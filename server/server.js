// Backend Server for YouTube to MP3 Extraction
// Educational Research Purposes - Spotify & Google Research Project
// Uses yt-dlp for audio extraction

const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001; // Different port from React app (3000)

// Directory to store downloaded MP3 files
const MP3_DIR = path.join(__dirname, 'mp3files');

// Create MP3 directory if it doesn't exist
if (!fs.existsSync(MP3_DIR)) {
  fs.mkdirSync(MP3_DIR, { recursive: true });
}

// Middleware
app.use(cors()); // Enable CORS for React frontend
app.use(express.json());

// Serve static MP3 files
app.use('/mp3files', express.static(MP3_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'YouTube to MP3 server is running' });
});

// Clear all MP3 files endpoint
app.post('/clear-mp3s', (req, res) => {
  try {
    const files = fs.readdirSync(MP3_DIR).filter(f => f.endsWith('.mp3'));
    let deletedCount = 0;
    files.forEach(file => {
      try {
        fs.unlinkSync(path.join(MP3_DIR, file));
        deletedCount++;
      } catch (e) {
        console.error(`Could not delete ${file}:`, e.message);
      }
    });
    console.log(`🗑️ Cleared ${deletedCount} MP3 files`);
    res.json({ message: 'MP3 files cleared', count: deletedCount });
  } catch (error) {
    res.status(500).json({ error: 'Could not clear files' });
  }
});

/**
 * Sanitize filename - remove special characters that could cause issues
 */
function sanitizeFilename(str) {
  return str
    .toLowerCase()
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename chars
    .replace(/\s+/g, '_')          // Replace spaces with underscores
    .replace(/[^\w\-_.]/g, '')     // Remove other special chars
    .replace(/_+/g, '_')           // Collapse multiple underscores
    .substring(0, 100);            // Limit length
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
  
  if (fs.existsSync(cachePath)) {
    const stats = fs.statSync(cachePath);
    const mp3Url = `http://localhost:${PORT}/mp3files/${encodeURIComponent(cacheFilename)}`;
    console.log(`📦 Cache HIT: ${cacheFilename}`);
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
  
  console.log(`📭 Cache MISS: ${cacheFilename}`);
  return res.json({ cached: false, expectedFilename: cacheFilename });
});

// Main endpoint to extract MP3 from YouTube URL
app.post('/get-mp3', async (req, res) => {
  const { url: youtubeUrl, artist, song, clearOld } = req.body;

  // Validate YouTube URL
  if (!youtubeUrl) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  // Extract video ID from URL
  const videoIdMatch = youtubeUrl.match(/[?&]v=([^&]+)/) || youtubeUrl.match(/youtu\.be\/([^?]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  // Use artist-song naming if provided (for proper caching)
  const cacheFilename = (artist && song) ? getCacheFilename(artist, song) : null;
  
  // Check cache by artist-song filename FIRST (before clearing old files)
  if (cacheFilename) {
    const cachePath = path.join(MP3_DIR, cacheFilename);
    if (fs.existsSync(cachePath)) {
      const stats = fs.statSync(cachePath);
      const mp3Url = `http://localhost:${PORT}/mp3files/${encodeURIComponent(cacheFilename)}`;
      console.log(`📦 Using cached MP3 (artist-song): ${cacheFilename}`);
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

  // Clear old MP3 files if requested (but preserve the current cache file if it exists)
  if (clearOld) {
    const files = fs.readdirSync(MP3_DIR).filter(f => f.endsWith('.mp3'));
    let deletedCount = 0;
    files.forEach(file => {
      // Don't delete the cache file we're about to create
      if (cacheFilename && file === cacheFilename) return;
      try {
        fs.unlinkSync(path.join(MP3_DIR, file));
        deletedCount++;
      } catch (e) {
        console.error(`Could not delete ${file}:`, e.message);
      }
    });
    if (deletedCount > 0) {
      console.log(`🗑️ Cleared ${deletedCount} old MP3 files`);
    }
  }

  // Legacy cache check by video ID (fallback)
  if (videoId && !cacheFilename) {
    const existingFiles = fs.readdirSync(MP3_DIR).filter(f => f.endsWith('.mp3'));
    for (const file of existingFiles) {
      const filepath = path.join(MP3_DIR, file);
      const stats = fs.statSync(filepath);
      const ageMs = Date.now() - stats.mtimeMs;
      // If file is less than 1 hour old, return it as cached
      if (ageMs < 3600000) {
        const mp3Url = `http://localhost:${PORT}/mp3files/${encodeURIComponent(file)}`;
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

  console.log(`📥 Processing: ${youtubeUrl}`);
  console.log(`   Artist: ${artist || 'unknown'}, Song: ${song || 'unknown'}`);

  // Determine output filename
  let outputPath;
  let finalFilename;
  
  if (cacheFilename) {
    // Use artist-song naming for proper caching
    outputPath = path.join(MP3_DIR, cacheFilename.replace('.mp3', '.%(ext)s'));
    finalFilename = cacheFilename;
  } else {
    // Fallback to timestamp naming
    const timestamp = Date.now();
    outputPath = path.join(MP3_DIR, `%(title)s_${timestamp}.%(ext)s`);
    finalFilename = null; // Will be determined after download
  }

  // yt-dlp command to extract audio as MP3
  // Options:
  //   -x: Extract audio
  //   --audio-format mp3: Convert to MP3
  //   --audio-quality 0: Best quality
  //   --no-playlist: Don't download playlists
  //   --ffmpeg-location: Specify ffmpeg path
  const ytDlpPath = path.join(__dirname, 'yt-dlp.exe');
  const ffmpegPath = __dirname;
  const command = `"${ytDlpPath}" --ffmpeg-location "${ffmpegPath}" -x --audio-format mp3 --audio-quality 0 --no-playlist -o "${outputPath}" "${youtubeUrl}"`;

  exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    console.log('📋 yt-dlp stdout:', stdout);
    console.log('📋 yt-dlp stderr:', stderr);
    
    if (error) {
      console.error('❌ yt-dlp error:', error.message);
      console.error('stderr:', stderr);
      return res.status(500).json({ 
        error: 'Failed to download MP3',
        details: error.message 
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
      return res.status(500).json({ error: 'Could not determine MP3 filename' });
    }

    const mp3Path = path.join(MP3_DIR, mp3Filename);

    // Verify file exists
    if (!fs.existsSync(mp3Path)) {
      console.error('❌ MP3 file not found:', mp3Path);
      return res.status(500).json({ error: 'MP3 file not found after download' });
    }

    const fileStats = fs.statSync(mp3Path);
    const mp3Url = `http://localhost:${PORT}/mp3files/${encodeURIComponent(mp3Filename)}`;

    console.log(`✅ MP3 ready: ${mp3Filename}`);
    console.log(`📁 Size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

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
          url: `http://localhost:${PORT}/mp3files/${encodeURIComponent(filename)}`,
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
app.delete('/mp3files/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filepath = path.join(MP3_DIR, filename);

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
app.delete('/mp3files/clear/all', (req, res) => {
  try {
    const files = fs.readdirSync(MP3_DIR).filter(f => f.endsWith('.mp3'));
    files.forEach(file => fs.unlinkSync(path.join(MP3_DIR, file)));
    res.json({ message: 'All files deleted', count: files.length });
  } catch (error) {
    res.status(500).json({ error: 'Could not clear files' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🎵 YouTube to MP3 Server - Educational Research');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📡 Server running on: http://localhost:${PORT}`);
  console.log(`  📁 MP3 files stored in: ${MP3_DIR}`);
  console.log('');
  console.log('  Endpoints:');
  console.log(`    POST /get-mp3          - Extract MP3 from YouTube URL`);
  console.log(`    GET  /mp3files/list    - List all MP3 files`);
  console.log(`    GET  /mp3files/:file   - Download MP3 file`);
  console.log(`    DELETE /mp3files/:file - Delete MP3 file`);
  console.log(`    GET  /health           - Server health check`);
  console.log('═══════════════════════════════════════════════════════════');
});

module.exports = app;
