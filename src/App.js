import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SpotifyAuth, SpotifyAPI } from './spotifyService';
import AudioVisualizer from './components/AudioVisualizer';
import TrackInfo from './components/TrackInfo';
import IdleAnimation from './components/IdleAnimation';
import PlaybackControls from './components/PlaybackControls';
import UserProfile from './components/UserProfile';
import { analyzeAudio } from './audioAnalysisService';
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
          
          // Check if YouTube API is blocked (403 error) - don't even try
          if (YouTubeService.isApiBlocked()) {
            console.warn('🚫 YouTube API blocked, cannot analyze audio');
            console.warn('   Reason:', YouTubeService.getApiBlockReason());
            console.warn('   Reload the page to try again.');
            return;
          }
          
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
            
            // Start the YouTube → MP3 → Analysis pipeline
            setIsAnalyzing(true);
            
            try {
              // Double-check API isn't blocked
              if (YouTubeService.isApiBlocked()) {
                console.warn('🚫 YouTube API is blocked, aborting');
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }
              
              // Get MP3 from YouTube via server
              // SEQUENCE: Check server cache → YouTube API (if needed) → Download MP3
              console.log('🔍 Starting MP3 pipeline...');
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
              
              // Analyze the MP3 with Essentia.js
              console.log('🎼 Analyzing audio with Essentia.js...');
              const analysis = await analyzeAudio(mp3Result.mp3.mp3Url);
              
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
      <UserProfile user={user} onLogout={handleLogout} />
      
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
              />
            </div>
          </>
        ) : (
          <IdleAnimation />
        )}
      </div>
      
      {/* Version Footer */}
      <footer className="version-footer">
        Made by {versionInfo.AUTHOR} - v{versionInfo.VERSION}
      </footer>
    </div>
  );
}

export default App;
