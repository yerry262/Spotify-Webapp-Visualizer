import React from 'react';
import { SpotifyAPI } from '../spotifyService';
import './PlaybackControls.css';

const PlaybackControls = ({ isPlaying, onRefresh }) => {
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
    </div>
  );
};

export default PlaybackControls;
