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
│  │  2. Check MP3 cache (skip to step 5 if cached!)                 │    │
│  │  3. Search YouTube for the song (YouTube Data API v3)           │    │
│  │  4. Download MP3 via backend server (yt-dlp)                    │    │
│  │  5. Analyze audio with Essentia.js (WASM)                       │    │
│  │  6. Sync visualization with Spotify playback position           │    │
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
- **Smart Caching System**:
  - MP3 files cached as `artist-song.mp3` on server (persists until manually cleared)
  - Analysis JSON files cached alongside MP3s for instant playback
  - YouTube URLs cached in localStorage (7-day TTL)
  - Fuzzy file matching handles special characters in song names
  - API rate limiting (2s minimum between calls)
  - Track change debouncing (800ms) to prevent rapid API calls
- **12 Waveform Visualization Styles**:
  - Layered Waves, Oscilloscope, Spectrum Bars, Flowing Ribbons
  - Mirrored Wave, Particle Dots, Pixelated, 3D Mesh
  - Gradient Bars, Sine Layers, Circular Dots, Neon Lines
  - Auto-rotate mode (changes every 30 seconds) or manual selection
  - Custom settings toggle with adjustable max height and start position
  - Hardcoded optimal defaults per waveform style
- **Particle System**:
  - Configurable particle count (0-200), size (0.5x-10x), and speed (0.5x-3x)
  - Pitch-reactive effects (spiral toward center on high notes)
  - Trail effects during high-pitch passages
- **Circular Mel Ring**:
  - Traveling wave animation for constant visual movement
  - Audio-reactive bar heights
  - Chroma-colored with beat pulse effects
- **Central Visualization**:
  - 3D pitch orb with gradient and glow effects
  - Chroma wheel showing pitch class distribution
  - Rotating petals for prominent notes
- **Beat Sync**: Visual pulses synchronized with detected beats
- **Playback Controls**: Shuffle, previous, play/pause, next, repeat buttons
- **Side Menu**: Easy access to waveform styles, particle settings, and user profile
- **Footer Info**: Now Playing badge with device info and connection status
- **Responsive Design**: Works on desktop and mobile browsers

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **FFmpeg** - Required for audio conversion
  - Windows: `winget install ffmpeg` or [Download](https://ffmpeg.org/download.html)
  - Mac: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`
- **yt-dlp** - YouTube downloader
  - All platforms: `pip install yt-dlp`
  - Or download the executable from [yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases)

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

> ⚠️ **Important**: YouTube Data API has a daily quota of 10,000 units. Each search costs 100 units, so you get ~100 searches/day. The caching system minimizes API usage.

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yerry262/Spotify-Webapp-Visualizer.git
   cd Spotify-Webapp-Visualizer
   ```

2. **Set up environment variables**
   ```bash
   # Create .env file in root directory
   # Add your API keys:
   REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id
   REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
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

5. **Place yt-dlp and FFmpeg in server folder** (Windows)
   - Download `yt-dlp.exe` and place in `server/` folder
   - Download `ffmpeg.exe` and `ffprobe.exe` and place in `server/` folder

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
   - Check if MP3 is already cached (instant if cached!)
   - Search YouTube for the song (if not cached)
   - Download and analyze the audio
   - Display real-time visualization synced with playback

## 🗂️ Project Structure

```
Spotify-Webapp-Visualizer/
├── .env                    # Environment variables (create this)
├── package.json            # Frontend dependencies
├── README.md               # This file
├── public/
│   ├── index.html          # HTML template
│   ├── test-runner.html    # Standalone audio analysis test page
│   ├── pitch-worker.js     # Web Worker for pitch extraction
│   ├── essentia.js-core.js       # Local Essentia.js core
│   ├── essentia-wasm.web.js      # Essentia WASM loader
│   └── essentia-wasm.web.wasm    # Essentia WASM binary
├── src/
│   ├── App.js              # Main React component
│   ├── App.css             # Main styles
│   ├── index.js            # React entry point
│   ├── spotifyService.js   # Spotify API integration
│   ├── youtubeService.js   # YouTube search & MP3 service (with caching)
│   ├── audioAnalysisService.js   # Essentia.js audio analysis
│   └── components/
│       ├── AudioVisualizer.js    # Main visualizer component
│       ├── TrackInfo.js          # Track information display
│       ├── PlaybackControls.js   # Playback control buttons
│       ├── UserProfile.js        # User profile display
│       ├── IdleAnimation.js      # Idle state animation
│       ├── SideMenu.js           # Side menu with settings
│       └── visualizers/          # Visualization renderers
│           ├── index.js          # Visualizer exports
│           ├── VisualizerAudio.js    # Main audio visualization (12 waveform styles)
│           ├── VisualizerIdle.js     # Idle state animation
│           └── VisualizerLoading.js  # Loading state animation
└── server/
    ├── server.js           # Express backend for MP3 extraction
    ├── package.json        # Backend dependencies
    ├── README.md           # Server documentation
    ├── yt-dlp.exe          # YouTube downloader (add this)
    ├── ffmpeg.exe          # Audio converter (add this)
    ├── mp3files/           # Downloaded MP3 storage (cached as artist-song.mp3)
    └── analysis/           # Pre-computed analysis JSON files
```

## 🔧 Technologies Used

- **Frontend**: React 18, Canvas API
- **Audio Analysis**: [Essentia.js](https://essentia.upf.edu/essentiajs/) (WASM)
- **APIs**: Spotify Web API, YouTube Data API v3
- **Backend**: Express.js, yt-dlp
- **Authentication**: Spotify OAuth 2.0 PKCE Flow

## 🎨 Waveform Styles & Defaults

Each waveform style has optimized default settings. Enable "Custom Settings" in the side menu to override with sliders.

| Style | Start Position | Max Height | Description |
|-------|---------------|------------|-------------|
| Layered Waves | 95% | 50% | Multiple overlapping sine waves |
| Oscilloscope | 60% | 30% | Classic oscilloscope lines |
| Spectrum Bars | 95% | 50% | Frequency spectrum analyzer |
| Flowing Ribbons | 50% | 15% | Smooth ribbon animations |
| Mirrored Wave | 50% | 50% | Symmetrical waveform |
| Particle Dots | 50% | 40% | Dotted wave pattern |
| Pixelated | 95% | 50% | Retro block style |
| 3D Mesh | 95% | 45% | Wireframe with depth |
| Gradient Bars | 95% | 50% | Glowing gradient bars |
| Sine Layers | 50% | 50% | Layered sine waves |
| Circular Dots | 60% | 40% | Circular dot arrangement |
| Neon Lines | 50% | 50% | Glowing neon effect |

## 📝 Caching System

The app implements a multi-layer caching system to minimize API usage:

| Cache Layer | Location | Duration | Purpose |
|-------------|----------|----------|---------|
| MP3 Files | Server (`mp3files/`) | Permanent | Skip YouTube API + download if song was played before |
| Analysis JSON | Server (`analysis/`) | Permanent | Skip audio analysis if already computed |
| YouTube URLs | localStorage | 7 days | Skip YouTube API if URL is known |
| Memory Cache | In-memory | Session | Backup for localStorage |

### Cache File Naming
MP3 files are saved as `artist_name-song_name.mp3` (sanitized lowercase with underscores). Analysis files follow the same pattern with `.json` extension. The server uses **fuzzy matching** to handle special characters (smart quotes, accented characters) in song names.

### API Rate Limiting
- **Track Change Debouncing**: 800ms delay after track changes before processing
- **YouTube API Rate Limit**: Minimum 2 seconds between API calls
- **403 Error Blocking**: If YouTube returns 403 (quota exceeded), further API calls are blocked

## ⚠️ Important Notes

- **This app does NOT play audio** - it only visualizes. Audio plays from your Spotify app.
- **MP3 files are cached** in `server/mp3files/` - clear periodically to save disk space
- **YouTube API has quotas** - 10,000 units/day free tier (~100 searches)
- **First analysis may take time** - downloading and analyzing a 4-minute song takes ~10-30 seconds
- **Subsequent plays are instant** - thanks to the caching system

## 🐛 Troubleshooting

### "REACT_APP_YOUTUBE_API_KEY not set"
- Make sure `.env` file exists in root directory
- Make sure the key starts with `REACT_APP_`
- Restart the React dev server after changing `.env`

### "yt-dlp: command not found" or "Failed to download MP3"
- Make sure `yt-dlp.exe` is in the `server/` folder
- Make sure `ffmpeg.exe` is in the `server/` folder
- Check that the YouTube URL is valid

### "YouTube API returned 403"
- Your daily quota (10,000 units) may be exhausted
- Wait until midnight Pacific Time for quota reset
- The app will block further API calls to prevent wasted requests

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

## Screenshots

<img width="641" alt="Login Screen" src="https://github.com/user-attachments/assets/7d6169e7-9d8b-48a7-9817-36537c0d762a" />
<img width="1168" alt="Visualization" src="https://github.com/user-attachments/assets/815966be-48af-4f94-bf45-9ad9ae885af9" />
<img width="633" alt="Track Info" src="https://github.com/user-attachments/assets/70fdedcb-5881-4115-b6cf-22588dd708db" />
<img width="2491" alt="Full Screen" src="https://github.com/user-attachments/assets/aa150ec7-2781-4350-94fd-5e7e33426efe" />


