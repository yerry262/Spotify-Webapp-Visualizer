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

// Main endpoint to extract MP3 from YouTube URL
app.post('/get-mp3', async (req, res) => {
  const { url: youtubeUrl, clearOld } = req.body;

  // Validate YouTube URL
  if (!youtubeUrl) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  // Extract video ID from URL for caching
  const videoIdMatch = youtubeUrl.match(/[?&]v=([^&]+)/) || youtubeUrl.match(/youtu\.be\/([^?]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  // Clear old MP3 files if requested
  if (clearOld) {
    const files = fs.readdirSync(MP3_DIR).filter(f => f.endsWith('.mp3'));
    files.forEach(file => {
      try {
        fs.unlinkSync(path.join(MP3_DIR, file));
      } catch (e) {
        console.error(`Could not delete ${file}:`, e.message);
      }
    });
    console.log(`🗑️ Cleared ${files.length} old MP3 files`);
  }

  // Check if we already have this video downloaded (by video ID in filename)
  if (videoId) {
    const existingFiles = fs.readdirSync(MP3_DIR).filter(f => f.endsWith('.mp3'));
    // Check for recent file (within last hour) - simple cache
    for (const file of existingFiles) {
      const filepath = path.join(MP3_DIR, file);
      const stats = fs.statSync(filepath);
      const ageMs = Date.now() - stats.mtimeMs;
      // If file is less than 1 hour old, return it as cached
      if (ageMs < 3600000) {
        const mp3Url = `http://localhost:${PORT}/mp3files/${encodeURIComponent(file)}`;
        console.log(`✅ Using cached MP3: ${file}`);
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

  // Generate unique filename based on timestamp
  const timestamp = Date.now();
  const outputTemplate = path.join(MP3_DIR, `%(title)s_${timestamp}.%(ext)s`);

  // yt-dlp command to extract audio as MP3
  // Options:
  //   -x: Extract audio
  //   --audio-format mp3: Convert to MP3
  //   --audio-quality 0: Best quality
  //   --no-playlist: Don't download playlists
  //   --ffmpeg-location: Specify ffmpeg path
  const ytDlpPath = path.join(__dirname, 'yt-dlp.exe');
  const ffmpegPath = __dirname;
  const command = `"${ytDlpPath}" --ffmpeg-location "${ffmpegPath}" -x --audio-format mp3 --audio-quality 0 --no-playlist -o "${outputTemplate}" "${youtubeUrl}"`;

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

    // Find the MP3 file in the directory with our timestamp
    const files = fs.readdirSync(MP3_DIR);
    console.log('📁 Files in MP3_DIR:', files);
    const mp3Filename = files
      .filter(f => f.includes(`_${timestamp}`) && f.endsWith('.mp3'))
      .sort()
      .pop();

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
      title: mp3Filename.replace(`_${timestamp}.mp3`, ''),
      size: fileStats.size,
      path: mp3Path
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
