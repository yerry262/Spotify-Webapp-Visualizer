import React, { useRef, useEffect, useCallback, useState } from 'react';
import { YouTubeService } from '../youtubeService';
import { analyzeAudio, getAnalysisAtTime, loadEssentia } from '../audioAnalysisService';
import './AudioVisualizer.css';

// Pitch class names for chroma display
const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Color schemes for visualization
const COLORS = {
  spotify: '#1DB954',
  accent: '#1ed760',
  bass: '#ff6b6b',
  mid: '#4ecdc4',
  high: '#45b7d1',
  chroma: [
    '#ff6b6b', '#ff8e72', '#ffa94d', '#ffd43b', '#a9e34b', '#69db7c',
    '#38d9a9', '#3bc9db', '#4dabf7', '#748ffc', '#9775fa', '#da77f2'
  ]
};

const AudioVisualizer = ({ isPlaying, progress, duration, trackId, trackName, artistName }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(Date.now());
  
  // Audio analysis state
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [mp3Url, setMp3Url] = useState(null);
  const [visualizationMode, setVisualizationMode] = useState('combined'); // 'mel', 'chroma', 'pitch', 'combined'
  
  // Current frame data for visualization
  const [currentFrame, setCurrentFrame] = useState(null);
  const lastTrackIdRef = useRef(null);
  
  // Preload essentia on mount
  useEffect(() => {
    loadEssentia().catch(console.error);
  }, []);

  // Fetch MP3 and analyze when track changes
  useEffect(() => {
    if (!trackId || trackId === lastTrackIdRef.current) return;
    if (!trackName || !artistName) return;
    
    lastTrackIdRef.current = trackId;
    
    // Reset state for new track
    setAnalysisData(null);
    setMp3Url(null);
    setAnalysisError(null);
    setCurrentFrame(null);
    
    const fetchAndAnalyze = async () => {
      setIsAnalyzing(true);
      
      try {
        console.log(`🎵 Fetching MP3 for: ${artistName} - ${trackName}`);
        
        // Get MP3 from YouTube via our service
        const mp3Result = await YouTubeService.getMP3ForTrack(artistName, trackName);
        
        if (!mp3Result || !mp3Result.mp3?.mp3Url) {
          throw new Error('Could not get MP3 from YouTube');
        }
        
        setMp3Url(mp3Result.mp3.mp3Url);
        console.log('📥 MP3 URL:', mp3Result.mp3.mp3Url);
        
        // Analyze the audio
        console.log('🔬 Starting audio analysis...');
        const analysis = await analyzeAudio(mp3Result.mp3.mp3Url);
        
        setAnalysisData(analysis);
        console.log('✅ Analysis complete:', analysis);
        
      } catch (error) {
        console.error('❌ Analysis failed:', error);
        setAnalysisError(error.message);
      } finally {
        setIsAnalyzing(false);
      }
    };
    
    fetchAndAnalyze();
  }, [trackId, trackName, artistName]);

  // Update current frame based on playback position
  useEffect(() => {
    if (!analysisData || !isPlaying || progress === undefined) return;
    
    const timeInSeconds = progress / 1000;
    const frame = getAnalysisAtTime(analysisData, timeInSeconds);
    setCurrentFrame(frame);
  }, [analysisData, isPlaying, progress]);

  // Draw visualization
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    const now = Date.now();
    const deltaTime = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    
    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    const currentTime = progress ? progress / 1000 : 0;
    
    if (analysisData && currentFrame) {
      // We have real analysis data - draw based on it
      drawRealVisualization(ctx, width, height, currentFrame, currentTime, deltaTime);
    } else {
      // Fallback visualization while loading
      drawFallbackVisualization(ctx, width, height, currentTime, deltaTime);
    }
    
    // Draw progress bar
    drawProgressBar(ctx, width, height);
    
    animationRef.current = requestAnimationFrame(draw);
  }, [isPlaying, progress, duration, analysisData, currentFrame, visualizationMode]);

  // Draw visualization using real audio analysis data
  const drawRealVisualization = (ctx, width, height, frame, time, deltaTime) => {
    const { mel, chroma, pitch, pitchConfidence, bpm, onBeat, beatStrength } = frame;
    
    const centerY = height / 2;
    
    // Beat flash effect
    if (onBeat && beatStrength > 0.5) {
      ctx.fillStyle = `rgba(29, 185, 84, ${beatStrength * 0.15})`;
      ctx.fillRect(0, 0, width, height);
    }
    
    switch (visualizationMode) {
      case 'mel':
        drawMelSpectrogram(ctx, width, height, mel, beatStrength);
        break;
      case 'chroma':
        drawChromaVisualization(ctx, width, height, chroma, beatStrength);
        break;
      case 'pitch':
        drawPitchVisualization(ctx, width, height, pitch, pitchConfidence, beatStrength);
        break;
      case 'combined':
      default:
        drawCombinedVisualization(ctx, width, height, frame, time);
        break;
    }
    
    // Draw center beat indicator
    drawBeatIndicator(ctx, width, centerY, bpm, onBeat, beatStrength);
  };

  // Draw mel spectrogram bars
  const drawMelSpectrogram = (ctx, width, height, melBands, beatStrength) => {
    if (!melBands || melBands.length === 0) return;
    
    const numBands = melBands.length;
    const barWidth = width / numBands;
    const maxHeight = height * 0.8;
    const centerY = height / 2;
    
    melBands.forEach((value, i) => {
      // Normalize mel band value (they're log-scaled)
      const normalizedValue = Math.max(0, Math.min(1, (value + 10) / 10));
      const barHeight = normalizedValue * maxHeight;
      
      const x = i * barWidth;
      const topY = centerY - barHeight / 2;
      
      // Color based on frequency band
      const hue = (i / numBands) * 60 + 180; // Cyan to magenta
      const saturation = 70 + normalizedValue * 30;
      const lightness = 30 + normalizedValue * 40 + beatStrength * 20;
      
      const gradient = ctx.createLinearGradient(x, topY, x, topY + barHeight);
      gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
      gradient.addColorStop(0.5, `hsl(${hue + 20}, ${saturation}%, ${lightness + 15}%)`);
      gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x + 1, topY, barWidth - 2, barHeight, 2);
      ctx.fill();
      
      // Glow on loud bands
      if (normalizedValue > 0.6) {
        ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.shadowBlur = 15 * normalizedValue;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  };

  // Draw chroma (pitch class) visualization
  const drawChromaVisualization = (ctx, width, height, chroma, beatStrength) => {
    if (!chroma || chroma.length !== 12) return;
    
    const barWidth = width / 12;
    const maxHeight = height * 0.7;
    const centerY = height / 2;
    
    chroma.forEach((value, i) => {
      const barHeight = value * maxHeight;
      const x = i * barWidth;
      const topY = centerY - barHeight / 2;
      
      const color = COLORS.chroma[i];
      
      const gradient = ctx.createLinearGradient(x, topY, x, topY + barHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color);
      gradient.addColorStop(1, color);
      
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.7 + beatStrength * 0.3;
      ctx.beginPath();
      ctx.roundRect(x + 4, topY, barWidth - 8, barHeight, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
      
      // Glow on active pitch classes
      if (value > 0.5) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20 * value;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      // Draw pitch class label
      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + value * 0.5})`;
      ctx.font = '12px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(PITCH_CLASSES[i], x + barWidth / 2, height - 20);
    });
  };

  // Draw pitch contour visualization
  const drawPitchVisualization = (ctx, width, height, pitch, confidence, beatStrength) => {
    // Draw pitch as a position on the Y axis
    if (pitch > 0 && confidence > 0.3) {
      // Map pitch (typically 80-2000 Hz) to screen position
      const minPitch = 80;
      const maxPitch = 2000;
      const normalizedPitch = Math.log(pitch / minPitch) / Math.log(maxPitch / minPitch);
      const y = height - (normalizedPitch * height * 0.8) - height * 0.1;
      
      const circleSize = 20 + confidence * 30 + beatStrength * 20;
      
      // Draw glow
      const gradient = ctx.createRadialGradient(width / 2, y, 0, width / 2, y, circleSize * 2);
      gradient.addColorStop(0, `rgba(29, 185, 84, ${confidence * 0.8})`);
      gradient.addColorStop(0.5, `rgba(29, 185, 84, ${confidence * 0.3})`);
      gradient.addColorStop(1, 'rgba(29, 185, 84, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(width / 2, y, circleSize * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw pitch circle
      ctx.fillStyle = COLORS.spotify;
      ctx.beginPath();
      ctx.arc(width / 2, y, circleSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw pitch value
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(pitch)} Hz`, width / 2, y + 5);
    }
    
    // Draw frequency guide lines
    const frequencies = [100, 200, 440, 880, 1760];
    frequencies.forEach(freq => {
      const normalizedPitch = Math.log(freq / 80) / Math.log(2000 / 80);
      const y = height - (normalizedPitch * height * 0.8) - height * 0.1;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px "Orbitron", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${freq}Hz`, 10, y - 5);
    });
  };

  // Draw combined visualization (mel + chroma + pitch)
  const drawCombinedVisualization = (ctx, width, height, frame, time) => {
    const { mel, chroma, pitch, pitchConfidence, onBeat, beatStrength } = frame;
    
    const topSection = height * 0.45;
    const middleY = height / 2;
    
    // Top: Mel spectrogram (condensed)
    if (mel && mel.length > 0) {
      const numBands = Math.min(mel.length, 48); // Use fewer bands for combined view
      const step = Math.floor(mel.length / numBands);
      const barWidth = width / numBands;
      
      for (let i = 0; i < numBands; i++) {
        const value = mel[i * step] || 0;
        const normalizedValue = Math.max(0, Math.min(1, (value + 10) / 10));
        const barHeight = normalizedValue * topSection * 0.8;
        
        const x = i * barWidth;
        const y = topSection - barHeight;
        
        const hue = (i / numBands) * 60 + 180;
        ctx.fillStyle = `hsla(${hue}, 80%, ${40 + normalizedValue * 30}%, ${0.7 + beatStrength * 0.3})`;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }
    }
    
    // Middle: Chroma ring
    if (chroma && chroma.length === 12) {
      const centerX = width / 2;
      const radius = Math.min(width, height) * 0.12;
      
      chroma.forEach((value, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const innerRadius = radius * 0.6;
        const outerRadius = radius + value * radius * 0.8;
        
        const x1 = centerX + Math.cos(angle - 0.2) * innerRadius;
        const y1 = middleY + Math.sin(angle - 0.2) * innerRadius;
        const x2 = centerX + Math.cos(angle + 0.2) * innerRadius;
        const y2 = middleY + Math.sin(angle + 0.2) * innerRadius;
        const x3 = centerX + Math.cos(angle + 0.2) * outerRadius;
        const y3 = middleY + Math.sin(angle + 0.2) * outerRadius;
        const x4 = centerX + Math.cos(angle - 0.2) * outerRadius;
        const y4 = middleY + Math.sin(angle - 0.2) * outerRadius;
        
        ctx.fillStyle = COLORS.chroma[i];
        ctx.globalAlpha = 0.4 + value * 0.6 + beatStrength * 0.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      
      // Center circle with pitch info
      if (pitch > 0 && pitchConfidence > 0.3) {
        ctx.fillStyle = `rgba(29, 185, 84, ${pitchConfidence})`;
        ctx.beginPath();
        ctx.arc(centerX, middleY, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(pitch)}`, centerX, middleY);
      }
    }
    
    // Bottom: Waveform-style visualization
    if (mel && mel.length > 0) {
      const startY = height - height * 0.1;
      const waveHeight = height * 0.35;
      const numPoints = Math.min(mel.length, 64);
      const step = Math.floor(mel.length / numPoints);
      
      ctx.beginPath();
      ctx.moveTo(0, startY);
      
      for (let i = 0; i < numPoints; i++) {
        const value = mel[i * step] || 0;
        const normalizedValue = Math.max(0, Math.min(1, (value + 10) / 10));
        const x = (i / numPoints) * width;
        const y = startY - normalizedValue * waveHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.lineTo(width, startY);
      ctx.lineTo(0, startY);
      ctx.closePath();
      
      const gradient = ctx.createLinearGradient(0, startY - waveHeight, 0, startY);
      gradient.addColorStop(0, `rgba(29, 185, 84, ${0.6 + beatStrength * 0.4})`);
      gradient.addColorStop(1, 'rgba(29, 185, 84, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  };

  // Draw beat indicator in center
  const drawBeatIndicator = (ctx, width, centerY, bpm, onBeat, beatStrength) => {
    const pulseSize = 30 + beatStrength * 40;
    
    // Outer ring
    ctx.beginPath();
    ctx.arc(width / 2, centerY, pulseSize, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(29, 185, 84, ${0.3 + beatStrength * 0.7})`;
    ctx.lineWidth = 2 + beatStrength * 3;
    ctx.stroke();
    
    // Inner glow on beat
    if (onBeat && beatStrength > 0.5) {
      ctx.beginPath();
      ctx.arc(width / 2, centerY, pulseSize * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(29, 185, 84, ${beatStrength * 0.5})`;
      ctx.fill();
    }
  };

  // Fallback visualization when no analysis data
  const drawFallbackVisualization = (ctx, width, height, time, deltaTime) => {
    const centerY = height / 2;
    const numBars = 32;
    const barWidth = width / numBars;
    const maxHeight = height * 0.6;
    
    for (let i = 0; i < numBars; i++) {
      const phase = (i / numBars) * Math.PI * 2;
      const wave1 = Math.sin(time * 2 + phase) * 0.5 + 0.5;
      const wave2 = Math.sin(time * 3 + phase * 1.5) * 0.3 + 0.5;
      const value = (wave1 + wave2) / 2 * (isPlaying ? 1 : 0.2);
      
      const barHeight = value * maxHeight;
      const x = i * barWidth;
      const topY = centerY - barHeight / 2;
      
      const hue = (i / numBars) * 60 + 140;
      ctx.fillStyle = `hsla(${hue}, 70%, ${40 + value * 30}%, 0.8)`;
      ctx.beginPath();
      ctx.roundRect(x + 2, topY, barWidth - 4, barHeight, 3);
      ctx.fill();
    }
    
    // Loading indicator
    if (isAnalyzing) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(width / 2 - 100, centerY - 30, 200, 60);
      
      ctx.fillStyle = COLORS.spotify;
      ctx.font = '14px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Analyzing Audio...', width / 2, centerY);
      
      // Spinning loader
      const loaderAngle = time * 3;
      ctx.beginPath();
      ctx.arc(width / 2, centerY + 20, 8, loaderAngle, loaderAngle + Math.PI * 1.5);
      ctx.strokeStyle = COLORS.spotify;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  };

  // Draw progress bar
  const drawProgressBar = (ctx, width, height) => {
    if (!progress || !duration) return;
    
    const progressWidth = (progress / duration) * width;
    
    // Background track
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, height - 6, width, 6);
    
    // Progress fill
    const progressGradient = ctx.createLinearGradient(0, 0, progressWidth, 0);
    progressGradient.addColorStop(0, COLORS.spotify);
    progressGradient.addColorStop(1, COLORS.accent);
    ctx.fillStyle = progressGradient;
    ctx.fillRect(0, height - 6, progressWidth, 6);
    
    // Progress handle
    ctx.beginPath();
    ctx.arc(progressWidth, height - 3, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = COLORS.spotify;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  // Setup canvas and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  // Cycle through visualization modes
  const cycleMode = () => {
    const modes = ['combined', 'mel', 'chroma', 'pitch'];
    const currentIndex = modes.indexOf(visualizationMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setVisualizationMode(modes[nextIndex]);
  };

  return (
    <div className="audio-visualizer">
      <canvas ref={canvasRef} className="visualizer-canvas" />
      <div className="visualizer-overlay">
        <div className="corner-accent top-left"></div>
        <div className="corner-accent top-right"></div>
        <div className="corner-accent bottom-left"></div>
        <div className="corner-accent bottom-right"></div>
      </div>
      
      {/* Status indicator */}
      <div className="audio-mode-indicator" onClick={cycleMode} style={{ cursor: 'pointer' }}>
        <span className={`mode-dot ${isPlaying ? 'active' : ''} ${isAnalyzing ? 'analyzing' : ''}`}></span>
        <span className="mode-text">
          {isAnalyzing ? 'ANALYZING...' : 
           analysisData ? `${visualizationMode.toUpperCase()} | ${Math.round(analysisData.features.rhythm?.bpm || 0)} BPM` : 
           'LOADING...'}
        </span>
      </div>
      
      {/* Error display */}
      {analysisError && (
        <div className="analysis-error">
          <span>⚠️ {analysisError}</span>
        </div>
      )}
      
      {isPlaying && (
        <div className="playing-pulse">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;
