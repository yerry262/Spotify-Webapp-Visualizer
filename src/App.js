import React, { useState, useEffect, useCallback } from 'react';
import { SpotifyAuth, SpotifyAPI } from './spotifyService';
import AudioVisualizer from './components/AudioVisualizer';
import TrackInfo from './components/TrackInfo';
import IdleAnimation from './components/IdleAnimation';
import PlaybackControls from './components/PlaybackControls';
import UserProfile from './components/UserProfile';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [playbackState, setPlaybackState] = useState(null);
  const [audioFeatures, setAudioFeatures] = useState(null);
  const [audioAnalysis, setAudioAnalysis] = useState(null);
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [trackData, setTrackData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
        // Store all track data (simulating pandas dataframe concept)
        const trackInfo = {
          id: state.item.id,
          name: state.item.name,
          artists: state.item.artists.map(a => a.name),
          album: state.item.album.name,
          albumArt: state.item.album.images[0]?.url,
          duration_ms: state.item.duration_ms,
          progress_ms: state.progress_ms,
          is_playing: state.is_playing,
          popularity: state.item.popularity,
          explicit: state.item.explicit,
          preview_url: state.item.preview_url,
          external_url: state.item.external_urls?.spotify,
          uri: state.item.uri,
          timestamp: new Date().toISOString()
        };
        setTrackData(trackInfo);
        
        // Only update when track changes
        if (state.item.id !== currentTrackId) {
          setCurrentTrackId(state.item.id);
          
          // Note: Audio Features and Audio Analysis APIs are now restricted (403)
          console.log('Track changed:', state.item.name);
          console.log('Preview URL:', state.item.preview_url || 'Not available');
          
          // Clear old audio data
          setAudioFeatures(null);
          setAudioAnalysis(null);
          
          
        }
      } else {
        setTrackData(null);
        setAudioFeatures(null);
        setAudioAnalysis(null);
        setYoutubeMP3Data(null);
        setCurrentTrackId(null);
      }
    } catch (error) {
      console.error('Error fetching playback state:', error);
    }
  }, [isLoggedIn, currentTrackId]);

  useEffect(() => {
    fetchPlaybackState();
    const interval = setInterval(fetchPlaybackState, 1000);
    return () => clearInterval(interval);
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
                isPlaying={playbackState?.is_playing}
                progress={playbackState?.progress_ms}
                duration={playbackState?.item?.duration_ms}
                trackId={playbackState?.item?.id}
                trackName={playbackState?.item?.name}
                artistName={playbackState?.item?.artists?.[0]?.name}
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
      
      {/* Data Panel - Hidden but stores data */}
      {trackData && (
        <div className="data-panel hidden">
          <pre>{JSON.stringify(trackData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
