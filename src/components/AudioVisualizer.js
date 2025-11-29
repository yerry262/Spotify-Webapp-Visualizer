import React, { useRef, useEffect, useCallback } from 'react';
import './AudioVisualizer.css';
import { drawIdleAnimation } from './visualizers/VisualizerIdle';
import { drawLoadingAnimation } from './visualizers/VisualizerLoading';
import { drawAudioVisualization, initParticles } from './visualizers/VisualizerAudio';
import { getAnalysisAtTime } from '../audioAnalysisService';

/**
 * AudioVisualizer Component
 * 
 * Exactly matches test-runner.html animation approach:
 * - Uses requestAnimationFrame with deltaTime for smooth animation
 * - Internal time tracking with periodic Spotify sync
 * - Continuous playback visualization
 */
const AudioVisualizer = ({ 
  analysisData, 
  isPlaying, 
  progress, 
  isAnalyzing,
  trackId 
}) => {
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const currentTimeRef = useRef(0);
  const lastSyncTimeRef = useRef(0);
  
  // Visualization state - exactly matches test-runner vizState
  const vizStateRef = useRef({
    beatPulse: 0,
    dominantHue: 200,
    energyLevel: 0,
    lastBeatTime: 0,
    particles: [],
    chromaRotation: 0
  });

  // Track previous track ID to detect track changes
  const prevTrackIdRef = useRef(null);

  // Initialize particles when canvas is ready
  const initializeParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    vizStateRef.current.particles = initParticles(canvas.width, canvas.height);
  }, []);

  // Sync with Spotify position periodically
  const syncWithSpotify = useCallback((spotifyProgress) => {
    if (typeof spotifyProgress === 'number' && !isNaN(spotifyProgress)) {
      currentTimeRef.current = spotifyProgress / 1000; // Convert ms to seconds
      lastSyncTimeRef.current = performance.now();
    }
  }, []);

  // Main animation loop - exactly matches test-runner animate() function
  const animate = useCallback((timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Calculate deltaTime - exactly like test-runner
    if (lastTimestampRef.current === null) {
      lastTimestampRef.current = timestamp;
    }
    const deltaTime = (timestamp - lastTimestampRef.current) / 1000;
    lastTimestampRef.current = timestamp;

    // IDLE STATE - no analysis data and not analyzing
    if (!analysisData && !isAnalyzing) {
      // Clear canvas solid for idle
      ctx.fillStyle = 'rgb(10, 10, 15)';
      ctx.fillRect(0, 0, width, height);
      drawIdleAnimation(ctx, width, height, timestamp / 1000);
      animationIdRef.current = requestAnimationFrame(animate);
      return;
    }

    // LOADING STATE - analyzing audio
    if (isAnalyzing) {
      ctx.fillStyle = 'rgb(10, 10, 15)';
      ctx.fillRect(0, 0, width, height);
      drawLoadingAnimation(ctx, width, height, timestamp / 1000, 0.5);
      animationIdRef.current = requestAnimationFrame(animate);
      return;
    }

    // REAL VISUALIZATION STATE - has analysis data
    if (analysisData) {
      // Advance time when playing - exactly like test-runner
      if (isPlaying) {
        currentTimeRef.current += deltaTime;
        
        // Loop back to start if we exceed duration
        if (analysisData.duration && currentTimeRef.current >= analysisData.duration) {
          currentTimeRef.current = 0;
        }
      }

      // Get analysis frame at current time - exactly like test-runner
      const frame = getAnalysisAtTime(analysisData, currentTimeRef.current);
      
      if (frame) {
        drawAudioVisualization(
          ctx, 
          width, 
          height, 
          vizStateRef.current,
          frame, 
          currentTimeRef.current
        );
      }
    }

    animationIdRef.current = requestAnimationFrame(animate);
  }, [analysisData, isPlaying, isAnalyzing]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        initializeParticles();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [initializeParticles]);

  // Handle track changes - reset time and state
  useEffect(() => {
    if (trackId !== prevTrackIdRef.current) {
      prevTrackIdRef.current = trackId;
      currentTimeRef.current = 0;
      lastTimestampRef.current = null;
      
      // Reset visualization state
      vizStateRef.current = {
        beatPulse: 0,
        dominantHue: 200,
        energyLevel: 0,
        lastBeatTime: 0,
        particles: vizStateRef.current.particles, // Keep particles
        chromaRotation: 0
      };
    }
  }, [trackId]);

  // Sync with Spotify progress more frequently for better precision
  useEffect(() => {
    if (typeof progress === 'number' && analysisData && isPlaying) {
      // Keep full precision - Spotify provides ms, convert to seconds with decimals
      const spotifyTime = progress / 1000;
      const timeSinceSync = performance.now() - lastSyncTimeRef.current;
      const drift = Math.abs(currentTimeRef.current - spotifyTime);
      
      // Sync more aggressively for better accuracy:
      // 1. Every 1 second (was 2)
      // 2. Drift > 0.15 seconds (was 0.5) - catches smaller drifts
      // 3. First sync
      if (timeSinceSync > 1000 || drift > 0.15 || lastSyncTimeRef.current === 0) {
        syncWithSpotify(progress);
      }
    }
  }, [progress, analysisData, isPlaying, syncWithSpotify]);

  // Start/stop animation loop
  useEffect(() => {
    // Start animation
    lastTimestampRef.current = null;
    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [animate]);

  // Initialize particles on mount
  useEffect(() => {
    initializeParticles();
  }, [initializeParticles]);

  return (
    <div className="audio-visualizer">
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  );
};

export default AudioVisualizer;
