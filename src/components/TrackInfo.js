import React from 'react';
import './TrackInfo.css';

const TrackInfo = ({ track, progress, duration }) => {
  if (!track) return null;

  const albumArt = track.album.images[0]?.url;
  const artistNames = track.artists.map(a => a.name).join(', ');
  
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (progress / duration) * 100;

  return (
    <div className="track-info">
      {/* Album Art Background */}
      <div 
        className="album-art-background"
        style={{ backgroundImage: `url(${albumArt})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="gradient-overlay" />
      
      {/* Content */}
      <div className="track-content">
        {/* Album Art */}
        <div className="album-art-container">
          <img 
            src={albumArt} 
            alt={track.album.name}
            className="album-art"
          />
          <div className="album-art-glow" style={{ backgroundImage: `url(${albumArt})` }} />
          <div className="vinyl-effect">
            <div className="vinyl-ring"></div>
            <div className="vinyl-ring"></div>
            <div className="vinyl-ring"></div>
          </div>
        </div>
        
        {/* Track Details */}
        <div className="track-details">
          <div className="now-playing-badge">
            <span className="pulse-dot"></span>
            <span>NOW PLAYING</span>
          </div>
          
          <h1 className="track-name">{track.name}</h1>
          <h2 className="artist-name">{artistNames}</h2>
          <h3 className="album-name">{track.album.name}</h3>
          
          {/* Progress Bar */}
          <div className="progress-container">
            <span className="time-current">{formatTime(progress)}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercent}%` }}
              />
              <div 
                className="progress-handle"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
            <span className="time-total">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="track-decorations">
        <div className="scan-line"></div>
        <div className="corner-frame top-left"></div>
        <div className="corner-frame top-right"></div>
        <div className="corner-frame bottom-left"></div>
        <div className="corner-frame bottom-right"></div>
      </div>
    </div>
  );
};

export default TrackInfo;
