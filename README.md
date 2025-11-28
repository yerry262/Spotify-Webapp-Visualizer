# Spotify Audio Visualizer

A React-based music visualizer that displays real-time audio analysis synchronized with your Spotify playback. The app analyzes MP3 audio files using **Essentia.js** to extract mel spectrograms, HPCP chroma, pitch data, and beat information, creating stunning visualizations that react to the actual audio content.

> 📚 **Educational Research Project** - This project is for educational and research purposes related to audio analysis and music information retrieval.

## 🎵 How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         YOUR PHONE (Spotify App)                        │
│                    Playing music through speakers/headphones            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     │ Spotify API
                                     │ (track info, playback position)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      COMPUTER (This App - React)                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  1. Get current track info from Spotify API                     │    │
│  │  2. Search YouTube for the song (YouTube Data API v3)           │    │
│  │  3. Download MP3 via backend server (yt-dlp)                    │    │
│  │  4. Analyze audio with Essentia.js (WASM)                       │    │
│  │  5. Sync visualization with Spotify playback position           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    VISUALIZATION OUTPUT                         │    │
│  │  • Mel Spectrogram (frequency bands)                            │    │
│  │  • HPCP Chroma (pitch classes C, C#, D... B)                    │    │
│  │  • Pitch contour (melody tracking)                              │    │
│  │  • Beat detection (BPM, beat position)                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Features

- **Real Audio Analysis**: Uses Essentia.js (industry-standard audio analysis library) for accurate music feature extraction
- **Spotify Integration**: Connects to your Spotify account to track what's currently playing
- **YouTube MP3 Extraction**: Automatically finds and downloads audio for analysis
- **Multiple Visualization Modes**:
  - **Combined**: Shows mel spectrogram, chroma ring, and waveform together
  - **Mel Spectrogram**: Frequency band visualization (bass to treble)
  - **Chroma**: 12 pitch classes showing harmonic content
  - **Pitch**: Melody contour tracking
- **Beat Sync**: Visual pulses synchronized with detected beats
- **Responsive Design**: Works on desktop and mobile browsers

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://python.org/)
- **FFmpeg** - Required for audio conversion
  - Windows: `winget install ffmpeg` or [Download](https://ffmpeg.org/download.html)
  - Mac: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`
- **yt-dlp** - YouTube downloader
  - All platforms: `pip install yt-dlp`

## 🔑 API Keys Required

### 1. Spotify Developer Account
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy the **Client ID**
4. In settings, add `http://127.0.0.1:3000/callback` to **Redirect URIs**

### 2. Google Cloud / YouTube Data API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services** > **Library**
4. Search for and enable **YouTube Data API v3**
5. Go to **Credentials** > **Create Credentials** > **API Key**
6. Copy the API key

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Spotify-API.git
   cd Spotify-API
   ```

2. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your API keys
   # REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id
   # REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
   ```

3. **Install frontend dependencies**
   ```bash
   npm install
   ```

4. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

5. **Verify yt-dlp and FFmpeg are installed**
   ```bash
   yt-dlp --version
   ffmpeg -version
   ```

## 🏃 Running the App

You need to run **two terminals** - one for the backend server and one for the React frontend.

### Terminal 1: Backend Server
```bash
cd server
node server.js
```
Server will start on `http://localhost:3001`

### Terminal 2: React Frontend
```bash
npm start
```
App will open at `http://127.0.0.1:3000`

## 📱 Usage

1. **Start playing music on Spotify** (on your phone or any device)
2. **Open the app** in your browser at `http://127.0.0.1:3000`
3. **Log in with Spotify** when prompted
4. **Watch the visualization** - it will:
   - Detect the current track from Spotify
   - Search YouTube for the song
   - Download and analyze the audio
   - Display real-time visualization synced with playback

### Visualization Controls
- **Click the mode indicator** (top-left) to cycle through visualization modes:
  - COMBINED - All features together
  - MEL - Mel spectrogram frequency bands
  - CHROMA - 12 pitch class distribution
  - PITCH - Melody pitch contour

## 🗂️ Project Structure

```
Spotify-API/
├── .env                    # Environment variables (not committed)
├── .env.example           # Template for environment variables
├── .gitignore             # Git ignore rules
├── package.json           # Frontend dependencies
├── README.md              # This file
├── public/
│   └── index.html         # HTML template
├── src/
│   ├── App.js             # Main React component
│   ├── App.css            # Main styles
│   ├── index.js           # React entry point
│   ├── spotifyService.js  # Spotify API integration
│   ├── youtubeService.js  # YouTube search & MP3 service
│   ├── audioAnalysisService.js  # Essentia.js audio analysis
│   └── components/
│       ├── AudioVisualizer.js   # Main visualizer component
│       ├── AudioVisualizer.css
│       ├── TrackInfo.js         # Track information display
│       ├── PlaybackControls.js  # Playback control buttons
│       ├── UserProfile.js       # User profile display
│       └── IdleAnimation.js     # Idle state animation
└── server/
    ├── server.js          # Express backend for MP3 extraction
    ├── package.json       # Backend dependencies
    ├── .env.example       # Backend env template
    └── mp3files/          # Downloaded MP3 storage
```

## 🔧 Technologies Used

- **Frontend**: React 18, Canvas API
- **Audio Analysis**: [Essentia.js](https://essentia.upf.edu/essentiajs/) (WASM)
- **APIs**: Spotify Web API, YouTube Data API v3
- **Backend**: Express.js, yt-dlp
- **Authentication**: Spotify OAuth 2.0 PKCE Flow

## ⚠️ Important Notes

- **This app does NOT play audio** - it only visualizes. Audio plays from your Spotify app.
- **MP3 files are cached** in `server/mp3files/` - clear periodically to save space
- **YouTube API has quotas** - 10,000 units/day free tier
- **First analysis may take time** - downloading and analyzing a 4-minute song takes ~10-30 seconds

## 🐛 Troubleshooting

### "REACT_APP_YOUTUBE_API_KEY not set"
- Make sure `.env` file exists in root directory
- Make sure the key starts with `REACT_APP_`
- Restart the React dev server after changing `.env`

### "yt-dlp: command not found"
- Install with `pip install yt-dlp`
- Make sure Python Scripts folder is in PATH
- Windows: Add `%APPDATA%\Python\Python3X\Scripts` to PATH

### "FFmpeg not found"
- Install FFmpeg and ensure it's in system PATH
- Windows: `winget install ffmpeg`
- Mac: `brew install ffmpeg`

### Visualization not syncing correctly
- The YouTube audio version may differ slightly from Spotify
- Analysis is approximate and beat detection may vary

## 📄 License

This project is for educational and research purposes only.

## 🙏 Acknowledgments

- [Essentia.js](https://essentia.upf.edu/essentiajs/) - Audio analysis library
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube downloader

## Online server
- <img width="641" height="1038" alt="image" src="https://github.com/user-attachments/assets/7d6169e7-9d8b-48a7-9817-36537c0d762a" />
- <img width="1168" height="1172" alt="image" src="https://github.com/user-attachments/assets/815966be-48af-4f94-bf45-9ad9ae885af9" />

- <img width="633" height="1036" alt="image" src="https://github.com/user-attachments/assets/70fdedcb-5881-4115-b6cf-22588dd708db" />
- <img width="2491" height="1339" alt="image" src="https://github.com/user-attachments/assets/aa150ec7-2781-4350-94fd-5e7e33426efe" />


