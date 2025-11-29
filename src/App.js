import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SpotifyAuth, SpotifyAPI } from './spotifyService';
import AudioVisualizer from './components/AudioVisualizer';
import TrackInfo from './components/TrackInfo';
import PlaybackControls from './components/PlaybackControls';
import UserProfile from './components/UserProfile';
import SideMenu from './components/SideMenu';
import { analyzeAudio, getCachedAnalysis, loadEssentia } from './audioAnalysisService';
import { YouTubeService } from './youtubeService';
import { 
  getWaveformStyles, 
  getWaveformStyle, 
  setWaveformStyle, 
  setWaveformAutoMode, 
  isWaveformAutoMode,
  getParticleSettings,
  setParticleSettings,
  getWaveformSettings,
  setWaveformSettings
} from './components/visualizers/VisualizerAudio';
import './App.css';

// Timestamp helper for console logs
const ts = () => {
  const now = new Date();
  return `[${now.toLocaleTimeString('en-US', { hour12: false })}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [playbackState, setPlaybackState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [versionInfo, setVersionInfo] = useState({ VERSION: '', AUTHOR: '' });
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Waveform selection state
  const [waveformStyle, setWaveformStyleState] = useState(getWaveformStyle());
  const [isWaveformAuto, setIsWaveformAuto] = useState(isWaveformAutoMode());
  const waveformStyles = getWaveformStyles();
  
  // Waveform settings state
  const [waveformSettingsState, setWaveformSettingsState] = useState(getWaveformSettings());
  
  // Particle settings state
  const [particleSettingsState, setParticleSettingsState] = useState(getParticleSettings());
  
  // Use ref to track current track ID without causing re-renders
  const currentTrackIdRef = useRef(null);
  // Track if we're currently processing to prevent duplicate calls
  const isProcessingRef = useRef(false);
  // Debounce timer for track changes
  const trackChangeTimerRef = useRef(null);
  // Track change debounce delay (ms) - wait for track to "settle"
  const TRACK_CHANGE_DEBOUNCE = 800;

  // Load version info
  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/version.json`)
      .then(res => res.json())
      .then(data => setVersionInfo(data))
      .catch(err => console.error('Failed to load version info:', err));
  }, []);

  // Preload Essentia.js WASM module when browser is idle (non-blocking)
  useEffect(() => {
    const startPreload = () => {
      loadEssentia().catch(err => 
        console.warn('Essentia.js preload failed (will retry when needed):', err)
      );
    };
    
    // Use requestIdleCallback if available, otherwise use setTimeout
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(startPreload, { timeout: 2000 });
    } else {
      // Fallback: start after a short delay to let initial render complete
      setTimeout(startPreload, 100);
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      SpotifyAuth.getToken(code).then(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsLoggedIn(true);
      });
    } else {
      setIsLoggedIn(SpotifyAuth.isLoggedIn());
    }
    setIsLoading(false);
  }, []);

  // Fetch user profile
  useEffect(() => {
    if (isLoggedIn) {
      SpotifyAPI.getMe().then(setUser).catch(console.error);
    }
  }, [isLoggedIn]);

  // Poll for playback state
  const fetchPlaybackState = useCallback(async () => {
    if (!isLoggedIn) return;
    
    try {
      const state = await SpotifyAPI.getPlaybackState();
      setPlaybackState(state);
      
      if (state?.item) {
        // Only update when track changes - use ref to avoid dependency issues
        if (state.item.id !== currentTrackIdRef.current) {
          // Prevent duplicate processing - strict lock check
          if (isProcessingRef.current) {
            console.log(ts(), '⏳ Already processing a track, skipping...', state.item.name);
            return;
          }
          
          // Cancel any pending debounced track change
          if (trackChangeTimerRef.current) {
            clearTimeout(trackChangeTimerRef.current);
            trackChangeTimerRef.current = null;
          }
          
          // Immediately update ref to prevent duplicate triggers
          const previousTrackId = currentTrackIdRef.current;
          currentTrackIdRef.current = state.item.id;
          
          const trackName = state.item.name;
          const artistName = state.item.artists[0]?.name;
          
          console.log(ts(), '🎵 Track changed:', trackName, '-', artistName);
          console.log(ts(), '   Previous ID:', previousTrackId, '→ New ID:', state.item.id);
          
          // Clear old audio data immediately
          setAnalysisData(null);
          
          // Cancel any previous processing
          YouTubeService.cancelCurrentProcessing();
          
          // DEBOUNCED PROCESSING: Wait for track to "settle" before starting
          // This prevents rapid API calls when user is skipping through tracks
          console.log(ts(), `⏳ Waiting ${TRACK_CHANGE_DEBOUNCE}ms for track to settle...`);
          
          trackChangeTimerRef.current = setTimeout(async () => {
            trackChangeTimerRef.current = null;
            
            // Verify this is still the current track after debounce
            if (state.item.id !== currentTrackIdRef.current) {
              console.log(ts(), '🛑 Track changed during debounce, aborting');
              return;
            }
            
            // Double-check we're not already processing
            if (isProcessingRef.current) {
              console.log(ts(), '⏳ Already processing, skipping debounced request');
              return;
            }
            
            // Mark as processing BEFORE any async work
            isProcessingRef.current = true;
            setIsAnalyzing(true);
            
            try {
              // STEP 1: Check if analysis data is already cached on server
              console.log(ts(), '🔍 Step 1: Checking analysis cache...');
              const cachedAnalysis = await getCachedAnalysis(artistName, trackName);
              
              if (cachedAnalysis) {
                console.log(ts(), '📦 Found cached analysis! Skipping MP3 pipeline.');
                setAnalysisData(cachedAnalysis);
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                console.log(ts(), '✅ Loaded from cache!');
                return;
              }
              
              // STEP 2: Check if MP3 is cached on server (even if API is blocked)
              console.log(ts(), '🔍 Step 2: Checking MP3 cache...');
              const mp3Cache = await YouTubeService.checkServerCache(artistName, trackName);
              
              if (mp3Cache) {
                // MP3 is cached! We can analyze it even if YouTube API is blocked
                console.log(ts(), '📦 Found cached MP3! Running analysis...');
                const analysis = await analyzeAudio(mp3Cache.mp3Url, artistName, trackName);
                
                if (state.item.id === currentTrackIdRef.current) {
                  setAnalysisData(analysis);
                  setIsAnalyzing(false);
                  isProcessingRef.current = false;
                  console.log(ts(), '✅ Audio analysis complete (from cached MP3)!');
                }
                return;
              }
              
              // STEP 3: No cache - need YouTube API
              // Check if API is blocked before trying
              if (YouTubeService.isApiBlocked()) {
                console.warn(ts(), '🚫 YouTube API blocked and no cache available');
                console.warn(ts(), '   Reason:', YouTubeService.getApiBlockReason());
                console.warn(ts(), '   Cannot analyze this track until quota resets.');
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }
              
              // Get MP3 from YouTube via server
              console.log(ts(), '🔍 Step 3: Fetching from YouTube...');
              const mp3Result = await YouTubeService.getMP3ForTrack(artistName, trackName);
              
              if (!mp3Result) {
                if (YouTubeService.isApiBlocked()) {
                  console.warn(ts(), '🚫 YouTube API blocked during request');
                }
                console.warn(ts(), '⚠️ Could not get MP3 from YouTube');
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }
              
              // Verify track hasn't changed
              if (!YouTubeService.shouldContinue(artistName, trackName)) {
                console.log(ts(), '🛑 Track changed, aborting analysis');
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }
              
              // Analyze the MP3 with Essentia.js (with caching by artist/song)
              console.log(ts(), '🎼 Step 4: Analyzing audio with Essentia.js...');
              const analysis = await analyzeAudio(mp3Result.mp3.mp3Url, artistName, trackName);
              
              // Final verify track hasn't changed
              if (!YouTubeService.shouldContinue(artistName, trackName)) {
                console.log(ts(), '🛑 Track changed during analysis, aborting');
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }
              
              setAnalysisData(analysis);
              setIsAnalyzing(false);
              isProcessingRef.current = false;
              console.log(ts(), '✅ Audio analysis complete!');
              
            } catch (err) {
              console.error(ts(), '❌ Audio pipeline failed:', err);
              setIsAnalyzing(false);
              isProcessingRef.current = false;
            }
          }, TRACK_CHANGE_DEBOUNCE);
        }
      } else {
        // No track playing - clean up state
        setAnalysisData(null);
        currentTrackIdRef.current = null;
        
        // Cancel any pending processing
        if (trackChangeTimerRef.current) {
          clearTimeout(trackChangeTimerRef.current);
          trackChangeTimerRef.current = null;
        }
        YouTubeService.cancelCurrentProcessing();
        isProcessingRef.current = false;
      }
    } catch (error) {
      console.error('Error fetching playback state:', error);
    }
  }, [isLoggedIn]); // Only depend on isLoggedIn, not currentTrackId

  useEffect(() => {
    fetchPlaybackState();
    const interval = setInterval(fetchPlaybackState, 1000);
    return () => {
      clearInterval(interval);
      // Clean up debounce timer on unmount
      if (trackChangeTimerRef.current) {
        clearTimeout(trackChangeTimerRef.current);
      }
      YouTubeService.cancelCurrentProcessing();
    };
  }, [fetchPlaybackState]);

  const handleLogin = () => {
    SpotifyAuth.login();
  };

  const handleLogout = () => {
    SpotifyAuth.logout();
    setIsLoggedIn(false);
    setUser(null);
    setPlaybackState(null);
  };

  // Waveform selection handlers
  const handleWaveformChange = (styleId) => {
    if (styleId === 'auto') {
      // Enable auto mode
      setWaveformAutoMode(true);
      setIsWaveformAuto(true);
    } else {
      // Disable auto mode and set specific style
      setWaveformStyle(styleId);
      setWaveformStyleState(styleId);
      setWaveformAutoMode(false);
      setIsWaveformAuto(false);
    }
  };

  const handleWaveformAutoToggle = (enabled) => {
    setWaveformAutoMode(enabled);
    setIsWaveformAuto(enabled);
  };

  // Particle settings handler
  const handleParticleSettingsChange = (newSettings) => {
    const updated = { ...particleSettingsState, ...newSettings };
    setParticleSettings(updated);
    setParticleSettingsState(updated);
  };

  // Waveform settings handler
  const handleWaveformSettingsChange = (newSettings) => {
    const updated = { ...waveformSettingsState, ...newSettings };
    setWaveformSettings(updated);
    setWaveformSettingsState(updated);
  };

  // Sync waveform state when it changes externally (auto mode)
  useEffect(() => {
    if (isWaveformAuto) {
      const interval = setInterval(() => {
        setWaveformStyleState(getWaveformStyle());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isWaveformAuto]);

  if (isLoading) {
    return (
      <div className="app loading-screen">
        <div className="loader">
          <div className="pulse-ring"></div>
          <span className="loader-text">INITIALIZING</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="app login-screen">
        <div className="login-container">
          <div className="logo-container">
            <div className="logo-glow"></div>
            <h1 className="app-title">SPOTIFY</h1>
            <h2 className="app-subtitle">MINI CONTROLLER</h2>
          </div>
          <p className="login-tagline">Experience your music in a new dimension</p>
          <button className="login-button" onClick={handleLogin}>
            <span className="button-text">CONNECT TO SPOTIFY</span>
            <span className="button-glow"></span>
          </button>
          <div className="login-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{
                '--delay': `${Math.random() * 5}s`,
                '--x': `${Math.random() * 100}%`,
                '--duration': `${3 + Math.random() * 4}s`
              }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isPlaying = playbackState?.is_playing && playbackState?.item;

  return (
    <div className="app main-screen">
      {/* User Profile Header */}
      <UserProfile user={user} onMenuClick={() => setIsMenuOpen(true)} />
      
      {/* Side Menu */}
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onLogout={handleLogout} 
        user={user}
        waveformStyle={waveformStyle}
        waveformStyles={waveformStyles}
        isWaveformAuto={isWaveformAuto}
        onWaveformChange={handleWaveformChange}
        onWaveformAutoToggle={handleWaveformAutoToggle}
        waveformSettings={waveformSettingsState}
        onWaveformSettingsChange={handleWaveformSettingsChange}
        particleSettings={particleSettingsState}
        onParticleSettingsChange={handleParticleSettingsChange}
      />
      
      {/* Main Content */}
      <div className="main-content">
        {isPlaying ? (
          <>
            {/* Top Half - Audio Visualizer */}
            <div className="visualizer-section">
              <AudioVisualizer 
                analysisData={analysisData}
                isPlaying={playbackState?.is_playing}
                progress={playbackState?.progress_ms}
                isAnalyzing={isAnalyzing}
                trackId={playbackState?.item?.id}
              />
            </div>
            
            {/* Bottom Half - Track Info */}
            <div className="track-section">
              <TrackInfo 
                track={playbackState?.item}
                progress={playbackState?.progress_ms}
                duration={playbackState?.item?.duration_ms}
              />
              <PlaybackControls 
                isPlaying={playbackState?.is_playing}
                onRefresh={fetchPlaybackState}
                device={playbackState?.device}
                shuffleState={playbackState?.shuffle_state}
                repeatState={playbackState?.repeat_state || 'off'}
                smartShuffle={playbackState?.smart_shuffle}
              />
            </div>
          </>
        ) : (
          <AudioVisualizer 
            analysisData={null}
            isPlaying={false}
            progress={0}
            isAnalyzing={false}
            trackId={null}
          />
        )}
      </div>
      
      {/* Version Footer */}
      <footer className="version-footer">
        {/* Now Playing badge on left */}
        {isPlaying && (
          <div className="footer-now-playing">
            <span className="footer-pulse-dot"></span>
            <span>NOW PLAYING</span>
          </div>
        )}
        
        <span>Made by {versionInfo.AUTHOR} - v{versionInfo.VERSION}</span>
        {/* Device info shown here on small screens */}
        {playbackState?.device && (
          <div className="footer-device-info" title={`Playing on: ${playbackState.device.name}`}>
            <span className="footer-device-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                {playbackState.device.type?.toLowerCase() === 'computer' ? (
                  <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
                ) : playbackState.device.type?.toLowerCase() === 'smartphone' ? (
                  <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z"/>
                ) : (
                  <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
                )}
              </svg>
            </span>
            <span className="footer-device-name">{playbackState.device.name}</span>
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
