# Spotify Audio Visualizer

A React-based music visualizer that displays real-time audio analysis synchronized with your Spotify playback. The app analyzes MP3 audio files using **Essentia.js** to extract mel spectrograms, HPCP chroma, pitch data, and beat information, creating stunning visualizations that react to the actual audio content.

> 📚 **Educational Research Project** - This project is for educational and research purposes related to audio analysis and music information retrieval.

## 🚀 Live Demo

https://youtu.be/AYoBXHKe2Ow

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
│                      COMPUTER (This App - React + Vite)                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  1. Get current track info from Spotify API                     │    │
│  │  2. Check MP3 cache (skip to step 5 if cached!)                 │    │
│  │  3. Search YouTube for the song (Browser-Use API - FREE!)       │    │
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
  - Track change debouncing (800ms) to prevent rapid API calls
- **32 Waveform Visualization Styles**:
  - **Classic**: Layered Waves, Oscilloscope, Spectrum Bars, Flowing Ribbons, Mirrored Wave, Particle Dots
  - **Retro/Tech**: Pixelated, 3D Mesh, Gradient Bars, Sine Layers, Circular Dots, Neon Lines
  - **Organic**: DNA Helix, Plasma Fire, Aurora Borealis, Fractal Tree, Liquid Mercury
  - **Digital**: Matrix Rain, Glitch Art, Heartbeat ECG, Lightning Storm
  - **Cosmic**: Shockwave Rings, Kaleidoscope, Cosmic Nebula, Galaxy Spiral, Particle Explosion
  - **Scenic**: Sound Tornado, Geometric Mandala, Soundwave Terrain, Neon City, Ocean Waves, Fireworks Show
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
  - Toggleable elements (Chroma Wheel, Circular Mel, Pitch Orb, Beat Flash)
- **Track Info Section**:
  - Transparent overlay with album art background blur
  - Floating particles with colors extracted from album artwork
  - Animated scan line with dominant color
  - Extends behind playback controls for immersive effect
- **Beat Sync**: Visual pulses synchronized with detected beats (toggleable)
- **Playback Controls**: Shuffle, previous, play/pause, next, repeat buttons
- **Side Menu**: Easy access to waveform styles, particle settings, center element toggles, and user profile
- **Collapsible Visualizer**: Expand visualizer to full screen with animated hide/show
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

### Spotify Developer Account
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy the **Client ID**
4. In settings, add **both** redirect URIs:
   - **Local development:** `http://127.0.0.1:3000/Spotify-Webapp-Visualizer/callback`
   - **Production (GitHub Pages):** `https://yerry262.github.io/Spotify-Webapp-Visualizer/callback`

> ⚠️ **Important:** Both redirect URIs must be registered in your Spotify app settings for the app to work in both development and production environments. Without the production URI, other users won't be able to log in.

> ✅ **No YouTube API Key Required!** This app uses the Browser-Use API for YouTube search, which is completely FREE with no quota limits.

## 📦 Installing Dependencies

You must install dependencies for both the frontend and backend before running or building the app:

1. **Frontend dependencies** (from the project root):
   ```bash
   cd "c:\Users\jerry\OneDrive\Desktop\REPOs\Spotify-Webapp-Visualizer"
   npm install
   ```
   This installs all packages for the React/Vite frontend.

2. **Backend dependencies** (from the server folder):
   ```bash
   cd server
   npm install
   ```
   This installs all packages for the backend Express server.

## 🔧 Configuration

1. **Set up environment variables**
   ```bash
   # Create .env file in root directory
   # Add your Spotify Client ID:
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   ```

2. **Place yt-dlp and FFmpeg in server folder** (Windows)
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

### Terminal 2: React Frontend (Vite)
```bash
npm run dev
```
App will open at `http://127.0.0.1:3000/Spotify-Webapp-Visualizer/`

## 🏗️ Production Build & Deployment

To build and deploy the app to GitHub Pages (production):

1. **Production Build**
   ```bash
   npm run build
   ```
   This will generate the optimized production files in the `dist/` folder using Vite.

2. **Deploy to GitHub Pages**
   ```bash
   npm run deploy
   ```
   This will publish the contents of the `dist/` folder to the `gh-pages` branch using the `gh-pages` package.

3. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "your message"
   git push
   ```
   This will commit and push your latest changes to your repository.

---

## 🖥️ Local Development (Windows Example)

You can run the app locally with the following commands (in two terminals):

**Terminal 1: Start the React Frontend**
```bash
cd "c:\Users\jerry\OneDrive\Desktop\REPOs\Spotify-Webapp-Visualizer"
npm run dev
```
This starts the Vite development server at `http://127.0.0.1:3000/Spotify-Webapp-Visualizer/`.


