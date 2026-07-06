// Backend Server for YouTube to MP3 Extraction
// Educational Research Purposes - Spotify & Google Research Project
// Uses yt-dlp for audio extraction

const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { pickBestCandidate } = require('./searchScoring');

const app = express();
const PORT = process.env.PORT || 3001; // Use Railway's PORT or default to 3001

// Railway terminates TLS at a single proxy hop in front of the app, so the
// client IP is in X-Forwarded-For. Trust exactly one hop so express-rate-limit
// keys on the real client IP (not the shared proxy IP) without trusting a
// spoofable full chain.
app.set('trust proxy', 1);

// Directory to store downloaded MP3 files and analysis data.
// DATA_DIR points at a Railway volume in production (survives deploys);
// falls back to the app directory for local dev.
const DATA_DIR = process.env.DATA_DIR || __dirname;
const MP3_DIR = path.join(DATA_DIR, 'mp3files');
const ANALYSIS_DIR = path.join(DATA_DIR, 'analysis');

// Create directories if they don't exist
if (!fs.existsSync(MP3_DIR)) {
  fs.mkdirSync(MP3_DIR, { recursive: true });
}
if (!fs.existsSync(ANALYSIS_DIR)) {
  fs.mkdirSync(ANALYSIS_DIR, { recursive: true });
}

// ==================== DOWNLOAD LOCK MANAGER ====================
// Tracks songs currently being downloaded/analyzed to prevent race conditions
// when multiple devices are connected

const downloadLocks = new Map();  // key: "artist-song" → { status, startTime, deviceId }
const analysisLocks = new Map();  // key: "artist-song" → { status, startTime, deviceId }

// Lock timeouts - if a lock is older than this, consider it stale (device crashed/disconnected)
const DOWNLOAD_LOCK_TIMEOUT_MS = 15 * 1000;  // 15 seconds - downloads should be quick
const ANALYSIS_LOCK_TIMEOUT_MS = 90 * 1000;  // 90 seconds - analysis takes longer

/**
 * Generate lock key from artist and song
 * Must be consistent with client-side sanitizeForKey() for multi-device coordination
 */
function getLockKey(artist, song) {
  const sanitizedArtist = artist
    .toLowerCase()
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^\w\-_.]/g, '')
    .replace(/_+/g, '_')
    .substring(0, 100);
  const sanitizedSong = song
    .toLowerCase()
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^\w\-_.]/g, '')
    .replace(/_+/g, '_')
    .substring(0, 100);
  return `${sanitizedArtist}-${sanitizedSong}`;
}

/**
 * Acquire a download lock for a song
 * @returns {object} { acquired: boolean, status: string, existingLock?: object }
 */
function acquireDownloadLock(artist, song, deviceId) {
  const key = getLockKey(artist, song);
  const now = Date.now();

  // Check for existing lock
  const existing = downloadLocks.get(key);
  if (existing) {
    // Check if lock is stale (15s timeout for downloads)
    if (now - existing.startTime > DOWNLOAD_LOCK_TIMEOUT_MS) {
      console.log(`🔓 Download lock expired for ${key} (>${DOWNLOAD_LOCK_TIMEOUT_MS/1000}s), releasing...`);
      downloadLocks.delete(key);
    } else {
      // Lock is still valid
      return {
        acquired: false,
        status: 'downloading',
        existingLock: existing
      };
    }
  }

  // Acquire the lock
  downloadLocks.set(key, {
    status: 'downloading',
    startTime: now,
    deviceId: deviceId
  });

  console.log(`🔒 Download lock acquired for ${key} by device ${deviceId}`);
  return { acquired: true, status: 'downloading' };
}

/**
 * Release a download lock
 */
function releaseDownloadLock(artist, song, success = true) {
  const key = getLockKey(artist, song);
  downloadLocks.delete(key);
  console.log(`🔓 Download lock released for ${key} (${success ? 'success' : 'failed'})`);
}

/**
 * Check download status without acquiring
 */
function getDownloadStatus(artist, song) {
  const key = getLockKey(artist, song);
  const existing = downloadLocks.get(key);

  if (!existing) return null;

  // Check if stale (15s timeout for downloads)
  if (Date.now() - existing.startTime > DOWNLOAD_LOCK_TIMEOUT_MS) {
    downloadLocks.delete(key);
    return null;
  }

  return existing;
}

/**
 * Acquire an analysis lock for a song
 */
function acquireAnalysisLock(artist, song, deviceId) {
  const key = getLockKey(artist, song);
  const now = Date.now();

  const existing = analysisLocks.get(key);
  if (existing) {
    // Check if stale (90s timeout for analysis)
    if (now - existing.startTime > ANALYSIS_LOCK_TIMEOUT_MS) {
      console.log(`🔓 Analysis lock expired for ${key} (>${ANALYSIS_LOCK_TIMEOUT_MS/1000}s), releasing...`);
      analysisLocks.delete(key);
    } else {
      return {
        acquired: false,
        status: 'analyzing',
        existingLock: existing
      };
    }
  }

  analysisLocks.set(key, {
    status: 'analyzing',
    startTime: now,
    deviceId: deviceId
  });

  console.log(`🔒 Analysis lock acquired for ${key} by device ${deviceId}`);
  return { acquired: true, status: 'analyzing' };
}

/**
 * Release an analysis lock
 */
function releaseAnalysisLock(artist, song, success = true) {
  const key = getLockKey(artist, song);
  analysisLocks.delete(key);
  console.log(`🔓 Analysis lock released for ${key} (${success ? 'success' : 'failed'})`);
}

/**
 * Check analysis status without acquiring
 */
function getAnalysisStatus(artist, song) {
  const key = getLockKey(artist, song);
  const existing = analysisLocks.get(key);

  if (!existing) return null;

  // Check if stale (90s timeout for analysis)
  if (Date.now() - existing.startTime > ANALYSIS_LOCK_TIMEOUT_MS) {
    analysisLocks.delete(key);
    return null;
  }

  return existing;
}

/**
 * Guard for destructive admin endpoints (raw file deletes). These are not used
 * by the web client, so they require an x-admin-token header matching the
 * ADMIN_TOKEN env var. If ADMIN_TOKEN is unset in production the endpoints stay
 * locked (fail closed) rather than being open to anyone.
 */
function requireAdmin(req, res, next) {
  const configured = process.env.ADMIN_TOKEN;
  if (!configured) {
    return res.status(503).json({ error: 'Admin endpoints disabled (ADMIN_TOKEN not configured)' });
  }
  if (req.get('x-admin-token') !== configured) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// CORS configuration - allow GitHub Pages and localhost
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://yerry262.github.io'
];

// Fail SAFE: only relax CORS when NODE_ENV is *explicitly* "development".
// If NODE_ENV is unset (or anything other than "development") we behave as
// production and reject unknown origins — an unset var must never open CORS up
// to arbitrary origins (which, with credentials:true, is a real vulnerability).
const isDev = process.env.NODE_ENV === 'development';

app.use(cors({
  origin: function(origin, callback) {
    // Requests with no Origin header (Railway healthcheck, curl, server-to-server)
    // are not browser cross-site requests, so CORS doesn't apply — always allow.
    // (Rejecting these breaks the platform /health probe.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      if (isDev) {
        console.warn('⚠️ Allowing unknown origin in development mode');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '25mb' })); // Analysis payloads are large but bounded

// ==================== RATE LIMITING ====================
// Protect the backend from abuse/DoS. Three tiers, keyed per client IP:
//  - general: a generous ceiling on all API traffic (multi-device polling of
//    /check-status is chatty, so this is high and mainly catches runaway loops)
//  - expensive: search + download spawn yt-dlp/ffmpeg subprocesses, so they get
//    a much tighter budget
//  - write: server-side writes (/save-analysis, /notify-analyzing)
// The `/health` probe and static file serving are exempted from the general cap.
const rlOpts = { standardHeaders: true, legacyHeaders: false };

const generalLimiter = rateLimit({
  ...rlOpts,
  windowMs: 15 * 60 * 1000,
  max: 1000, // ~1/sec sustained per IP across all API routes
  message: { error: 'Too many requests, please slow down.' },
});

const expensiveLimiter = rateLimit({
  ...rlOpts,
  windowMs: 5 * 60 * 1000,
  max: 40, // yt-dlp/ffmpeg spawns — keep this tight
  message: { error: 'Too many download/search requests, please wait a moment.' },
});

const writeLimiter = rateLimit({
  ...rlOpts,
  windowMs: 5 * 60 * 1000,
  max: 120,
  message: { error: 'Too many writes, please slow down.' },
});

// General limiter on everything except the health probe (Railway hits it often).
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/') return next();
  return generalLimiter(req, res, next);
});

// Serve static MP3 files
app.use('/mp3files', express.static(MP3_DIR));
// Serve static analysis files
app.use('/analysis', express.static(ANALYSIS_DIR));

// Root route - useful for quick "is it up?" checks (Railway, browsers, uptime pings)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'YouTube to MP3 server (Educational Research)',
    endpoints: ['/health', '/check-status', '/get-mp3', '/search-youtube'],
    uptime: process.uptime()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'YouTube to MP3 server is running', uptime: process.uptime() });
});


// YouTube bot-challenges datacenter IPs ("Sign in to confirm you're not a bot").
// Downloads are defended by a proof-of-origin token minted locally by the bgutil
// POT provider (auto-detected by the yt-dlp plugin on 127.0.0.1:4416), plus a
// rotation of player clients: if one is blocked/DRM'd/challenged, we retry the
// download with the next. POT tokens are minted fresh per video by the provider,
// so there is nothing static to rotate — the client is what we vary.
// Override the provider URL (e.g. a separate service) via POT_PROVIDER_URL.
const POT_PROVIDER_URL = process.env.POT_PROVIDER_URL || null;
const YT_DLP_CLIENTS = ['default', 'mweb', 'tv,web_embedded', 'web_safari'];

function buildDownloadArgs(clientSpec, outputPath, youtubeUrl) {
  const args = [
    '-x', '--audio-format', 'mp3', '--audio-quality', '0',
    '--no-playlist', '--force-overwrites',
    '--extractor-args', `youtube:player_client=${clientSpec}`,
  ];
  if (POT_PROVIDER_URL) {
    args.push('--extractor-args', `youtubepot-bgutilhttp:base_url=${POT_PROVIDER_URL}`);
  }
  args.push('-o', outputPath, youtubeUrl);
  return args;
}

// ==================== YOUTUBE SEARCH (yt-dlp) ====================
// Search YouTube via yt-dlp's built-in ytsearch — no API key, no external service.
// Response shape matches the old Browser-Use proxy so the frontend needs no changes.
app.post('/search-youtube', expensiveLimiter, async (req, res) => {
  const { query, artist, song, durationSec } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // With artist/song metadata we can fetch several candidates and score them
  // against the Spotify track; without it (legacy clients) take the top hit.
  const haveMeta = typeof artist === 'string' && typeof song === 'string' && artist && song;
  const numResults = haveMeta ? 8 : 1;
  console.log(`🔍 Searching YouTube via yt-dlp (top ${numResults}):`, query);

  // execFile with an args array — the query is passed as a single argument and
  // is never parsed by a shell, so shell metacharacters ($(), backticks, ;)
  // in the query cannot inject commands.
  // --flat-playlist returns search metadata without hitting the player API,
  // so the search step can never trip YouTube's datacenter-IP bot challenge.
  const args = [`ytsearch${numResults}:${query}`, '--dump-json', '--flat-playlist', '--no-download'];

  execFile('yt-dlp', args, { maxBuffer: 1024 * 1024 * 10, timeout: 30000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ yt-dlp search error:', stderr || error.message);
      return res.status(500).json({ success: false, error: 'Failed to search YouTube', details: stderr || error.message });
    }

    try {
      const candidates = stdout.trim().split('\n').filter(Boolean).map(line => {
        try {
          const info = JSON.parse(line);
          return {
            id: info.id,
            title: info.title || '',
            channel: info.channel || info.uploader || '',
            duration: info.duration || null,
            url: info.webpage_url || `https://www.youtube.com/watch?v=${info.id}`,
          };
        } catch {
          return null;
        }
      }).filter(Boolean);

      if (candidates.length === 0) {
        console.warn('No YouTube results found for:', query);
        return res.json({ success: false, error: 'no_results' });
      }

      let picked;
      if (haveMeta) {
        const target = { artist, song, durationSec: Number(durationSec) || null };
        const best = pickBestCandidate(candidates, target);
        if (!best) {
          console.warn(`❌ No candidate matched "${artist} - ${song}" (dur ${durationSec || '?'}s). Top hit was: ${candidates[0].title}`);
          return res.json({ success: false, error: 'no_results' });
        }
        picked = best.candidate;
        console.log(`✅ Picked (score ${best.score.toFixed(1)}): ${picked.title} by ${picked.channel}` +
          (picked.duration && durationSec ? ` [${picked.duration}s vs ${Math.round(durationSec)}s]` : ''));
      } else {
        picked = candidates[0];
        console.log('✅ Found video:', picked.title, 'by', picked.channel);
      }

      res.json({
        success: true,
        data: {
          video_id: picked.id,
          video_url: picked.url,
          title: picked.title,
          channel: picked.channel
        }
      });
    } catch (parseError) {
      console.error('❌ Failed to parse yt-dlp output:', parseError.message);
      res.status(500).json({ success: false, error: 'Failed to parse search result' });
    }
  });
});

// Clear old MP3 files endpoint - only delete files older than 3 minutes
app.post('/clear-mp3s', (req, res) => {
  try {
    const { exclude } = req.body;
    // Retention policy (with persistent volume):
    // - .part files (incomplete downloads): stale after 10 min
    // - .mp3 files: RETAINED indefinitely (analysis JSON + MP3 are both
    //   durable artifacts now), except a size cap below
    // - Size cap: if the MP3 dir exceeds MP3_CACHE_MAX_MB (default 4000),
    //   the oldest analyzed MP3s are evicted first until under the cap.
    //   Unanalyzed MP3s are only evicted after analyzed ones.
    const PART_TTL_MS = 10 * 60 * 1000;
    const MAX_CACHE_BYTES = (parseInt(process.env.MP3_CACHE_MAX_MB, 10) || 4000) * 1024 * 1024;
    const now = Date.now();

    let deletedCount = 0;

    // 1. Clear stale partial downloads
    const partFiles = fs.readdirSync(MP3_DIR).filter(f => f.endsWith('.part'));
    partFiles.forEach(file => {
      if (exclude && file === exclude) return;
      try {
        const filepath = path.join(MP3_DIR, file);
        if (now - fs.statSync(filepath).mtimeMs > PART_TTL_MS) {
          fs.unlinkSync(filepath);
          console.log(`   ❌ Deleted stale partial: ${file}`);
          deletedCount++;
        }
      } catch (e) {
        console.error(`Could not delete ${file}:`, e.message);
      }
    });

    // 2. Enforce the size cap, oldest analyzed files first
    const mp3s = fs.readdirSync(MP3_DIR)
      .filter(f => f.endsWith('.mp3') && !(exclude && f === exclude))
      .map(file => {
        const filepath = path.join(MP3_DIR, file);
        const stats = fs.statSync(filepath);
        const hasAnalysis = fs.existsSync(path.join(ANALYSIS_DIR, file.replace(/\.mp3$/, '.json')));
        return { file, filepath, size: stats.size, mtime: stats.mtimeMs, hasAnalysis };
      });
    let totalBytes = mp3s.reduce((s, f) => s + f.size, 0);
    if (totalBytes > MAX_CACHE_BYTES) {
      // Analyzed first (their JSON survives), then unanalyzed; oldest first within each group
      const evictionOrder = [
        ...mp3s.filter(f => f.hasAnalysis).sort((a, b) => a.mtime - b.mtime),
        ...mp3s.filter(f => !f.hasAnalysis).sort((a, b) => a.mtime - b.mtime),
      ];
      for (const f of evictionOrder) {
        if (totalBytes <= MAX_CACHE_BYTES) break;
        try {
          fs.unlinkSync(f.filepath);
          totalBytes -= f.size;
          deletedCount++;
          console.log(`   ❌ Evicted (cache over ${Math.round(MAX_CACHE_BYTES / 1024 / 1024)}MB, ${f.hasAnalysis ? 'analyzed' : 'unanalyzed'}): ${f.file}`);
        } catch (e) {
          console.error(`Could not evict ${f.file}:`, e.message);
        }
      }
    }

    console.log(`🗑️ Cleanup: ${deletedCount} files removed, cache at ${(totalBytes / 1024 / 1024).toFixed(0)}MB${exclude ? ` (excluded ${exclude})` : ''}`);
    res.json({ message: 'Old files cleared', count: deletedCount });
  } catch (error) {
    res.status(500).json({ error: 'Could not clear files' });
  }
});

/**
 * Resolve a user-supplied filename against a base directory and confirm the
 * result stays inside it. Blocks path-traversal (e.g. "../../etc/passwd" or
 * URL-encoded "%2F.." segments). Returns the safe absolute path, or null if
 * the name escapes baseDir or isn't a plain filename.
 */
function resolveWithinDir(baseDir, filename) {
  if (!filename || typeof filename !== 'string') return null;
  // A legitimate cache file is a single path segment; reject anything with
  // separators or traversal before touching the filesystem.
  if (filename.includes('/') || filename.includes('\\') || filename.includes('\0')) return null;
  const resolved = path.resolve(baseDir, filename);
  const root = path.resolve(baseDir) + path.sep;
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

/**
 * Sanitize filename - remove special characters that could cause issues
 * Must match client-side sanitizeForKey() for consistent cache keys
 */
function sanitizeFilename(str) {
  return str
    .toLowerCase()
    .trim()                        // Trim whitespace to match client
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename chars
    .replace(/\s+/g, '_')          // Replace spaces with underscores
    .replace(/[^\w\-_.]/g, '')     // Remove other special chars
    .replace(/_+/g, '_')           // Collapse multiple underscores
    .substring(0, 100);            // Limit length
}

/**
 * Extract keywords from a string for fuzzy matching
 * Returns an array of lowercase words (3+ chars) that are meaningful
 */
function extractKeywords(str) {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')  // Replace special chars with spaces
    .split(/\s+/)                   // Split by whitespace
    .map(word => word.trim())
    .filter(word => word.length >= 3)  // Only words with 3+ chars
    .filter(word => !['the', 'and', 'for', 'from', 'with', 'feat', 'featuring'].includes(word)); // Skip common words
}

/**
 * Check if a filename contains all the keywords (fuzzy match)
 * Returns true if all keywords are found in the filename
 */
function fuzzyMatchFilename(filename, artistKeywords, songKeywords) {
  const filenameLower = filename.toLowerCase();
  
  // Check if at least some artist keywords match (at least 1 if available)
  const artistMatches = artistKeywords.filter(kw => filenameLower.includes(kw));
  const hasArtistMatch = artistKeywords.length === 0 || artistMatches.length >= 1;
  
  // Check if most song keywords match (at least half, minimum 1)
  const songMatches = songKeywords.filter(kw => filenameLower.includes(kw));
  const minSongMatches = Math.max(1, Math.ceil(songKeywords.length / 2));
  const hasSongMatch = songKeywords.length === 0 || songMatches.length >= minSongMatches;
  
  return hasArtistMatch && hasSongMatch;
}

/**
 * Find a file by fuzzy matching artist and song keywords
 * @param {string} directory - Directory to search in
 * @param {string} artist - Artist name
 * @param {string} song - Song name
 * @param {string} extension - File extension (e.g., '.mp3', '.json')
 * @returns {string|null} - Matching filename or null
 */
function findFileByFuzzyMatch(directory, artist, song, extension) {
  try {
    const files = fs.readdirSync(directory).filter(f => f.endsWith(extension));
    const artistKeywords = extractKeywords(artist);
    const songKeywords = extractKeywords(song);
    
    // console.log(`🔍 Fuzzy search: artist=[${artistKeywords.join(', ')}] song=[${songKeywords.join(', ')}]`);
    
    for (const file of files) {
      if (fuzzyMatchFilename(file, artistKeywords, songKeywords)) {
        console.log(`✅ Fuzzy match found: ${file}`);
        return file;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Fuzzy search error:', error);
    return null;
  }
}

/**
 * Generate cache filename from artist and song name
 */
function getCacheFilename(artist, song) {
  const sanitizedArtist = sanitizeFilename(artist);
  const sanitizedSong = sanitizeFilename(song);
  return `${sanitizedArtist}-${sanitizedSong}.mp3`;
}

// Check if MP3 exists by artist-song name (cache check endpoint)
app.get('/check-mp3-cache', (req, res) => {
  const { artist, song } = req.query;
  
  if (!artist || !song) {
    return res.status(400).json({ error: 'Artist and song are required' });
  }
  
  const cacheFilename = getCacheFilename(artist, song);
  const cachePath = path.join(MP3_DIR, cacheFilename);
  
  // First try exact match
  if (fs.existsSync(cachePath)) {
    const stats = fs.statSync(cachePath);
    const mp3Url = `/mp3files/${encodeURIComponent(cacheFilename)}`;
    console.log(`📦 Cache HIT (exact): ${cacheFilename}`);
    return res.json({
      cached: true,
      mp3Url: mp3Url,
      filename: cacheFilename,
      artist: artist,
      song: song,
      size: stats.size,
      created: stats.birthtime
    });
  }
  
  // Try fuzzy match as fallback
  const fuzzyMatch = findFileByFuzzyMatch(MP3_DIR, artist, song, '.mp3');
  if (fuzzyMatch) {
    const fuzzyPath = path.join(MP3_DIR, fuzzyMatch);
    const stats = fs.statSync(fuzzyPath);
    const mp3Url = `/mp3files/${encodeURIComponent(fuzzyMatch)}`;
    console.log(`📦 Cache HIT (fuzzy): ${fuzzyMatch}`);
    return res.json({
      cached: true,
      mp3Url: mp3Url,
      filename: fuzzyMatch,
      artist: artist,
      song: song,
      size: stats.size,
      created: stats.birthtime
    });
  }
  
  console.log(`📭 Cache MISS: ${cacheFilename}`);
  return res.json({ cached: false, expectedFilename: cacheFilename });
});

/**
 * Validate and sanitize YouTube URL to prevent command injection
 * Returns sanitized URL or null if invalid
 */
function sanitizeYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Remove any shell metacharacters that could be used for injection
  const dangerousChars = /[;&|`$(){}\[\]<>\\\n\r]/g;
  if (dangerousChars.test(url)) {
    console.warn('⚠️ Potentially malicious URL detected:', url);
    return null;
  }
  
  // Validate URL format strictly
  const youtubePatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/,
    /^https?:\/\/youtu\.be\/[a-zA-Z0-9_-]{11}/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]{11}/
  ];
  
  const isValidYouTubeUrl = youtubePatterns.some(pattern => pattern.test(url));
  if (!isValidYouTubeUrl) {
    return null;
  }
  
  return url;
}

// Main endpoint to extract MP3 from YouTube URL
app.post('/get-mp3', expensiveLimiter, async (req, res) => {
  const { url: rawYoutubeUrl, artist, song, clearOld, deviceId } = req.body;

  // Validate and sanitize YouTube URL
  const youtubeUrl = sanitizeYouTubeUrl(rawYoutubeUrl);
  
  if (!youtubeUrl) {
    return res.status(400).json({ error: 'Invalid or missing YouTube URL. Must be a valid youtube.com or youtu.be link.' });
  }

  // Extract video ID from URL (already validated)
  const videoIdMatch = youtubeUrl.match(/[?&]v=([^&]+)/) || youtubeUrl.match(/youtu\.be\/([^?]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  // Use artist-song naming if provided (for proper caching)
  const cacheFilename = (artist && song) ? getCacheFilename(artist, song) : null;
  
  // Check cache by artist-song filename FIRST (before clearing old files)
  if (cacheFilename) {
    const cachePath = path.join(MP3_DIR, cacheFilename);
    
    // Try exact match first
    if (fs.existsSync(cachePath)) {
      const stats = fs.statSync(cachePath);
      const mp3Url = `/mp3files/${encodeURIComponent(cacheFilename)}`;
      console.log(`📦 Using cached MP3 (exact): ${cacheFilename}`);
      return res.json({
        mp3Url: mp3Url,
        filename: cacheFilename,
        title: `${artist} - ${song}`,
        artist: artist,
        song: song,
        size: stats.size,
        cached: true
      });
    }
    
    // Try fuzzy match as fallback
    const fuzzyMatch = findFileByFuzzyMatch(MP3_DIR, artist, song, '.mp3');
    if (fuzzyMatch) {
      const fuzzyPath = path.join(MP3_DIR, fuzzyMatch);
      const stats = fs.statSync(fuzzyPath);
      const mp3Url = `/mp3files/${encodeURIComponent(fuzzyMatch)}`;
      console.log(`📦 Using cached MP3 (fuzzy): ${fuzzyMatch}`);
      return res.json({
        mp3Url: mp3Url,
        filename: fuzzyMatch,
        title: `${artist} - ${song}`,
        artist: artist,
        song: song,
        size: stats.size,
        cached: true
      });
    }
  }

  // Note: Automatic cleanup during download removed
  // Cleanup now happens at the start of song via /clear-mp3s endpoint

  // Legacy cache check by video ID (fallback)
  if (videoId && !cacheFilename) {
    const existingFiles = fs.readdirSync(MP3_DIR).filter(f => f.endsWith('.mp3'));
    for (const file of existingFiles) {
      const filepath = path.join(MP3_DIR, file);
      const stats = fs.statSync(filepath);
      const ageMs = Date.now() - stats.mtimeMs;
      // If file is less than 1 hour old, return it as cached
      if (ageMs < 3600000) {
        const mp3Url = `/mp3files/${encodeURIComponent(file)}`;
        console.log(`✅ Using cached MP3 (legacy): ${file}`);
        return res.json({
          mp3Url: mp3Url,
          filename: file,
          title: file.replace(/_\d+\.mp3$/, ''),
          size: stats.size,
          cached: true
        });
      }
    }
  }

  // ==================== DOWNLOAD LOCKING ====================
  // Try to acquire lock BEFORE starting download to prevent race conditions
  if (artist && song) {
    const lockResult = acquireDownloadLock(artist, song, deviceId || 'unknown');

    if (!lockResult.acquired) {
      // Another device is downloading - tell client to poll
      console.log(`⏳ Download lock denied for ${artist} - ${song}, another device is downloading`);
      return res.status(202).json({
        status: 'in_progress',
        message: 'Another device is downloading this song',
        waitTime: Date.now() - lockResult.existingLock.startTime,
        retry: true
      });
    }

    // Double-check cache after acquiring lock (another device may have just finished)
    const cachePath = path.join(MP3_DIR, cacheFilename);
    if (fs.existsSync(cachePath)) {
      releaseDownloadLock(artist, song, true);
      const stats = fs.statSync(cachePath);
      const mp3Url = `/mp3files/${encodeURIComponent(cacheFilename)}`;
      console.log(`📦 Using cached MP3 (post-lock check): ${cacheFilename}`);
      return res.json({
        mp3Url: mp3Url,
        filename: cacheFilename,
        title: `${artist} - ${song}`,
        artist: artist,
        song: song,
        size: stats.size,
        cached: true
      });
    }
  }

  console.log(`📥 Processing: ${youtubeUrl}`);
  console.log(`   Artist: ${artist || 'unknown'}, Song: ${song || 'unknown'}`);

  // Determine output filename
  let outputPath;
  let finalFilename;
  
  if (cacheFilename) {
    // Use artist-song naming for proper caching
    outputPath = path.join(MP3_DIR, cacheFilename.replace('.mp3', '.%(ext)s'));
    finalFilename = cacheFilename;
    
    // 🧹 CLEANUP: Remove any incomplete/corrupted intermediate files
    // This fixes the "unable to obtain file audio codec with ffprobe" error
    // caused by leftover .webm/.opus/.m4a files from failed downloads
    const baseName = cacheFilename.replace('.mp3', '');
    const intermediateExtensions = ['.webm', '.opus', '.m4a', '.ogg', '.part', '.ytdl'];
    
    intermediateExtensions.forEach(ext => {
      const intermediatePath = path.join(MP3_DIR, baseName + ext);
      if (fs.existsSync(intermediatePath)) {
        console.log(`🧹 Cleaning up incomplete file: ${baseName + ext}`);
        try {
          fs.unlinkSync(intermediatePath);
        } catch (cleanupErr) {
          console.error(`⚠️ Could not delete ${baseName + ext}:`, cleanupErr.message);
        }
      }
    });
  } else {
    // Fallback to timestamp naming
    const timestamp = Date.now();
    outputPath = path.join(MP3_DIR, `%(title)s_${timestamp}.%(ext)s`);
    finalFilename = null; // Will be determined after download
  }

  // Extract audio as MP3 via yt-dlp, rotating through player clients on failure.
  // execFile + args array: outputPath/URL are literal arguments, never parsed
  // by a shell (defense-in-depth; URL is already regex-validated). A local POT
  // provider supplies proof-of-origin tokens so YouTube trusts the request.
  const tryDownload = (attempt) => {
    const clientSpec = YT_DLP_CLIENTS[attempt];
    const args = buildDownloadArgs(clientSpec, outputPath, youtubeUrl);
    console.log(`⬇️ Download attempt ${attempt + 1}/${YT_DLP_CLIENTS.length} (client=${clientSpec}): ${youtubeUrl}`);

    execFile('yt-dlp', args, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    console.log('📋 yt-dlp stdout:', stdout);
    console.log('📋 yt-dlp stderr:', stderr);

    if (error) {
      console.error(`❌ yt-dlp error (client=${clientSpec}):`, error.message);
      console.error('stderr:', stderr);
      // Retry with the next player client if any remain
      if (attempt + 1 < YT_DLP_CLIENTS.length) {
        console.log('🔄 Retrying download with next player client...');
        return tryDownload(attempt + 1);
      }
      // Release lock on failure
      if (artist && song) {
        releaseDownloadLock(artist, song, false);
      }
      return res.status(500).json({
        error: 'Failed to download MP3',
        details: stderr || error.message
      });
    }

    // Find the downloaded MP3 file
    let mp3Filename;
    
    if (cacheFilename) {
      // We know the exact filename we requested
      mp3Filename = cacheFilename;
    } else {
      // Fallback: Find file by timestamp pattern
      const timestamp = Date.now();
      const files = fs.readdirSync(MP3_DIR);
      mp3Filename = files
        .filter(f => f.endsWith('.mp3'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(MP3_DIR, a));
          const statB = fs.statSync(path.join(MP3_DIR, b));
          return statB.mtimeMs - statA.mtimeMs;
        })
        .shift(); // Get most recent
    }
    
    console.log('📁 Looking for MP3:', mp3Filename);

    if (!mp3Filename) {
      console.error('❌ Could not determine MP3 filename');
      if (artist && song) {
        releaseDownloadLock(artist, song, false);
      }
      return res.status(500).json({ error: 'Could not determine MP3 filename' });
    }

    const mp3Path = path.join(MP3_DIR, mp3Filename);

    // Verify file exists
    if (!fs.existsSync(mp3Path)) {
      console.error('❌ MP3 file not found:', mp3Path);
      if (artist && song) {
        releaseDownloadLock(artist, song, false);
      }
      return res.status(500).json({ error: 'MP3 file not found after download' });
    }

    const fileStats = fs.statSync(mp3Path);
    const mp3Url = `/mp3files/${encodeURIComponent(mp3Filename)}`;

    console.log(`✅ MP3 ready: ${mp3Filename}`);
    console.log(`📁 Size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

    // Release lock on success
    if (artist && song) {
      releaseDownloadLock(artist, song, true);
    }

    res.json({
      mp3Url: mp3Url,
      filename: mp3Filename,
      title: (artist && song) ? `${artist} - ${song}` : mp3Filename.replace(/\.mp3$/, ''),
      artist: artist || null,
      song: song || null,
      size: fileStats.size,
      path: mp3Path,
      cached: false
    });
    });
  };

  tryDownload(0);
});

// List all downloaded MP3 files
app.get('/mp3files/list', (req, res) => {
  try {
    const files = fs.readdirSync(MP3_DIR)
      .filter(f => f.endsWith('.mp3'))
      .map(filename => {
        const filepath = path.join(MP3_DIR, filename);
        const stats = fs.statSync(filepath);
        return {
          filename,
          url: `/mp3files/${encodeURIComponent(filename)}`,
          size: stats.size,
          created: stats.birthtime
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({ files, count: files.length });
  } catch (error) {
    res.status(500).json({ error: 'Could not list files' });
  }
});

// Delete an MP3 file
app.delete('/mp3files/:filename', requireAdmin, (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filepath = resolveWithinDir(MP3_DIR, filename);

  if (!filepath) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    fs.unlinkSync(filepath);
    res.json({ message: 'File deleted', filename });
  } catch (error) {
    res.status(500).json({ error: 'Could not delete file' });
  }
});

// Clear all MP3 files
app.delete('/mp3files/clear/all', requireAdmin, (req, res) => {
  try {
    const files = fs.readdirSync(MP3_DIR).filter(f => f.endsWith('.mp3'));
    files.forEach(file => fs.unlinkSync(path.join(MP3_DIR, file)));
    res.json({ message: 'All files deleted', count: files.length });
  } catch (error) {
    res.status(500).json({ error: 'Could not clear files' });
  }
});

// ==================== ANALYSIS DATA ENDPOINTS ====================

/**
 * Generate analysis filename from artist and song
 */
function getAnalysisFilename(artist, song) {
  const sanitizedArtist = sanitizeFilename(artist);
  const sanitizedSong = sanitizeFilename(song);
  return `${sanitizedArtist}-${sanitizedSong}.json`;
}

// ==================== UNIFIED STATUS CHECK ENDPOINT ====================
// Single atomic check for multi-device coordination
app.get('/check-status', (req, res) => {
  const { artist, song, deviceId } = req.query;

  if (!artist || !song) {
    return res.status(400).json({ error: 'Artist and song are required' });
  }

  // 1. Check if analysis is already cached (complete)
  const analysisFilename = getAnalysisFilename(artist, song);
  const analysisPath = path.join(ANALYSIS_DIR, analysisFilename);

  if (fs.existsSync(analysisPath)) {
    console.log(`📊 Status: analysis_ready (exact) for ${artist} - ${song}`);
    return res.json({
      status: 'analysis_ready',
      analysisUrl: `/analysis/${encodeURIComponent(analysisFilename)}`
    });
  }

  // Try fuzzy match for analysis
  const fuzzyAnalysis = findFileByFuzzyMatch(ANALYSIS_DIR, artist, song, '.json');
  if (fuzzyAnalysis) {
    console.log(`📊 Status: analysis_ready (fuzzy) for ${artist} - ${song}`);
    return res.json({
      status: 'analysis_ready',
      analysisUrl: `/analysis/${encodeURIComponent(fuzzyAnalysis)}`
    });
  }

  // 2. Check if someone is analyzing
  const analysisLock = getAnalysisStatus(artist, song);
  if (analysisLock) {
    console.log(`📊 Status: analyzing for ${artist} - ${song}`);
    return res.json({
      status: 'analyzing',
      waitTime: Date.now() - analysisLock.startTime
    });
  }

  // 3. Check if MP3 is cached (ready for analysis)
  const cacheFilename = getCacheFilename(artist, song);
  const cachePath = path.join(MP3_DIR, cacheFilename);

  if (fs.existsSync(cachePath)) {
    const mp3Url = `/mp3files/${encodeURIComponent(cacheFilename)}`;
    console.log(`📊 Status: mp3_ready for ${artist} - ${song}`);
    return res.json({
      status: 'mp3_ready',
      mp3Url: mp3Url
    });
  }

  // Try fuzzy match for MP3
  const fuzzyMp3 = findFileByFuzzyMatch(MP3_DIR, artist, song, '.mp3');
  if (fuzzyMp3) {
    const mp3Url = `/mp3files/${encodeURIComponent(fuzzyMp3)}`;
    console.log(`📊 Status: mp3_ready (fuzzy) for ${artist} - ${song}`);
    return res.json({
      status: 'mp3_ready',
      mp3Url: mp3Url
    });
  }

  // 4. Check if download is in progress
  const downloadLock = getDownloadStatus(artist, song);
  if (downloadLock) {
    console.log(`📊 Status: downloading for ${artist} - ${song}`);
    return res.json({
      status: 'downloading',
      waitTime: Date.now() - downloadLock.startTime
    });
  }

  // 5. Nothing cached, not in progress
  console.log(`📊 Status: not_found for ${artist} - ${song}`);
  return res.json({
    status: 'not_found'
  });
});

// ==================== ANALYSIS LOCK NOTIFICATION ====================
// Client calls this before starting analysis to let other devices know
app.post('/notify-analyzing', (req, res) => {
  const { artist, song, deviceId } = req.body;

  if (!artist || !song) {
    return res.status(400).json({ error: 'Artist and song are required' });
  }

  const lockResult = acquireAnalysisLock(artist, song, deviceId || 'unknown');

  if (!lockResult.acquired) {
    return res.json({
      acquired: false,
      status: 'already_analyzing',
      waitTime: Date.now() - lockResult.existingLock.startTime
    });
  }

  return res.json({
    acquired: true,
    status: 'analyzing'
  });
});

// Release analysis lock endpoint (called when analysis completes or fails)
app.post('/release-analysis-lock', (req, res) => {
  const { artist, song, success } = req.body;

  if (!artist || !song) {
    return res.status(400).json({ error: 'Artist and song are required' });
  }

  releaseAnalysisLock(artist, song, success !== false);
  return res.json({ released: true });
});

// Check if analysis data exists
app.get('/check-analysis-cache', (req, res) => {
  const { artist, song } = req.query;
  
  if (!artist || !song) {
    return res.status(400).json({ error: 'Artist and song are required' });
  }
  
  const analysisFilename = getAnalysisFilename(artist, song);
  const analysisPath = path.join(ANALYSIS_DIR, analysisFilename);
  
  // Try exact match first
  if (fs.existsSync(analysisPath)) {
    const stats = fs.statSync(analysisPath);
    console.log(`📦 Analysis cache HIT (exact): ${analysisFilename}`);
    return res.json({
      cached: true,
      filename: analysisFilename,
      url: `/analysis/${encodeURIComponent(analysisFilename)}`,
      artist: artist,
      song: song,
      size: stats.size,
      created: stats.birthtime
    });
  }
  
  // Try fuzzy match as fallback
  const fuzzyMatch = findFileByFuzzyMatch(ANALYSIS_DIR, artist, song, '.json');
  if (fuzzyMatch) {
    const fuzzyPath = path.join(ANALYSIS_DIR, fuzzyMatch);
    const stats = fs.statSync(fuzzyPath);
    console.log(`📦 Analysis cache HIT (fuzzy): ${fuzzyMatch}`);
    return res.json({
      cached: true,
      filename: fuzzyMatch,
      url: `/analysis/${encodeURIComponent(fuzzyMatch)}`,
      artist: artist,
      song: song,
      size: stats.size,
      created: stats.birthtime
    });
  }
  
  console.log(`📭 Analysis cache MISS: ${analysisFilename}`);
  return res.json({ cached: false, expectedFilename: analysisFilename });
});

// Get analysis data
app.get('/get-analysis', (req, res) => {
  const { artist, song } = req.query;
  
  if (!artist || !song) {
    return res.status(400).json({ error: 'Artist and song are required' });
  }
  
  const analysisFilename = getAnalysisFilename(artist, song);
  const analysisPath = path.join(ANALYSIS_DIR, analysisFilename);
  
  // Try exact match first
  if (fs.existsSync(analysisPath)) {
    try {
      const data = fs.readFileSync(analysisPath, 'utf8');
      const analysis = JSON.parse(data);
      console.log(`📦 Loaded analysis (exact): ${analysisFilename}`);
      return res.json(analysis);
    } catch (error) {
      console.error('❌ Failed to read analysis:', error);
      return res.status(500).json({ error: 'Failed to read analysis data' });
    }
  }
  
  // Try fuzzy match as fallback
  const fuzzyMatch = findFileByFuzzyMatch(ANALYSIS_DIR, artist, song, '.json');
  if (fuzzyMatch) {
    const fuzzyPath = path.join(ANALYSIS_DIR, fuzzyMatch);
    try {
      const data = fs.readFileSync(fuzzyPath, 'utf8');
      const analysis = JSON.parse(data);
      console.log(`📦 Loaded analysis (fuzzy): ${fuzzyMatch}`);
      return res.json(analysis);
    } catch (error) {
      console.error('❌ Failed to read analysis:', error);
      return res.status(500).json({ error: 'Failed to read analysis data' });
    }
  }
  
  return res.status(404).json({ error: 'Analysis not found', filename: analysisFilename });
});

// Save analysis data
app.post('/save-analysis', writeLimiter, (req, res) => {
  const { artist, song, data, deviceId } = req.body;

  if (!artist || !song || !data) {
    return res.status(400).json({ error: 'Artist, song, and data are required' });
  }

  // Basic shape validation: analysis data must be a JSON object/array, and
  // artist/song must be short strings. Blocks junk/oversized scalar writes
  // (rate limiting above bounds volume; this bounds per-item shape).
  if (typeof data !== 'object' || data === null) {
    return res.status(400).json({ error: 'Analysis data must be an object' });
  }
  if (typeof artist !== 'string' || typeof song !== 'string' ||
      artist.length > 300 || song.length > 300) {
    return res.status(400).json({ error: 'Invalid artist or song' });
  }

  const analysisFilename = getAnalysisFilename(artist, song);
  const analysisPath = path.join(ANALYSIS_DIR, analysisFilename);

  // Check if analysis already exists (another device may have saved it)
  if (fs.existsSync(analysisPath)) {
    console.log(`📦 Analysis already exists (saved by another device): ${analysisFilename}`);
    // Release lock if we had it
    releaseAnalysisLock(artist, song, true);
    const stats = fs.statSync(analysisPath);
    return res.json({
      success: true,
      message: 'Analysis already saved by another device',
      cached: true,
      filename: analysisFilename,
      size: stats.size,
      url: `/analysis/${encodeURIComponent(analysisFilename)}`
    });
  }

  try {
    fs.writeFileSync(analysisPath, JSON.stringify(data, null, 2));
    const stats = fs.statSync(analysisPath);
    console.log(`💾 Saved analysis: ${analysisFilename} (${(stats.size / 1024).toFixed(1)}KB)`);

    // Release analysis lock after saving
    releaseAnalysisLock(artist, song, true);

    res.json({
      success: true,
      filename: analysisFilename,
      size: stats.size,
      url: `/analysis/${encodeURIComponent(analysisFilename)}`
    });
  } catch (error) {
    console.error('❌ Failed to save analysis:', error);
    // Release lock on failure
    releaseAnalysisLock(artist, song, false);
    res.status(500).json({ error: 'Failed to save analysis data' });
  }
});

// List all analysis files
app.get('/analysis/list', (req, res) => {
  try {
    const files = fs.readdirSync(ANALYSIS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(filename => {
        const filepath = path.join(ANALYSIS_DIR, filename);
        const stats = fs.statSync(filepath);
        return {
          filename,
          url: `/analysis/${encodeURIComponent(filename)}`,
          size: stats.size,
          created: stats.birthtime
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({ files, count: files.length });
  } catch (error) {
    res.status(500).json({ error: 'Could not list analysis files' });
  }
});

// Delete analysis file
app.delete('/analysis/:filename', requireAdmin, (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filepath = resolveWithinDir(ANALYSIS_DIR, filename);

  if (!filepath) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Analysis file not found' });
  }

  try {
    fs.unlinkSync(filepath);
    res.json({ message: 'Analysis deleted', filename });
  } catch (error) {
    res.status(500).json({ error: 'Could not delete analysis file' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🎵 YouTube to MP3 Server - Educational Research');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📡 Server running on: http://localhost:${PORT}`);
  console.log(`  📁 MP3 files stored in: ${MP3_DIR}`);
  console.log(`  📊 Analysis data stored in: ${ANALYSIS_DIR}`);
  console.log('');
  console.log('  Endpoints:');
  console.log(`    POST /get-mp3              - Extract MP3 from YouTube URL`);
  console.log(`    GET  /check-mp3-cache      - Check if MP3 is cached`);
  console.log(`    GET  /mp3files/list        - List all MP3 files`);
  console.log(`    GET  /mp3files/:file       - Download MP3 file`);
  console.log(`    GET  /check-analysis-cache - Check if analysis is cached`);
  console.log(`    GET  /get-analysis         - Get cached analysis data`);
  console.log(`    POST /save-analysis        - Save analysis data`);
  console.log(`    GET  /analysis/list        - List all analysis files`);
  console.log(`    GET  /health               - Server health check`);
  console.log('═══════════════════════════════════════════════════════════');
});

module.exports = app;
