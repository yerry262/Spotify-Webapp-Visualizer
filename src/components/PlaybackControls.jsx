import React from 'react';
import { SpotifyAPI } from '../spotifyService';
import './PlaybackControls.css';

const PlaybackControls = ({ isPlaying, onRefresh, device, shuffleState, repeatState, smartShuffle }) => {
  const handlePrevious = async () => {
    await SpotifyAPI.previous();
    setTimeout(onRefresh, 300);
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await SpotifyAPI.pause();
    } else {
      await SpotifyAPI.play();
    }
    setTimeout(onRefresh, 300);
  };

  const handleNext = async () => {
    await SpotifyAPI.next();
    setTimeout(onRefresh, 300);
  };

  const handleShuffle = async () => {
    // Toggle shuffle on/off (smart shuffle is controlled by Spotify based on context)
    await SpotifyAPI.setShuffle(!shuffleState);
    setTimeout(onRefresh, 300);
  };

  const handleRepeat = async () => {
    // Cycle through: off -> context -> track -> off
    let nextState;
    if (repeatState === 'off') {
      nextState = 'context';
    } else if (repeatState === 'context') {
      nextState = 'track';
    } else {
      nextState = 'off';
    }
    await SpotifyAPI.setRepeat(nextState);
    setTimeout(onRefresh, 300);
  };

  // Get shuffle icon based on state
  const getShuffleIcon = () => {
    if (!shuffleState) {
      // Shuffle off - gray crossed arrows
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
        </svg>
      );
    } else if (smartShuffle) {
      // Smart shuffle - crossed arrows with sparkle
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
          <circle cx="19" cy="5" r="2.5" fill="#1DB954"/>
          <path d="M19 3.5l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z" fill="white"/>
        </svg>
      );
    } else {
      // Regular shuffle - green crossed arrows
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
        </svg>
      );
    }
  };

  // Get shuffle title
  const getShuffleTitle = () => {
    if (!shuffleState) return 'Enable Shuffle';
    if (smartShuffle) return 'Smart Shuffle On (click to disable)';
    return 'Shuffle On (click to disable)';
  };

  // Get repeat icon based on state
  const getRepeatIcon = () => {
    if (repeatState === 'track') {
      // Repeat one - arrows with "1"
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
          <text x="12" y="14.5" fontSize="8" fontWeight="bold" textAnchor="middle">1</text>
        </svg>
      );
    } else if (repeatState === 'context') {
      // Repeat all - just arrows (green)
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
        </svg>
      );
    } else {
      // Repeat off - gray arrows
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
        </svg>
      );
    }
  };

  // Get repeat title
  const getRepeatTitle = () => {
    if (repeatState === 'off') return 'Enable Repeat';
    if (repeatState === 'context') return 'Repeat All (click for Repeat One)';
    return 'Repeat One (click to disable)';
  };

  // Get device icon based on type
  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'computer':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
          </svg>
        );
      case 'smartphone':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z"/>
          </svg>
        );
      case 'speaker':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 16c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        );
      case 'tv':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
          </svg>
        );
    }
  };

  return (
    <div className="playback-controls">
      {/* Centered control buttons */}
      <div className="controls-center">
        <button 
          className={`control-btn small ${shuffleState ? 'active' : ''} ${smartShuffle ? 'smart' : ''}`} 
          onClick={handleShuffle} 
          title={getShuffleTitle()}
        >
          {getShuffleIcon()}
        </button>
        
        <button className="control-btn secondary" onClick={handlePrevious} title="Previous">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>
        
        <button className="control-btn primary" onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        
        <button className="control-btn secondary" onClick={handleNext} title="Next">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>
        
        <button 
          className={`control-btn small ${repeatState !== 'off' ? 'active' : ''}`} 
          onClick={handleRepeat} 
          title={getRepeatTitle()}
        >
          {getRepeatIcon()}
        </button>
      </div>
      
      {/* Device Info - positioned to the right */}
      {device && (
        <div className="device-info" title={`Playing on: ${device.name}`}>
          <span className="device-icon">
            {getDeviceIcon(device.type)}
          </span>
          <span className="device-name">{device.name}</span>
        </div>
      )}
    </div>
  );
};

export default PlaybackControls;
