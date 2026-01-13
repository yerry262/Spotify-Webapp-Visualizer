import React from 'react';
import './SongProgress.css';

const SongProgress = ({ progress, duration, isExpanded }) => {
  const formatTime = (ms) => {
    if (!ms) return '0:00';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (progress / duration) * 100 : 0;

  return (
    <div className={`song-progress ${isExpanded ? 'is-expanded' : ''}`}>
      <span className="progress-time current">{formatTime(progress)}</span>
      <div className="progress-bar-container">
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <span className="progress-time total">{formatTime(duration)}</span>
    </div>
  );
};

export default SongProgress;
