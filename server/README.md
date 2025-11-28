# YouTube to MP3 Backend Server

Express.js backend server that extracts MP3 audio from YouTube videos using yt-dlp.

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
- **yt-dlp** - `pip install yt-dlp`
- **FFmpeg** - Required for audio conversion

## 🔌 API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Extract MP3
```
POST /get-mp3
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```
Returns:
```json
{
  "mp3Url": "http://localhost:3001/mp3files/filename.mp3",
  "filename": "Song Title_timestamp.mp3",
  "title": "Song Title",
  "size": 12345678
}
```

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

## ⚠️ Notes

- Downloaded MP3 files can be large - clear periodically
- The server uses CORS to allow requests from the React frontend (localhost:3000)
- yt-dlp must be installed and accessible in system PATH
