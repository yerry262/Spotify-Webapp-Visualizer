/**
 * VisualizerAudio.js
 * 
 * Enhanced visualization with dynamic effects
 */

// Pitch class names for visualization
export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Chroma hues for pitch class visualization (0-330 in 30 degree steps)
export const CHROMA_HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

// Waveform style tracking (changes every 30 seconds)
let currentWaveformStyle = 0;
let lastWaveformStyleChange = 0;
let isAutoWaveformMode = true; // Auto-switch mode

// Hardcoded default values per waveform style
// Each style can have: basePosition, maxAmplitude, particles (enabled, count, size, speed), 
// and center elements (chromaWheel, circularMel, pitchOrb, beatFlash)
export const WAVEFORM_DEFAULTS = {
  // Featured styles (user favorites)
  liquid_mercury:   { basePosition: 50,  maxAmplitude: 46, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 70, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  cosmic_nebula:    { basePosition: 54,  maxAmplitude: 45, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 60, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: false, pitchOrb: true, beatFlash: false } },
  terrain_3d:       { basePosition: 95,  maxAmplitude: 60, basePositionFullScreen: 95,  maxAmplitudeFullScreen: 83, particles: { enabled: false, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  gradient_bars:    { basePosition: 95,  maxAmplitude: 50, basePositionFullScreen: 97,  maxAmplitudeFullScreen: 70, particles: { enabled: true, count: 5, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: true } },
  matrix_rain:      { basePosition: 90,  maxAmplitude: 90, basePositionFullScreen: 100,  maxAmplitudeFullScreen: 90, particles: { enabled: false, count: 5, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  plasma_fire:      { basePosition: 95,  maxAmplitude: 90, basePositionFullScreen: 95,  maxAmplitudeFullScreen: 90, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  helix_dna:        { basePosition: 50,  maxAmplitude: 40, basePositionFullScreen: 100,  maxAmplitudeFullScreen: 70, particles: { enabled: true, count: 5, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: true, pitchOrb: false, beatFlash: false } },
  pacman:           { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  snake:            { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  sacred_geometry:  { basePosition: 50,  maxAmplitude: 70, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 80, particles: { enabled: true, count: 30, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  fractal_void:     { basePosition: 50,  maxAmplitude: 80, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 90, particles: { enabled: true, count: 50, size: 0.8, speed: 1.5 }, centerElements: { chromaWheel: true, circularMel: false, pitchOrb: true, beatFlash: true } },

  // Classic styles
  layered:          { basePosition: 95,  maxAmplitude: 50, basePositionFullScreen: 95,  maxAmplitudeFullScreen: 80, particles: { enabled: false, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  oscilloscope:     { basePosition: 45,  maxAmplitude: 48, basePositionFullScreen: 45,  maxAmplitudeFullScreen: 48, particles: { enabled: false, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  bars:             { basePosition: 95,  maxAmplitude: 57, basePositionFullScreen: 95,  maxAmplitudeFullScreen: 57, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: false, pitchOrb: true, beatFlash: false } },
  ribbon:           { basePosition: 50,  maxAmplitude: 15, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 15, particles: { enabled: false, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: false, pitchOrb: true, beatFlash: false } },
  mirrored:         { basePosition: 50,  maxAmplitude: 40, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 40, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  dotted:           { basePosition: 50,  maxAmplitude: 40, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 40, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  pixelated:        { basePosition: 95,  maxAmplitude: 50, basePositionFullScreen: 95,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  //updated to here
  mesh3d:           { basePosition: 95,  maxAmplitude: 45, basePositionFullScreen: 70,  maxAmplitudeFullScreen: 45, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  sine_layers:      { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 70,  maxAmplitudeFullScreen: 50, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  circular_dots:    { basePosition: 60,  maxAmplitude: 40, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 60, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  neon_lines:       { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 70,  maxAmplitudeFullScreen: 50, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  aurora_borealis:  { basePosition: 100, maxAmplitude: 70, basePositionFullScreen: 100, maxAmplitudeFullScreen: 80, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  shockwave:        { basePosition: 62,  maxAmplitude: 80, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 90, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  kaleidoscope:     { basePosition: 65,  maxAmplitude: 45, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 60, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  lightning:        { basePosition: 15,  maxAmplitude: 70, basePositionFullScreen: 15,  maxAmplitudeFullScreen: 90, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  heartbeat:        { basePosition: 60,  maxAmplitude: 35, basePositionFullScreen: 70,  maxAmplitudeFullScreen: 60, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  fractal_tree:     { basePosition: 90,  maxAmplitude: 40, basePositionFullScreen: 90,  maxAmplitudeFullScreen: 60, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  sound_tornado:    { basePosition: 90,  maxAmplitude: 50, basePositionFullScreen: 90,  maxAmplitudeFullScreen: 70, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  geo_mandala:      { basePosition: 50,  maxAmplitude: 45, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 60, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  glitch_art:       { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 70, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  fireworks:        { basePosition: 90,  maxAmplitude: 70, basePositionFullScreen: 90,  maxAmplitudeFullScreen: 90, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  ocean_waves:      { basePosition: 70,  maxAmplitude: 30, basePositionFullScreen: 80,  maxAmplitudeFullScreen: 50, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  galaxy_spiral:    { basePosition: 50,  maxAmplitude: 45, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 60, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  neon_city:        { basePosition: 85,  maxAmplitude: 60, basePositionFullScreen: 85,  maxAmplitudeFullScreen: 80, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  particle_explosion: { basePosition: 50, maxAmplitude: 50, basePositionFullScreen: 50, maxAmplitudeFullScreen: 70, particles: { enabled: true, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
};

// Waveform settings state
let waveformSettings = {
  maxAmplitude: 45, // Custom slider value (used when useCustomSettings is true)
  basePosition: 60, // Custom slider value (used when useCustomSettings is true)
  useCustomSettings: false // Toggle: false = use hardcoded defaults, true = use sliders
};

// Animation state for smooth transitions
let isVisualizerFullScreen = false;
let vizAnimationState = {
  basePosition: 60,
  maxAmplitude: 45,
  lastStyleId: null
};

export function setVisualizerFullScreen(isFull) {
  isVisualizerFullScreen = isFull;
}

// Waveform settings getters/setters
export function getWaveformSettings() {
  return { ...waveformSettings };
}

export function setWaveformSettings(settings) {
  waveformSettings = { ...waveformSettings, ...settings };
}

export function setWaveformMaxAmplitude(amplitude) {
  waveformSettings.maxAmplitude = Math.max(10, Math.min(100, amplitude));
}

export function setWaveformBasePosition(position) {
  waveformSettings.basePosition = Math.max(25, Math.min(200, position));
}

// Internal function to update animation state (called by draw loop)
export function updateWaveformAnimationState(styleId) {
  let targetBase, targetAmp;

  if (waveformSettings.useCustomSettings) {
    targetBase = waveformSettings.basePosition;
    targetAmp = waveformSettings.maxAmplitude;
  } else {
    // Determine defaults based on current style and fullscreen mode
    const defaults = WAVEFORM_DEFAULTS[styleId] || WAVEFORM_DEFAULTS.layered;
    
    // Check if style changed
    if (vizAnimationState.lastStyleId !== styleId) {
        vizAnimationState.lastStyleId = styleId;
        // Snap to target immediately on style change
        targetBase = isVisualizerFullScreen ? (defaults.basePositionFullScreen ?? defaults.basePosition) : defaults.basePosition;
        targetAmp = isVisualizerFullScreen ? (defaults.maxAmplitudeFullScreen ?? defaults.maxAmplitude) : defaults.maxAmplitude;
        vizAnimationState.basePosition = targetBase;
        vizAnimationState.maxAmplitude = targetAmp;
        return;
    }

    targetBase = isVisualizerFullScreen ? (defaults.basePositionFullScreen ?? defaults.basePosition) : defaults.basePosition;
    targetAmp = isVisualizerFullScreen ? (defaults.maxAmplitudeFullScreen ?? defaults.maxAmplitude) : defaults.maxAmplitude;
  }

  // Smoothly interpolate current values towards target
  vizAnimationState.basePosition += (targetBase - vizAnimationState.basePosition) * 0.1;
  vizAnimationState.maxAmplitude += (targetAmp - vizAnimationState.maxAmplitude) * 0.1;
}

// Get effective waveform settings (either custom or hardcoded defaults based on toggle)
export function getEffectiveWaveformSettings(styleId) {
  // If the requested style matches our animation state tracking, return animated values
  if (styleId === vizAnimationState.lastStyleId) {
      return {
          basePosition: vizAnimationState.basePosition,
          maxAmplitude: vizAnimationState.maxAmplitude
      };
  }
  
  // Fallback logic for non-active styles or initial load
  if (waveformSettings.useCustomSettings) {
    return {
      basePosition: waveformSettings.basePosition,
      maxAmplitude: waveformSettings.maxAmplitude
    };
  }
  const defaults = WAVEFORM_DEFAULTS[styleId] || WAVEFORM_DEFAULTS.layered;
  // Make sure to return the correct target based on fullscreen even if not animated yet
  return {
      basePosition: isVisualizerFullScreen ? (defaults.basePositionFullScreen ?? defaults.basePosition) : defaults.basePosition,
      maxAmplitude: isVisualizerFullScreen ? (defaults.maxAmplitudeFullScreen ?? defaults.maxAmplitude) : defaults.maxAmplitude
  };
}

// Particle settings state
let particleSettings = {
  enabled: true,
  count: 5,
  size: 1.0,
  speed: 1.0
};

// Center elements visibility settings
let centerElementSettings = {
  chromaWheel: true,
  circularMel: true,
  pitchOrb: true,
  beatFlash: true
};

// Particle settings getters/setters
export function getParticleSettings() {
  return { ...particleSettings };
}

export function setParticleSettings(settings) {
  particleSettings = { ...particleSettings, ...settings };
}

export function setParticleEnabled(enabled) {
  particleSettings.enabled = enabled;
}

export function setParticleCount(count) {
  particleSettings.count = Math.max(0, Math.min(200, count));
}

export function setParticleSize(size) {
  particleSettings.size = Math.max(0.5, Math.min(10, size));
}

export function setParticleSpeed(speed) {
  particleSettings.speed = Math.max(0.5, Math.min(3, speed));
}

// Center elements getters/setters
export function getCenterElementSettings() {
  return { ...centerElementSettings };
}

export function setCenterElementSettings(settings) {
  centerElementSettings = { ...centerElementSettings, ...settings };
}

// Sample rate / resolution settings
// These control the visualization resolution (frames per second for each analysis type)
// FPS values: 0-60, where 0 disables the analysis. Default is 5 fps for each.
let sampleRateSettings = {
  chromaFps: 5,        // HPCP Chroma analysis fps (0-60)
  melFps: 5,           // Mel Spectrogram analysis fps (0-60)
  pitchFps: 2,         // Pitch analysis fps (0-60)
  rhythmFps: 5         // Rhythm/Beat density fps (0-60)
};

// Convert FPS to interval (seconds between frames)
export function fpsToInterval(fps) {
  if (fps <= 0) return 999; // Effectively disabled
  return 1 / fps;
}

// Sample rate getters/setters
export function getSampleRateSettings() {
  return { ...sampleRateSettings };
}

export function setSampleRateSettings(settings) {
  sampleRateSettings = { ...sampleRateSettings, ...settings };
}

// Get interval for a specific analysis type
export function getAnalysisInterval(type) {
  switch (type) {
    case 'chroma': return fpsToInterval(sampleRateSettings.chromaFps);
    case 'mel': return fpsToInterval(sampleRateSettings.melFps);
    case 'pitch': return fpsToInterval(sampleRateSettings.pitchFps);
    case 'rhythm': return fpsToInterval(sampleRateSettings.rhythmFps);
    default: return 0.2; // Default 5fps
  }
}

// Export waveform styles for menu
export const WAVEFORM_STYLES = [
  // Featured styles (user favorites)
  { id: 'liquid_mercury', name: 'Liquid Mercury' },
  { id: 'cosmic_nebula', name: 'Cosmic Nebula' },
  { id: 'terrain_3d', name: 'Soundwave Terrain' },
  { id: 'gradient_bars', name: 'Gradient Bars' },
  { id: 'matrix_rain', name: 'Matrix Rain' },
  { id: 'plasma_fire', name: 'Plasma Fire' },
  { id: 'helix_dna', name: 'DNA Helix' },
  { id: 'pacman', name: '8-Bit Chase' },
  { id: 'snake', name: 'Rhythm Snake' },
  { id: 'sacred_geometry', name: 'Sacred Geometry' },
  { id: 'fractal_void', name: 'Fractal Void' },
  // Classic styles
  { id: 'layered', name: 'Layered Waves' },
  { id: 'oscilloscope', name: 'Oscilloscope' },
  { id: 'bars', name: 'Spectrum Bars' },
  { id: 'ribbon', name: 'Flowing Ribbons' },
  { id: 'mirrored', name: 'Mirrored Wave' },
  { id: 'dotted', name: 'Particle Dots' },
  { id: 'pixelated', name: 'Pixelated' },
  { id: 'mesh3d', name: '3D Mesh' },
  { id: 'sine_layers', name: 'Sine Layers' },
  { id: 'circular_dots', name: 'Circular Dots' },
  { id: 'neon_lines', name: 'Neon Lines' },
  { id: 'aurora_borealis', name: 'Aurora Borealis' },
  { id: 'shockwave', name: 'Shockwave Rings' },
  { id: 'kaleidoscope', name: 'Kaleidoscope' },
  { id: 'lightning', name: 'Lightning Storm' },
  { id: 'heartbeat', name: 'Heartbeat ECG' },
  { id: 'fractal_tree', name: 'Fractal Tree' },
  { id: 'sound_tornado', name: 'Sound Tornado' },
  { id: 'geo_mandala', name: 'Geometric Mandala' },
  { id: 'glitch_art', name: 'Glitch Art' },
  { id: 'fireworks', name: 'Fireworks Show' },
  { id: 'ocean_waves', name: 'Ocean Waves' },
  { id: 'galaxy_spiral', name: 'Galaxy Spiral' },
  { id: 'neon_city', name: 'Neon City' },
  { id: 'particle_explosion', name: 'Particle Explosion' }
];

// Get current waveform style
export function getWaveformStyle() {
  return WAVEFORM_STYLES[currentWaveformStyle]?.id || 'layered';
}

// Get all waveform styles
export function getWaveformStyles() {
  return WAVEFORM_STYLES;
}

// Get auto mode status
export function isWaveformAutoMode() {
  return isAutoWaveformMode;
}

// Set auto mode on/off
export function setWaveformAutoMode(enabled) {
  isAutoWaveformMode = enabled;
  if (enabled) {
    lastWaveformStyleChange = -9999; // Force immediate change on next frame
  }
}

// Reset waveform timing for track changes - should be called when a new song starts
export function resetWaveformTiming() {
  lastWaveformStyleChange = -9999; // Force immediate change

  // Force a style change on next frame
  console.log('🔄 Waveform timing reset for new track');
}

// Set waveform style (null = auto mode)
export function setWaveformStyle(styleId) {
  if (styleId === null || styleId === 'auto') {
    isAutoWaveformMode = true;
    lastWaveformStyleChange = 0; // Force immediate change on next frame
  } else {
    isAutoWaveformMode = false;
    const index = WAVEFORM_STYLES.findIndex(s => s.id === styleId);
    if (index !== -1) {
      currentWaveformStyle = index;
    }
  }
}

/**
 * Initialize particle system with more random properties
 */
export function initParticles(width, height) {
  const NUM_PARTICLES = particleSettings.count;
  const particles = [];
  for (let i = 0; i < NUM_PARTICLES; i++) {
    // More random speeds and directions
    const speed = (Math.random() * 4 + 0.5) * particleSettings.speed; // 0.5 to 4.5, scaled by speed setting
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      baseSpeed: speed,
      size: (Math.random() * 4 + 1) * particleSettings.size,
      hue: Math.random() * 360, // Full color range
      alpha: Math.random() * 0.6 + 0.2,
      trail: [], // For trail effect on high pitch
      oscillation: Math.random() * Math.PI * 2, // Random phase
      oscillationSpeed: Math.random() * 0.1 + 0.02
    });
  }
  return particles;
}

/**
 * REAL VISUALIZATION: Full visualization with actual audio data
 */
export function drawAudioVisualization(ctx, width, height, vizState, frame, time) {
  const centerX = width / 2;
  const centerY = height / 2;
  const beatStrength = frame.beatStrength || 0;
  const radius = Math.min(width, height) * 0.38;
  
  // Update visualization state
  if (frame.onBeat && beatStrength > 0.5) {
    vizState.beatPulse = 1;
    vizState.lastBeatTime = time;
  }
  vizState.beatPulse *= 0.92; // Decay
  
  // Calculate energy level from mel
  if (frame.mel && frame.mel.length > 0) {
    const avgMel = frame.mel.reduce((a, b) => a + b, 0) / frame.mel.length;
    vizState.energyLevel = Math.max(0, Math.min(1, (avgMel + 5) / 10));
  }
  
  // Calculate dominant hue from chroma
  if (frame.chroma && frame.chroma.length === 12) {
    let maxIdx = 0;
    let maxVal = 0;
    for (let i = 0; i < 12; i++) {
      if (frame.chroma[i] > maxVal) {
        maxVal = frame.chroma[i];
        maxIdx = i;
      }
    }
    vizState.dominantHue = CHROMA_HUES[maxIdx];
  }
  
  // Update chroma rotation
  vizState.chromaRotation += 0.005 + vizState.beatPulse * 0.02;
  
  // Update waveform style every 30 seconds - random selection (only in auto mode)
  // Also detect if time went backwards (new song started) and reset timing
  if (isAutoWaveformMode) {
    // If time is less than lastWaveformStyleChange (but huge negative means we forced it),
    // we should only reset IF it wasn't our forced change.
    // Our forced change makes lastWaveformStyleChange = -9999.
    // So if time < lastWaveformStyleChange - 5, it means time went VERY negative (impossible) 
    // OR we just wanted to fix the "new song detection".
    // Actually, simply checking if it's > 30 handles the forced update.
    // The "new song" detection is tricky if we use -9999.
    // Let's rely on resetWaveformTiming() being called externally for new songs,
    // or just check for backwards time travel relative to positive timestamps.
    // If lastWaveformStyleChange is positive and time < last, then new song.
    if (lastWaveformStyleChange > 0 && time < lastWaveformStyleChange - 5) {
      lastWaveformStyleChange = -9999;
    }
    
    if (time - lastWaveformStyleChange > 30 || lastWaveformStyleChange < -9000) {
      let newStyle;
      do {
        newStyle = Math.floor(Math.random() * WAVEFORM_STYLES.length);
      } while (newStyle === currentWaveformStyle && WAVEFORM_STYLES.length > 1);
      currentWaveformStyle = newStyle;
      lastWaveformStyleChange = time;
    }
  }

  // Update animation state for smooth transitions
  const currentStyleObj = WAVEFORM_STYLES[currentWaveformStyle];
  const currentStyleId = currentStyleObj?.id || 'layered';
  updateWaveformAnimationState(currentStyleId);
  
  // Background with fade trail
  ctx.fillStyle = 'rgba(10, 10, 15, 0.12)';
  ctx.fillRect(0, 0, width, height);
  
  // Beat flash effect (can be toggled off)
  if (centerElementSettings.beatFlash && vizState.beatPulse > 0.5) {
    ctx.fillStyle = `hsla(${vizState.dominantHue}, 70%, 50%, ${vizState.beatPulse * 0.1})`;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Draw all visualization components
  const pitch = frame.pitch || 0;
  
  // Draw waveform FIRST (behind other elements)
  drawChromaSoundWaves(ctx, width, height, frame.chroma, frame.mel, vizState.beatPulse, time);
  
  // Then draw particles, mel ring, chroma wheel, and pitch orb on top
  updateAndDrawParticles(ctx, width, height, vizState.beatPulse, vizState.dominantHue, vizState.energyLevel, vizState, pitch);
  if (centerElementSettings.circularMel) {
    drawCircularMel(ctx, centerX, centerY, radius, frame.mel, vizState.beatPulse, vizState.dominantHue);
  }
  if (centerElementSettings.chromaWheel) {
    drawChromaWheel(ctx, centerX, centerY, radius, frame.chroma, vizState.chromaRotation, vizState.beatPulse);
  }
  if (centerElementSettings.pitchOrb) {
    drawPitchOrb(ctx, centerX, centerY, radius, pitch, frame.pitchConfidence || 0, vizState.beatPulse, vizState.dominantHue);
  }
}

/**
 * Draw circular mel spectrogram - smaller ring with animated bar lengths
 * Features a traveling wave animation that creates a sequential "chasing" effect
 */
function drawCircularMel(ctx, centerX, centerY, radius, mel, beatPulse, dominantHue) {
  if (!mel || mel.length === 0) return;
  
  const numBars = mel.length;
  const angleStep = (Math.PI * 2) / numBars;
  const maxBarHeight = radius * 0.25; // Slightly reduced max height
  
  // Get current time for wave animation
  const time = performance.now() / 1000;
  
  // Wave parameters for the traveling animation
  const waveSpeed = 2; // How fast the wave travels around the circle
  const waveCycles = 2; // How many complete waves around the circle
  
  for (let i = 0; i < numBars; i++) {
    const angle = i * angleStep - Math.PI / 2;
    
    // Calculate traveling wave offset for this bar
    // Each bar has a phase based on its position around the circle
    const phaseOffset = (i / numBars) * Math.PI * 2 * waveCycles;
    const waveValue = (Math.sin(time * waveSpeed * Math.PI - phaseOffset) + 1) / 2; // 0 to 1
    
    // Base wave animation (always present) - gives minimum movement
    const baseWaveHeight = maxBarHeight * 0.3 * waveValue;
    
    // Normalize mel value - higher values = longer bars
    const melValue = Math.max(0, Math.min(1, (mel[i] + 10) / 10));
    
    // Audio-reactive height (when there's actual audio data)
    const audioHeight = melValue * maxBarHeight * (1 + beatPulse * 0.3);
    
    // Combine: use the larger of base wave or audio, ensuring there's always movement
    const barHeight = Math.max(baseWaveHeight, audioHeight * (0.5 + waveValue * 0.5));
    
    // Shrink the mel ring - moved closer to center
    const innerRadius = radius * 0.65;
    const outerRadius = innerRadius + barHeight;
    
    const x1 = centerX + Math.cos(angle - angleStep * 0.3) * innerRadius;
    const y1 = centerY + Math.sin(angle - angleStep * 0.3) * innerRadius;
    const x2 = centerX + Math.cos(angle - angleStep * 0.3) * outerRadius;
    const y2 = centerY + Math.sin(angle - angleStep * 0.3) * outerRadius;
    const x3 = centerX + Math.cos(angle + angleStep * 0.3) * outerRadius;
    const y3 = centerY + Math.sin(angle + angleStep * 0.3) * outerRadius;
    const x4 = centerX + Math.cos(angle + angleStep * 0.3) * innerRadius;
    const y4 = centerY + Math.sin(angle + angleStep * 0.3) * innerRadius;
    
    const hue = dominantHue + (i / numBars) * 60;
    // Brightness also affected by wave position for extra visual effect
    const lightness = 40 + melValue * 35 + beatPulse * 15 + waveValue * 10;
    
    ctx.fillStyle = `hsla(${hue}, 75%, ${lightness}%, ${0.7 + melValue * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Draw chroma wheel - note labels closer to pitch orb and bigger
 */
function drawChromaWheel(ctx, centerX, centerY, radius, chroma, rotation, beatPulse) {
  if (!chroma || chroma.length !== 12) return;
  
  for (let i = 0; i < 12; i++) {
    const value = chroma[i] || 0;
    const angle = (i / 12) * Math.PI * 2 + rotation - Math.PI / 2;
    const petalLength = radius * (0.3 + value * 0.5) * (1 + beatPulse * 0.2);
    
    // Draw petal
    ctx.beginPath();
    const petalWidth = Math.PI / 16;
    ctx.moveTo(centerX, centerY);
    ctx.quadraticCurveTo(
      centerX + Math.cos(angle - petalWidth) * petalLength * 0.7,
      centerY + Math.sin(angle - petalWidth) * petalLength * 0.7,
      centerX + Math.cos(angle) * petalLength,
      centerY + Math.sin(angle) * petalLength
    );
    ctx.quadraticCurveTo(
      centerX + Math.cos(angle + petalWidth) * petalLength * 0.7,
      centerY + Math.sin(angle + petalWidth) * petalLength * 0.7,
      centerX,
      centerY
    );
    
    const hue = CHROMA_HUES[i];
    ctx.fillStyle = `hsla(${hue}, 80%, ${45 + value * 30}%, ${0.5 + value * 0.5})`;
    ctx.fill();
    
    // Pitch class label - BIGGER and CLOSER to pitch orb
    const labelDist = radius * 0.35; // Moved much closer (was 0.75)
    const labelX = centerX + Math.cos(angle) * labelDist;
    const labelY = centerY + Math.sin(angle) * labelDist;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + value * 0.5})`;
    ctx.font = 'bold 13px "Orbitron", monospace'; // Bigger (was 9px)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PITCH_CLASSES[i], labelX, labelY);
  }
}

/**
 * Draw central pitch orb with 3D effect
 */
function drawPitchOrb(ctx, centerX, centerY, radius, pitch, confidence, beatPulse, dominantHue) {
  const orbRadius = radius * 0.22 * (1 + beatPulse * 0.15);
  
  // Outer glow
  const glowGradient = ctx.createRadialGradient(
    centerX, centerY, orbRadius * 0.5,
    centerX, centerY, orbRadius * 2
  );
  glowGradient.addColorStop(0, `hsla(${dominantHue}, 80%, 60%, ${0.3 + beatPulse * 0.3})`);
  glowGradient.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, orbRadius * 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Main orb with 3D gradient
  const orbGradient = ctx.createRadialGradient(
    centerX - orbRadius * 0.3, centerY - orbRadius * 0.3, 0,
    centerX, centerY, orbRadius
  );
  orbGradient.addColorStop(0, `hsla(${dominantHue}, 70%, 70%, 0.95)`);
  orbGradient.addColorStop(0.5, `hsla(${dominantHue}, 80%, 50%, 0.9)`);
  orbGradient.addColorStop(1, `hsla(${dominantHue}, 90%, 30%, 0.85)`);
  
  ctx.fillStyle = orbGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(
    centerX - orbRadius * 0.25, 
    centerY - orbRadius * 0.25, 
    orbRadius * 0.3, 
    orbRadius * 0.2, 
    -Math.PI / 4, 0, Math.PI * 2
  );
  ctx.fill();
  
  // Pitch text
  if (pitch > 0 && confidence > 0.3) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(pitch)}Hz`, centerX, centerY);
  }
}

/**
 * Update and draw particles - more random with pitch-based effects
 */
function updateAndDrawParticles(ctx, width, height, beatPulse, dominantHue, energyLevel, vizState, pitch) {
  // Check if particles are enabled
  if (!particleSettings.enabled) {
    vizState.particles = [];
    return;
  }
  
  // Reinitialize if count changed
  if (!vizState.particles || vizState.particles.length !== particleSettings.count) {
    vizState.particles = initParticles(width, height);
  }
  
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Normalize pitch for effects (0-1 range, where 1 = high pitch ~1000Hz+)
  const pitchNormalized = pitch ? Math.min(1, Math.max(0, (pitch - 100) / 900)) : 0;
  const highPitch = pitchNormalized > 0.5;
  
  for (let p of vizState.particles) {
    // Update oscillation for wavy movement
    p.oscillation += p.oscillationSpeed;
    
    // Random speed variations based on beat and energy
    const boost = (1 + energyLevel * 2 + beatPulse * 4) * particleSettings.speed;
    
    // Add oscillating movement for more randomness
    const oscillateX = Math.sin(p.oscillation) * 0.5;
    const oscillateY = Math.cos(p.oscillation * 1.3) * 0.5;
    
    p.x += (p.vx + oscillateX) * boost;
    p.y += (p.vy + oscillateY) * boost;
    
    // HIGH PITCH EFFECT: Particles spiral toward center and burst outward
    if (highPitch) {
      const dx = centerX - p.x;
      const dy = centerY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Spiral effect - perpendicular force + slight attraction
      const spiralStrength = pitchNormalized * 0.1;
      p.vx += (-dy / dist) * spiralStrength + (dx / dist) * spiralStrength * 0.3;
      p.vy += (dx / dist) * spiralStrength + (dy / dist) * spiralStrength * 0.3;
      
      // Speed boost on high pitch
      const speedMultiplier = 1 + pitchNormalized * 2;
      p.vx *= 1 + (speedMultiplier - 1) * 0.02;
      p.vy *= 1 + (speedMultiplier - 1) * 0.02;
      
      // Cap speed
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 8) {
        p.vx = (p.vx / speed) * 8;
        p.vy = (p.vy / speed) * 8;
      }
    } else {
      // Gradually return to base speed when pitch is low
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > p.baseSpeed * 1.5) {
        p.vx *= 0.98;
        p.vy *= 0.98;
      }
    }
    
    // Wrap around edges
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
    
    // Store position for trail
    if (highPitch) {
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 8) p.trail.shift();
    } else {
      if (p.trail.length > 0) p.trail.shift();
    }
    
    // Draw trail when high pitch
    if (p.trail.length > 1) {
      ctx.strokeStyle = `hsla(${(p.hue + dominantHue) % 360}, 80%, 60%, 0.3)`;
      ctx.lineWidth = p.size * 0.5;
      ctx.beginPath();
      ctx.moveTo(p.trail[0].x, p.trail[0].y);
      for (let i = 1; i < p.trail.length; i++) {
        ctx.lineTo(p.trail[i].x, p.trail[i].y);
      }
      ctx.stroke();
    }
    
    // Draw particle with energy-reactive size
    const size = p.size * (1 + beatPulse * 2 + energyLevel + pitchNormalized);
    const hue = (p.hue + dominantHue + pitchNormalized * 60) % 360;
    const lightness = 50 + pitchNormalized * 20;
    
    // Glow effect on high pitch
    if (highPitch) {
      ctx.shadowColor = `hsla(${hue}, 80%, 70%, 0.8)`;
      ctx.shadowBlur = 10 * pitchNormalized;
    }
    
    ctx.fillStyle = `hsla(${hue}, 70%, ${lightness}%, ${p.alpha * (0.5 + energyLevel * 0.5)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
  }
}

/**
 * Chroma-colored sound waves - style changes every 30 seconds
 */
function drawChromaSoundWaves(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const styleObj = WAVEFORM_STYLES[currentWaveformStyle];
  const style = styleObj?.id || 'layered';
  
  switch (style) {
    case 'oscilloscope':
      drawOscilloscopeWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'bars':
      drawBarWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'ribbon':
      drawRibbonWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'mirrored':
      drawMirroredWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'dotted':
      drawDottedWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'pixelated':
      drawPixelatedWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'mesh3d':
      drawMesh3DWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'gradient_bars':
      drawGradientBarsWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'sine_layers':
      drawSineLayersWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'circular_dots':
      drawCircularDotsWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'neon_lines':
      drawNeonLinesWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'helix_dna':
      drawHelixDNAWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'plasma_fire':
      drawPlasmaFireWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'matrix_rain':
      drawMatrixRainWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'aurora_borealis':
      drawAuroraBorealisWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'shockwave':
      drawShockwaveWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'kaleidoscope':
      drawKaleidoscopeWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'lightning':
      drawLightningWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'heartbeat':
      drawHeartbeatWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'fractal_tree':
      drawFractalTreeWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'liquid_mercury':
      drawLiquidMercuryWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'cosmic_nebula':
      drawCosmicNebulaWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'sound_tornado':
      drawSoundTornadoWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'geo_mandala':
      drawGeoMandalaWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'glitch_art':
      drawGlitchArtWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'terrain_3d':
      drawTerrain3DWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'fireworks':
      drawFireworksWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'ocean_waves':
      drawOceanWavesWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'galaxy_spiral':
      drawGalaxySpiralWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'neon_city':
      drawNeonCityWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'particle_explosion':
      drawParticleExplosionWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'pacman':
      drawPacmanWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'snake':
      drawSnakeWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'sacred_geometry':
      drawSacredGeometryWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'fractal_void':
      drawFractalVoidWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'layered':
    default:
      drawLayeredWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
  }
}

/**
 * =============================================================================
 * WAVEFORM DRAWING FUNCTIONS
 * =============================================================================
 * 
 * AUDIO ANALYSIS DATA (use these to control the visualization):
 * 
 * 1. CHROMA (12 values) - The 12 musical notes (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
 *    - Use for: Color selection (hue via CHROMA_HUES[idx]), note-specific effects
 *    - Higher values (0-1) = that note is more prominent in the audio
 * 
 * 2. MEL SPECTROGRAM (array) - Frequency distribution across mel-scale bands
 *    - Use for: Wave heights, bar amplitudes, energy/intensity effects
 *    - Raw values are dB (-10 to 0), normalize with: (mel[idx] + 10) / 10
 * 
 * 3. BEAT PULSE (0-1) - Derived from rhythm analysis, decays after each beat
 *    - Use for: Pulsing effects, size boosts, flash effects
 *    - Spikes to 1 on beat, then decays (~0.92 per frame)
 * 
 * 4. TIME (seconds) - Current playback position
 *    - Use for: Animation timing, phase offsets, cyclic effects (Math.sin(time * speed))
 * 
 * SETTINGS (user-adjustable via sliders when "Use Custom Settings" is enabled):
 * 
 * - basePosition (0-200%): Controls WHERE the visualization is positioned
 *   * Linear waveforms: Vertical position (0=top, 100=bottom)
 *   * Radial waveforms: Center vertical position
 *   * Scattered waveforms: Origin point
 * 
 * - maxAmplitude (10-100%): Controls SIZE of the visualization
 *   * Linear waveforms: Maximum wave height as % of screen
 *   * Radial waveforms: Radius as % of screen
 *   * Scattered waveforms: Spread/size of elements
 * 
 * HOW TO USE SETTINGS IN YOUR WAVEFORM:
 *   const settings = getEffectiveWaveformSettings('your_style_id');
 *   const baseY = height * (settings.basePosition / 100);
 *   const maxHeight = height * (settings.maxAmplitude / 100);
 *   // OR for radial:
 *   const centerY = height * (settings.basePosition / 100);
 *   const radius = Math.min(width, height) * (settings.maxAmplitude / 100);
 * 
 * Note: PITCH is used for the central orb and particle system but is not 
 * passed to waveform functions. Add it to the signature if needed.
 * =============================================================================
 */

/**
 * Original layered wave style
 */
function drawLayeredWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('layered');
  const baseY = height * (settings.basePosition / 100);
  const maxWaveHeight = height * (settings.maxAmplitude / 100);
  const numPoints = 60;
  
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const waveHeight = maxWaveHeight * (0.3 + chromaValue * 0.7);
    const phaseOffset = chromaIdx * 0.5;
    const speed = 1.5 + chromaIdx * 0.1;
    
    ctx.beginPath();
    
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * width;
      const t = i / numPoints;
      
      const wave1 = Math.sin(t * Math.PI * 4 + time * speed + phaseOffset) * 0.5;
      const wave2 = Math.sin(t * Math.PI * 6 + time * speed * 1.3 + phaseOffset) * 0.3;
      const wave3 = Math.sin(t * Math.PI * 2 + time * speed * 0.7 + phaseOffset) * 0.2;
      
      let melInfluence = 0.5;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor(t * mel.length);
        melInfluence = Math.max(0, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      const combinedWave = (wave1 + wave2 + wave3) * (0.5 + melInfluence * 0.5);
      const beatBoost = beatPulse * 0.3;
      const y = baseY - (waveHeight * (0.5 + combinedWave * 0.5)) * (1 + beatBoost);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = ((i - 1) / numPoints) * width;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(cpX, y, x, y);
      }
    }
    
    ctx.lineTo(width, baseY + 5);
    ctx.lineTo(0, baseY + 5);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, baseY - waveHeight, 0, baseY + 5);
    const alpha = 0.3 + chromaValue * 0.5 + beatPulse * 0.2;
    const lightness = 45 + chromaValue * 20;
    gradient.addColorStop(0, `hsla(${hue}, 85%, ${lightness + 15}%, ${alpha})`);
    gradient.addColorStop(0.5, `hsla(${hue}, 80%, ${lightness}%, ${alpha * 0.7})`);
    gradient.addColorStop(1, `hsla(${hue}, 75%, ${lightness - 10}%, 0.05)`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    if (chromaValue > 0.5) {
      ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.5)`;
      ctx.shadowBlur = 8 * chromaValue;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Oscilloscope-style wave - 12 chroma-colored lines
 */
function drawOscilloscopeWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('oscilloscope');
  const centerY = height * (settings.basePosition / 100);
  const maxAmplitude = height * (settings.maxAmplitude / 100);
  const numPoints = 100;
  
  // Sort chroma by intensity (draw quieter ones first)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const amplitude = maxAmplitude * (0.3 + chromaValue * 0.7) * (1 + beatPulse * 0.3);
    const phaseOffset = chromaIdx * 0.5;
    const speed = 1.5 + chromaIdx * 0.1;
    
    ctx.beginPath();
    ctx.lineWidth = 1.5 + chromaValue * 2;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * width;
      
      // Get mel for local amplitude variation
      let melInfluence = 0.5;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor(t * mel.length);
        melInfluence = Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      const wave1 = Math.sin(t * Math.PI * 4 + time * speed + phaseOffset);
      const wave2 = Math.sin(t * Math.PI * 7 + time * speed * 1.3 + phaseOffset) * 0.3;
      const y = centerY + (wave1 + wave2) * amplitude * melInfluence;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    const alpha = 0.4 + chromaValue * 0.5;
    ctx.strokeStyle = `hsla(${hue}, 85%, ${50 + chromaValue * 20}%, ${alpha})`;
    
    // Glow for prominent notes
    if (chromaValue > 0.4) {
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.7)`;
      ctx.shadowBlur = 12 * chromaValue;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Bar/spectrum analyzer style - chroma colored
 */
function drawBarWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('bars');
  const baseY = height * (settings.basePosition / 100);
  const maxBarHeight = height * (settings.maxAmplitude / 100);
  const numBars = mel && mel.length > 0 ? Math.min(mel.length, 48) : 48;
  const barWidth = width / numBars * 0.85;
  const gap = width / numBars * 0.15;
  
  for (let i = 0; i < numBars; i++) {
    const t = i / numBars;
    const x = i * (barWidth + gap) + gap / 2;
    
    // Get value from mel
    let value = 0.3;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(i * mel.length / numBars);
      value = Math.max(0.1, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    
    // Map to chroma for color - each bar gets color from corresponding pitch class
    const chromaIdx = Math.floor(t * 12);
    const chromaValue = chroma[chromaIdx] || 0.5;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Height influenced by both mel and chroma
    const barHeight = value * maxBarHeight * (0.5 + chromaValue * 0.5) * (1 + beatPulse * 0.5);
    
    // Gradient bar
    const gradient = ctx.createLinearGradient(x, baseY, x, baseY - barHeight);
    const lightness = 40 + chromaValue * 25;
    gradient.addColorStop(0, `hsla(${hue}, 80%, ${lightness}%, 0.9)`);
    gradient.addColorStop(0.5, `hsla(${hue}, 85%, ${lightness + 15}%, 0.85)`);
    gradient.addColorStop(1, `hsla(${hue}, 90%, ${lightness + 25}%, 0.8)`);
    
    ctx.fillStyle = gradient;
    
    // Rounded rect
    const radius = Math.min(barWidth / 2, 3);
    ctx.beginPath();
    ctx.roundRect(x, baseY - barHeight, barWidth, barHeight, [radius, radius, 0, 0]);
    ctx.fill();
    
    // Top highlight for loud notes
    if (chromaValue > 0.5) {
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.8)`;
      ctx.shadowBlur = 8 * chromaValue;
      ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${chromaValue})`;
      ctx.beginPath();
      ctx.roundRect(x, baseY - barHeight, barWidth, 3, [radius, radius, 0, 0]);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Flowing ribbon style - 12 chroma ribbons
 */
function drawRibbonWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('ribbon');
  const centerY = height * (settings.basePosition / 100);
  const ribbonHeight = height * (settings.maxAmplitude / 100) * 0.3;
  const numPoints = 60;
  
  // Sort and draw all 12 chroma ribbons
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const yOffset = (chromaIdx - 5.5) * 4; // Spread ribbons vertically
    const speed = 1.5 + chromaIdx * 0.08;
    const phase = chromaIdx * Math.PI / 6;
    const waveAmplitude = 15 + chromaValue * 25;
    
    const topPoints = [];
    const bottomPoints = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * width;
      
      // Get mel for local variation
      let melInfluence = 0.5;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor(t * mel.length);
        melInfluence = Math.max(0.3, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      const wave = Math.sin(t * Math.PI * 3 + time * speed + phase) * waveAmplitude * melInfluence * (1 + beatPulse * 0.3);
      const thickness = ribbonHeight * (0.5 + chromaValue * 0.5);
      
      topPoints.push({ x, y: centerY + yOffset + wave - thickness / 2 });
      bottomPoints.push({ x, y: centerY + yOffset + wave + thickness / 2 });
    }
    
    // Draw ribbon shape
    ctx.beginPath();
    ctx.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 1; i < topPoints.length; i++) {
      ctx.lineTo(topPoints[i].x, topPoints[i].y);
    }
    for (let i = bottomPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(bottomPoints[i].x, bottomPoints[i].y);
    }
    ctx.closePath();
    
    const alpha = 0.3 + chromaValue * 0.5;
    const lightness = 45 + chromaValue * 20;
    
    const gradient = ctx.createLinearGradient(0, centerY - 30, 0, centerY + 30);
    gradient.addColorStop(0, `hsla(${hue}, 80%, ${lightness + 10}%, ${alpha * 0.7})`);
    gradient.addColorStop(0.5, `hsla(${hue}, 85%, ${lightness}%, ${alpha})`);
    gradient.addColorStop(1, `hsla(${hue}, 80%, ${lightness - 10}%, ${alpha * 0.7})`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Edge glow for prominent notes
    if (chromaValue > 0.4) {
      ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${chromaValue * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Mirrored waveform - 12 chroma waves mirrored
 */
function drawMirroredWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('mirrored');
  const centerY = height * (settings.basePosition / 100);
  const maxAmplitude = height * (settings.maxAmplitude / 100);
  const numPoints = 80;
  
  // Sort chroma (draw quieter first)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const amplitude = maxAmplitude * (0.3 + chromaValue * 0.7) * (1 + beatPulse * 0.3);
    const phaseOffset = chromaIdx * 0.5;
    const speed = 1.5 + chromaIdx * 0.1;
    
    // Draw mirrored waveform
    for (let mirror = 0; mirror < 2; mirror++) {
      const direction = mirror === 0 ? -1 : 1;
      
      ctx.beginPath();
      
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const x = t * width;
        
        // Get mel for local amplitude
        let melInfluence = 0.5;
        if (mel && mel.length > 0) {
          const melIdx = Math.floor(t * mel.length);
          melInfluence = Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10));
        }
        
        const wave1 = Math.sin(t * Math.PI * 4 + time * speed + phaseOffset);
        const wave2 = Math.sin(t * Math.PI * 8 + time * speed * 1.5 + phaseOffset) * 0.3;
        const y = centerY + direction * (wave1 + wave2) * amplitude * melInfluence;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.lineTo(width, centerY);
      ctx.lineTo(0, centerY);
      ctx.closePath();
      
      const alpha = 0.25 + chromaValue * 0.4;
      const lightness = 45 + chromaValue * 20;
      
      const gradient = ctx.createLinearGradient(0, centerY - amplitude, 0, centerY + amplitude);
      gradient.addColorStop(0, `hsla(${hue}, 85%, ${lightness + 15}%, ${alpha})`);
      gradient.addColorStop(0.5, `hsla(${hue}, 80%, ${lightness}%, ${alpha * 0.6})`);
      gradient.addColorStop(1, `hsla(${hue}, 75%, ${lightness - 10}%, 0.05)`);
      
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }
  
  // Center line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Dotted/particle wave - 12 chroma dot waves
 */
function drawDottedWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('dotted');
  const centerY = height * (settings.basePosition / 100);
  const maxAmplitude = height * (settings.maxAmplitude / 100);
  const numDots = 50;
  
  // Sort chroma (draw quieter first)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const amplitude = maxAmplitude * (0.3 + chromaValue * 0.7) * (1 + beatPulse * 0.3);
    const phaseOffset = chromaIdx * 0.5;
    const speed = 1.5 + chromaIdx * 0.1;
    const yOffset = (chromaIdx - 5.5) * 2;
    
    for (let i = 0; i < numDots; i++) {
      const t = i / numDots;
      const x = t * width;
      
      // Get mel for local variation
      let melInfluence = 0.5;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor(t * mel.length);
        melInfluence = Math.max(0.3, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      const wave = Math.sin(t * Math.PI * 4 + time * speed + phaseOffset);
      const y = centerY + yOffset + wave * amplitude * melInfluence;
      
      // Dot size varies with chroma value
      const dotSize = 1.5 + chromaValue * 3 + beatPulse * 1.5;
      const alpha = 0.4 + chromaValue * 0.5;
      const lightness = 50 + chromaValue * 20;
      
      // Glow effect for prominent notes
      if (chromaValue > 0.4) {
        ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.8)`;
        ctx.shadowBlur = 6 * chromaValue;
      }
      
      ctx.fillStyle = `hsla(${hue}, 80%, ${lightness}%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Pixelated/blocky waveform - chroma colored blocks
 */
function drawPixelatedWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('pixelated');
  const baseY = height * (settings.basePosition / 100);
  const maxHeight = height * (settings.maxAmplitude / 100);
  const blockSize = 6;
  const numBlocks = Math.floor(width / blockSize);
  
  for (let i = 0; i < numBlocks; i++) {
    const t = i / numBlocks;
    const x = i * blockSize;
    
    // Map to chroma for color
    const chromaIdx = Math.floor(t * 12);
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel value for height
    let melValue = 0.3;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(t * mel.length);
      melValue = Math.max(0.1, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    
    // Height based on both mel and chroma
    const wave = Math.sin(t * Math.PI * 3 + time * 2) * 0.15;
    const combinedValue = (melValue * 0.6 + chromaValue * 0.4 + wave) * (1 + beatPulse * 0.3);
    const blockHeight = Math.floor(combinedValue * maxHeight / blockSize) * blockSize;
    const lightness = 40 + chromaValue * 30;
    
    // Draw stacked blocks
    const numStackedBlocks = Math.max(1, Math.floor(blockHeight / blockSize));
    for (let j = 0; j < numStackedBlocks; j++) {
      const by = baseY - (j + 1) * blockSize;
      const alpha = 0.5 + (j / numStackedBlocks) * 0.4;
      ctx.fillStyle = `hsla(${hue}, 85%, ${lightness + j * 2}%, ${alpha})`;
      ctx.fillRect(x + 1, by + 1, blockSize - 2, blockSize - 2);
    }
    
    // Top glow for loud notes
    if (chromaValue > 0.5 && numStackedBlocks > 2) {
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.8)`;
      ctx.shadowBlur = 6;
      ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${chromaValue})`;
      ctx.fillRect(x + 1, baseY - blockHeight + 1, blockSize - 2, blockSize - 2);
      ctx.shadowBlur = 0;
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * 3D Mesh/wireframe wave - 12 chroma colored lines with depth
 */
function drawMesh3DWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('mesh3d');
  const baseY = height * (settings.basePosition / 100);
  const maxHeight = height * (settings.maxAmplitude / 100);
  const numPoints = 50;
  const perspective = 0.6;
  
  // Sort chroma (draw quieter/back first)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (let lineIdx = 0; lineIdx < sortedIndices.length; lineIdx++) {
    const chromaIdx = sortedIndices[lineIdx];
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const lineProgress = lineIdx / 12;
    const yOffset = lineProgress * 25 * perspective;
    const scale = 0.5 + chromaValue * 0.5;
    const alpha = 0.4 + chromaValue * 0.5;
    const phaseOffset = chromaIdx * 0.5;
    const speed = 1.5 + chromaIdx * 0.1;
    
    ctx.beginPath();
    ctx.strokeStyle = `hsla(${hue}, 80%, ${50 + chromaValue * 20}%, ${alpha})`;
    ctx.lineWidth = 1 + chromaValue * 2;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * width;
      
      // Get mel value for local height
      let melValue = 0.3;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor(t * mel.length);
        melValue = Math.max(0.1, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      const wave = Math.sin(t * Math.PI * 4 + time * speed + phaseOffset);
      const y = baseY - yOffset - (melValue * maxHeight * scale * (0.5 + wave * 0.5)) * (1 + beatPulse * 0.3);
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    // Glow for prominent notes
    if (chromaValue > 0.4) {
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.6)`;
      ctx.shadowBlur = 8 * chromaValue;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Gradient bars with intense glow - chroma colored
 */
function drawGradientBarsWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('gradient_bars');
  const baseY = height * (settings.basePosition / 100);
  const maxHeight = height * (settings.maxAmplitude / 100);
  const numBars = 60;
  const barWidth = width / numBars;
  
  for (let i = 0; i < numBars; i++) {
    const t = i / numBars;
    const x = i * barWidth;
    
    // Map to chroma
    const chromaIdx = Math.floor(t * 12);
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel value
    let melValue = 0.3;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(t * mel.length);
      melValue = Math.max(0.1, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    
    // Height based on both
    const barHeight = melValue * maxHeight * (0.5 + chromaValue * 0.5) * (1 + beatPulse * 0.4);
    const lightness = 35 + chromaValue * 25;
    
    // Create gradient for each bar
    const gradient = ctx.createLinearGradient(x, baseY, x, baseY - barHeight);
    gradient.addColorStop(0, `hsla(${hue}, 90%, ${lightness}%, 0.9)`);
    gradient.addColorStop(0.5, `hsla(${hue}, 85%, ${lightness + 20}%, 0.85)`);
    gradient.addColorStop(1, `hsla(${hue}, 80%, ${lightness + 35}%, 0.8)`);
    
    // Glow effect based on chroma intensity
    if (chromaValue > 0.3) {
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${chromaValue})`;
      ctx.shadowBlur = 8 + chromaValue * 10;
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, baseY - barHeight, barWidth - 1, barHeight);
    ctx.shadowBlur = 0;
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Sine wave layers - 12 chroma colored sine waves
 */
function drawSineLayersWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('sine_layers');
  const centerY = height * (settings.basePosition / 100);
  const maxAmplitude = height * (settings.maxAmplitude / 100);
  const numPoints = 80;
  
  // Sort chroma (draw quieter first)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const frequency = 2 + chromaIdx * 0.3;
    const speed = 1.5 + chromaIdx * 0.1;
    const phaseOffset = chromaIdx * 0.5;
    const amplitude = maxAmplitude * (0.3 + chromaValue * 0.7) * (1 + beatPulse * 0.3);
    
    ctx.beginPath();
    ctx.lineWidth = 1.5 + chromaValue * 2;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * width;
      
      // Get mel for local variation
      let melInfluence = 0.5;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor(t * mel.length);
        melInfluence = Math.max(0.3, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      // Multiple sine components
      const y = centerY + 
        Math.sin(t * Math.PI * frequency + time * speed + phaseOffset) * amplitude * melInfluence +
        Math.sin(t * Math.PI * frequency * 2 + time * speed * 1.5 + phaseOffset) * amplitude * 0.3 * melInfluence;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    const alpha = 0.4 + chromaValue * 0.5;
    ctx.strokeStyle = `hsla(${hue}, 85%, ${50 + chromaValue * 20}%, ${alpha})`;
    
    // Glow for prominent notes
    if (chromaValue > 0.4) {
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.6)`;
      ctx.shadowBlur = 10 * chromaValue;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Dots arranged in wave pattern - 12 chroma colored dot rows
 */
function drawCircularDotsWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('circular_dots');
  const centerY = height * (settings.basePosition / 100);
  const maxAmplitude = height * (settings.maxAmplitude / 100);
  const numDots = 40;
  
  // Sort chroma (draw quieter first)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const yOffset = (chromaIdx - 5.5) * 3;
    const speed = 1.5 + chromaIdx * 0.1;
    const phaseOffset = chromaIdx * 0.5;
    
    for (let i = 0; i < numDots; i++) {
      const t = i / numDots;
      const x = t * width;
      
      // Get mel for local variation
      let melInfluence = 0.5;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor(t * mel.length);
        melInfluence = Math.max(0.3, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      // Wave with phase offset
      const wave = Math.sin(t * Math.PI * 4 + time * speed + phaseOffset);
      const y = centerY + yOffset + wave * chromaValue * maxAmplitude * melInfluence * (1 + beatPulse * 0.3);
      
      // Size varies with chroma and mel
      const size = 1.5 + chromaValue * 3 + melInfluence * 1.5;
      const alpha = 0.4 + chromaValue * 0.5;
      const lightness = 50 + chromaValue * 20;
      
      // Gradient fill for 3D effect
      const dotGradient = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size);
      dotGradient.addColorStop(0, `hsla(${hue}, 80%, ${lightness + 15}%, ${alpha})`);
      dotGradient.addColorStop(1, `hsla(${hue}, 85%, ${lightness - 10}%, ${alpha * 0.7})`);
      
      ctx.fillStyle = dotGradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Neon lines - 12 chroma colored neon waves
 */
function drawNeonLinesWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('neon_lines');
  const centerY = height * (settings.basePosition / 100);
  const maxAmplitude = height * (settings.maxAmplitude / 100);
  const numPoints = 60;
  
  // Sort chroma (draw quieter first)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const yOffset = (chromaIdx - 5.5) * 4;
    const speed = 1.5 + chromaIdx * 0.1;
    const phaseOffset = chromaIdx * 0.5;
    const amplitude = maxAmplitude * (0.3 + chromaValue * 0.7) * (1 + beatPulse * 0.3);
    
    // Draw outer glow first, then inner line
    for (let glow = 2; glow >= 0; glow--) {
      ctx.beginPath();
      ctx.lineWidth = glow === 0 ? (1.5 + chromaValue * 2) : (4 - glow);
      
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const x = t * width;
        
        // Get mel for local variation
        let melInfluence = 0.5;
        if (mel && mel.length > 0) {
          const melIdx = Math.floor(t * mel.length);
          melInfluence = Math.max(0.3, Math.min(1, (mel[melIdx] + 10) / 10));
        }
        
        const wave1 = Math.sin(t * Math.PI * 3 + time * speed + phaseOffset);
        const wave2 = Math.sin(t * Math.PI * 6 + time * speed * 1.3 + phaseOffset) * 0.3;
        const y = centerY + yOffset + (wave1 + wave2) * amplitude * melInfluence;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      const alpha = glow === 0 ? (0.5 + chromaValue * 0.4) : (0.2 - glow * 0.05);
      const lightness = glow === 0 ? (55 + chromaValue * 15) : 50;
      ctx.strokeStyle = `hsla(${hue}, 100%, ${lightness}%, ${alpha})`;
      ctx.stroke();
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * DNA Helix - Double helix with chroma-colored strands that twist and pulse
 */
function drawHelixDNAWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('helix_dna');
  const centerY = height * (settings.basePosition / 200);
  const maxAmplitude = height * (settings.maxAmplitude / 100) * 0.6;
  const numPoints = 80;
  const rotationSpeed = 2;
  const twistFrequency = 3;
  
  // Calculate total chroma energy for glow intensity
  const totalEnergy = chroma.reduce((a, b) => a + b, 0) / 12;
  
  // Draw connecting rungs first (behind strands)
  for (let i = 0; i < numPoints; i++) {
    const t = i / numPoints;
    const x = t * width;
    const phase = t * Math.PI * twistFrequency * 2 + time * rotationSpeed;
    
    // Get mel for local variation
    let melInfluence = 0.5;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(t * mel.length);
      melInfluence = Math.max(0.3, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    
    const amplitude = maxAmplitude * (0.7 + melInfluence * 0.3) * (1 + beatPulse * 0.3);
    const y1 = centerY + Math.sin(phase) * amplitude;
    const y2 = centerY + Math.sin(phase + Math.PI) * amplitude;
    
    // Draw rung between strands at intervals
    if (i % 4 === 0) {
      const chromaIdx = Math.floor(t * 12);
      const chromaValue = chroma[chromaIdx] || 0.3;
      const hue = CHROMA_HUES[chromaIdx];
      const alpha = 0.3 + chromaValue * 0.4;
      
      ctx.strokeStyle = `hsla(${hue}, 70%, 50%, ${alpha})`;
      ctx.lineWidth = 2 + chromaValue * 2;
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
    }
  }
  
  // Draw two DNA strands
  for (let strand = 0; strand < 2; strand++) {
    const strandPhase = strand * Math.PI;
    
    // Sort and draw 12 chroma layers for each strand
    const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
    
    for (const chromaIdx of sortedIndices) {
      const chromaValue = chroma[chromaIdx] || 0;
      if (chromaValue < 0.1) continue;
      
      const hue = CHROMA_HUES[chromaIdx];
      const layerOffset = (chromaIdx / 12) * 0.3;
      
      ctx.beginPath();
      ctx.lineWidth = 2 + chromaValue * 3;
      
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const x = t * width;
        const phase = t * Math.PI * twistFrequency * 2 + time * rotationSpeed + strandPhase + layerOffset;
        
        let melInfluence = 0.5;
        if (mel && mel.length > 0) {
          const melIdx = Math.floor(t * mel.length);
          melInfluence = Math.max(0.3, Math.min(1, (mel[melIdx] + 10) / 10));
        }
        
        const amplitude = maxAmplitude * (0.5 + chromaValue * 0.5) * (0.7 + melInfluence * 0.3) * (1 + beatPulse * 0.3);
        const y = centerY + Math.sin(phase) * amplitude;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      const alpha = 0.4 + chromaValue * 0.5;
      ctx.strokeStyle = `hsla(${hue}, 85%, ${50 + chromaValue * 20}%, ${alpha})`;
      
      if (chromaValue > 0.4) {
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.7)`;
        ctx.shadowBlur = 10 * chromaValue;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Plasma Fire - Rising flames with chroma colors and heat distortion
 */
function drawPlasmaFireWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('plasma_fire');
  const baseY = height * (settings.basePosition / 100);
  const maxFlameHeight = height * (settings.maxAmplitude / 100);
  const numFlames = 50;
  
  // Draw flames from back to front
  for (let layer = 3; layer >= 0; layer--) {
    const layerScale = 0.6 + layer * 0.15;
    const layerSpeed = 3 + layer * 0.5;
    const layerOffset = layer * 0.3;
    
    for (let i = 0; i < numFlames; i++) {
      const t = i / numFlames;
      const x = t * width;
      
      // Map to chroma for color
      const chromaIdx = Math.floor(t * 12);
      const chromaValue = chroma[chromaIdx] || 0.3;
      
      // Flame colors: shift from chroma color toward orange/yellow at tips
      const baseHue = CHROMA_HUES[chromaIdx];
      
      // Get mel for flame height
      let melValue = 0.4;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor(t * mel.length);
        melValue = Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      // Flickering noise
      const noise1 = Math.sin(t * 15 + time * layerSpeed + layerOffset) * 0.3;
      const noise2 = Math.sin(t * 23 + time * layerSpeed * 1.7 + layerOffset) * 0.2;
      const noise3 = Math.sin(t * 7 + time * layerSpeed * 0.5 + layerOffset) * 0.2;
      const flicker = 0.5 + noise1 + noise2 + noise3;
      
      const flameHeight = melValue * maxFlameHeight * layerScale * flicker * (0.5 + chromaValue * 0.5) * (1 + beatPulse * 0.5);
      const flameWidth = (width / numFlames) * 1.5 * (1 + beatPulse * 0.2);
      
      // Draw flame gradient
      const gradient = ctx.createLinearGradient(x, baseY, x, baseY - flameHeight);
      const tipHue = (baseHue + 30) % 360; // Shift toward yellow/orange at tip
      
      gradient.addColorStop(0, `hsla(${baseHue}, 90%, 30%, ${0.5 + chromaValue * 0.4})`);
      gradient.addColorStop(0.3, `hsla(${baseHue}, 85%, 50%, ${0.6 + chromaValue * 0.3})`);
      gradient.addColorStop(0.6, `hsla(${tipHue}, 100%, 60%, ${0.4 + chromaValue * 0.3})`);
      gradient.addColorStop(1, `hsla(${tipHue + 20}, 100%, 70%, 0)`);
      
      // Flame shape using bezier curves
      ctx.beginPath();
      ctx.moveTo(x - flameWidth / 2, baseY);
      ctx.quadraticCurveTo(
        x - flameWidth / 4 + Math.sin(time * 5 + t * 10) * 5,
        baseY - flameHeight * 0.6,
        x + Math.sin(time * 3 + t * 8) * 8,
        baseY - flameHeight
      );
      ctx.quadraticCurveTo(
        x + flameWidth / 4 + Math.sin(time * 4 + t * 12) * 5,
        baseY - flameHeight * 0.6,
        x + flameWidth / 2,
        baseY
      );
      ctx.closePath();
      
      ctx.fillStyle = gradient;
      
      if (chromaValue > 0.3 && layer === 0) {
        ctx.shadowColor = `hsla(${baseHue}, 100%, 60%, 0.6)`;
        ctx.shadowBlur = 15 * chromaValue;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Matrix Rain - Falling digital rain with chroma colors
 */
function drawMatrixRainWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('matrix_rain');
  const baseY = height * (settings.basePosition / 100);
  const dropHeight = height * (settings.maxAmplitude / 100);
  const numColumns = 60;
  const columnWidth = width / numColumns;
  
  // Characters for matrix effect
  const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  
  for (let col = 0; col < numColumns; col++) {
    const t = col / numColumns;
    const x = col * columnWidth + columnWidth / 2;
    
    // Map to chroma for color
    const chromaIdx = Math.floor(t * 12);
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel for drop speed and intensity
    let melValue = 0.4;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(t * mel.length);
      melValue = Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    
    // Unique phase for each column
    const columnPhase = col * 0.7;
    const dropSpeed = 2 + melValue * 3 + beatPulse * 2;
    const dropPos = ((time * dropSpeed + columnPhase) % 2) / 2; // 0 to 1 cycling
    
    // Number of characters in the drop
    const numChars = Math.floor(5 + chromaValue * 8 + melValue * 5);
    
    for (let char = 0; char < numChars; char++) {
      const charProgress = char / numChars;
      const y = baseY - dropHeight + (dropPos + charProgress * 0.3) * dropHeight * 1.3;
      
      // Wrap around
      const wrappedY = ((y - (baseY - dropHeight)) % dropHeight) + (baseY - dropHeight);
      
      // Skip if outside visible area
      if (wrappedY < baseY - dropHeight || wrappedY > baseY + 20) continue;
      
      // Fade based on position in drop (head is bright, tail fades)
      const alpha = (1 - charProgress) * (0.4 + chromaValue * 0.5) * (0.7 + melValue * 0.3);
      const lightness = 50 + (1 - charProgress) * 30;
      
      // Random character (changes occasionally)
      const charIndex = Math.floor((time * 0.5 + col * 0.3 + char * 0.2) * 10) % matrixChars.length;
      const displayChar = matrixChars[charIndex];
      
      ctx.fillStyle = `hsla(${hue}, 90%, ${lightness}%, ${alpha})`;
      ctx.font = `bold ${10 + chromaValue * 4}px monospace`;
      ctx.textAlign = 'center';
      
      // Glow for head of drop
      if (char === 0 && chromaValue > 0.3) {
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.9)`;
        ctx.shadowBlur = 10;
      }
      
      ctx.fillText(displayChar, x, wrappedY);
      ctx.shadowBlur = 0;
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Aurora Borealis - Flowing curtains of light with chroma colors
 */
function drawAuroraBorealisWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('aurora_borealis');
  const baseY = height * (settings.basePosition / 100);
  const maxHeight = height * (settings.maxAmplitude / 100);
  const numCurtains = 8;
  
  // Sort chroma to draw dimmer curtains first
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (let curtainIdx = 0; curtainIdx < numCurtains; curtainIdx++) {
    const chromaIdx = sortedIndices[Math.floor(curtainIdx / numCurtains * 12)];
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    const curtainPhase = curtainIdx * 0.8;
    const curtainSpeed = 0.5 + curtainIdx * 0.1;
    const curtainX = (curtainIdx / numCurtains) * width * 0.8 + width * 0.1;
    const curtainWidth = width / numCurtains * 2;
    
    // Curtain wave parameters
    const numPoints = 40;
    const points = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      
      // Get mel for local ripple
      let melInfluence = 0.5;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor((curtainIdx / numCurtains * 0.5 + t * 0.5) * mel.length);
        melInfluence = Math.max(0.3, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      // Multiple wave layers for organic flow
      const wave1 = Math.sin(t * Math.PI * 3 + time * curtainSpeed + curtainPhase) * 30;
      const wave2 = Math.sin(t * Math.PI * 5 + time * curtainSpeed * 1.5 + curtainPhase) * 15;
      const wave3 = Math.sin(t * Math.PI * 8 + time * curtainSpeed * 2 + curtainPhase) * 8;
      
      const xOffset = (wave1 + wave2 + wave3) * melInfluence * (1 + beatPulse * 0.3);
      const curtainHeight = maxHeight * (0.5 + chromaValue * 0.5) * t; // Taller at bottom
      
      points.push({
        x: curtainX + xOffset,
        yTop: baseY - maxHeight + t * curtainHeight * 0.3,
        yBottom: baseY - maxHeight + curtainHeight
      });
    }
    
    // Draw curtain with gradient
    ctx.beginPath();
    ctx.moveTo(points[0].x - curtainWidth / 2, points[0].yTop);
    
    // Top edge
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x - curtainWidth / 2 * (1 - i / points.length), points[i].yTop);
    }
    
    // Bottom edge (reversed)
    for (let i = points.length - 1; i >= 0; i--) {
      ctx.lineTo(points[i].x + curtainWidth / 2 * (1 - i / points.length), points[i].yBottom);
    }
    
    ctx.closePath();
    
    // Vertical gradient for aurora effect
    const gradient = ctx.createLinearGradient(0, baseY - maxHeight, 0, baseY);
    const alpha = 0.15 + chromaValue * 0.25;
    gradient.addColorStop(0, `hsla(${hue}, 90%, 70%, 0)`);
    gradient.addColorStop(0.2, `hsla(${hue}, 85%, 60%, ${alpha * 0.5})`);
    gradient.addColorStop(0.5, `hsla(${hue}, 80%, 50%, ${alpha})`);
    gradient.addColorStop(0.8, `hsla(${(hue + 30) % 360}, 85%, 45%, ${alpha * 0.7})`);
    gradient.addColorStop(1, `hsla(${(hue + 60) % 360}, 90%, 40%, ${alpha * 0.3})`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Edge glow
    if (chromaValue > 0.3) {
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${chromaValue * 0.3})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.5)`;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Shockwave Rings - Expanding circular ripples from beat impacts
 */
function drawShockwaveWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('shockwave');
  const centerY = height * (settings.basePosition / 100);
  const maxRadius = height * (settings.maxAmplitude / 100) * 1.5;
  const centerX = width / 2;
  
  // Number of active rings based on beat
  const numRings = 12;
  const ringSpacing = 1.5; // Time between ring spawns
  
  // Draw rings from oldest (largest) to newest (smallest)
  for (let ring = numRings - 1; ring >= 0; ring--) {
    const ringTime = (time + ring * ringSpacing / numRings) % ringSpacing;
    const ringProgress = ringTime / ringSpacing; // 0 to 1
    
    // Map ring to chroma
    const chromaIdx = ring % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel for ring distortion
    let melInfluence = 0.5;
    if (mel && mel.length > 0) {
      const melIdx = ring % mel.length;
      melInfluence = Math.max(0.3, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    
    // Ring expands and fades
    const radius = ringProgress * maxRadius * (0.5 + chromaValue * 0.5) * (1 + beatPulse * 0.3);
    const alpha = (1 - ringProgress) * (0.3 + chromaValue * 0.5) * melInfluence;
    
    if (alpha < 0.05 || radius < 5) continue;
    
    // Draw distorted ring (wave on the circle)
    ctx.beginPath();
    const numPoints = 60;
    
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      
      // Distortion waves
      const distortion1 = Math.sin(angle * 6 + time * 3 + ring) * 8 * melInfluence;
      const distortion2 = Math.sin(angle * 10 + time * 5 + ring * 0.5) * 4 * chromaValue;
      
      const r = radius + distortion1 + distortion2;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r * 0.4; // Squash for perspective
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    
    // Ring style
    const lightness = 50 + chromaValue * 25;
    ctx.strokeStyle = `hsla(${hue}, 85%, ${lightness}%, ${alpha})`;
    ctx.lineWidth = 2 + (1 - ringProgress) * 3 + chromaValue * 2;
    
    // Glow for prominent rings
    if (chromaValue > 0.3 && ringProgress < 0.5) {
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${alpha})`;
      ctx.shadowBlur = 12 * chromaValue;
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Inner glow fill for newest rings
    if (ringProgress < 0.3) {
      const fillAlpha = (0.3 - ringProgress) * chromaValue * 0.3;
      ctx.fillStyle = `hsla(${hue}, 80%, 50%, ${fillAlpha})`;
      ctx.fill();
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Kaleidoscope - Mirrored geometric patterns that rotate with beat
 * Uses chroma for segment colors and mel for pattern complexity
 */
function drawKaleidoscopeWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('kaleidoscope');
  const centerX = width / 2;
  // basePosition controls vertical center (0-100 = top to bottom)
  const centerY = height * (settings.basePosition / 100);
  // maxAmplitude controls the radius/size of the kaleidoscope
  const maxRadius = Math.min(width, height) * (settings.maxAmplitude / 100);
  const numSegments = 12; // One for each chroma
  const segmentAngle = (Math.PI * 2) / numSegments;
  
  // Rotation speed affected by beat
  const rotation = time * 0.3 + beatPulse * 0.5;
  
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  
  // Draw each kaleidoscope segment
  for (let seg = 0; seg < numSegments; seg++) {
    const chromaIdx = seg % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    ctx.save();
    ctx.rotate(seg * segmentAngle);
    
    // Create segment clip path
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(maxRadius, 0);
    ctx.arc(0, 0, maxRadius, 0, segmentAngle);
    ctx.closePath();
    ctx.clip();
    
    // Draw patterns inside segment based on mel
    const numShapes = Math.floor(3 + chromaValue * 5);
    
    for (let shape = 0; shape < numShapes; shape++) {
      const melIdx = shape % (mel?.length || 1);
      const melValue = mel ? Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10)) : 0.5;
      
      const shapeRadius = (shape + 1) / numShapes * maxRadius * 0.9;
      const shapeSize = 10 + melValue * 25 * (1 + beatPulse * 0.5);
      const shapeAngle = time * (0.5 + shape * 0.1) + shape * 0.5;
      
      const x = Math.cos(shapeAngle) * shapeRadius * 0.3 + shapeRadius * 0.5;
      const y = Math.sin(shapeAngle) * shapeRadius * 0.2;
      
      // Alternate between shapes
      const alpha = 0.3 + chromaValue * 0.5 + melValue * 0.2;
      const lightness = 45 + chromaValue * 25;
      
      ctx.fillStyle = `hsla(${(hue + shape * 15) % 360}, 85%, ${lightness}%, ${alpha})`;
      
      if (shape % 3 === 0) {
        // Diamond
        ctx.beginPath();
        ctx.moveTo(x, y - shapeSize);
        ctx.lineTo(x + shapeSize * 0.7, y);
        ctx.lineTo(x, y + shapeSize);
        ctx.lineTo(x - shapeSize * 0.7, y);
        ctx.closePath();
        ctx.fill();
      } else if (shape % 3 === 1) {
        // Circle
        ctx.beginPath();
        ctx.arc(x, y, shapeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Triangle
        ctx.beginPath();
        ctx.moveTo(x, y - shapeSize);
        ctx.lineTo(x + shapeSize * 0.8, y + shapeSize * 0.6);
        ctx.lineTo(x - shapeSize * 0.8, y + shapeSize * 0.6);
        ctx.closePath();
        ctx.fill();
      }
      
      // Glow for high chroma
      if (chromaValue > 0.5) {
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.6)`;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    
    ctx.restore();
  }
  
  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Lightning Storm - Electric bolts that branch based on mel energy
 * Chroma controls bolt colors, mel controls branching intensity
 */
function drawLightningWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('lightning');
  // basePosition controls where bolts originate (top)
  const baseY = height * (settings.basePosition / 100);
  // maxAmplitude controls how far bolts travel
  const targetY = baseY + height * (settings.maxAmplitude / 100);
  
  // Number of main bolts based on total energy
  const totalEnergy = chroma.reduce((a, b) => a + b, 0) / 12;
  const numBolts = Math.floor(3 + totalEnergy * 4 + beatPulse * 3);
  
  // Draw lightning bolts
  for (let bolt = 0; bolt < numBolts; bolt++) {
    const chromaIdx = bolt % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Bolt starting position varies with time
    const boltPhase = bolt * 1.7 + time * 0.5;
    const startX = (Math.sin(boltPhase) * 0.4 + 0.5) * width;
    
    // Get mel energy for this bolt's branching
    const melIdx = bolt % (mel?.length || 1);
    const melValue = mel ? Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10)) : 0.5;
    
    // Draw the bolt recursively
    drawBolt(ctx, startX, baseY, startX + (Math.random() - 0.5) * 100, targetY, 
             hue, chromaValue, melValue, beatPulse, 0, 4);
  }
  
  // Helper function to draw branching bolt
  function drawBolt(ctx, x1, y1, x2, y2, hue, chromaValue, melValue, beatPulse, depth, maxDepth) {
    if (depth >= maxDepth) return;
    
    const segments = 5 + Math.floor(melValue * 5);
    const points = [{ x: x1, y: y1 }];
    
    // Generate jagged path
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const baseX = x1 + (x2 - x1) * t;
      const baseY = y1 + (y2 - y1) * t;
      
      // Add randomness (more at middle, less at ends)
      const jitter = Math.sin(t * Math.PI) * 40 * melValue;
      const offsetX = (Math.random() - 0.5) * jitter * 2;
      
      points.push({ x: baseX + offsetX, y: baseY });
    }
    
    // Draw main bolt
    const alpha = 0.6 + chromaValue * 0.4 - depth * 0.15;
    const lineWidth = (3 - depth * 0.5) * (1 + beatPulse * 0.5);
    
    // Outer glow
    ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${alpha * 0.3})`;
    ctx.lineWidth = lineWidth * 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    
    // Core bolt
    ctx.strokeStyle = `hsla(${hue}, 90%, ${60 + chromaValue * 20}%, ${alpha})`;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = `hsla(${hue}, 100%, 80%, 0.8)`;
    ctx.shadowBlur = 15 * chromaValue;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Bright core
    ctx.strokeStyle = `hsla(${hue}, 50%, 95%, ${alpha * 0.8})`;
    ctx.lineWidth = lineWidth * 0.3;
    ctx.stroke();
    
    // Branch at random points (more branches with higher mel)
    if (depth < maxDepth - 1 && melValue > 0.3) {
      const branchChance = 0.3 + melValue * 0.3;
      for (let i = 1; i < points.length - 1; i++) {
        if (Math.random() < branchChance) {
          const branchDir = Math.random() > 0.5 ? 1 : -1;
          const branchLen = 30 + melValue * 50;
          const branchX = points[i].x + branchDir * branchLen;
          const branchY = points[i].y + branchLen * 0.7;
          drawBolt(ctx, points[i].x, points[i].y, branchX, branchY,
                   (hue + 30) % 360, chromaValue * 0.7, melValue * 0.6, beatPulse, depth + 1, maxDepth);
        }
      }
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Heartbeat ECG - Medical monitor style with beat-reactive spikes
 * Uses chroma for line colors and mel frequencies for ECG complexity
 */
function drawHeartbeatWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('heartbeat');
  // basePosition controls vertical center of the ECG lines
  const centerY = height * (settings.basePosition / 100);
  // maxAmplitude controls the height of the ECG spikes
  const maxAmplitude = height * (settings.maxAmplitude / 100);
  const scrollSpeed = 100; // pixels per second
  
  // Sort chroma for layering
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const yOffset = (chromaIdx - 5.5) * 3;
    const phaseOffset = chromaIdx * 0.3;
    
    ctx.beginPath();
    ctx.lineWidth = 1.5 + chromaValue * 2;
    
    const numPoints = 150;
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * width;
      
      // Scrolling position in the ECG cycle
      const scrollPos = (time * scrollSpeed / width + t + phaseOffset) % 1;
      
      // Get mel for this position
      let melValue = 0.3;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor(t * mel.length);
        melValue = Math.max(0.1, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      // ECG waveform shape - QRS complex
      let ecgValue = 0;
      const cyclePos = (scrollPos * 4) % 1; // 4 beats per screen width
      
      if (cyclePos < 0.1) {
        // P wave (small bump)
        ecgValue = Math.sin(cyclePos / 0.1 * Math.PI) * 0.15;
      } else if (cyclePos < 0.15) {
        // Flat
        ecgValue = 0;
      } else if (cyclePos < 0.18) {
        // Q dip
        ecgValue = -0.1 * ((cyclePos - 0.15) / 0.03);
      } else if (cyclePos < 0.22) {
        // R spike (main peak)
        const rPos = (cyclePos - 0.18) / 0.04;
        ecgValue = rPos < 0.5 ? rPos * 2 : (1 - rPos) * 2;
        ecgValue *= 1 + beatPulse * 0.5; // React to actual beats
      } else if (cyclePos < 0.26) {
        // S dip
        ecgValue = -0.2 * (1 - (cyclePos - 0.22) / 0.04);
      } else if (cyclePos < 0.45) {
        // T wave (recovery bump)
        const tPos = (cyclePos - 0.26) / 0.19;
        ecgValue = Math.sin(tPos * Math.PI) * 0.25;
      }
      
      // Scale by chroma and mel
      const amplitude = maxAmplitude * (0.3 + chromaValue * 0.7) * (0.5 + melValue * 0.5);
      const y = centerY + yOffset - ecgValue * amplitude;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    const alpha = 0.5 + chromaValue * 0.4;
    ctx.strokeStyle = `hsla(${hue}, 90%, ${50 + chromaValue * 20}%, ${alpha})`;
    
    // Glow effect
    if (chromaValue > 0.3) {
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.6)`;
      ctx.shadowBlur = 8 * chromaValue;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  // Grid lines for medical monitor effect
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, height * 0.2);
    ctx.lineTo(x, height * 0.95);
    ctx.stroke();
  }
  for (let y = height * 0.2; y < height * 0.95; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Fractal Tree - Recursive branching trees that grow with mel energy
 * Each chroma value creates a tree that grows/shrinks with its intensity
 */
function drawFractalTreeWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('fractal_tree');
  // basePosition controls where the ground/tree base is
  const groundY = height * (settings.basePosition / 100);
  // maxAmplitude controls tree height
  const maxTreeHeight = height * (settings.maxAmplitude / 100);
  const numTrees = 6;
  const treeSpacing = width / (numTrees + 1);
  
  for (let tree = 0; tree < numTrees; tree++) {
    const chromaIdx = (tree * 2) % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    const treeX = (tree + 1) * treeSpacing;
    const treeHeight = maxTreeHeight * (0.4 + chromaValue * 0.6) * (1 + beatPulse * 0.2);
    
    // Get mel for branching angle variation
    const melIdx = tree % (mel?.length || 1);
    const melValue = mel ? Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10)) : 0.5;
    
    // Draw tree recursively
    drawBranch(ctx, treeX, groundY, -Math.PI / 2, treeHeight, hue, chromaValue, melValue, beatPulse, time, 0, 7);
  }
  
  function drawBranch(ctx, x, y, angle, length, hue, chromaValue, melValue, beatPulse, time, depth, maxDepth) {
    if (depth >= maxDepth || length < 3) return;
    
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;
    
    // Branch thickness decreases with depth
    const thickness = (maxDepth - depth) * 0.8 + chromaValue * 2;
    
    // Color shifts toward leaves at tips
    const depthHue = (hue + depth * 10) % 360;
    const lightness = 30 + depth * 5 + chromaValue * 15;
    const alpha = 0.6 + chromaValue * 0.4 - depth * 0.05;
    
    ctx.strokeStyle = `hsla(${depthHue}, 70%, ${lightness}%, ${alpha})`;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Glow for prominent branches
    if (depth < 3 && chromaValue > 0.4) {
      ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.4)`;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Calculate branch angles with sway
    const sway = Math.sin(time * 2 + depth * 0.5 + x * 0.01) * 0.1 * melValue;
    const spreadAngle = 0.4 + melValue * 0.3 + beatPulse * 0.1;
    const lengthRatio = 0.65 + chromaValue * 0.1;
    
    // Left branch
    drawBranch(ctx, endX, endY, angle - spreadAngle + sway, length * lengthRatio,
               hue, chromaValue * 0.9, melValue, beatPulse, time, depth + 1, maxDepth);
    
    // Right branch
    drawBranch(ctx, endX, endY, angle + spreadAngle + sway, length * lengthRatio,
               hue, chromaValue * 0.9, melValue, beatPulse, time, depth + 1, maxDepth);
    
    // Center branch for high energy
    if (melValue > 0.6 && depth < maxDepth - 2) {
      drawBranch(ctx, endX, endY, angle + sway * 2, length * lengthRatio * 0.8,
                 (hue + 30) % 360, chromaValue * 0.7, melValue, beatPulse, time, depth + 1, maxDepth);
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Liquid Mercury - Metallic blobs that merge and separate with mel
 * Creates organic, flowing metallic shapes
 */
function drawLiquidMercuryWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('liquid_mercury');
  // basePosition controls vertical center of the blob field
  const centerY = height * (settings.basePosition / 100);
  // maxAmplitude controls blob size and spread
  const sizeMultiplier = settings.maxAmplitude / 50; // normalize to 1.0 at 50%
  const numBlobs = 20;
  
  // Calculate blob positions based on mel and time
  const blobs = [];
  for (let i = 0; i < numBlobs; i++) {
    const t = i / numBlobs;
    const chromaIdx = i % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    
    // Get mel value for this blob
    const melIdx = Math.floor(t * (mel?.length || 1));
    const melValue = mel ? Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10)) : 0.5;
    
    // Base position
    const baseX = t * width;
    const baseY = centerY;
    
    // Organic movement
    const moveX = Math.sin(time * 1.5 + i * 0.7) * 30 * melValue;
    const moveY = Math.cos(time * 1.2 + i * 0.5) * 40 * melValue + 
                  Math.sin(time * 2 + i) * 20 * chromaValue;
    
    // Size based on mel and chroma, scaled by settings
    const size = (15 + melValue * 35 + chromaValue * 25 + beatPulse * 15) * sizeMultiplier;
    
    blobs.push({
      x: baseX + moveX,
      y: baseY + moveY,
      size,
      chromaIdx,
      chromaValue,
      melValue
    });
  }
  
  // Draw metaball-style merged blobs
  // We'll approximate by drawing overlapping gradients
  for (let layer = 0; layer < 3; layer++) {
    const layerScale = 1 - layer * 0.2;
    
    for (const blob of blobs) {
      const hue = CHROMA_HUES[blob.chromaIdx];
      const size = blob.size * layerScale;
      
      // Create metallic gradient
      const gradient = ctx.createRadialGradient(
        blob.x - size * 0.3, blob.y - size * 0.3, 0,
        blob.x, blob.y, size
      );
      
      // Metallic silver-ish color influenced by chroma
      const baseLight = 70 + layer * 10;
      const saturation = 20 + blob.chromaValue * 40;
      
      gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${baseLight + 20}%, ${0.4 - layer * 0.1})`);
      gradient.addColorStop(0.4, `hsla(${hue}, ${saturation}%, ${baseLight}%, ${0.5 - layer * 0.1})`);
      gradient.addColorStop(0.8, `hsla(${hue}, ${saturation + 20}%, ${baseLight - 20}%, ${0.4 - layer * 0.1})`);
      gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${baseLight - 30}%, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      // Organic blob shape using bezier curves
      const numPoints = 8;
      for (let p = 0; p <= numPoints; p++) {
        const angle = (p / numPoints) * Math.PI * 2;
        const wobble = Math.sin(angle * 3 + time * 3 + blob.x * 0.1) * size * 0.2 * blob.melValue;
        const r = size + wobble;
        const px = blob.x + Math.cos(angle) * r;
        const py = blob.y + Math.sin(angle) * r * 0.6; // Squash vertically
        
        if (p === 0) {
          ctx.moveTo(px, py);
        } else {
          const prevAngle = ((p - 1) / numPoints) * Math.PI * 2;
          const prevWobble = Math.sin(prevAngle * 3 + time * 3 + blob.x * 0.1) * size * 0.2 * blob.melValue;
          const prevR = size + prevWobble;
          
          const cpAngle = (angle + prevAngle) / 2;
          const cpR = (r + prevR) / 2 * 1.1;
          const cpX = blob.x + Math.cos(cpAngle) * cpR;
          const cpY = blob.y + Math.sin(cpAngle) * cpR * 0.6;
          
          ctx.quadraticCurveTo(cpX, cpY, px, py);
        }
      }
      ctx.closePath();
      ctx.fill();
      
      // Add specular highlight
      if (layer === 0 && blob.chromaValue > 0.3) {
        const highlightGrad = ctx.createRadialGradient(
          blob.x - size * 0.4, blob.y - size * 0.4, 0,
          blob.x - size * 0.2, blob.y - size * 0.2, size * 0.4
        );
        highlightGrad.addColorStop(0, `rgba(255, 255, 255, ${0.4 * blob.chromaValue})`);
        highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGrad;
        ctx.beginPath();
        ctx.ellipse(blob.x - size * 0.3, blob.y - size * 0.25, size * 0.25, size * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Cosmic Nebula 🌠 - Swirling cosmic clouds with stars that pulse to the beat
 * Features gas clouds, twinkling stars, and gravitational distortion
 */
function drawCosmicNebulaWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('cosmic_nebula');
  const centerX = width / 2;
  // basePosition controls vertical center of the nebula
  const centerY = height * (settings.basePosition / 100);
  // maxAmplitude controls the size/spread of the nebula
  const sizeMultiplier = settings.maxAmplitude / 45; // normalize to 1.0 at default 45%
  
  // Draw swirling nebula clouds
  const numClouds = 8;
  for (let cloud = 0; cloud < numClouds; cloud++) {
    const chromaIdx = cloud % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel for cloud density
    const melIdx = Math.floor((cloud / numClouds) * (mel?.length || 1));
    const melValue = mel ? Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10)) : 0.5;
    
    // Spiral rotation - scaled by sizeMultiplier
    const spiralAngle = (cloud / numClouds) * Math.PI * 2 + time * 0.3;
    const spiralRadius = (100 + melValue * 150 + beatPulse * 50) * sizeMultiplier;
    
    const cloudX = centerX + Math.cos(spiralAngle) * spiralRadius;
    const cloudY = centerY + Math.sin(spiralAngle) * spiralRadius * 0.5;
    const cloudSize = (80 + chromaValue * 120 + melValue * 60) * sizeMultiplier;
    
    // Multi-layered cloud gradient
    for (let layer = 2; layer >= 0; layer--) {
      const layerSize = cloudSize * (1 + layer * 0.4);
      const gradient = ctx.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, layerSize);
      
      const alpha = (0.15 - layer * 0.04) * chromaValue;
      gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, ${alpha * 1.5})`);
      gradient.addColorStop(0.3, `hsla(${hue}, 70%, 50%, ${alpha})`);
      gradient.addColorStop(0.6, `hsla(${(hue + 30) % 360}, 60%, 40%, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      // Irregular cloud shape with bezier curves
      const numPoints = 12;
      for (let p = 0; p <= numPoints; p++) {
        const angle = (p / numPoints) * Math.PI * 2;
        const wobble = Math.sin(angle * 3 + time * 2 + cloud) * layerSize * 0.3 * melValue;
        const distort = Math.cos(angle * 5 + time * 1.5) * layerSize * 0.2;
        const r = layerSize + wobble + distort;
        const px = cloudX + Math.cos(angle) * r;
        const py = cloudY + Math.sin(angle) * r * 0.6;
        
        if (p === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  
  // Draw twinkling stars
  const numStars = 60;
  for (let i = 0; i < numStars; i++) {
    // Use deterministic random based on index
    const seed = i * 12345.67;
    const starX = ((Math.sin(seed) + 1) / 2) * width;
    const starY = ((Math.cos(seed * 1.1) + 1) / 2) * height * 0.9;
    
    const chromaIdx = i % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Twinkle effect based on time and beat
    const twinkle = Math.sin(time * 3 + i * 0.5) * 0.5 + 0.5;
    const beatTwinkle = chromaValue > 0.5 ? beatPulse : 0;
    const brightness = twinkle * chromaValue + beatTwinkle;
    const size = 1 + brightness * 3;
    
    if (brightness > 0.2) {
      // Star glow
      const gradient = ctx.createRadialGradient(starX, starY, 0, starX, starY, size * 4);
      gradient.addColorStop(0, `hsla(${hue}, 60%, 90%, ${brightness * 0.8})`);
      gradient.addColorStop(0.3, `hsla(${hue}, 70%, 70%, ${brightness * 0.4})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(starX, starY, size * 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Star core
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(starX, starY, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Cross flare for bright stars
      if (brightness > 0.6) {
        ctx.strokeStyle = `hsla(${hue}, 50%, 90%, ${brightness * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(starX - size * 3, starY);
        ctx.lineTo(starX + size * 3, starY);
        ctx.moveTo(starX, starY - size * 3);
        ctx.lineTo(starX, starY + size * 3);
        ctx.stroke();
      }
    }
  }
  
  // Gravitational lens effect in center
  const lensGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60 + beatPulse * 30);
  lensGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
  lensGradient.addColorStop(0.5, 'rgba(100, 50, 150, 0.1)');
  lensGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = lensGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 60 + beatPulse * 30, 0, Math.PI * 2);
  ctx.fill();
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Sound Tornado 🌪️ - A spiraling vortex with particles swirling upward
 * Particles spiral based on mel frequencies, tornado width pulses with beat
 */
function drawSoundTornadoWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('sound_tornado');
  const centerX = width / 2;
  // basePosition controls where the tornado base is
  const baseY = height * (settings.basePosition / 100);
  // maxAmplitude controls tornado height (how far up it reaches)
  const tornadoHeight = height * (settings.maxAmplitude / 100);
  const topY = baseY - tornadoHeight;
  
  // Tornado parameters
  const baseWidth = 150 + beatPulse * 50;
  const topWidth = 20 + beatPulse * 10;
  
  // Calculate average mel for overall intensity
  const avgMel = mel ? mel.reduce((a, b) => a + b, 0) / mel.length : 0;
  const intensity = Math.max(0.3, (avgMel + 10) / 10);
  
  // Draw tornado layers (back to front)
  for (let layer = 2; layer >= 0; layer--) {
    const layerOffset = layer * 15;
    
    // Draw spiral bands
    const numBands = 20;
    for (let band = 0; band < numBands; band++) {
      const t = band / numBands;
      const y = baseY - t * tornadoHeight;
      
      // Width narrows toward top
      const widthAtY = baseWidth * (1 - t * 0.85) + topWidth * t * 0.85;
      
      const chromaIdx = band % 12;
      const chromaValue = chroma[chromaIdx] || 0.3;
      const hue = CHROMA_HUES[chromaIdx];
      
      // Spiral rotation
      const spiralAngle = t * Math.PI * 6 + time * 3 * (1 + t);
      const spiralOffset = Math.sin(spiralAngle) * widthAtY * 0.3;
      
      // Band height based on mel
      const melIdx = Math.floor(t * (mel?.length || 1));
      const melValue = mel ? Math.max(0.1, (mel[melIdx] + 10) / 10) : 0.3;
      const bandHeight = 8 + melValue * 15;
      
      const x1 = centerX + spiralOffset - widthAtY / 2 + layerOffset;
      const x2 = centerX + spiralOffset + widthAtY / 2 + layerOffset;
      
      // Gradient for depth
      const gradient = ctx.createLinearGradient(x1, y, x2, y);
      const alpha = (0.3 + chromaValue * 0.4) * (1 - layer * 0.2);
      const lightness = 50 + chromaValue * 20 - layer * 10;
      
      gradient.addColorStop(0, `hsla(${hue}, 70%, ${lightness - 10}%, ${alpha * 0.3})`);
      gradient.addColorStop(0.3, `hsla(${hue}, 80%, ${lightness}%, ${alpha})`);
      gradient.addColorStop(0.7, `hsla(${hue}, 80%, ${lightness}%, ${alpha})`);
      gradient.addColorStop(1, `hsla(${hue}, 70%, ${lightness - 10}%, ${alpha * 0.3})`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(centerX + spiralOffset + layerOffset, y, widthAtY / 2, bandHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Draw debris particles spiraling around
  const numDebris = 40;
  for (let i = 0; i < numDebris; i++) {
    const chromaIdx = i % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Particle height cycles
    const cycleSpeed = 0.3 + (i % 5) * 0.1;
    const heightT = ((time * cycleSpeed + i * 0.2) % 1);
    const y = baseY - heightT * tornadoHeight;
    
    // Width at this height
    const widthAtY = baseWidth * (1 - heightT * 0.85) + topWidth * heightT * 0.85;
    
    // Spiral around
    const spiralAngle = heightT * Math.PI * 8 + i * 0.5 + time * 2;
    const radius = widthAtY * 0.6 + Math.sin(time * 3 + i) * 20;
    
    const x = centerX + Math.cos(spiralAngle) * radius;
    const particleY = y + Math.sin(spiralAngle * 2) * 10;
    
    const size = 2 + chromaValue * 4 + beatPulse * 2;
    const alpha = 0.4 + chromaValue * 0.5;
    
    // Particle glow
    const gradient = ctx.createRadialGradient(x, particleY, 0, x, particleY, size * 3);
    gradient.addColorStop(0, `hsla(${hue}, 90%, 70%, ${alpha})`);
    gradient.addColorStop(0.5, `hsla(${hue}, 80%, 50%, ${alpha * 0.5})`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, particleY, size * 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Motion trail
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha * 0.4})`;
    ctx.lineWidth = size * 0.5;
    ctx.beginPath();
    for (let trail = 0; trail < 5; trail++) {
      const trailT = heightT - trail * 0.02;
      if (trailT < 0) continue;
      const trailY = baseY - trailT * tornadoHeight;
      const trailWidth = baseWidth * (1 - trailT * 0.85) + topWidth * trailT * 0.85;
      const trailAngle = trailT * Math.PI * 8 + i * 0.5 + time * 2;
      const trailRadius = trailWidth * 0.6;
      const trailX = centerX + Math.cos(trailAngle) * trailRadius;
      if (trail === 0) ctx.moveTo(trailX, trailY);
      else ctx.lineTo(trailX, trailY);
    }
    ctx.stroke();
  }
  
  // Ground dust cloud
  const dustGradient = ctx.createRadialGradient(centerX, baseY, 0, centerX, baseY, baseWidth * 1.5);
  dustGradient.addColorStop(0, `rgba(100, 80, 60, ${0.4 * intensity})`);
  dustGradient.addColorStop(0.5, `rgba(80, 60, 40, ${0.2 * intensity})`);
  dustGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = dustGradient;
  ctx.beginPath();
  ctx.ellipse(centerX, baseY, baseWidth * 1.5, 40 + beatPulse * 20, 0, 0, Math.PI * 2);
  ctx.fill();
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Geometric Mandala 🔮 - Sacred geometry that rotates with music
 * Each chroma note adds geometric elements that scale and rotate
 */
function drawGeoMandalaWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('geo_mandala');
  const centerX = width / 2;
  // basePosition controls vertical center of the mandala
  const centerY = height * (settings.basePosition / 100);
  // maxAmplitude controls the radius of the mandala
  const maxRadius = Math.min(width, height) * (settings.maxAmplitude / 100);
  
  ctx.save();
  ctx.translate(centerX, centerY);
  
  // Calculate overall rotation based on cumulative chroma
  const totalChroma = chroma.reduce((a, b) => a + b, 0);
  const baseRotation = time * 0.2 + totalChroma * 0.1;
  
  // Draw layers from back to front
  const numLayers = 6;
  for (let layer = numLayers - 1; layer >= 0; layer--) {
    const layerT = layer / numLayers;
    const layerRadius = maxRadius * (0.3 + layerT * 0.7) * (1 + beatPulse * 0.15);
    
    const chromaIdx = layer * 2 % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel for this layer
    const melIdx = Math.floor(layerT * (mel?.length || 1));
    const melValue = mel ? Math.max(0.3, (mel[melIdx] + 10) / 10) : 0.5;
    
    // Rotation speed varies by layer
    const rotation = baseRotation * (1 + layer * 0.3) * (layer % 2 === 0 ? 1 : -1);
    
    ctx.save();
    ctx.rotate(rotation);
    
    // Different geometric shapes per layer
    const shapeType = layer % 3;
    const numSides = 3 + layer; // Triangle, square, pentagon, hexagon, etc.
    const numRepeats = 6 + layer * 2;
    
    for (let repeat = 0; repeat < numRepeats; repeat++) {
      const repeatAngle = (repeat / numRepeats) * Math.PI * 2;
      ctx.save();
      ctx.rotate(repeatAngle);
      
      const alpha = (0.3 + chromaValue * 0.4) * melValue;
      const lightness = 50 + chromaValue * 25;
      
      if (shapeType === 0) {
        // Petals
        const petalLength = layerRadius * 0.4 * melValue;
        const petalWidth = petalLength * 0.3;
        
        ctx.beginPath();
        ctx.moveTo(layerRadius - petalLength, 0);
        ctx.quadraticCurveTo(layerRadius - petalLength / 2, -petalWidth, layerRadius, 0);
        ctx.quadraticCurveTo(layerRadius - petalLength / 2, petalWidth, layerRadius - petalLength, 0);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(layerRadius - petalLength, 0, layerRadius, 0);
        gradient.addColorStop(0, `hsla(${hue}, 70%, ${lightness}%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${hue}, 80%, ${lightness + 10}%, ${alpha})`);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = `hsla(${hue}, 90%, ${lightness + 20}%, ${alpha * 0.8})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
      } else if (shapeType === 1) {
        // Polygons
        const polyRadius = layerRadius * 0.15 * melValue;
        const polyX = layerRadius * 0.7;
        
        ctx.beginPath();
        for (let side = 0; side <= numSides; side++) {
          const sideAngle = (side / numSides) * Math.PI * 2 + time * 0.5;
          const px = polyX + Math.cos(sideAngle) * polyRadius;
          const py = Math.sin(sideAngle) * polyRadius;
          if (side === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        
        ctx.fillStyle = `hsla(${hue}, 75%, ${lightness}%, ${alpha * 0.6})`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${hue}, 85%, ${lightness + 15}%, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
      } else {
        // Lines radiating outward
        const innerR = layerRadius * 0.4;
        const outerR = layerRadius * 0.9;
        
        ctx.beginPath();
        ctx.moveTo(innerR, 0);
        ctx.lineTo(outerR, 0);
        
        ctx.strokeStyle = `hsla(${hue}, 80%, ${lightness}%, ${alpha * 0.8})`;
        ctx.lineWidth = 2 * melValue;
        ctx.stroke();
        
        // Diamond at end
        const diamondSize = 5 * melValue;
        ctx.save();
        ctx.translate(outerR, 0);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = `hsla(${hue}, 85%, ${lightness + 10}%, ${alpha})`;
        ctx.fillRect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
        ctx.restore();
      }
      
      ctx.restore();
    }
    
    // Center ring for this layer
    ctx.strokeStyle = `hsla(${hue}, 70%, ${50 + chromaValue * 20}%, ${0.2 + chromaValue * 0.3})`;
    ctx.lineWidth = 1 + chromaValue * 2;
    ctx.beginPath();
    ctx.arc(0, 0, layerRadius * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }
  
  // Central focal point
  const centerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 50 + beatPulse * 20);
  centerGlow.addColorStop(0, `rgba(255, 255, 255, ${0.6 + beatPulse * 0.3})`);
  centerGlow.addColorStop(0.3, `hsla(${CHROMA_HUES[Math.floor(time * 2) % 12]}, 80%, 70%, 0.4)`);
  centerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = centerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 50 + beatPulse * 20, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Glitch Art 📺 - Digital glitch effects with RGB splitting and scan lines
 * Intensity based on beat, colors shift with chroma
 */
function drawGlitchArtWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('glitch_art');
  // basePosition controls vertical center of glitch effect concentration
  const centerY = height * (settings.basePosition / 100);
  // maxAmplitude controls the spread/intensity of glitch slices
  const spreadMultiplier = settings.maxAmplitude / 50; // normalize to 1.0 at 50%
  
  // Find dominant chroma for base color
  let dominantIdx = 0;
  let maxChroma = 0;
  for (let i = 0; i < 12; i++) {
    if (chroma[i] > maxChroma) {
      maxChroma = chroma[i];
      dominantIdx = i;
    }
  }
  const dominantHue = CHROMA_HUES[dominantIdx];
  
  // Calculate glitch intensity based on beat and mel
  const avgMel = mel ? mel.reduce((a, b) => a + b, 0) / mel.length : 0;
  const glitchIntensity = Math.max(0.1, (avgMel + 10) / 10) + beatPulse * 0.5;
  
  // Horizontal glitch slices
  const numSlices = 15 + Math.floor(glitchIntensity * 10);
  for (let i = 0; i < numSlices; i++) {
    // Pseudo-random based on time and index
    const seed = Math.sin(i * 12345.67 + Math.floor(time * 5) * 0.1);
    const seed2 = Math.cos(i * 67890.12 + Math.floor(time * 7) * 0.15);
    
    const sliceY = ((seed + 1) / 2) * height;
    const sliceHeight = 3 + Math.abs(seed2) * 30 * glitchIntensity;
    
    const chromaIdx = i % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // RGB shift offset
    const rgbShift = (10 + glitchIntensity * 30) * Math.sin(time * 10 + i);
    
    // Only draw if chroma is active or random trigger
    if (chromaValue > 0.2 || Math.abs(seed) > 0.7) {
      // Red channel (shifted left)
      ctx.fillStyle = `hsla(0, 100%, 50%, ${0.15 * chromaValue * glitchIntensity})`;
      ctx.fillRect(rgbShift, sliceY, width * 0.4, sliceHeight);
      
      // Green channel (center)
      ctx.fillStyle = `hsla(120, 100%, 50%, ${0.12 * chromaValue * glitchIntensity})`;
      ctx.fillRect(width * 0.3, sliceY, width * 0.4, sliceHeight);
      
      // Blue channel (shifted right)
      ctx.fillStyle = `hsla(240, 100%, 50%, ${0.15 * chromaValue * glitchIntensity})`;
      ctx.fillRect(width * 0.6 - rgbShift, sliceY, width * 0.4, sliceHeight);
      
      // Main color slice
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.3 * chromaValue})`;
      ctx.fillRect(0, sliceY, width, sliceHeight * 0.5);
    }
  }
  
  // Scan lines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 2);
  }
  
  // Static noise blocks
  const numBlocks = 20 + Math.floor(glitchIntensity * 30);
  for (let i = 0; i < numBlocks; i++) {
    const seed = Math.sin(i * 9876.54 + time * 20);
    const seed2 = Math.cos(i * 5432.1 + time * 15);
    
    if (Math.abs(seed) > 0.6) {
      const blockX = ((seed + 1) / 2) * width;
      const blockY = ((seed2 + 1) / 2) * height;
      const blockW = 5 + Math.abs(seed) * 40 * glitchIntensity;
      const blockH = 3 + Math.abs(seed2) * 20 * glitchIntensity;
      
      const chromaIdx = i % 12;
      const hue = CHROMA_HUES[chromaIdx];
      const chromaValue = chroma[chromaIdx] || 0.3;
      
      ctx.fillStyle = `hsla(${hue}, ${60 + chromaValue * 40}%, ${50 + chromaValue * 30}%, ${0.4 + chromaValue * 0.4})`;
      ctx.fillRect(blockX, blockY, blockW, blockH);
    }
  }
  
  // Vertical glitch bars (chromatic aberration style)
  const numBars = 5 + Math.floor(beatPulse * 10);
  for (let i = 0; i < numBars; i++) {
    const seed = Math.sin(i * 3333.33 + Math.floor(time * 8));
    if (Math.abs(seed) > 0.7) {
      const barX = ((seed + 1) / 2) * width;
      const barWidth = 2 + Math.abs(seed) * 10 * glitchIntensity;
      
      const chromaIdx = i % 12;
      const hue = CHROMA_HUES[chromaIdx];
      
      ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${0.3 * glitchIntensity})`;
      ctx.fillRect(barX, 0, barWidth, height);
    }
  }
  
  // CRT monitor corner vignette
  const vignetteGradient = ctx.createRadialGradient(width/2, height/2, Math.min(width, height) * 0.3, width/2, height/2, Math.max(width, height) * 0.7);
  vignetteGradient.addColorStop(0, 'transparent');
  vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Occasional "data corruption" text
  if (beatPulse > 0.5) {
    ctx.font = '10px monospace';
    ctx.fillStyle = `hsla(${dominantHue}, 80%, 70%, ${beatPulse * 0.8})`;
    const errorTexts = ['ERR', '0x00', '####', 'NULL', '???', 'SYNC'];
    for (let i = 0; i < 5; i++) {
      const seed = Math.sin(i * 1111.11 + Math.floor(time * 12));
      const x = ((seed + 1) / 2) * width;
      const y = ((Math.cos(i * 2222.22 + time) + 1) / 2) * height;
      ctx.fillText(errorTexts[i % errorTexts.length], x, y);
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Soundwave Terrain 🏔️ - 3D perspective terrain that rises with mel frequencies
 * Like viewing sound as a mountain landscape from above
 */
function drawTerrain3DWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('terrain_3d');
  // basePosition controls where the ground/terrain sits
  const groundY = height * (settings.basePosition / 100);
  // maxAmplitude controls the height of the terrain peaks
  const terrainHeight = height * (settings.maxAmplitude / 100);
  const horizonY = groundY - terrainHeight;
  const numRows = 25;
  const numCols = 30;
  
  // Find dominant chroma for sun color
  let dominantIdx = 0;
  let maxChromaVal = 0;
  for (let i = 0; i < 12; i++) {
    if ((chroma[i] || 0) > maxChromaVal) {
      maxChromaVal = chroma[i];
      dominantIdx = i;
    }
  }
  const dominantHue = CHROMA_HUES[dominantIdx];
  
  // Draw background sky gradient first
  const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY + 50);
  skyGradient.addColorStop(0, `hsla(${dominantHue}, 40%, 15%, 0.6)`);
  skyGradient.addColorStop(0.7, `hsla(${dominantHue}, 60%, 30%, 0.4)`);
  skyGradient.addColorStop(1, `hsla(${dominantHue}, 70%, 50%, 0.3)`);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, horizonY + 50);
  
  // Sun/moon at horizon
  const sunX = width / 2;
  const sunY = horizonY;
  const sunRadius = 40 + beatPulse * 15;
  
  const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2.5);
  sunGradient.addColorStop(0, `hsla(${dominantHue}, 50%, 95%, 0.9)`);
  sunGradient.addColorStop(0.2, `hsla(${dominantHue}, 60%, 80%, 0.7)`);
  sunGradient.addColorStop(0.5, `hsla(${dominantHue}, 70%, 60%, 0.3)`);
  sunGradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = sunGradient;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Store terrain points for rendering
  const points = [];
  
  for (let row = 0; row < numRows; row++) {
    const rowPoints = [];
    const rowT = row / (numRows - 1);
    const y = horizonY + (groundY - horizonY) * rowT;
    
    // Perspective scaling - closer rows are wider
    const perspectiveScale = 0.2 + rowT * 0.8;
    const rowWidth = width * perspectiveScale;
    const startX = (width - rowWidth) / 2;
    
    for (let col = 0; col < numCols; col++) {
      const colT = col / (numCols - 1);
      const x = startX + colT * rowWidth;
      
      // Get mel value for terrain height
      const melIdx = mel ? Math.floor(colT * mel.length) : 0;
      const melValue = mel && mel[melIdx] !== undefined ? Math.max(0, (mel[melIdx] + 10) / 10) : 0.3;
      
      // Get chroma for coloring
      const chromaIdx = Math.floor(colT * 11.99);
      const chromaValue = chroma[chromaIdx] || 0.3;
      
      // Wave effect moving through terrain
      const waveOffset = Math.sin(colT * Math.PI * 3 + time * 1.5 - rowT * 4) * 0.25;
      const beatWave = Math.sin(colT * Math.PI * 2 + time * 3) * beatPulse * 0.2;
      
      // Height calculation - scale down for far rows
      const heightMultiplier = 60 * perspectiveScale;
      const terrainHeight = Math.max(0, (melValue + waveOffset + beatWave)) * heightMultiplier;
      const finalY = y - terrainHeight;
      
      rowPoints.push({
        x,
        y: finalY,
        baseY: y,
        melValue,
        chromaIdx,
        chromaValue,
        perspectiveScale
      });
    }
    points.push(rowPoints);
  }
  
  // Draw terrain from back to front (far rows first)
  for (let row = 0; row < numRows - 1; row++) {
    const rowT = row / numRows;
    
    for (let col = 0; col < numCols - 1; col++) {
      const p1 = points[row][col];
      const p2 = points[row][col + 1];
      const p3 = points[row + 1][col + 1];
      const p4 = points[row + 1][col];
      
      // Average values for this quad
      const avgMel = (p1.melValue + p2.melValue + p3.melValue + p4.melValue) / 4;
      const avgChromaValue = (p1.chromaValue + p2.chromaValue + p3.chromaValue + p4.chromaValue) / 4;
      const hue = CHROMA_HUES[p1.chromaIdx] || 0;
      
      // Calculate brightness based on height
      const avgHeight = (p1.y + p2.y + p3.y + p4.y) / 4;
      const normalizedHeight = 1 - (avgHeight - horizonY) / (groundY - horizonY);
      
      // Color based on height and chroma
      const lightness = 25 + avgMel * 35 + normalizedHeight * 20;
      const saturation = 60 + avgChromaValue * 30;
      const alpha = 0.6 + avgChromaValue * 0.3 + rowT * 0.1;
      
      // Fill quad
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      
      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.fill();
      
      // Grid lines for wireframe effect on active notes
      if (avgChromaValue > 0.4) {
        ctx.strokeStyle = `hsla(${hue}, ${saturation + 20}%, ${lightness + 25}%, ${alpha * 0.6})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }
  
  // Reflection bars under sun
  for (let i = 0; i < 6; i++) {
    const reflectY = horizonY + 10 + i * 6;
    const reflectAlpha = 0.4 - i * 0.06;
    const reflectWidth = 60 - i * 8;
    ctx.fillStyle = `hsla(${dominantHue}, 60%, 80%, ${reflectAlpha})`;
    ctx.fillRect(sunX - reflectWidth / 2, reflectY, reflectWidth, 2);
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Fireworks Show 🎆 - Exploding fireworks with sparkling trails
 * Each chroma note triggers a firework with that color
 */
function drawFireworksWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('fireworks');
  // basePosition controls where fireworks launch from (ground level)
  const launchY = height * (settings.basePosition / 100);
  // maxAmplitude controls how high fireworks can explode
  const explosionHeight = height * (settings.maxAmplitude / 100);
  
  // Generate fireworks based on chroma peaks
  const numFireworks = 8;
  
  for (let fw = 0; fw < numFireworks; fw++) {
    const chromaIdx = fw % 12;
    const chromaValue = chroma[chromaIdx] || 0;
    
    if (chromaValue < 0.2) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    
    // Firework position - use deterministic "random" based on index
    const seed1 = Math.sin(fw * 1234.5 + Math.floor(time * 0.5) * 100);
    const seed2 = Math.cos(fw * 5678.9 + Math.floor(time * 0.5) * 100);
    const centerX = width * 0.15 + ((seed1 + 1) / 2) * width * 0.7;
    // Position fireworks between launch point and explosion height
    const centerY = launchY - ((seed2 + 1) / 2) * explosionHeight;
    
    // Explosion phase (cycles every 2 seconds offset by firework index)
    const explosionCycle = ((time + fw * 0.4) % 2) / 2;
    const explosionRadius = explosionCycle * 120 * chromaValue + beatPulse * 30;
    const fadeOut = 1 - explosionCycle;
    
    // Get mel for spark count
    const melIdx = Math.floor((fw / numFireworks) * (mel?.length || 1));
    const melValue = mel ? Math.max(0.3, (mel[melIdx] + 10) / 10) : 0.5;
    
    // Draw explosion sparks
    const numSparks = Math.floor(20 + melValue * 30);
    for (let spark = 0; spark < numSparks; spark++) {
      const sparkAngle = (spark / numSparks) * Math.PI * 2;
      const sparkSpeed = 0.5 + Math.sin(spark * 123.456) * 0.5;
      const sparkRadius = explosionRadius * sparkSpeed;
      
      // Gravity effect - sparks fall as they travel
      const gravityOffset = explosionCycle * explosionCycle * 40;
      
      const sparkX = centerX + Math.cos(sparkAngle) * sparkRadius;
      const sparkY = centerY + Math.sin(sparkAngle) * sparkRadius + gravityOffset;
      
      // Spark trail
      const trailLength = 5;
      for (let t = 0; t < trailLength; t++) {
        const trailT = 1 - t / trailLength;
        const trailRadius = sparkRadius * (1 - t * 0.15);
        const trailGravity = (explosionCycle - t * 0.02) * (explosionCycle - t * 0.02) * 40;
        const trailX = centerX + Math.cos(sparkAngle) * trailRadius;
        const trailY = centerY + Math.sin(sparkAngle) * trailRadius + trailGravity;
        
        const trailAlpha = fadeOut * chromaValue * trailT * 0.6;
        const trailSize = (3 - t * 0.4) * chromaValue;
        
        ctx.fillStyle = `hsla(${hue}, 90%, ${60 + t * 8}%, ${trailAlpha})`;
        ctx.beginPath();
        ctx.arc(trailX, trailY, Math.max(0.5, trailSize), 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Spark head with glow
      const sparkAlpha = fadeOut * chromaValue * 0.9;
      const sparkSize = 2 + chromaValue * 3;
      
      // Glow
      const glowGradient = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, sparkSize * 4);
      glowGradient.addColorStop(0, `hsla(${hue}, 100%, 80%, ${sparkAlpha * 0.8})`);
      glowGradient.addColorStop(0.5, `hsla(${hue}, 90%, 60%, ${sparkAlpha * 0.3})`);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize * 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Core
      ctx.fillStyle = `hsla(${hue}, 50%, 95%, ${sparkAlpha})`;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Central flash at explosion start
    if (explosionCycle < 0.2) {
      const flashAlpha = (0.2 - explosionCycle) * 5 * chromaValue;
      const flashGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
      flashGradient.addColorStop(0, `hsla(${hue}, 50%, 100%, ${flashAlpha})`);
      flashGradient.addColorStop(0.3, `hsla(${hue}, 80%, 70%, ${flashAlpha * 0.5})`);
      flashGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Ambient sparkles in background
  const numSparkles = 30;
  for (let i = 0; i < numSparkles; i++) {
    const sparkleX = ((Math.sin(i * 999.99) + 1) / 2) * width;
    const sparkleY = ((Math.cos(i * 888.88) + 1) / 2) * height * 0.7;
    const twinkle = Math.sin(time * 5 + i * 2) * 0.5 + 0.5;
    const chromaIdx = i % 12;
    const chromaValue = chroma[chromaIdx] || 0.2;
    
    if (twinkle > 0.7 && chromaValue > 0.3) {
      const hue = CHROMA_HUES[chromaIdx];
      ctx.fillStyle = `hsla(${hue}, 70%, 80%, ${twinkle * chromaValue * 0.6})`;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Ocean Waves 🌊 - Rolling ocean waves with foam and spray
 * Wave height and intensity based on mel, colors from chroma
 */
function drawOceanWavesWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('ocean_waves');
  // basePosition controls where the ocean sits
  const oceanBaseY = height * (settings.basePosition / 100);
  // maxAmplitude controls wave height
  const waveHeight = height * (settings.maxAmplitude / 100);
  
  // Find dominant color for water
  let dominantIdx = 0;
  let maxVal = 0;
  for (let i = 0; i < 12; i++) {
    if ((chroma[i] || 0) > maxVal) {
      maxVal = chroma[i];
      dominantIdx = i;
    }
  }
  const waterHue = CHROMA_HUES[dominantIdx];
  
  // Draw multiple wave layers from back to front
  const numWaveLayers = 6;
  
  for (let layer = 0; layer < numWaveLayers; layer++) {
    const layerT = layer / numWaveLayers;
    // Position waves between oceanBaseY - waveHeight and oceanBaseY
    const baseY = (oceanBaseY - waveHeight) + layerT * waveHeight;
    
    const chromaIdx = (layer * 2) % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const layerHue = CHROMA_HUES[chromaIdx];
    
    // Get mel for wave height
    const melIdx = Math.floor(layerT * (mel?.length || 1));
    const melValue = mel ? Math.max(0.2, (mel[melIdx] + 10) / 10) : 0.4;
    
    // Wave amplitude increases for closer layers
    const amplitude = 20 + layerT * 40 + melValue * 30 + beatPulse * 20;
    const frequency = 2 + layer * 0.5;
    const speed = 1.5 - layerT * 0.5; // Back layers move slower
    
    // Draw wave
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    const numPoints = 60;
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * width;
      
      // Composite wave
      const wave1 = Math.sin(t * Math.PI * frequency + time * speed) * amplitude;
      const wave2 = Math.sin(t * Math.PI * frequency * 2.3 + time * speed * 1.4) * amplitude * 0.3;
      const wave3 = Math.sin(t * Math.PI * frequency * 0.7 + time * speed * 0.8) * amplitude * 0.4;
      
      const y = baseY + wave1 + wave2 + wave3;
      
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.lineTo(width, height);
    ctx.closePath();
    
    // Gradient for depth
    const gradient = ctx.createLinearGradient(0, baseY - amplitude, 0, height);
    const lightness = 35 + chromaValue * 20 + (1 - layerT) * 15;
    const saturation = 60 + chromaValue * 30;
    const alpha = 0.4 + layerT * 0.4;
    
    gradient.addColorStop(0, `hsla(${layerHue}, ${saturation}%, ${lightness + 20}%, ${alpha})`);
    gradient.addColorStop(0.3, `hsla(${layerHue}, ${saturation}%, ${lightness}%, ${alpha})`);
    gradient.addColorStop(1, `hsla(${layerHue}, ${saturation - 20}%, ${lightness - 15}%, ${alpha})`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Wave crest foam
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * width;
      
      const wave1 = Math.sin(t * Math.PI * frequency + time * speed) * amplitude;
      const wave2 = Math.sin(t * Math.PI * frequency * 2.3 + time * speed * 1.4) * amplitude * 0.3;
      const wave3 = Math.sin(t * Math.PI * frequency * 0.7 + time * speed * 0.8) * amplitude * 0.4;
      
      const y = baseY + wave1 + wave2 + wave3;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + chromaValue * 0.4})`;
    ctx.lineWidth = 2 + chromaValue * 3;
    ctx.stroke();
    
    // Foam spray on wave peaks for front layers
    if (layer >= numWaveLayers - 2 && chromaValue > 0.4) {
      const numFoamParticles = 20;
      for (let fp = 0; fp < numFoamParticles; fp++) {
        const foamT = fp / numFoamParticles;
        const foamX = foamT * width;
        
        const wave1 = Math.sin(foamT * Math.PI * frequency + time * speed) * amplitude;
        const foamY = baseY + wave1 - 10;
        
        // Only add foam at wave peaks
        const waveSlope = Math.cos(foamT * Math.PI * frequency + time * speed);
        if (waveSlope > 0.6) {
          // Use deterministic pseudo-random based on position and time
          const seed = Math.sin(fp * 12.9898 + layer * 78.233 + Math.floor(time * 2));
          const seed2 = Math.cos(fp * 43.758 + layer * 23.421 + Math.floor(time * 2));
          
          const foamSize = 2 + (seed * 0.5 + 0.5) * 3 * chromaValue;
          const foamAlpha = 0.3 + (seed2 * 0.5 + 0.5) * 0.4;
          const offsetX = seed * 15;
          const offsetY = seed2 * 8;
          
          ctx.fillStyle = `rgba(255, 255, 255, ${foamAlpha})`;
          ctx.beginPath();
          ctx.arc(foamX + offsetX, foamY + offsetY, foamSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  
  // Sun reflection on water
  const sunX = width * 0.5;
  const sunReflectionY = height * 0.4;
  
  for (let i = 0; i < 8; i++) {
    const reflectY = sunReflectionY + i * 15 + Math.sin(time * 2 + i) * 5;
    const reflectWidth = 40 - i * 4 + beatPulse * 10;
    const reflectAlpha = 0.4 - i * 0.04;
    
    ctx.fillStyle = `hsla(${waterHue}, 40%, 90%, ${reflectAlpha})`;
    ctx.fillRect(sunX - reflectWidth / 2, reflectY, reflectWidth, 3);
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Galaxy Spiral 🌀 - Spinning galaxy with stars and cosmic dust
 * Arms spiral based on time, stars pulse with chroma
 */
function drawGalaxySpiralWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('galaxy_spiral');
  const centerX = width / 2;
  // basePosition controls vertical center of the galaxy
  const centerY = height * (settings.basePosition / 100);
  // maxAmplitude controls the radius of the galaxy
  const maxRadius = Math.min(width, height) * (settings.maxAmplitude / 100);
  
  // Rotation speed based on total energy
  const totalEnergy = chroma.reduce((a, b) => a + b, 0) / 12;
  const rotationSpeed = 0.15 + totalEnergy * 0.1;
  
  // Draw spiral arms
  const numArms = 3;
  const armPointsPerArm = 200;
  
  for (let arm = 0; arm < numArms; arm++) {
    const armOffset = (arm / numArms) * Math.PI * 2;
    const chromaIdx = arm * 4 % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const armHue = CHROMA_HUES[chromaIdx];
    
    // Draw arm as series of points
    for (let p = 0; p < armPointsPerArm; p++) {
      const t = p / armPointsPerArm;
      const radius = t * maxRadius;
      
      // Logarithmic spiral
      const spiralAngle = armOffset + t * Math.PI * 4 + time * rotationSpeed;
      
      // Get mel for arm thickness
      const melIdx = Math.floor(t * (mel?.length || 1));
      const melValue = mel ? Math.max(0.2, (mel[melIdx] + 10) / 10) : 0.4;
      
      const x = centerX + Math.cos(spiralAngle) * radius;
      const y = centerY + Math.sin(spiralAngle) * radius * 0.6; // Squash for perspective
      
      // Star/dust size based on position and chroma
      const size = (2 + melValue * 4 + beatPulse * 2) * (1 - t * 0.5);
      const alpha = (0.3 + chromaValue * 0.5) * (1 - t * 0.3);
      
      // Dust cloud
      if (p % 3 === 0) {
        const dustGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
        dustGradient.addColorStop(0, `hsla(${armHue}, 70%, 60%, ${alpha * 0.6})`);
        dustGradient.addColorStop(0.5, `hsla(${armHue}, 60%, 50%, ${alpha * 0.3})`);
        dustGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = dustGradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Bright stars
      if (p % 8 === 0) {
        const starTwinkle = Math.sin(time * 4 + p) * 0.3 + 0.7;
        ctx.fillStyle = `hsla(${armHue}, 40%, 95%, ${alpha * starTwinkle})`;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  // Central core glow
  const coreSize = 30 + beatPulse * 20 + totalEnergy * 20;
  
  for (let layer = 3; layer >= 0; layer--) {
    const layerSize = coreSize * (1 + layer * 0.5);
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, layerSize);
    
    const coreHue = CHROMA_HUES[Math.floor(time) % 12];
    const coreAlpha = 0.4 - layer * 0.08;
    
    coreGradient.addColorStop(0, `hsla(${coreHue}, 50%, 95%, ${coreAlpha})`);
    coreGradient.addColorStop(0.3, `hsla(${coreHue}, 70%, 70%, ${coreAlpha * 0.7})`);
    coreGradient.addColorStop(0.6, `hsla(${coreHue}, 80%, 50%, ${coreAlpha * 0.4})`);
    coreGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, layerSize, layerSize * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Background stars
  const numBgStars = 80;
  for (let i = 0; i < numBgStars; i++) {
    const starX = ((Math.sin(i * 12345.6) + 1) / 2) * width;
    const starY = ((Math.cos(i * 67890.1) + 1) / 2) * height;
    
    const chromaIdx = i % 12;
    const chromaValue = chroma[chromaIdx] || 0.2;
    const twinkle = Math.sin(time * 3 + i * 0.7) * 0.4 + 0.6;
    
    if (chromaValue > 0.15) {
      const hue = CHROMA_HUES[chromaIdx];
      const size = 0.5 + chromaValue * 2 * twinkle;
      ctx.fillStyle = `hsla(${hue}, 50%, 90%, ${twinkle * chromaValue * 0.7})`;
      ctx.beginPath();
      ctx.arc(starX, starY, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Neon City 🌃 - Cyberpunk cityscape with neon lights pulsing to music
 * Buildings react to mel, neon signs use chroma colors
 */
function drawNeonCityWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('neon_city');
  // basePosition controls where the ground/city base is
  const groundY = height * (settings.basePosition / 100);
  // maxAmplitude controls maximum building height
  const maxBuildingHeight = height * (settings.maxAmplitude / 100);
  
  // Night sky gradient
  const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGradient.addColorStop(0, 'rgba(5, 5, 20, 0.8)');
  skyGradient.addColorStop(0.5, 'rgba(20, 10, 40, 0.6)');
  skyGradient.addColorStop(1, 'rgba(40, 20, 60, 0.4)');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, groundY);
  
  // Draw buildings
  const numBuildings = 16;
  for (let b = 0; b < numBuildings; b++) {
    const buildingT = b / numBuildings;
    const buildingX = buildingT * width;
    const buildingWidth = width / numBuildings * 0.9;
    
    const chromaIdx = b % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel for building height
    const melIdx = Math.floor(buildingT * (mel?.length || 1));
    const melValue = mel ? Math.max(0.2, (mel[melIdx] + 10) / 10) : 0.4;
    
    // Building height pulses with mel and beat, scaled by maxBuildingHeight
    const baseHeight = maxBuildingHeight * (0.3 + melValue * 0.5 + beatPulse * 0.1);
    const buildingHeight = baseHeight + Math.sin(time * 2 + b) * 10;
    const buildingY = groundY - buildingHeight;
    
    // Building body - dark with subtle gradient
    const buildingGradient = ctx.createLinearGradient(buildingX, buildingY, buildingX + buildingWidth, buildingY);
    buildingGradient.addColorStop(0, `rgba(20, 20, 30, 0.9)`);
    buildingGradient.addColorStop(0.5, `rgba(30, 30, 45, 0.9)`);
    buildingGradient.addColorStop(1, `rgba(15, 15, 25, 0.9)`);
    
    ctx.fillStyle = buildingGradient;
    ctx.fillRect(buildingX, buildingY, buildingWidth, buildingHeight);
    
    // Windows
    const windowRows = Math.floor(buildingHeight / 15);
    const windowCols = 3;
    const windowWidth = buildingWidth * 0.2;
    const windowHeight = 8;
    
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const windowX = buildingX + 5 + col * (buildingWidth - 10) / windowCols;
        const windowY = buildingY + 10 + row * 15;
        
        // Some windows are lit based on chroma/time
        const isLit = Math.sin(time * 2 + row * 0.5 + col + b) > 0.3;
        
        if (isLit && chromaValue > 0.2) {
          const windowHue = CHROMA_HUES[(chromaIdx + row) % 12];
          ctx.fillStyle = `hsla(${windowHue}, 70%, 70%, ${0.4 + chromaValue * 0.4})`;
          ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
          
          // Window glow
          ctx.shadowColor = `hsla(${windowHue}, 80%, 60%, 0.8)`;
          ctx.shadowBlur = 8;
          ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = 'rgba(10, 10, 20, 0.8)';
          ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
        }
      }
    }
    
    // Neon sign on some buildings
    if (chromaValue > 0.4 && b % 3 === 0) {
      const signY = buildingY + buildingHeight * 0.3;
      const signWidth = buildingWidth * 0.8;
      const signHeight = 20;
      
      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${0.7 + beatPulse * 0.3})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = `hsla(${hue}, 100%, 50%, 1)`;
      ctx.shadowBlur = 15;
      
      // Neon rectangle
      ctx.strokeRect(buildingX + 5, signY, signWidth, signHeight);
      
      // Neon line through
      ctx.beginPath();
      ctx.moveTo(buildingX + 10, signY + signHeight / 2);
      ctx.lineTo(buildingX + signWidth, signY + signHeight / 2);
      ctx.stroke();
      
      ctx.shadowBlur = 0;
    }
    
    // Rooftop antenna/light
    if (b % 4 === 0) {
      const antennaHeight = 20 + chromaValue * 30;
      ctx.strokeStyle = `rgba(100, 100, 120, 0.8)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(buildingX + buildingWidth / 2, buildingY);
      ctx.lineTo(buildingX + buildingWidth / 2, buildingY - antennaHeight);
      ctx.stroke();
      
      // Blinking light
      const blinkPhase = Math.sin(time * 4 + b) > 0.5;
      if (blinkPhase) {
        ctx.fillStyle = `hsla(0, 100%, 50%, 0.9)`;
        ctx.beginPath();
        ctx.arc(buildingX + buildingWidth / 2, buildingY - antennaHeight, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }
  
  // Ground with reflections
  ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
  ctx.fillRect(0, groundY, width, height - groundY);
  
  // Wet street reflection
  for (let b = 0; b < numBuildings; b++) {
    const buildingT = b / numBuildings;
    const buildingX = buildingT * width;
    const buildingWidth = width / numBuildings * 0.9;
    
    const chromaIdx = b % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    if (chromaValue > 0.3) {
      const reflectionGradient = ctx.createLinearGradient(buildingX, groundY, buildingX, height);
      reflectionGradient.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.3)`);
      reflectionGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = reflectionGradient;
      ctx.fillRect(buildingX, groundY, buildingWidth, height - groundY);
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Particle Explosion 💥 - Bursting particles from center that react to music
 * Particles spread based on mel, colors from chroma
 */
function drawParticleExplosionWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('particle_explosion');
  const centerX = width / 2;
  // basePosition controls vertical center of the explosion
  const centerY = height * (settings.basePosition / 100);
  // maxAmplitude controls how far particles spread
  const spreadMultiplier = settings.maxAmplitude / 50; // normalize to 1.0 at 50%
  
  // Calculate explosion intensity
  const avgMel = mel ? mel.reduce((a, b) => a + b, 0) / mel.length : 0;
  const intensity = Math.max(0.3, (avgMel + 10) / 10) + beatPulse * 0.5;
  
  // Multiple explosion layers
  const numLayers = 5;
  
  for (let layer = 0; layer < numLayers; layer++) {
    const layerT = layer / numLayers;
    
    // Each layer has different timing
    const layerTime = (time * (1 + layer * 0.2)) % 3;
    const expansionPhase = layerTime / 3;
    // Scale max radius by spreadMultiplier
    const maxRadius = (200 + layer * 50) * spreadMultiplier;
    const currentRadius = expansionPhase * maxRadius * intensity;
    const fadeOut = 1 - expansionPhase;
    
    const chromaIdx = layer * 2 % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel for particle count
    const melIdx = Math.floor(layerT * (mel?.length || 1));
    const melValue = mel ? Math.max(0.3, (mel[melIdx] + 10) / 10) : 0.5;
    
    const numParticles = Math.floor(30 + melValue * 40);
    
    for (let p = 0; p < numParticles; p++) {
      const particleT = p / numParticles;
      const angle = particleT * Math.PI * 2;
      
      // Particle speed variation
      const speedVar = 0.6 + Math.sin(p * 123.456) * 0.4;
      const radius = currentRadius * speedVar;
      
      // Spiral motion
      const spiralOffset = Math.sin(expansionPhase * Math.PI * 2 + p * 0.2) * 20;
      
      const x = centerX + Math.cos(angle + expansionPhase * 0.5) * (radius + spiralOffset);
      const y = centerY + Math.sin(angle + expansionPhase * 0.5) * (radius + spiralOffset);
      
      // Particle size decreases as it travels
      const size = (3 + chromaValue * 4) * fadeOut * speedVar;
      const alpha = fadeOut * chromaValue * 0.8;
      
      if (alpha > 0.05 && size > 0.5) {
        // Particle glow
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
        glowGradient.addColorStop(0, `hsla(${hue}, 90%, 70%, ${alpha})`);
        glowGradient.addColorStop(0.4, `hsla(${hue}, 80%, 55%, ${alpha * 0.5})`);
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright core
        ctx.fillStyle = `hsla(${hue}, 60%, 90%, ${alpha * 1.2})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Motion trail
        if (radius > 20) {
          const trailLength = 4;
          for (let t = 1; t <= trailLength; t++) {
            const trailRadius = radius - t * 8;
            if (trailRadius > 0) {
              const trailX = centerX + Math.cos(angle + expansionPhase * 0.5) * trailRadius;
              const trailY = centerY + Math.sin(angle + expansionPhase * 0.5) * trailRadius;
              const trailAlpha = alpha * (1 - t / trailLength) * 0.5;
              const trailSize = size * (1 - t / trailLength * 0.5);
              
              ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${trailAlpha})`;
              ctx.beginPath();
              ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }
    
    // Shockwave ring
    if (expansionPhase > 0.1 && expansionPhase < 0.8) {
      const ringRadius = currentRadius * 1.1;
      const ringAlpha = fadeOut * chromaValue * 0.4;
      
      ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${ringAlpha})`;
      ctx.lineWidth = 2 + chromaValue * 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  // Central energy core
  const coreSize = 20 + beatPulse * 30 + intensity * 20;
  
  const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreSize * 2);
  const coreHue = CHROMA_HUES[Math.floor(time * 3) % 12];
  coreGradient.addColorStop(0, `hsla(${coreHue}, 60%, 95%, 0.9)`);
  coreGradient.addColorStop(0.3, `hsla(${coreHue}, 80%, 70%, 0.6)`);
  coreGradient.addColorStop(0.6, `hsla(${coreHue}, 90%, 50%, 0.3)`);
  coreGradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, coreSize * 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Energy tendrils from center
  const numTendrils = 12;
  for (let t = 0; t < numTendrils; t++) {
    const chromaIdx = t;
    const chromaValue = chroma[chromaIdx] || 0.2;
    const hue = CHROMA_HUES[chromaIdx];
    
    if (chromaValue > 0.2) {
      const angle = (t / numTendrils) * Math.PI * 2 + time * 0.5;
      const tendrilLength = 30 + chromaValue * 60 + beatPulse * 20;
      
      const endX = centerX + Math.cos(angle) * tendrilLength;
      const endY = centerY + Math.sin(angle) * tendrilLength;
      
      const tendrilGradient = ctx.createLinearGradient(centerX, centerY, endX, endY);
      tendrilGradient.addColorStop(0, `hsla(${hue}, 80%, 70%, ${chromaValue * 0.8})`);
      tendrilGradient.addColorStop(1, 'transparent');
      
      ctx.strokeStyle = tendrilGradient;
      ctx.lineWidth = 2 + chromaValue * 4;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      
      // Wavy tendril
      const midX = centerX + Math.cos(angle) * tendrilLength * 0.5 + Math.sin(time * 4 + t) * 10;
      const midY = centerY + Math.sin(angle) * tendrilLength * 0.5 + Math.cos(time * 4 + t) * 10;
      ctx.quadraticCurveTo(midX, midY, endX, endY);
      ctx.stroke();
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Draw pitch class labels at bottom of screen
 */
function drawWaveLabels(ctx, width, height, chroma) {
  const labelY = height - 18; // Fixed at bottom (y=100%)
  ctx.font = '12px "Orbitron", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  for (let i = 0; i < 12; i++) {
    const x = (i + 0.5) / 12 * width;
    const chromaValue = chroma[i] || 0;
    const hue = CHROMA_HUES[i];
    const alpha = 0.3 + chromaValue * 0.7;
    ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
    ctx.fillText(PITCH_CLASSES[i], x, labelY);
  }
}

/**
 * =============================================================================
 * NEW VISUALIZERS: Pacman, Snake, Sacred Geometry
 * =============================================================================
 */

// --- PACMAN STATE ---
let pacmanState = {
  pacman: { x: 0.5, y: 0.5, dir: 0, mouthTimer: 0 },
  ghosts: [
    { x: 0.2, y: 0.2, color: 0, type: 'blinky' },    // Red
    { x: 0.8, y: 0.2, color: 330, type: 'pinky' },   // Pink
    { x: 0.2, y: 0.8, color: 180, type: 'inky' },    // Cyan
    { x: 0.8, y: 0.8, color: 40, type: 'clyde' }     // Orange
  ],
  dots: [],
  blueMode: false,
  blueTimer: 0,
  lastBlueTime: 0,
  score: 0
};

function drawPacmanWave(ctx, width, height, chroma, mel, beatPulse, time) {
  // Initialize dots if empty
  if (pacmanState.dots.length < 10) {
    for(let i=0; i<50; i++) {
        pacmanState.dots.push({x: Math.random(), y: Math.random(), active: true});
    }
  }

  // Draw Background Grid (neon style)
  ctx.strokeStyle = `rgba(20, 20, 80, ${0.3 + beatPulse*0.2})`;
  ctx.lineWidth = 1;
  const gridSize = 40;
  for(let x=0; x<width; x+=gridSize) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke();
  }
  for(let y=0; y<height; y+=gridSize) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke();
  }

  // High Energy => Blue Ghosts (Occasional - with cooldown)
  // Only trigger if beat is strong AND it hasn't happened recently (e.g. 10s cooldown)
  if (beatPulse > 0.9 && !pacmanState.blueMode && (time - pacmanState.lastBlueTime > 15)) {
      pacmanState.blueMode = true;
      pacmanState.blueTimer = time + 4; // 4 seconds of blue (chase time)
      pacmanState.lastBlueTime = time;
  }
  if (time > pacmanState.blueTimer) {
      pacmanState.blueMode = false;
  }

  const speed = 0.005 * (1 + beatPulse);
  const size = Math.min(width, height) * 0.04;

  // Moves Pacman
  if (pacmanState.blueMode) {
      // PACMAN CHASES: Move towards nearest ghost
      let nearestDist = 999;
      let targetG = null;
      for(let g of pacmanState.ghosts) {
          if (g.isDead) continue; // Ignore eaten ghosts
          const dx = g.x - pacmanState.pacman.x;
          const dy = g.y - pacmanState.pacman.y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if(d < nearestDist) { nearestDist = d; targetG = g; }
      }
      
      if(targetG) {
          // Chase nearest ghost
          const dx = targetG.x - pacmanState.pacman.x;
          const dy = targetG.y - pacmanState.pacman.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if(dist > 0.01) {
             pacmanState.pacman.x += (dx/dist) * speed * 1.5; // Faster when chasing
             pacmanState.pacman.y += (dy/dist) * speed * 1.5;
             
             // Update direction for mouth
             pacmanState.pacman.dir = Math.atan2(dy, dx);
          }
      }
  } else {
      // NORMAL MODE: PACMAN CIRCLES
      // Large circular path
      const radius = 0.35;
      const omega = 0.8; // Rotation speed
      
      const targetX = 0.5 + Math.cos(time * omega) * radius;
      const targetY = 0.5 + Math.sin(time * omega) * radius;
      
      // Smoothly move towards target point on circle (prevents snapping)
      pacmanState.pacman.x += (targetX - pacmanState.pacman.x) * 0.1;
      pacmanState.pacman.y += (targetY - pacmanState.pacman.y) * 0.1;
      
      // Face direction of movement (tangent to circle)
      // Tangent of circle at angle theta is theta + PI/2
      pacmanState.pacman.dir = (time * omega) + Math.PI/2;
  }
  
  // Constrain to screen
  pacmanState.pacman.x = Math.max(0.05, Math.min(0.95, pacmanState.pacman.x));
  pacmanState.pacman.y = Math.max(0.05, Math.min(0.95, pacmanState.pacman.y));

  // Draw and Eat Dots
  ctx.fillStyle = '#ffb8ae';
  for(let d of pacmanState.dots) {
      if(!d.active) continue;
      // Eat check
      const dx = d.x * width - pacmanState.pacman.x * width;
      const dy = d.y * height - pacmanState.pacman.y * height;
      if (Math.sqrt(dx*dx + dy*dy) < size) {
          d.active = false;
          pacmanState.score += 10;
          // Respawn elsewhere
          setTimeout(() => {
             d.x = Math.random(); d.y = Math.random(); d.active = true; 
          }, 2000);
      } else {
          ctx.beginPath();
          ctx.arc(d.x * width, d.y * height, 3, 0, Math.PI*2);
          ctx.fill();
      }
  }

  // Draw Pacman
  const px = pacmanState.pacman.x * width;
  const py = pacmanState.pacman.y * height;
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  const mouth = Math.abs(Math.sin(time * 15)) * 0.2 * Math.PI;
  
  // Use calculated direction
  const dir = pacmanState.pacman.dir || 0;
  
  ctx.arc(px, py, size/2, dir + mouth, dir + Math.PI * 2 - mouth);
  ctx.lineTo(px, py);
  ctx.fill();

  // Draw Ghosts
  for(let g of pacmanState.ghosts) {
    // Respawn Logic
    if (g.isDead) {
        if (time > g.respawnTime) {
            g.isDead = false;
            g.x = 0.5; g.y = 0.5; // Respawn center
        } else {
            // Draw Eyes returning to center (optional visualization of 'dead' ghost)
            const eyesX = g.x * width;
            const eyesY = g.y * height;
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(eyesX - size*0.15, eyesY, size*0.15, 0, Math.PI*2);
            ctx.arc(eyesX + size*0.15, eyesY, size*0.15, 0, Math.PI*2);
            ctx.fill();
            // Move eyes to center
            g.x += (0.5 - g.x) * 0.05;
            g.y += (0.5 - g.y) * 0.05;
            continue; 
        }
    }

    // Determine Color
    let color = `hsl(${g.color}, 100%, 50%)`;
    if (pacmanState.blueMode) color = '#0000FF';

    // Move Ghosts
    const dx = pacmanState.pacman.x - g.x;
    const dy = pacmanState.pacman.y - g.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // Collision Detect (Eat Ghost)
    // 0.04 is approx size in normalized coords relative to screen min dim, but let's use a safe threshold
    if (pacmanState.blueMode && dist < 0.04) {
        g.isDead = true;
        g.respawnTime = time + 5; // Respawn after 5s
        pacmanState.score += 200;
        continue;
    }

    // If Blue, run away. Else chase.
    // Make ghosts slightly slower than likely Pacman speed (speed * 0.9)
    let vx = (dx/dist) * speed * 0.85; 
    let vy = (dy/dist) * speed * 0.85;

    if (pacmanState.blueMode) {
        vx = -vx;
        vy = -vy;
    }

    g.x += vx;
    g.y += vy;
    
    // Constrain ghosts
    g.x = Math.max(0, Math.min(1, g.x));
    g.y = Math.max(0, Math.min(1, g.y));
    
    // Draw Ghost
    const gx = g.x * width;
    const gy = g.y * height;
    ctx.fillStyle = color;
    
    // Ghost Body
    ctx.beginPath();
    ctx.arc(gx, gy - size*0.2, size/2, Math.PI, 0);
    ctx.lineTo(gx + size/2, gy + size/2);
    // Feet
    for(let k=1; k<=3; k++) {
        ctx.lineTo(gx + size/2 - (k*size/3), gy + size/2 - (k%2===0 ? 5 : 0));
    }
    ctx.lineTo(gx - size/2, gy + size/2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(gx - size*0.15, gy - size*0.2, size*0.15, 0, Math.PI*2);
    ctx.arc(gx + size*0.15, gy - size*0.2, size*0.15, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = pacmanState.blueMode ? 'white' : 'blue'; // Typo protection: pacmanState
    ctx.beginPath();
    ctx.arc(gx - size*0.15 + (dx>0?2:-2), gy - size*0.2 + (dy>0?2:-2), size*0.07, 0, Math.PI*2);
    ctx.arc(gx + size*0.15 + (dx>0?2:-2), gy - size*0.2 + (dy>0?2:-2), size*0.07, 0, Math.PI*2);
    ctx.fill();
  }
}
// Correcting possible typo above in variable usage if I manually type it...
// Use pacmanState exactly.

// --- SNAKE STATE ---
let snakeState = {
    snake: [],
    dir: {x:1, y:0},
    lastBeat: 0
};
// Grid size
const SNAKE_GRID = 30; 

function drawSnakeWave(ctx, width, height, chroma, mel, beatPulse, time) {
    const cellSize = width / SNAKE_GRID;
    
    // Initialize Snake
    if(snakeState.snake.length === 0) {
        snakeState.snake = [{x: 10, y: 10}, {x:9, y:10}, {x:8, y:10}, {x:7, y:10}];
    }
    
    // Direction change based on dominant chroma (giving "control" to the music)
    let maxChroma = 0; let maxVal = 0;
    chroma.forEach((v, i) => { if(v > maxVal) { maxVal = v; maxChroma = i; } });
    
    // Map 12 notes to 4 directions
    // ADDED: Random turns on beat for more chaos
    if (beatPulse > 0.7 && Math.random() < 0.3) {
         // Force a 90-degree turn
         if (snakeState.dir.x !== 0) {
             snakeState.dir = Math.random() > 0.5 ? {x: 0, y: 1} : {x: 0, y: -1};
         } else {
             snakeState.dir = Math.random() > 0.5 ? {x: 1, y: 0} : {x: -1, y: 0};
         }
    } 
    else if (maxVal > 0.5) { // Lowered threshold slightly for more responsiveness
        if (maxChroma <= 2 && snakeState.dir.y !== 1) snakeState.dir = {x:0, y:-1}; // Up
        else if (maxChroma <= 5 && snakeState.dir.x !== -1) snakeState.dir = {x:1, y:0}; // Right
        else if (maxChroma <= 8 && snakeState.dir.y !== -1) snakeState.dir = {x:0, y:1}; // Down
        else if (maxChroma >= 9 && snakeState.dir.x !== 1) snakeState.dir = {x:-1, y:0}; // Left
    }

    // Move Update - synced to beat or fixed interval
    // We update approximately every 0.1s or faster on beat
    if (time - snakeState.lastBeat > 0.08) {
        snakeState.lastBeat = time;
        
        let head = snakeState.snake[0];
        let newHead = { x: head.x + snakeState.dir.x, y: head.y + snakeState.dir.y };
        
        // Wrap around screen
        if(newHead.x < 0) newHead.x = SNAKE_GRID-1;
        if(newHead.x >= SNAKE_GRID) newHead.x = 0;
        if(newHead.y < 0) newHead.y = Math.floor(height/cellSize)-1;
        if(newHead.y >= Math.floor(height/cellSize)) newHead.y = 0;
        
        snakeState.snake.unshift(newHead);
        
        // Growth Logic
        // Grow if beatPulse is high, else maintain length (slide)
        // Default length constraint
        const targetLen = 10 + beatPulse * 20;
        if (snakeState.snake.length > targetLen) {
             snakeState.snake.pop();
        }
    }

    // Draw Grid (Optional, faint)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    // ... skipping explicit grid loop for perf

    // Draw Snake
    // Shadow bloom
    ctx.shadowBlur = 15;
    ctx.shadowColor = `hsl(${maxChroma * 30}, 100%, 50%)`;
    
    snakeState.snake.forEach((p, i) => {
        const hue = (maxChroma * 30 + i * 5) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(p.x * cellSize, p.y * cellSize, cellSize-1, cellSize-1);
    });
    ctx.shadowBlur = 0;
}

// --- SACRED GEOMETRY ---
function drawSacredGeometryWave(ctx, width, height, chroma, mel, beatPulse, time) {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.15;
    
    // Calculate average energy
    let energy = 0;
    if (mel && mel.length) energy = mel.reduce((a,b)=>a+b,0) / mel.length;

    const layers = 3 + Math.floor(beatPulse * 3); // Dynamic complexity
    const rotation = time * 0.2;
    
    ctx.lineWidth = 2;
    
    for (let l = 0; l < layers; l++) {
        const r = baseRadius * (l + 1) * 0.6; 
        const circleCount = 6 * (l + 1);
        
        ctx.strokeStyle = `hsla(${(time * 20 + l * 30) % 360}, 70%, 60%, ${0.3 + energy*0.5 + beatPulse*0.2})`;
        
        for (let i = 0; i < circleCount; i++) {
            // Complex rotation pattern
            const angle = (i / circleCount) * Math.PI * 2 + rotation * (l % 2 === 0 ? 1 : -1);
            
            const cx = centerX + Math.cos(angle) * r;
            const cy = centerY + Math.sin(angle) * r;
            
            // Draw Circle
            const circleSize = baseRadius * (0.8 + beatPulse * 0.3);
            ctx.beginPath();
            ctx.arc(cx, cy, circleSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // Connect to center if beat is strong
            if (beatPulse > 0.6) {
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(cx, cy);
                ctx.strokeStyle = `rgba(255,255,255,${0.1 * beatPulse})`;
                ctx.stroke();
            }
        }
    }
    
    // Central Geometric Figure (Hexagon/Cube)
    ctx.beginPath();
    const vertices = 6;
    const polyR = baseRadius * 1.5 * (1+beatPulse*0.1);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + beatPulse*0.5})`;
    ctx.lineWidth = 3;
    
    for (let i = 0; i <= vertices; i++) {
        const angle = (i / vertices) * Math.PI * 2 + rotation;
        const x = centerX + Math.cos(angle) * polyR;
        const y = centerY + Math.sin(angle) * polyR;
        if (i===0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        
        // Inner connections
        ctx.lineTo(centerX, centerY);
        ctx.moveTo(x, y);
    }
    ctx.stroke();
}

// --- FRACTAL VOID STATE ---
let fractalState = {
    rotation: 0,
    smoothedEnergy: 0,
    hueOffset: 0
};

// --- FRACTAL VOID ---
function drawFractalVoidWave(ctx, width, height, chroma, mel, beatPulse, time) {
    const centerX = width / 2;
    const centerY = height / 2;
    // Smoother visual: Constant depth
    const maxDepth = 4;
    
    // Get average energy
    let energy = 0;
    if (mel && mel.length) energy = mel.reduce((a,b)=>a+b,0) / mel.length;
    // Normalize -20 to -5 db range roughly
    energy = Math.max(0, (energy + 15) / 20); 

    // Smooth the energy value (Linear Interpolation)
    fractalState.smoothedEnergy += (energy - fractalState.smoothedEnergy) * 0.08;
    const smoothE = fractalState.smoothedEnergy;
    
    // Smooth rotation - accumulate speed based on energy
    fractalState.rotation += 0.002 + smoothE * 0.01 + beatPulse * 0.005;

    // Get Dominant Pitch for Color only (not geometry popping)
    let maxChroma = 0; let maxVal = -1;
    chroma.forEach((v, i) => { if(v > maxVal) { maxVal = v; maxChroma = i; } });
    
    // Smooth hue transition
    const targetHue = maxChroma * 30;
    // Shortest path interpolation for angles (0-360)
    let diff = targetHue - fractalState.hueOffset;
    while (diff < -180) diff += 360;
    while (diff > 180) diff -= 360;
    fractalState.hueOffset += diff * 0.05;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Recursive Function
    const drawFractal = (x, y, radius, angle, depth) => {
        if (depth <= 0 || radius < 3) return;
        
        // Use fixed sides (Hexagon) for stability + smooth morphing
        // We can morph the shape by drawing curves or varying vertices
        const sides = 6; 
        
        // Color based on depth and smooth hue
        const hue = (fractalState.hueOffset + time * 10 + depth * 30) % 360;
        const opacity = 0.5 + smoothE * 0.5; // Pulse opacity
        
        // Add Glow
        ctx.shadowBlur = beatPulse * 15 * (depth === maxDepth ? 1 : 0);
        ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.8)`;
        
        ctx.strokeStyle = `hsla(${hue}, 70%, 50%, ${opacity * (depth/maxDepth)})`;
        ctx.lineWidth = 1 + depth * 0.5 + smoothE * 2;
        
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
            const theta = angle + (i / sides) * Math.PI * 2;
            // Morph shape slightly with beat (make it breathe)
            const r = radius * (1 + 0.1 * Math.sin(time * 2 + i + beatPulse));
            const px = x + Math.cos(theta) * r;
            const py = y + Math.sin(theta) * r;
            if (i===0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset for performance in deep recursion
        
        // Recursion - FIXED number of children (3) for smoothness
        const children = 3; 
        const nextRadius = radius * 0.55;
        // The distance of children expands with energy (Zoom/Explosion effect)
        const expansion = 1 + smoothE * 0.6 + beatPulse * 0.1;
        
        for(let c=0; c<children; c++) {
            const childOffset = (c / children) * Math.PI * 2 + fractalState.rotation;
            const dist = radius * 0.85 * expansion;
            
            const nx = x + Math.cos(childOffset) * dist;
            const ny = y + Math.sin(childOffset) * dist;
            
            // Twist angle for children
            drawFractal(nx, ny, nextRadius, angle + childOffset + Math.PI/3, depth - 1);
        }
    };
    
    // Draw Main Fractal
    const startRadius = Math.min(width, height) * 0.22;
    drawFractal(centerX, centerY, startRadius, fractalState.rotation, maxDepth);
    
    // Background Tunnel - Smoother and separate from fractal logic
    const tunnelDepth = 8;
    for(let i=0; i<tunnelDepth; i++) {
        // Logarithmic scale for tunnel feeling
        const scale = 1.0 + (i * 0.5) + (time*0.5 % 0.5); // Infinite zoom feeling
        const tSize = startRadius * 3 / scale; 
        if (tSize < 5) continue;
        
        const alpha = Math.max(0, (1 - (scale/4))); // Fade out as it gets bigger
        if (alpha <= 0) continue;

        const rot = -fractalState.rotation * (0.5 + i*0.1);
        const hue = (fractalState.hueOffset + i * 20 - time*20) % 360;
        
        ctx.strokeStyle = `hsla(${hue}, 60%, 40%, ${alpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const sides = 6;
        for (let j = 0; j <= sides; j++) {
            const theta = rot + (j / sides) * Math.PI * 2;
            const px = centerX + Math.cos(theta) * tSize;
            const py = centerY + Math.sin(theta) * tSize;
            if (j===0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }
}
