import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SpotifyAuth, SpotifyAPI } from './spotifyService';
import AudioVisualizer from './components/AudioVisualizer';
import TrackInfo from './components/TrackInfo';
import PlaybackControls from './components/PlaybackControls';
import UserProfile from './components/UserProfile';
import SideMenu from './components/SideMenu';
import { analyzeAudio, getCachedAnalysis } from './audioAnalysisService';
import { YouTubeService } from './youtubeService';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [playbackState, setPlaybackState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [versionInfo, setVersionInfo] = useState({ VERSION: '', AUTHOR: '' });
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
    fetch('/version.json')
      .then(res => res.json())
      .then(data => setVersionInfo(data))
      .catch(err => console.error('Failed to load version info:', err));
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
            console.log('⏳ Already processing a track, skipping...', state.item.name);
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
          
          console.log('🎵 Track changed:', trackName, '-', artistName);
          console.log('   Previous ID:', previousTrackId, '→ New ID:', state.item.id);
          
          // Clear old audio data immediately
          setAnalysisData(null);
          
          // Cancel any previous processing
          YouTubeService.cancelCurrentProcessing();
          
          // DEBOUNCED PROCESSING: Wait for track to "settle" before starting
          // This prevents rapid API calls when user is skipping through tracks
          console.log(`⏳ Waiting ${TRACK_CHANGE_DEBOUNCE}ms for track to settle...`);
          
          trackChangeTimerRef.current = setTimeout(async () => {
            trackChangeTimerRef.current = null;
            
            // Verify this is still the current track after debounce
            if (state.item.id !== currentTrackIdRef.current) {
              console.log('🛑 Track changed during debounce, aborting');
              return;
            }
            
            // Double-check we're not already processing
            if (isProcessingRef.current) {
              console.log('⏳ Already processing, skipping debounced request');
              return;
            }
            
            // Mark as processing BEFORE any async work
            isProcessingRef.current = true;
            setIsAnalyzing(true);
            
            try {
              // STEP 1: Check if analysis data is already cached on server
              console.log('🔍 Step 1: Checking analysis cache...');
              const cachedAnalysis = await getCachedAnalysis(artistName, trackName);
              
              if (cachedAnalysis) {
                console.log('📦 Found cached analysis! Skipping MP3 pipeline.');
                setAnalysisData(cachedAnalysis);
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                console.log('✅ Loaded from cache!');
                return;
              }
              
              // STEP 2: Check if MP3 is cached on server (even if API is blocked)
              console.log('🔍 Step 2: Checking MP3 cache...');
              const mp3Cache = await YouTubeService.checkServerCache(artistName, trackName);
              
              if (mp3Cache) {
                // MP3 is cached! We can analyze it even if YouTube API is blocked
                console.log('📦 Found cached MP3! Running analysis...');
                const analysis = await analyzeAudio(mp3Cache.mp3Url, artistName, trackName);
                
                if (state.item.id === currentTrackIdRef.current) {
                  setAnalysisData(analysis);
                  setIsAnalyzing(false);
                  isProcessingRef.current = false;
                  console.log('✅ Audio analysis complete (from cached MP3)!');
                }
                return;
              }
              
              // STEP 3: No cache - need YouTube API
              // Check if API is blocked before trying
              if (YouTubeService.isApiBlocked()) {
                console.warn('🚫 YouTube API blocked and no cache available');
                console.warn('   Reason:', YouTubeService.getApiBlockReason());
                console.warn('   Cannot analyze this track until quota resets.');
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }
              
              // Get MP3 from YouTube via server
              console.log('🔍 Step 3: Fetching from YouTube...');
              const mp3Result = await YouTubeService.getMP3ForTrack(artistName, trackName);
              
              if (!mp3Result) {
                if (YouTubeService.isApiBlocked()) {
                  console.warn('🚫 YouTube API blocked during request');
                }
                console.warn('⚠️ Could not get MP3 from YouTube');
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }
              
              // Verify track hasn't changed
              if (!YouTubeService.shouldContinue(artistName, trackName)) {
                console.log('🛑 Track changed, aborting analysis');
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }
              
              // Analyze the MP3 with Essentia.js (with caching by artist/song)
              console.log('🎼 Step 4: Analyzing audio with Essentia.js...');
              const analysis = await analyzeAudio(mp3Result.mp3.mp3Url, artistName, trackName);
              
              // Final verify track hasn't changed
              if (!YouTubeService.shouldContinue(artistName, trackName)) {
                console.log('🛑 Track changed during analysis, aborting');
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }
              
              setAnalysisData(analysis);
              setIsAnalyzing(false);
              isProcessingRef.current = false;
              console.log('✅ Audio analysis complete!');
              
            } catch (err) {
              console.error('❌ Audio pipeline failed:', err);
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
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
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
        {user && (
          <button className="signout-btn" onClick={handleLogout} title="Sign Out">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        )}
        <span>Made by {versionInfo.AUTHOR} - v{versionInfo.VERSION}</span>
        <a href="/test-runner.html" className="settings-btn" title="Test Runner">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </a>
      </footer>
    </div>
  );
}

export default App;
