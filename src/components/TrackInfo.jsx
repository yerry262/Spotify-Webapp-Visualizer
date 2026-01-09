import React, { useEffect, useRef, useState, useMemo } from 'react';
import './TrackInfo.css';

// Extract random pixel colors from album art for particles
const extractPixelColors = (imgUrl, numColors, callback) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 100;
    canvas.height = 100;
    ctx.drawImage(img, 0, 0, 100, 100);
    
    const imageData = ctx.getImageData(0, 0, 100, 100).data;
    const colors = [];
    
    // Extract random pixel colors from the artwork
    for (let i = 0; i < numColors; i++) {
      const x = Math.floor(Math.random() * 100);
      const y = Math.floor(Math.random() * 100);
      const idx = (y * 100 + x) * 4;
      const r = imageData[idx];
      const g = imageData[idx + 1];
      const b = imageData[idx + 2];
      
      // Skip very dark or very light pixels, resample if needed
      const brightness = (r + g + b) / 3;
      if (brightness > 30 && brightness < 240) {
        colors.push(`rgb(${r}, ${g}, ${b})`);
      } else {
        // Try another random pixel
        const x2 = Math.floor(Math.random() * 100);
        const y2 = Math.floor(Math.random() * 100);
        const idx2 = (y2 * 100 + x2) * 4;
        colors.push(`rgb(${imageData[idx2]}, ${imageData[idx2 + 1]}, ${imageData[idx2 + 2]})`);
      }
    }
    
    callback(colors);
  };
  img.src = imgUrl;
};

// Extract dominant colors for scan line (keep original function for that)
const extractDominantColors = (imgUrl, callback) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 50;
    canvas.height = 50;
    ctx.drawImage(img, 0, 0, 50, 50);
    
    const imageData = ctx.getImageData(0, 0, 50, 50).data;
    const colors = [];
    
    // Sample colors from different regions
    const samples = [
      { x: 12, y: 12 }, // top-left
      { x: 37, y: 12 }, // top-right
      { x: 25, y: 25 }, // center
      { x: 12, y: 37 }, // bottom-left
      { x: 37, y: 37 }, // bottom-right
    ];
    
    samples.forEach(({ x, y }) => {
      const i = (y * 50 + x) * 4;
      colors.push(`rgb(${imageData[i]}, ${imageData[i+1]}, ${imageData[i+2]})`);
    });
    
    callback(colors);
  };
  img.src = imgUrl;
};

const NUM_PARTICLES = 30;

const TrackInfo = ({ track, progress, duration, isExpanded }) => {
  const [albumColors, setAlbumColors] = useState(['#1DB954', '#1ed760', '#ff6b6b', '#4ecdc4', '#a855f7']);
  const [particleColors, setParticleColors] = useState(Array(NUM_PARTICLES).fill('#1DB954'));
  const particleContainerRef = useRef(null);
  const lastTrackIdRef = useRef(null);
  
  // Extract colors when track changes
  useEffect(() => {
    if (track?.album?.images?.[0]?.url && track.id !== lastTrackIdRef.current) {
      lastTrackIdRef.current = track.id;
      
      // Extract dominant colors for scan line
      extractDominantColors(track.album.images[0].url, (colors) => {
        setAlbumColors(colors);
      });
      
      // Extract random pixel colors for particles
      extractPixelColors(track.album.images[0].url, NUM_PARTICLES, (colors) => {
        setParticleColors(colors);
      });
    }
  }, [track?.id, track?.album?.images]);
  
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
  
  // Generate particles - memoized so they don't reset on re-render
  const particles = useMemo(() => Array.from({ length: NUM_PARTICLES }, (_, i) => ({
    id: i,
    delay: (i * 0.6) + (Math.random() * 2), // Staggered start with some randomness
    duration: 10 + Math.random() * 10, // 10-20 seconds
    left: Math.random() * 100,
    size: 3 + Math.random() * 10,
    type: i % 4, // Different particle types
  })), []); // Empty deps = stable across renders

  return (
    <div className={`track-info ${isExpanded ? 'is-expanded' : ''}`}>
      {/* Floating Particles */}
      <div className="particle-container" ref={particleContainerRef}>
        {particles.map(p => (
          <div
            key={p.id}
            className={`floating-particle particle-type-${p.type}`}
            style={{
              '--particle-color': particleColors[p.id] || albumColors[p.id % albumColors.length],
              '--particle-delay': `${p.delay}s`,
              '--particle-duration': `${p.duration}s`,
              '--particle-left': `${p.left}%`,
              '--particle-size': `${p.size}px`,
            }}
          />
        ))}
      </div>
      
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
      <div className="track-decorations" style={{ '--scan-color': albumColors[2] || '#1DB954' }}>
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
