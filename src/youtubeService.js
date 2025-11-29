// YouTube to MP3 Service for Educational Research
// Uses YouTube Data API v3 to find videos and backend server for MP3 extraction
// 
// PROPER SEQUENCE:
// 1. Spotify signals new song (or initial page load)
// 2. Check local MP3 cache by artist-song filename (SKIP YouTube API if cached!)
// 3. If no cache: Use YouTube API to find video URL
// 4. Pass URL to yt-dlp server to download MP3 (saved as artist-song.mp3)
// 5. Analyze MP3 with Essentia.js
// 6. Generate visualization

// Get YouTube API key from environment variable
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.warn('⚠️ REACT_APP_YOUTUBE_API_KEY not set in .env file');
}

// ==================== CONSTANTS ====================

const CACHE_KEY_PREFIX = 'yt_cache_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for YouTube URL cache
const RATE_LIMIT_MIN_INTERVAL = 2000; // Minimum 2 seconds between YouTube API calls

// ==================== STATE ====================

// In-memory cache (backup for localStorage)
const memoryCache = new Map();

// Current track being processed (for cancellation)
let currentProcessingTrack = null;
// Last successfully completed track (for verification during analysis)
let lastCompletedTrack = null;
// Flag to block API calls after 403 error (persists until page reload)
let apiBlocked = false;
let apiBlockReason = '';

// Rate limiting state
let lastApiCallTime = 0;

// Processing lock to prevent concurrent requests
let processingLock = false;

// ==================== HELPER FUNCTIONS ====================

/**
 * Sanitize string for cache key (matches server logic)
 */
function sanitizeForKey(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^\w\-_.]/g, '')
    .replace(/_+/g, '_')
    .substring(0, 100);
}

/**
 * Generate a cache key for a track
 */
function getCacheKey(artistName, songName) {
  const artist = sanitizeForKey(artistName);
  const song = sanitizeForKey(songName);
  return `${CACHE_KEY_PREFIX}${artist}|${song}`;
}

/**
 * Load cache from localStorage
 */
function loadFromLocalStorage(key) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    
    // Check if cache is expired
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed.data;
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
    return null;
  }
}

/**
 * Save to localStorage cache
 */
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data: data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

/**
 * Check if cached result is still valid (memory cache)
 */
function isValidCache(cacheEntry) {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
}

/**
 * Rate-limited fetch for YouTube API
 * Ensures minimum interval between API calls
 */
async function rateLimitedFetch(url) {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCallTime;
  
  if (timeSinceLastCall < RATE_LIMIT_MIN_INTERVAL) {
    const waitTime = RATE_LIMIT_MIN_INTERVAL - timeSinceLastCall;
    console.log(`⏳ Rate limiting: waiting ${waitTime}ms before API call`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastApiCallTime = Date.now();
  return fetch(url);
}

// ==================== YOUTUBE SERVICE ====================

export const YouTubeService = {
  /**
   * Check if YouTube API is blocked (403 error occurred)
   */
  isApiBlocked() {
    return apiBlocked;
  },

  /**
   * Get the reason API is blocked
   */
  getApiBlockReason() {
    return apiBlockReason;
  },

  /**
   * Get current processing track (for external cancellation checks)
   */
  getCurrentTrack() {
    return currentProcessingTrack;
  },

  /**
   * Check if we should continue processing (track hasn't changed)
   */
  shouldContinue(artistName, songName) {
    const artist = sanitizeForKey(artistName);
    const song = sanitizeForKey(songName);
    
    // Check if currently processing this track
    if (currentProcessingTrack) {
      return currentProcessingTrack.artist === artist && 
             currentProcessingTrack.song === song;
    }
    // Check if this was the last completed track
    if (lastCompletedTrack) {
      return lastCompletedTrack.artist === artist && 
             lastCompletedTrack.song === song;
    }
    return false;
  },

  /**
   * Cancel current processing and clear pending requests
   */
  cancelCurrentProcessing() {
    if (currentProcessingTrack) {
      console.log('🛑 Cancelling processing for:', currentProcessingTrack.artist, '-', currentProcessingTrack.song);
      currentProcessingTrack = null;
    }
    lastCompletedTrack = null;
    
    // Release processing lock
    processingLock = false;
  },

  /**
   * Check if MP3 is already cached on server (by artist-song filename)
   * This is called BEFORE any YouTube API call!
   */
  async checkServerCache(artistName, songName) {
    try {
      const params = new URLSearchParams({
        artist: artistName,
        song: songName
      });
      
      const response = await fetch(`http://localhost:3001/check-mp3-cache?${params}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.cached) {
        console.log('📦 Server has cached MP3:', data.filename);
        return data;
      }
      return null;
    } catch (error) {
      console.warn('Could not check server cache:', error);
      return null;
    }
  },

  /**
   * Search for a song on YouTube and get the top result
   * Uses localStorage cache to avoid duplicate API calls
   */
  async searchVideo(artistName, songName) {
    // Check if API is blocked (403 error occurred)
    if (apiBlocked) {
      console.warn('🚫 YouTube API is blocked:', apiBlockReason);
      return null;
    }

    const cacheKey = getCacheKey(artistName, songName);
    
    // Check localStorage first
    const localCached = loadFromLocalStorage(cacheKey);
    if (localCached) {
      console.log('📦 Using localStorage cached YouTube URL');
      return localCached;
    }
    
    // Check memory cache as fallback
    const memoryCached = memoryCache.get(cacheKey);
    if (isValidCache(memoryCached)) {
      console.log('📦 Using memory cached YouTube URL');
      return memoryCached.data;
    }

    // Optimized query
    const query = `${artistName} ${songName} official audio`;
    
    // OPTIMIZED API REQUEST
    const url = `https://www.googleapis.com/youtube/v3/search?` + 
      `part=id&` +
      `q=${encodeURIComponent(query)}&` +
      `type=video&` +
      `videoCategoryId=10&` +
      `maxResults=1&` +
      `fields=items/id/videoId&` +
      `key=${YOUTUBE_API_KEY}`;

    try {
      console.warn('💰 TRIGGERING YOUTUBE API - COST: 100 QUOTA UNITS');
      console.log('🔍 Making YouTube API call (rate-limited)...');
      const response = await rateLimitedFetch(url);
      
      // Handle 403 Forbidden
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        apiBlocked = true;
        apiBlockReason = errorData.error?.message || 'Quota exceeded or access forbidden';
        console.error('🚫 YouTube API returned 403 Forbidden');
        console.error('   Reason:', apiBlockReason);
        return null;
      }
      
      if (!response.ok) {
        console.error(`YouTube API Error: HTTP ${response.status}`);
        return null;
      }
      
      const data = await response.json();

      if (data.error) {
        if (data.error.code === 403) {
          apiBlocked = true;
          apiBlockReason = data.error.message || 'Quota exceeded or access forbidden';
          console.error('🚫 YouTube API blocked:', apiBlockReason);
          return null;
        }
        console.error('YouTube API Error:', data.error.message);
        return null;
      }

      if (!data.items || data.items.length === 0) {
        console.warn('No YouTube results found for:', query);
        return null;
      }

      const video = data.items[0];
      const videoId = video.id.videoId;
      const result = {
        videoId: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };

      // Save to localStorage (persistent)
      saveToLocalStorage(cacheKey, result);
      
      // Also save to memory cache
      memoryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      console.log('📝 Cached YouTube URL for:', artistName, '-', songName);

      return result;
    } catch (error) {
      console.error('Error searching YouTube:', error);
      return null;
    }
  },

  /**
   * Clear all old MP3 files from the server
   */
  async clearOldMP3s() {
    try {
      const response = await fetch('http://localhost:3001/clear-mp3s', {
        method: 'POST'
      });
      const data = await response.json();
      console.log('🗑️ Cleared old MP3s:', data);
      return data;
    } catch (error) {
      console.error('Error clearing MP3s:', error);
      return null;
    }
  },

  /**
   * Get MP3 from YouTube video via backend server
   * Now includes artist/song for proper cache filename
   */
  async getMP3(youtubeUrl, artistName, songName, clearOld = false) {
    try {
      const response = await fetch('http://localhost:3001/get-mp3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          url: youtubeUrl, 
          artist: artistName,
          song: songName,
          clearOld 
        })
      });

      if (!response.ok) {
        console.error(`MP3 server error: HTTP ${response.status}`);
        return null;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('MP3 server returned non-JSON response');
        return null;
      }
      
      if (data.error) {
        console.error('MP3 extraction error:', data.error);
        return null;
      }

      if (data.mp3Url) {
        if (data.cached) {
          console.log('📦 Using cached MP3 from server');
        }
        return {
          mp3Url: data.mp3Url,
          filename: data.filename,
          title: data.title,
          cached: data.cached || false
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching MP3:', error);
      return null;
    }
  },

  /**
   * Main function: Get MP3 from artist and song name
   * 
   * PROPER SEQUENCE:
   * 1. Acquire processing lock (prevent concurrent requests)
   * 2. Check if MP3 is already on server (by artist-song.mp3 filename)
   * 3. If cached on server → SKIP YouTube API, return cached MP3
   * 4. If not cached → Search YouTube for video URL
   * 5. Download MP3 via yt-dlp (server saves as artist-song.mp3)
   * 6. Return MP3 info for analysis
   */
  async getMP3ForTrack(artistName, songName) {
    // Check if API is blocked first
    if (apiBlocked) {
      console.warn('🚫 YouTube API is blocked, checking server cache only...');
      // Still try server cache even if API is blocked
      const serverCache = await this.checkServerCache(artistName, songName);
      if (serverCache) {
        return {
          artist: artistName,
          song: songName,
          youtube: null,
          mp3: {
            mp3Url: serverCache.mp3Url,
            filename: serverCache.filename,
            title: `${artistName} - ${songName}`,
            cached: true
          }
        };
      }
      console.warn('🚫 No server cache available and API is blocked');
      return null;
    }

    // Acquire processing lock
    if (processingLock) {
      console.warn('⏳ Already processing a track, skipping...');
      return null;
    }
    processingLock = true;
    
    // Set current processing track (use sanitized keys for comparison)
    const artist = sanitizeForKey(artistName);
    const song = sanitizeForKey(songName);
    currentProcessingTrack = { artist, song };
    
    console.log(`🎵 Processing: ${artistName} - ${songName}`);
    
    try {
      // STEP 1: Check server MP3 cache FIRST (before any YouTube API call!)
      console.log('📦 Step 1: Checking server MP3 cache...');
      const serverCache = await this.checkServerCache(artistName, songName);
      
      if (serverCache && serverCache.cached) {
        console.log('✅ MP3 found in server cache - SKIPPING YouTube API!');
        
        // Verify track hasn't changed
        if (!this.shouldContinue(artistName, songName)) {
          console.log('🛑 Track changed, aborting');
          processingLock = false;
          return null;
        }
        
        lastCompletedTrack = { artist, song };
        currentProcessingTrack = null;
        processingLock = false;
        
        return {
          artist: artistName,
          song: songName,
          youtube: null, // Didn't need to call YouTube API!
          mp3: {
            mp3Url: serverCache.mp3Url,
            filename: serverCache.filename,
            title: `${artistName} - ${songName}`,
            cached: true
          }
        };
      }
      
      // STEP 2: Search YouTube for video URL (only if not in server cache)
      console.log('🔍 Step 2: Searching YouTube for video...');
      const videoInfo = await this.searchVideo(artistName, songName);
      
      if (!videoInfo) {
        if (apiBlocked) {
          console.warn('🚫 YouTube API blocked, cannot proceed');
        } else {
          console.error('Could not find video on YouTube');
        }
        currentProcessingTrack = null;
        processingLock = false;
        return null;
      }

      // Verify track hasn't changed during search
      if (!this.shouldContinue(artistName, songName)) {
        console.log('🛑 Track changed during YouTube search, aborting');
        processingLock = false;
        return null;
      }

      console.log(`📺 Found video: ${videoInfo.videoId}`);
      console.log(`🔗 URL: ${videoInfo.url}`);

      // STEP 3: Download MP3 via server (saves as artist-song.mp3)
      console.log('📥 Step 3: Downloading MP3...');
      const mp3Info = await this.getMP3(videoInfo.url, artistName, songName, true);
      
      if (!mp3Info) {
        console.error('Could not extract MP3');
        currentProcessingTrack = null;
        processingLock = false;
        return null;
      }

      // Final check if track changed during MP3 download
      if (!this.shouldContinue(artistName, songName)) {
        console.log('🛑 Track changed during MP3 download, aborting');
        processingLock = false;
        return null;
      }

      console.log(`🎧 MP3 ready: ${mp3Info.mp3Url}${mp3Info.cached ? ' (cached)' : ''}`);

      // Mark as completed
      lastCompletedTrack = { artist, song };
      currentProcessingTrack = null;
      processingLock = false;

      return {
        artist: artistName,
        song: songName,
        youtube: videoInfo,
        mp3: mp3Info
      };
      
    } catch (error) {
      console.error('❌ getMP3ForTrack failed:', error);
      currentProcessingTrack = null;
      processingLock = false;
      return null;
    }
  },

  /**
   * Get cache statistics (useful for debugging)
   */
  getCacheStats() {
    let localStorageCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        localStorageCount++;
      }
    }
    
    return {
      memoryCache: memoryCache.size,
      localStorageCache: localStorageCount,
      apiBlocked: apiBlocked,
      apiBlockReason: apiBlockReason
    };
  },

  /**
   * Clear all YouTube URL caches
   */
  clearCache() {
    memoryCache.clear();
    
    // Clear localStorage cache
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('🗑️ Cleared all YouTube URL caches');
  }
};

export default YouTubeService;
