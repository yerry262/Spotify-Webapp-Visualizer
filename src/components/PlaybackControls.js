import React from 'react';
import { SpotifyAPI } from '../spotifyService';
import './PlaybackControls.css';

const PlaybackControls = ({ isPlaying, onRefresh, device }) => {
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
      
      {/* Device Info */}
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
