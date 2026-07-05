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

// ==================== TIMESTAMP HELPER ====================
const ts = () => {
  const now = new Date();
  return `[${now.toLocaleTimeString('en-US', { hour12: false })}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
};

// ==================== CONSTANTS ====================

const CACHE_KEY_PREFIX = 'yt_cache_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for YouTube URL cache
const POLL_INTERVAL_MS = 2000;  // Poll every 2s when waiting for another device
const MAX_WAIT_MS = 20000;      // 20s max wait (server download lock is 15s, analysis is 90s)

// ==================== DEVICE ID ====================
// Unique device identifier for multi-device coordination

function getDeviceId() {
  let deviceId = localStorage.getItem('visualizer_device_id');
  if (!deviceId) {
    // Use a more cryptographically unique approach: timestamp + random + browser fingerprint
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    const fingerprint = Math.random().toString(36).substring(2, 8);
    deviceId = `device_${timestamp}_${random}${fingerprint}`;
    localStorage.setItem('visualizer_device_id', deviceId);
    console.log('🔑 Generated new device ID:', deviceId);
  }
  return deviceId;
}

const DEVICE_ID = getDeviceId();

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
   * Unified status check for multi-device coordination
   * Returns: { status: 'analysis_ready'|'mp3_ready'|'downloading'|'analyzing'|'not_found', ... }
   */
  async checkStatus(artistName, songName) {
    try {
      const params = new URLSearchParams({
        artist: artistName,
        song: songName,
        deviceId: DEVICE_ID
      });

      const response = await fetch(`${API_BASE_URL}/check-status?${params}`);
      if (!response.ok) return { status: 'error' };

      return await response.json();
    } catch (error) {
      console.warn('Status check failed:', error);
      return { status: 'error' };
    }
  },

  /**
   * Wait for a song to become ready (poll server when another device is processing)
   * @returns {Promise<{status: string, mp3Url?: string, analysisUrl?: string}>}
   */
  async waitForReady(artistName, songName) {
    const startTime = Date.now();
    console.log(`⏳ Waiting for another device to finish processing ${artistName} - ${songName}...`);

    while (Date.now() - startTime < MAX_WAIT_MS) {
      // Check if track changed (abort early)
      if (!this.shouldContinue(artistName, songName)) {
        throw new Error('Track changed while waiting');
      }

      const status = await this.checkStatus(artistName, songName);

      if (status.status === 'analysis_ready') {
        console.log(`✅ Analysis ready after ${Math.round((Date.now() - startTime) / 1000)}s wait`);
        return status;
      }

      if (status.status === 'mp3_ready') {
        console.log(`✅ MP3 ready after ${Math.round((Date.now() - startTime) / 1000)}s wait`);
        return status;
      }

      if (status.status === 'not_found' || status.status === 'error') {
        // No one is working on it - we should start
        console.log(`📭 Song not found/error after waiting, we should process it`);
        return status;
      }

      // Still downloading/analyzing - wait and retry
      const waitTime = status.waitTime ? Math.round(status.waitTime / 1000) : '?';
      console.log(`⏳ Still ${status.status}... (${waitTime}s elapsed on other device)`);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    console.warn(`⏰ Timeout waiting for song to be ready after ${MAX_WAIT_MS / 1000}s`);
    return { status: 'timeout' };
  },

  /**
   * Notify server that we're about to start analyzing
   * Returns: { acquired: boolean, status: string, waitTime?: number }
   */
  async notifyAnalyzing(artistName, songName) {
    try {
      const response = await fetch(`${API_BASE_URL}/notify-analyzing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist: artistName,
          song: songName,
          deviceId: DEVICE_ID
        })
      });

      if (!response.ok) return { acquired: false };
      return await response.json();
    } catch (error) {
      console.warn('Failed to notify analyzing:', error);
      return { acquired: false };
    }
  },

  /**
   * Release analysis lock when analysis completes (or fails)
   */
  async releaseAnalysisLock(artistName, songName, success = true) {
    try {
      await fetch(`${API_BASE_URL}/release-analysis-lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist: artistName,
          song: songName,
          success: success
        })
      });
    } catch (error) {
      console.warn('Failed to release analysis lock:', error);
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
   * Now includes artist/song for proper cache filename and deviceId for coordination
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
          song: songName,
          deviceId: DEVICE_ID
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('MP3 server returned non-JSON response');
        return null;
      }

      // Handle 202 "in progress" response (another device is downloading)
      if (response.status === 202 && data.status === 'in_progress') {
        console.log('⏳ Another device is downloading, waiting...');
        return { inProgress: true, waitTime: data.waitTime };
      }

      if (!response.ok) {
        console.error(`MP3 server error: HTTP ${response.status}`);
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
   * MULTI-DEVICE COORDINATION SEQUENCE:
   * 1. Acquire local processing lock (prevent concurrent requests on same device)
   * 2. Check unified status (analysis_ready, mp3_ready, downloading, analyzing, not_found)
   * 3. If another device is processing → wait and poll until ready
   * 4. If analysis_ready → return analysis URL (skip MP3 entirely!)
   * 5. If mp3_ready → return MP3 URL for local analysis
   * 6. If not_found → Search YouTube, download MP3
   * 7. Return result for analysis
   * 
   * @param {function} onSearchStart - Optional callback when YouTube search begins
   * @param {function} onDownloadStart - Optional callback when MP3 download begins
   */
  async getMP3ForTrack(artistName, songName, onSearchStart = null, onDownloadStart = null) {
    // Acquire processing lock
    if (processingLock) {
      console.warn(ts(), '⏳ Already processing a track locally, skipping...');
      return null;
    }
    processingLock = true;

    // Set current processing track (use sanitized keys for comparison)
    const artist = sanitizeForKey(artistName);
    const song = sanitizeForKey(songName);
    currentProcessingTrack = { artist, song };

    console.log(ts(), `🎵 NEW SONG: "${artistName} - ${songName}" (Device: ${DEVICE_ID.substring(0, 15)}...)`);

    try {
      // STEP 0: Clean up old files (>3 minutes) at the start of song
      this.clearOldMP3s().catch(e => console.warn(ts(), 'Cleanup failed:', e));

      // STEP 1: Check unified status (includes lock awareness for multi-device coordination)
      console.log(ts(), '📡 Checking unified status...');
      let status = await this.checkStatus(artistName, songName);
      console.log(ts(), `   Status: ${status.status}`);

      // STEP 2: If another device is processing, wait for it
      if (status.status === 'downloading' || status.status === 'analyzing') {
        console.log(ts(), `⏳ Another device is ${status.status}, waiting...`);
        try {
          status = await this.waitForReady(artistName, songName);
        } catch (waitError) {
          console.log(ts(), '🛑 Aborted while waiting:', waitError.message);
          currentProcessingTrack = null;
          processingLock = false;
          return null;
        }
      }

      // Verify track hasn't changed
      if (!this.shouldContinue(artistName, songName)) {
        console.log(ts(), '🛑 Track changed, aborting');
        processingLock = false;
        return null;
      }

      // STEP 3: Handle analysis_ready (another device already analyzed!)
      if (status.status === 'analysis_ready') {
        console.log(ts(), '✅ ANALYSIS READY from another device - no work needed!');
        lastCompletedTrack = { artist, song };
        currentProcessingTrack = null;
        processingLock = false;

        return {
          artist: artistName,
          song: songName,
          analysisUrl: `${API_BASE_URL}${status.analysisUrl}`,
          mp3: null,
          fromCache: true
        };
      }

      // STEP 4: Handle mp3_ready (MP3 cached, need to analyze locally)
      if (status.status === 'mp3_ready') {
        console.log(ts(), '✅ MP3 CACHED on server, will analyze locally');
        lastCompletedTrack = { artist, song };
        currentProcessingTrack = null;
        processingLock = false;

        return {
          artist: artistName,
          song: songName,
          mp3: {
            mp3Url: `${API_BASE_URL}${status.mp3Url}`,
            cached: true
          }
        };
      }

      // STEP 5: Not found - we need to download
      console.log(ts(), '🔍 SEARCHING YouTube for video...');
      if (onSearchStart) onSearchStart();
      const videoInfo = await this.searchVideo(artistName, songName);

      if (!videoInfo) {
        console.error(ts(), '❌ Could not find video on YouTube');
        currentProcessingTrack = null;
        processingLock = false;
        return null;
      }

      // Verify track hasn't changed during search
      if (!this.shouldContinue(artistName, songName)) {
        console.log(ts(), '🛑 Track changed during YouTube search, aborting');
        processingLock = false;
        return null;
      }

      console.log(ts(), `📺 YOUTUBE FOUND: ${videoInfo.videoId}`);
      console.log(ts(), `   URL: ${videoInfo.url}`);

      // STEP 6: Download MP3 via server (with locking)
      console.log(ts(), '📥 STARTING MP3 DOWNLOAD...');
      if (onDownloadStart) onDownloadStart();
      const downloadStartTime = Date.now();
      let mp3Info = await this.getMP3(videoInfo.url, artistName, songName);

      // Handle 202 "in progress" response (another device started downloading)
      if (mp3Info && mp3Info.inProgress) {
        console.log(ts(), '⏳ Server says another device started download, waiting...');
        try {
          status = await this.waitForReady(artistName, songName);
          if (status.status === 'mp3_ready' || status.status === 'analysis_ready') {
            lastCompletedTrack = { artist, song };
            currentProcessingTrack = null;
            processingLock = false;

            if (status.status === 'analysis_ready') {
              console.log(ts(), '✅ Other device finished analysis');
              return {
                artist: artistName,
                song: songName,
                analysisUrl: `${API_BASE_URL}${status.analysisUrl}`,
                mp3: null,
                fromCache: true
              };
            }

            console.log(ts(), '✅ Other device finished download');
            // Small debounce to ensure file is fully written
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
              artist: artistName,
              song: songName,
              mp3: {
                mp3Url: `${API_BASE_URL}${status.mp3Url}`,
                cached: true
              }
            };
          }
        } catch (waitError) {
          console.log(ts(), '🛑 Aborted while waiting for download:', waitError.message);
          currentProcessingTrack = null;
          processingLock = false;
          return null;
        }
        // If we get here, the other device's download failed - return null
        console.error(ts(), '❌ Other device download failed');
        currentProcessingTrack = null;
        processingLock = false;
        return null;
      }

      if (!mp3Info) {
        console.error(ts(), '❌ DOWNLOAD FAILED - Could not extract MP3');
        currentProcessingTrack = null;
        processingLock = false;
        return null;
      }

      // Final check if track changed during MP3 download
      if (!this.shouldContinue(artistName, songName)) {
        console.log(ts(), '🛑 Track changed during MP3 download, aborting');
        processingLock = false;
        return null;
      }

      const downloadTime = ((Date.now() - downloadStartTime) / 1000).toFixed(1);
      console.log(ts(), `✅ MP3 DOWNLOAD COMPLETE (${downloadTime}s)${mp3Info.cached ? ' [CACHED]' : ''}`);
      console.log(ts(), `   URL: ${mp3Info.mp3Url}`);

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
      console.error(ts(), '❌ getMP3ForTrack failed:', error);
      currentProcessingTrack = null;
      processingLock = false;
      return null;
    }
  },

  /**
   * Prefetch version: Get MP3 for next track (non-blocking for multi-device)
   * 
   * Key differences from getMP3ForTrack:
   * - If another device is downloading/analyzing → SKIP (don't wait)
   * - Returns null if work is in progress elsewhere
   * - Perfect for background prefetching without blocking
   * - Handles race conditions with server-side locking
   */
  async getMP3ForTrackPrefetch(artistName, songName) {
    // Check local processing lock first
    if (processingLock) {
      console.log(ts(), '⏩ Already processing locally, skipping prefetch');
      return null;
    }

    console.log(ts(), `🔮 PREFETCH: "${artistName} - ${songName}"`);

    try {
      // STEP 1: Check unified status on server
      const status = await this.checkStatus(artistName, songName);

      // STEP 2: If analysis is ready, return it immediately
      if (status.status === 'analysis_ready') {
        console.log(ts(), '📦 Analysis already cached (prefetch)');
        return {
          artist: artistName,
          song: songName,
          analysisUrl: `${API_BASE_URL}${status.analysisUrl}`,
          mp3: null,
          fromCache: true
        };
      }

      // STEP 3: If MP3 is ready, return it
      if (status.status === 'mp3_ready') {
        console.log(ts(), '📦 MP3 already cached (prefetch)');
        return {
          artist: artistName,
          song: songName,
          mp3: {
            mp3Url: `${API_BASE_URL}${status.mp3Url}`,
            cached: true
          }
        };
      }

      // STEP 4: If another device is working → SKIP (don't wait)
      if (status.status === 'downloading' || status.status === 'analyzing') {
        console.log(ts(), `⏩ Another device is ${status.status}, skipping prefetch`);
        return null;
      }

      // STEP 5: Not found - we need to download
      // Search YouTube for video
      console.log(ts(), '🔍 PREFETCH: Searching YouTube...');
      const videoInfo = await this.searchVideo(artistName, songName);

      if (!videoInfo) {
        console.log(ts(), '❌ Prefetch: Video not found');
        return null;
      }

      // Verify track hasn't changed (for prefetch context)
      if (!this.shouldContinue(artistName, songName)) {
        console.log(ts(), '🛑 Track changed during prefetch search, aborting');
        return null;
      }

      console.log(ts(), `📺 PREFETCH FOUND: ${videoInfo.videoId}`);

      // STEP 6: Try to download (server handles locking)
      // If another device acquired the lock first, we'll get a 202 response
      const mp3Info = await this.getMP3(videoInfo.url, artistName, songName);

      // Handle 202 "in progress" - another device got the lock first
      if (mp3Info && mp3Info.inProgress) {
        console.log(ts(), '⏩ Another device started download during prefetch, skipping');
        return null; // Don't wait for prefetch
      }

      if (!mp3Info) {
        console.log(ts(), '❌ Prefetch download failed');
        return null;
      }

      // Verify track hasn't changed
      if (!this.shouldContinue(artistName, songName)) {
        console.log(ts(), '🛑 Track changed during prefetch download, aborting');
        return null;
      }

      console.log(ts(), '✅ Prefetch MP3 complete');

      return {
        artist: artistName,
        song: songName,
        youtube: videoInfo,
        mp3: mp3Info
      };

    } catch (error) {
      console.error(ts(), '❌ Prefetch failed:', error);
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
