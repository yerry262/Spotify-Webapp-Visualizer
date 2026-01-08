# YouTube to MP3 Backend Server

Express.js backend server that extracts MP3 audio from YouTube videos using yt-dlp. Includes a smart caching system that stores MP3 files with artist-song naming for quick lookup.

> 📚 **Educational Research Only** - This server is for educational and research purposes.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start server
node server.js
```

Server runs on `http://localhost:3001`

## 📋 Prerequisites

- **Node.js** v16+
- **yt-dlp** - YouTube downloader (see installation below)
- **FFmpeg** - Audio conversion tool (see installation below)

### Installation

**Windows:**
```bash
winget install yt-dlp
winget install ffmpeg
```

**Mac:**
```bash
brew install yt-dlp ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
pip install yt-dlp
```

**Or use pip (all platforms):**
```bash
pip install -r requirements.txt
```

## 🔌 API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Check MP3 Cache
```
POST /check-mp3-cache
Content-Type: application/json

{
  "artist": "Artist Name",
  "song": "Song Title"
}
```
Returns if cached:
```json
{
  "cached": true,
  "mp3Url": "http://localhost:3001/mp3files/artist_name-song_title.mp3",
  "filename": "artist_name-song_title.mp3"
}
```
Returns if not cached:
```json
{
  "cached": false
}
```

### Extract MP3
```
POST /get-mp3
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "artist": "Artist Name",
  "song": "Song Title"
}
```
Returns:
```json
{
  "mp3Url": "http://localhost:3001/mp3files/artist_name-song_title.mp3",
  "filename": "artist_name-song_title.mp3",
  "title": "Song Title",
  "size": 12345678
}
```

> **Note**: If `artist` and `song` are provided, the file is saved as `artist-song.mp3` (sanitized). Otherwise, falls back to `video_title_timestamp.mp3`.

### List MP3 Files
```
GET /mp3files/list
```
Returns list of all downloaded MP3 files.

### Delete MP3 File
```
DELETE /mp3files/:filename
```
Deletes a specific MP3 file.

### Clear All MP3 Files
```
DELETE /mp3files/clear
```
Deletes all MP3 files.

## 📁 File Storage

MP3 files are stored in the `mp3files/` directory. Files are served statically at:
```
GET /mp3files/:filename
```

### Naming Convention
Files are saved as `artist_name-song_title.mp3`:
- Lowercase
- Spaces replaced with underscores
- Special characters removed
- Example: `Taylor Swift - Blank Space` → `taylor_swift-blank_space.mp3`

## ⚠️ Notes

- Downloaded MP3 files can be large - clear periodically with `DELETE /mp3files/clear`
- The server uses CORS to allow requests from the React frontend (localhost:3000)
- yt-dlp and ffmpeg executables should be in this folder (Windows) or system PATH
