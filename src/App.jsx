import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SpotifyAuth, SpotifyAPI } from './spotifyService';
import AudioVisualizer from './components/AudioVisualizer';
import TrackInfo from './components/TrackInfo';
import PlaybackControls from './components/PlaybackControls';
import SongProgress from './components/SongProgress';
import UserProfile from './components/UserProfile';
import SideMenu from './components/SideMenu';
import { analyzeAudio, getCachedAnalysis, cancelAnalysis } from './audioAnalysisService';
import { YouTubeService } from './youtubeService';
import { loadLyricsForTrack, clearLyrics } from './lyricsService';
import { 
  getWaveformStyles, 
  getWaveformStyle, 
  setWaveformStyle, 
  setWaveformAutoMode, 
  isWaveformAutoMode,
  getParticleSettings,
  setParticleSettings,
  getWaveformSettings,
  setWaveformSettings,
  getCenterElementSettings,
  setCenterElementSettings,
  getSampleRateSettings,
  setSampleRateSettings,
  setVisualizerFullScreen
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
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Waveform selection state
  const [waveformStyle, setWaveformStyleState] = useState(getWaveformStyle());
  const [isWaveformAuto, setIsWaveformAuto] = useState(isWaveformAutoMode());
  const waveformStyles = getWaveformStyles();
  
  // Waveform settings state
  const [waveformSettingsState, setWaveformSettingsState] = useState(getWaveformSettings());
  
  // Particle settings state
  const [particleSettingsState, setParticleSettingsState] = useState(getParticleSettings());
  
  // Center element visibility settings state
  const [centerElementSettingsState, setCenterElementSettingsState] = useState(getCenterElementSettings());
  
  // Sample rate settings state
  const [sampleRateSettingsState, setSampleRateSettingsState] = useState(getSampleRateSettings());
  
  // Visualizer expanded/collapsed state
  const [isVisualizerExpanded, setIsVisualizerExpanded] = useState(false);
  
  // Use ref to track current track ID without causing re-renders
  const currentTrackIdRef = useRef(null);
  // Ref mirror of analysisData so the polling callback (deps: [isLoggedIn]
  // only) reads the CURRENT value instead of a stale closure — the stale
  // closure kept the 50% prefetch check seeing null and never triggering
  const analysisDataRef = useRef(null);
  // Track if we're currently processing to prevent duplicate calls
  const isProcessingRef = useRef(false);
  // Debounce timer for track changes
  const trackChangeTimerRef = useRef(null);
  // Track change debounce delay (ms) - wait for track to "settle"
  const TRACK_CHANGE_DEBOUNCE = 100;
  
  // Prefetch next track refs
  const prefetchedTrackIdRef = useRef(null); // Track ID we've prefetched
  const isPrefetchingRef = useRef(false); // Currently prefetching
  const prefetchTriggeredForTrackRef = useRef(null); // Current track that triggered prefetch
  const prefetchNextTrackRef = useRef(null); // Ref to the prefetch function (to break circular deps)

  // Keep the analysisData ref mirror in sync for the polling callback
  useEffect(() => {
    analysisDataRef.current = analysisData;
  }, [analysisData]);

  // Load version info
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    fetch(`${import.meta.env.BASE_URL}version.json`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId);
        setVersionInfo(data);
      })
      .catch(err => {
        clearTimeout(timeoutId);
        if (err.name !== 'AbortError') {
          console.error('Failed to load version info:', err);
        }
        // Continue with default empty values on timeout/error
      });

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  // Handle OAuth callback and restore session
  useEffect(() => {
    const initAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        // New login - exchange code for token
        await SpotifyAuth.getToken(code);
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsLoggedIn(true);
      } else if (SpotifyAuth.isLoggedIn()) {
        // Existing session - validate/refresh token
        try {
          const validToken = await SpotifyAuth.getValidToken();
          if (validToken) {
            setIsLoggedIn(true);
          } else {
            // Token refresh failed, need to re-login
            console.log('Token refresh failed, clearing session');
            SpotifyAuth.logout();
            setIsLoggedIn(false);
          }
        } catch (err) {
          console.error('Auth validation error:', err);
          SpotifyAuth.logout();
          setIsLoggedIn(false);
        }
      }
      setIsLoading(false);
    };
    
    initAuth();
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
          // Cancel any pending debounced track change
          if (trackChangeTimerRef.current) {
            clearTimeout(trackChangeTimerRef.current);
            trackChangeTimerRef.current = null;
          }
          
          // If currently processing, CANCEL it and start the new track
          if (isProcessingRef.current) {
            console.log(ts(), '⚡ Cancelling current processing for new track:', state.item.name);
            YouTubeService.cancelCurrentProcessing();
            cancelAnalysis();
            isProcessingRef.current = false;
            setIsAnalyzing(false);
          }
          
          // Cancel any ongoing prefetch and reset prefetch state for new track
          if (isPrefetchingRef.current) {
            console.log(ts(), '⚡ Cancelling prefetch for track change');
            cancelAnalysis();
            isPrefetchingRef.current = false;
          }
          prefetchTriggeredForTrackRef.current = null;
          
          // Immediately update ref to prevent duplicate triggers
          const previousTrackId = currentTrackIdRef.current;
          currentTrackIdRef.current = state.item.id;
          
          const trackName = state.item.name;
          const artistName = state.item.artists[0]?.name;
          
          console.log(ts(), '🎵 Track changed:', trackName, '-', artistName);
          console.log(ts(), '   Previous ID:', previousTrackId, '→ New ID:', state.item.id);
          
          // Clear old audio data immediately
          setAnalysisData(null);

          // Fetch synced lyrics for the Lyric Flow visualizer (fire-and-forget)
          clearLyrics();
          loadLyricsForTrack(artistName, trackName, state.item.duration_ms / 1000);
          
          // DEBOUNCED PROCESSING: Wait for track to "settle" before starting
          // This prevents rapid API calls when user is skipping through tracks
          // console.log(ts(), `⏳ Waiting ${TRACK_CHANGE_DEBOUNCE}ms for track to settle...`);
          
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
              
              // STEP 2: Fetch MP3 (Check cache first, then YouTube)
              // NOTE: getMP3ForTrack handles unified status check + server cache + locking
              console.log(ts(), '🔍 Step 2: Fetching MP3 (Unified status check + Cache + YouTube)...');
              const mp3Result = await YouTubeService.getMP3ForTrack(
                artistName, 
                trackName,
                () => setIsSearching(true),  // onSearchStart
                () => { setIsSearching(false); setIsDownloading(true); }  // onDownloadStart
              );

              if (!mp3Result) {
                console.warn(ts(), '⚠️ Could not get MP3 from YouTube');
                setIsSearching(false);
                setIsDownloading(false);
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }

              // Clear search/download states - now we have the MP3
              setIsSearching(false);
              setIsDownloading(false);

              // STEP 2b: Handle pre-cached analysis from another device
              if (mp3Result.analysisUrl) {
                console.log(ts(), '📦 Analysis ready from another device, fetching...');
                try {
                  const response = await fetch(mp3Result.analysisUrl);
                  if (response.ok) {
                    const cachedAnalysis = await response.json();
                    setAnalysisData(cachedAnalysis);
                    setIsAnalyzing(false);
                    isProcessingRef.current = false;
                    console.log(ts(), '✅ Loaded analysis from server cache (another device)!');
                    return;
                  }
                } catch (fetchErr) {
                  console.warn(ts(), '⚠️ Failed to fetch cached analysis, will re-analyze:', fetchErr.message);
                }
              }

              // Verify track hasn't changed
              if (!YouTubeService.shouldContinue(artistName, trackName)) {
                console.log(ts(), '🛑 Track changed, aborting analysis');
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }

              // STEP 3: Notify server we're analyzing (so other devices wait)
              console.log(ts(), '🔒 Notifying server: starting analysis...');
              const lockResult = await YouTubeService.notifyAnalyzing(artistName, trackName);

              // Check if another device is already analyzing
              if (!lockResult.acquired) {
                console.log(ts(), '⏳ Another device is analyzing, waiting...');
                try {
                  const status = await YouTubeService.waitForReady(artistName, trackName);
                  if (status.status === 'analysis_ready') {
                    console.log(ts(), '✅ Other device finished analysis');
                    // Small debounce to ensure file is fully written
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Retry fetching the analysis file (up to 3 times with 1s delay)
                    // The other device may still be flushing the file to disk.
                    let analysisData = null;
                    let fetchSuccess = false;
                    const maxRetries = 3;
                    
                    for (let attempt = 1; attempt <= maxRetries; attempt++) {
                      try {
                        console.log(ts(), `📥 Fetching analysis from server (attempt ${attempt}/${maxRetries})...`);
                        const response = await fetch(status.analysisUrl);
                        
                        if (!response.ok) {
                          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        analysisData = await response.json();
                        fetchSuccess = true;
                        console.log(ts(), `✅ Successfully fetched analysis on attempt ${attempt}`);
                        break;
                      } catch (fetchError) {
                        console.warn(ts(), `⚠️ Attempt ${attempt}/${maxRetries} failed:`, fetchError.message);
                        if (attempt < maxRetries) {
                          console.log(ts(), `⏳ Retrying in 1 second...`);
                          await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                      }
                    }
                    
                    if (fetchSuccess && analysisData) {
                      setAnalysisData(analysisData);
                      setIsAnalyzing(false);
                      isProcessingRef.current = false;
                      return;
                    } else {
                      console.warn(ts(), '⚠️ Failed to fetch analysis after all retries, will analyze ourselves');
                      // Fall through to analyze ourselves
                    }
                  }
                  // If we get here, analysis failed or timed out - fall through to do it ourselves
                  console.log(ts(), '⚠️ Other device analysis failed/timeout, will analyze ourselves');
                } catch (waitError) {
                  console.log(ts(), '🛑 Aborted while waiting for analysis:', waitError.message);
                  setIsAnalyzing(false);
                  isProcessingRef.current = false;
                  return;
                }
              }

              // STEP 4: Analyze the MP3 with Essentia.js (with caching by artist/song)
              console.log(ts(), '🎼 Step 3: Analyzing audio with Essentia.js...');
              const mp3Url = mp3Result.mp3?.mp3Url;
              if (!mp3Url) {
                console.error(ts(), '❌ No MP3 URL available for analysis');
                await YouTubeService.releaseAnalysisLock(artistName, trackName, false);
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }
              
              let analysis;
              try {
                analysis = await analyzeAudio(mp3Url, artistName, trackName, state.item.duration_ms);
              } catch (analysisError) {
                console.error(ts(), '❌ Analysis failed:', analysisError);
                await YouTubeService.releaseAnalysisLock(artistName, trackName, false);
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }
              
              // Final verify track hasn't changed
              if (!YouTubeService.shouldContinue(artistName, trackName)) {
                console.log(ts(), '🛑 Track changed during analysis, aborting');
                await YouTubeService.releaseAnalysisLock(artistName, trackName, false);
                setIsAnalyzing(false);
                isProcessingRef.current = false;
                return;
              }
              
              // Release the analysis lock
              await YouTubeService.releaseAnalysisLock(artistName, trackName, true);
              
              setAnalysisData(analysis);
              setIsAnalyzing(false);
              isProcessingRef.current = false;
              console.log(ts(), '✅ Audio analysis complete!');
              console.log(ts(), '🔓 Analysis lock released');
              
            } catch (err) {
              console.error(ts(), '❌ Audio pipeline failed:', err);
              setIsAnalyzing(false);
              isProcessingRef.current = false;
            }
          }, TRACK_CHANGE_DEBOUNCE);
        }
        
        // Check if we should prefetch the next track (at 50% progress)
        // Only prefetch if we have analysis data (current track is ready)
        // and we're not already processing or prefetching
        if (state.progress_ms && state.item.duration_ms) {
          const progress = state.progress_ms / state.item.duration_ms;
          if (progress >= 0.5 && !isPrefetchingRef.current && !isProcessingRef.current) {
            // Check if we haven't already triggered prefetch for this track AND analysis is ready
            if (prefetchTriggeredForTrackRef.current !== currentTrackIdRef.current && analysisDataRef.current) {
              // Call prefetch directly instead of via setTimeout to avoid callback accumulation
              if (prefetchNextTrackRef.current) {
                prefetchNextTrackRef.current();
              }
            }
          }
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

  // Prefetch next track when current song is 50% complete
  const prefetchNextTrack = useCallback(async () => {
    // Don't prefetch if already prefetching or processing
    if (isPrefetchingRef.current || isProcessingRef.current) return;
    
    // Don't re-prefetch if we already prefetched for this track
    if (prefetchTriggeredForTrackRef.current === currentTrackIdRef.current) return;
    
    try {
      // Get the queue from Spotify
      const queue = await SpotifyAPI.getQueue();
      if (!queue?.queue || queue.queue.length === 0) {
        console.log(ts(), '📭 No tracks in queue to prefetch');
        return;
      }
      
      const nextTrack = queue.queue[0];
      const nextTrackId = nextTrack.id;
      const nextArtist = nextTrack.artists[0]?.name;
      const nextSong = nextTrack.name;
      
      // Don't prefetch if we already have this track prefetched
      if (prefetchedTrackIdRef.current === nextTrackId) {
        return;
      }
      
      // Mark that we've triggered prefetch for current track
      prefetchTriggeredForTrackRef.current = currentTrackIdRef.current;
      isPrefetchingRef.current = true;
      
      console.log(ts(), `🔮 Prefetching next track: ${nextSong} - ${nextArtist}`);
      
      // Check if analysis is already cached
      const cachedAnalysis = await getCachedAnalysis(nextArtist, nextSong);
      if (cachedAnalysis) {
        console.log(ts(), '📦 Next track already cached!');
        prefetchedTrackIdRef.current = nextTrackId;
        isPrefetchingRef.current = false;
        return;
      }
      
      // Check if MP3 is cached
      const mp3Cache = await YouTubeService.checkServerCache(nextArtist, nextSong);
      if (mp3Cache) {
        console.log(ts(), '📦 Next track MP3 cached, pre-analyzing...');
        
        // Verify we should still continue (user hasn't changed track)
        if (currentTrackIdRef.current !== prefetchTriggeredForTrackRef.current) {
          console.log(ts(), '🛑 User changed track, cancelling prefetch');
          isPrefetchingRef.current = false;
          return;
        }
        
        // Try to acquire analysis lock for prefetch
        const lockResult = await YouTubeService.notifyAnalyzing(nextArtist, nextSong);
        if (!lockResult.acquired) {
          // Another device is already analyzing - that's fine for prefetch, just skip
          console.log(ts(), '⏳ Another device analyzing next track, skipping prefetch');
          isPrefetchingRef.current = false;
          return;
        }
        
        try {
          await analyzeAudio(mp3Cache.mp3Url, nextArtist, nextSong, nextTrack.duration_ms);
          await YouTubeService.releaseAnalysisLock(nextArtist, nextSong, true);
          prefetchedTrackIdRef.current = nextTrackId;
          console.log(ts(), '✅ Prefetch analysis complete!');
        } catch (error) {
          console.warn(ts(), '⚠️ Prefetch analysis failed:', error);
          await YouTubeService.releaseAnalysisLock(nextArtist, nextSong, false);
        }
        isPrefetchingRef.current = false;
        return;
      }
      
      // Fetch from YouTube (using prefetch method that skips if another device is working)
      console.log(ts(), '🔮 Prefetching MP3 from YouTube...');
      const mp3Result = await YouTubeService.getMP3ForTrackPrefetch(nextArtist, nextSong);
      
      if (!mp3Result) {
        console.log(ts(), '⏩ Prefetch skipped (another device working or failed)');
        isPrefetchingRef.current = false;
        return;
      }
      
      // If we got analysis from cache, we're done
      if (mp3Result.analysisUrl) {
        console.log(ts(), '✅ Prefetch complete (analysis was cached)!');
        prefetchedTrackIdRef.current = nextTrackId;
        isPrefetchingRef.current = false;
        return;
      }
      
      // Verify we should still continue
      if (currentTrackIdRef.current !== prefetchTriggeredForTrackRef.current) {
        console.log(ts(), '🛑 User changed track, cancelling prefetch analysis');
        isPrefetchingRef.current = false;
        return;
      }
      
      // Try to acquire analysis lock for prefetch
      const lockResult = await YouTubeService.notifyAnalyzing(nextArtist, nextSong);
      if (!lockResult.acquired) {
        // Another device is already analyzing - that's fine for prefetch, just skip
        console.log(ts(), '⏳ Another device analyzing, skipping prefetch');
        isPrefetchingRef.current = false;
        return;
      }
      
      // Analyze the prefetched MP3
      console.log(ts(), '🔮 Pre-analyzing next track...');
      try {
        await analyzeAudio(mp3Result.mp3.mp3Url, nextArtist, nextSong, nextTrack.duration_ms);
        await YouTubeService.releaseAnalysisLock(nextArtist, nextSong, true);
        prefetchedTrackIdRef.current = nextTrackId;
        console.log(ts(), '✅ Prefetch complete!');
      } catch (error) {
        console.warn(ts(), '⚠️ Prefetch analysis failed:', error);
        await YouTubeService.releaseAnalysisLock(nextArtist, nextSong, false);
      }
      
    } catch (err) {
      console.warn(ts(), '⚠️ Prefetch failed:', err.message);
    } finally {
      isPrefetchingRef.current = false;
    }
  }, []);

  // Set the ref so fetchPlaybackState can call it
  prefetchNextTrackRef.current = prefetchNextTrack;

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

  // Switch account - fully logs out of Spotify and allows a different user to login
  const handleSwitchAccount = () => {
    SpotifyAuth.logout(true); // true = full logout, redirects to Spotify logout
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

  // Center element visibility settings handler
  const handleCenterElementSettingsChange = (newSettings) => {
    const updated = { ...centerElementSettingsState, ...newSettings };
    setCenterElementSettings(updated);
    setCenterElementSettingsState(updated);
  };

  // Sample rate settings handler
  const handleSampleRateSettingsChange = (newSettings) => {
    const updated = { ...sampleRateSettingsState, ...newSettings };
    setSampleRateSettings(updated);
    setSampleRateSettingsState(updated);
  };

  // Sync waveform state when it changes externally (auto mode)
  useEffect(() => {
    if (isWaveformAuto) {
      const interval = setInterval(() => {
        setWaveformStyleState(getWaveformStyle());
      }, 30000); // Changed from 1000ms to 30000ms - matches the auto-rotate feature (30s per style)
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
      <UserProfile user={user} onMenuClick={() => setIsMenuOpen(true)} onLogout={handleLogout} />
      
      {/* Side Menu */}
      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
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
        centerElementSettings={centerElementSettingsState}
        onCenterElementSettingsChange={handleCenterElementSettingsChange}
        sampleRateSettings={sampleRateSettingsState}
        onSampleRateSettingsChange={handleSampleRateSettingsChange}
      />
      
      {/* Main Content */}
      <div className="main-content">
        {isPlaying ? (
          <>
            {/* Top Half - Audio Visualizer */}
            <div className={`visualizer-section ${isVisualizerExpanded ? 'expanded' : ''}`}>
              <AudioVisualizer 
                analysisData={analysisData}
                isPlaying={playbackState?.is_playing}
                progress={playbackState?.progress_ms}
                isAnalyzing={isAnalyzing}
                isSearching={isSearching}
                isDownloading={isDownloading}
                trackId={playbackState?.item?.id}
              />
            </div>
            
            {/* Collapsible Divider */}
            <div 
              className={`section-divider ${isVisualizerExpanded ? 'expanded' : ''}`}
              onClick={() => {
                const newState = !isVisualizerExpanded;
                setIsVisualizerExpanded(newState);
                setVisualizerFullScreen(newState);
              }}
            >
              <div className="divider-line"></div>
              <div className="divider-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <div className="divider-line"></div>
            </div>
            
            {/* Bottom Half - Track Info */}
            
            <TrackInfo 
              track={playbackState?.item}
              progress={playbackState?.progress_ms}
              duration={playbackState?.item?.duration_ms}
              isExpanded={isVisualizerExpanded}
            />
            
            <PlaybackControls 
              isPlaying={playbackState?.is_playing}
              onRefresh={fetchPlaybackState}
              device={playbackState?.device}
              shuffleState={playbackState?.shuffle_state}
              repeatState={playbackState?.repeat_state || 'off'}
              smartShuffle={playbackState?.smart_shuffle}
              isExpanded={isVisualizerExpanded}
            />

            <SongProgress 
              progress={playbackState?.progress_ms}
              duration={playbackState?.item?.duration_ms}
              isExpanded={isVisualizerExpanded}
            />
          </>
        ) : (
          <>
            {/* Idle State - Show Visualizer and Controls */}
            <div className="visualizer-section idle-visualizer">
              <AudioVisualizer 
                analysisData={null}
                isPlaying={false}
                progress={0}
                isAnalyzing={false}
                trackId={null}
              />
            </div>
            
            {/* Idle Controls */}
            <div className="track-section idle-controls">
            </div>
            
            <PlaybackControls 
              isPlaying={false}
              onRefresh={fetchPlaybackState}
              device={playbackState?.device}
              shuffleState={playbackState?.shuffle_state}
              repeatState={playbackState?.repeat_state || 'off'}
              smartShuffle={playbackState?.smart_shuffle}
              isExpanded={isVisualizerExpanded}
            />

            <SongProgress 
              progress={playbackState?.progress_ms}
              duration={playbackState?.item?.duration_ms}
              isExpanded={isVisualizerExpanded}
            />
          </>
        )}
      </div>
      
      {/* Version Footer */}
      <footer className={`version-footer ${isVisualizerExpanded ? 'hidden' : ''}`}>
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
