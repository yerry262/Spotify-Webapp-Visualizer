// YouTube to MP3 Service for Educational Research
// Uses Browser-Use API to find videos and backend server for MP3 extraction
// 
// PROPER SEQUENCE:
// 1. Spotify signals new song (or initial page load)
// 2. Check local MP3 cache by artist-song filename (SKIP YouTube search if cached!)
// 3. If no cache: Use Browser-Use API to find video URL (FREE - no quota limits!)
// 4. Pass URL to yt-dlp server to download MP3 (saved as artist-song.mp3)
// 5. Analyze MP3 with Essentia.js
// 6. Generate visualization

import { API_BASE_URL } from './config';

// ==================== CONSTANTS ====================

const CACHE_KEY_PREFIX = 'yt_cache_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for YouTube URL cache

// ==================== STATE ====================

// In-memory cache (backup for localStorage)
const memoryCache = new Map();

// Current track being processed (for cancellation)
let currentProcessingTrack = null;
// Last successfully completed track (for verification during analysis)
let lastCompletedTrack = null;

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

// ==================== YOUTUBE SERVICE ====================

export const YouTubeService = {
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
      
      const response = await fetch(`${API_BASE_URL}/check-mp3-cache?${params}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.cached) {
        console.log('📦 Server has cached MP3:', data.filename);
        // Convert relative mp3Url to full URL
        return {
          ...data,
          mp3Url: `${API_BASE_URL}${data.mp3Url}`
        };
      }
      return null;
    } catch (error) {
      console.warn('Could not check server cache:', error);
      return null;
    }
  },

  /**
   * Helper function to search YouTube using Browser-Use API via backend proxy (FREE!)
   * Uses backend proxy to avoid CORS issues
   * @returns {Promise<{videoId: string, url: string} | {error: string}>}
   */
  async _searchBrowserUseAPI(query) {
    console.log('🔍 Making Browser-Use API call (FREE - no quota!)...');
    console.log('   Query:', query);
    
    try {
      // Use backend proxy to avoid CORS issues
      const response = await fetch(`${API_BASE_URL}/search-youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        console.error(`Browser-Use API Error: HTTP ${response.status}`);
        return { error: 'http_error' };
      }

      const data = await response.json();

      if (!data.success || data.error) {
        console.error('Browser-Use API Error:', data.error || 'Unknown error');
        return { error: 'api_error' };
      }

      if (!data.data || !data.data.video_id) {
        console.warn('No YouTube results found for:', query);
        return { error: 'no_results' };
      }

      console.log('✅ Found video:', data.data.title, 'by', data.data.channel);
      
      return {
        videoId: data.data.video_id,
        url: data.data.video_url,
        title: data.data.title,
        channel: data.data.channel
      };
    } catch (error) {
      console.error('Browser-Use API fetch error:', error.message);
      return { error: 'fetch_error' };
    }
  },

  /**
   * Search for a song on YouTube and get the top result
   * Uses localStorage cache to avoid duplicate API calls
   * Retries with simplified query (song name only) if no results found
   */
  async searchVideo(artistName, songName) {
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

    try {
      // First attempt: artist + song name + "official audio lyrics" for better results
      const query = `${artistName} ${songName} official audio lyrics`;
      let result = await this._searchBrowserUseAPI(query);
      
      // If no results found, retry with just the song name
      if (result.error === 'no_results') {
        console.log('🔄 No results with full query, retrying with just song name...');
        result = await this._searchBrowserUseAPI(songName);
      }
      
      // If we got an error response, return null
      if (result.error) {
        return null;
      }

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
   * Clear old MP3 files from the server (only files older than 3 minutes)
   * Called at the start of each song to clean up stale files
   */
  async clearOldMP3s() {
    try {
      const response = await fetch(`${API_BASE_URL}/clear-mp3s`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      console.log('🗑️ Cleared old MP3s (>3min):', data);
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
  async getMP3(youtubeUrl, artistName, songName) {
    try {
      const response = await fetch(`${API_BASE_URL}/get-mp3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          url: youtubeUrl, 
          artist: artistName,
          song: songName
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
        // Construct full URL from relative path
        const fullMp3Url = `${API_BASE_URL}${data.mp3Url}`;
        return {
          mp3Url: fullMp3Url,
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
      // STEP 0: Clean up old files (>3 minutes) at the start of song
      console.log('🧹 Cleaning up old files...');
      this.clearOldMP3s().catch(e => console.warn('Cleanup failed:', e));
      
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
            mp3Url: `${API_BASE_URL}${serverCache.mp3Url}`,
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
        console.error('Could not find video on YouTube');
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
      const mp3Info = await this.getMP3(videoInfo.url, artistName, songName);
      
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
      localStorageCache: localStorageCount
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
