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
export let autoWaveformInterval = 30;
export const setWaveformAutoInterval = (seconds) => { autoWaveformInterval = seconds; };
let currentWaveformStyle = 0;
let lastWaveformStyleChange = 0;
let isAutoWaveformMode = true; // Auto-switch mode

// Hardcoded default values per waveform style
// Each style can have: basePosition, maxAmplitude, particles (enabled, count, size, speed), 
// and center elements (chromaWheel, circularMel, pitchOrb, beatFlash)
export const WAVEFORM_DEFAULTS = {
  // Featured styles (user favorites)
  synthwave_horizon: { basePosition: 60,  maxAmplitude: 70, basePositionFullScreen: 60,  maxAmplitudeFullScreen: 80, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  liquid_mercury:   { basePosition: 50,  maxAmplitude: 46, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 70, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  cosmic_nebula:    { basePosition: 54,  maxAmplitude: 45, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 60, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: false, pitchOrb: true, beatFlash: false } },
  terrain_3d:       { basePosition: 95,  maxAmplitude: 60, basePositionFullScreen: 87,  maxAmplitudeFullScreen: 75, particles: { enabled: false, count: 20, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  gradient_bars:    { basePosition: 95,  maxAmplitude: 50, basePositionFullScreen: 97,  maxAmplitudeFullScreen: 70, particles: { enabled: true, count: 2, size: 6.0, speed: 0.3 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: true } },
  matrix_rain:      { basePosition: 95,  maxAmplitude: 90, basePositionFullScreen: 90,  maxAmplitudeFullScreen: 100, particles: { enabled: false, count: 5, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  plasma_fire:      { basePosition: 95,  maxAmplitude: 90, basePositionFullScreen: 95,  maxAmplitudeFullScreen: 90, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  helix_dna:        { basePosition: 100,  maxAmplitude: 50, basePositionFullScreen: 100,  maxAmplitudeFullScreen: 55, particles: { enabled: true, count: 5, size: 2.0, speed: 0.5 }, centerElements: { chromaWheel: false, circularMel: true, pitchOrb: false, beatFlash: false } },
  pacman:           { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  snake:            { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: false, pitchOrb: false, beatFlash: false } },
  rain_tetris:      { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  dvd_bouncer:      { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  gummy:            { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  sacred_geometry:  { basePosition: 50,  maxAmplitude: 70, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 80, particles: { enabled: true, count: 4, size: 1.0, speed: 0.6 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: true, beatFlash: false } },
  fractal_void:     { basePosition: 50,  maxAmplitude: 80, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 90, particles: { enabled: true, count: 4, size: 0.8, speed: 1.5 }, centerElements: { chromaWheel: true, circularMel: false, pitchOrb: false, beatFlash: true } },
  quantum_flux:     { basePosition: 50,  maxAmplitude: 85, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 95, particles: { enabled: true, count: 4, size: 1.2, speed: 2.0 }, centerElements: { chromaWheel: true, circularMel: false, pitchOrb: true, beatFlash: true } },
  water_ripple:     { basePosition: 50,  maxAmplitude: 70, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 80, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  spirograph:       { basePosition: 50,  maxAmplitude: 60, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 75, particles: { enabled: true, count: 4, size: 1.0, speed: 0.8 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: true, beatFlash: false } },
  starfield_warp:   { basePosition: 50,  maxAmplitude: 80, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 95, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: true } },
  vinyl_record:     { basePosition: 50,  maxAmplitude: 65, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 80, particles: { enabled: true, count: 3, size: 1.0, speed: 0.5 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  glitch_art_3:     { basePosition: 50,  maxAmplitude: 55, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 70, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: true } },
  maze_mystery:     { basePosition: 50,  maxAmplitude: 70, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 85, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: true, beatFlash: false } },

  // Classic styles
  layered:          { basePosition: 95,  maxAmplitude: 50, basePositionFullScreen: 95,  maxAmplitudeFullScreen: 80, particles: { enabled: false, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  oscilloscope:     { basePosition: 45,  maxAmplitude: 48, basePositionFullScreen: 45,  maxAmplitudeFullScreen: 48, particles: { enabled: false, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  bars:             { basePosition: 95,  maxAmplitude: 57, basePositionFullScreen: 95,  maxAmplitudeFullScreen: 57, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: false, pitchOrb: true, beatFlash: false } },
  ribbon:           { basePosition: 50,  maxAmplitude: 15, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 30, particles: { enabled: true, count: 10, size: 5.0, speed: 0.7 }, centerElements: { chromaWheel: true, circularMel: false, pitchOrb: true, beatFlash: false } },
  mirrored:         { basePosition: 50,  maxAmplitude: 30, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 30, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  dotted:           { basePosition: 50,  maxAmplitude: 40, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 40, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  pixelated:        { basePosition: 95,  maxAmplitude: 50, basePositionFullScreen: 95,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: true } },
  //updated to here
  mesh3d:           { basePosition: 95,  maxAmplitude: 45, basePositionFullScreen: 80,  maxAmplitudeFullScreen: 80, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  sine_layers:      { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 50, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: true } },
  circular_dots:    { basePosition: 60,  maxAmplitude: 40, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 40, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  neon_lines:       { basePosition: 50,  maxAmplitude: 40, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 35, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: true, pitchOrb: true, beatFlash: true } },
  aurora_borealis:  { basePosition: 100, maxAmplitude: 70, basePositionFullScreen: 100, maxAmplitudeFullScreen: 80, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  shockwave:        { basePosition: 62,  maxAmplitude: 80, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 90, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  kaleidoscope:     { basePosition: 50,  maxAmplitude: 45, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 60, particles: { enabled: false, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  lightning:        { basePosition: 15,  maxAmplitude: 70, basePositionFullScreen: 15,  maxAmplitudeFullScreen: 70, particles: { enabled: false, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  heartbeat:        { basePosition: 70,  maxAmplitude: 35, basePositionFullScreen: 70,  maxAmplitudeFullScreen: 60, particles: { enabled: false, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  fractal_tree:     { basePosition: 95,  maxAmplitude: 35, basePositionFullScreen: 95,  maxAmplitudeFullScreen: 40, particles: { enabled: false, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  sound_tornado:    { basePosition: 84,  maxAmplitude: 81, basePositionFullScreen: 84,  maxAmplitudeFullScreen: 81, particles: { enabled: false, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  geo_mandala:      { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 45,  maxAmplitudeFullScreen: 45, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  glitch_art:       { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 70, particles: { enabled: false, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  glitch_art_2:     { basePosition: 50,  maxAmplitude: 60, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 80, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  fireworks:        { basePosition: 90,  maxAmplitude: 70, basePositionFullScreen: 90,  maxAmplitudeFullScreen: 90, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  ocean_waves:      { basePosition: 70,  maxAmplitude: 30, basePositionFullScreen: 80,  maxAmplitudeFullScreen: 50, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  galaxy_spiral:    { basePosition: 50,  maxAmplitude: 45, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 60, particles: { enabled: true, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  neon_city:        { basePosition: 85,  maxAmplitude: 60, basePositionFullScreen: 85,  maxAmplitudeFullScreen: 80, particles: { enabled: true, count: 2, size: 0.7, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  particle_explosion: { basePosition: 50, maxAmplitude: 50, basePositionFullScreen: 50, maxAmplitudeFullScreen: 70, particles: { enabled: false, count: 2, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  lava_lamp:        { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  volcanic_magma:   { basePosition: 85,  maxAmplitude: 55, basePositionFullScreen: 85,  maxAmplitudeFullScreen: 65, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
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
  maxAmplitude: 70,
  lastStyleId: null
};

// --- Waveform Specific Animation States ---
let oceanState = { sChroma: new Float32Array(12).fill(0), sMel: null, sBeat: 0, timeOffset: 0, foamParticles: [] };
let galaxyState = { sChroma: new Float32Array(12).fill(0), sMel: null, sBeat: 0, rotation: 0 };
let glitch2State = { sChroma: new Float32Array(12).fill(0), sBeat: 0, blocks: [], glitchActive: 0, lastScanlineShift: 0 };
let lavaLampState = { blobs: [], sChroma: new Float32Array(12).fill(0), sBeat: 0, initialized: false };
let synthwaveState = { sChroma: new Float32Array(12).fill(0), sBeat: 0, gridOffset: 0, sunPulse: 0, glitchFrame: 0, scanY: 0 };
let volcanicState = { sChroma: new Float32Array(12).fill(0), sBeat: 0, sBass: 0, lavaOffset: 0, ashParticles: [], bubbles: [], bombs: [], initialised: false };

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
    const defaults = WAVEFORM_DEFAULTS[styleId] || WAVEFORM_DEFAULTS.synthwave_horizon;
    
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
  const defaults = WAVEFORM_DEFAULTS[styleId] || WAVEFORM_DEFAULTS.synthwave_horizon;
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
  { id: 'synthwave_horizon', name: 'Synthwave Horizon' },
  { id: 'liquid_mercury', name: 'Liquid Mercury' },
  { id: 'cosmic_nebula', name: 'Cosmic Nebula' },
  { id: 'terrain_3d', name: 'Soundwave Terrain' },
  { id: 'gradient_bars', name: 'Gradient Bars' },
  { id: 'matrix_rain', name: 'Matrix Rain' },
  { id: 'plasma_fire', name: 'Plasma Fire' },
  { id: 'helix_dna', name: 'DNA Helix' },
  { id: 'pacman', name: '8-Bit Chase' },
  { id: 'snake', name: 'Rhythm Snake' },
  { id: 'rain_tetris', name: 'Rain Tetris' },
  { id: 'dvd_bouncer', name: 'DVD Bouncer' },
  { id: 'gummy', name: 'Gummy' },
  { id: 'sacred_geometry', name: 'Sacred Geometry' },
  { id: 'fractal_void', name: 'Fractal Void' },
  { id: 'quantum_flux', name: 'Quantum Flux' },
  { id: 'water_ripple', name: 'Water Ripple' },
  { id: 'spirograph', name: 'Spirograph' },
  { id: 'starfield_warp', name: 'Starfield Warp' },
  { id: 'vinyl_record', name: 'Vinyl Record' },
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
  { id: 'glitch_art_2', name: 'Glitch Art 2' },
  { id: 'glitch_art_3', name: 'Glitch Art 3' },
  { id: 'maze_mystery', name: 'Maze Mystery' },
  { id: 'fireworks', name: 'Fireworks Show' },
  { id: 'ocean_waves', name: 'Ocean Waves' },
  { id: 'volcanic_magma', name: 'Volcanic Magma' },
  { id: 'galaxy_spiral', name: 'Galaxy Spiral' },
  { id: 'neon_city', name: 'Neon City' },
  { id: 'particle_explosion', name: 'Particle Explosion' },
  { id: 'lava_lamp', name: 'Lava Lamp' }
];

// Get current waveform style
export function getWaveformStyle() {
  return WAVEFORM_STYLES[currentWaveformStyle]?.id || 'synthwave_horizon';
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

  // Reset Rain Tetris state for new track
  resetRainTetrisState();
  
  // Reset Snake state for new track
  resetSnakeState();

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
      // Reset Rain Tetris state when switching waveforms
      resetRainTetrisState();
      
      // Reset Snake state when switching waveforms
      resetSnakeState();
      
      // Load settings from WAVEFORM_DEFAULTS for this style
      const defaults = WAVEFORM_DEFAULTS[styleId];
      if (defaults) {
        // Apply particle settings
        if (defaults.particles) {
          particleSettings = { ...particleSettings, ...defaults.particles };
        }
        // Apply center element settings
        if (defaults.centerElements) {
          centerElementSettings = { ...centerElementSettings, ...defaults.centerElements };
        }
      }
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
    
    if (time - lastWaveformStyleChange > autoWaveformInterval || lastWaveformStyleChange < -9000) {
      let newStyle;
      do {
        newStyle = Math.floor(Math.random() * WAVEFORM_STYLES.length);
      } while (newStyle === currentWaveformStyle && WAVEFORM_STYLES.length > 1);
      currentWaveformStyle = newStyle;
      lastWaveformStyleChange = time;
      // Reset Rain Tetris state when auto-switching waveforms
      resetRainTetrisState();
      
      // Reset Snake state when auto-switching waveforms
      resetSnakeState();
      
      // Load settings from WAVEFORM_DEFAULTS for the new style
      const styleId = WAVEFORM_STYLES[newStyle]?.id;
      const defaults = WAVEFORM_DEFAULTS[styleId];
      if (defaults) {
        // Apply particle settings
        if (defaults.particles) {
          particleSettings = { ...particleSettings, ...defaults.particles };
        }
        // Apply center element settings
        if (defaults.centerElements) {
          centerElementSettings = { ...centerElementSettings, ...defaults.centerElements };
        }
      }
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
    case 'glitch_art_2':
      drawGlitchArt2Wave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'glitch_art_3':
      drawGlitchArt3Wave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'maze_mystery':
      drawMazeMysteryWave(ctx, width, height, chroma, mel, beatPulse, time);
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
    case 'lava_lamp':
      drawLavaLampWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'synthwave_horizon':
      drawSynthwaveHorizonWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'volcanic_magma':
      drawVolcanicMagmaWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'pacman':
      drawPacmanWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'snake':
      drawSnakeWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'rain_tetris':
      drawRainTetrisWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'dvd_bouncer':
      drawDVDBouncerWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'gummy':
      drawGummyWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'sacred_geometry':
      drawSacredGeometryWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'fractal_void':
      drawFractalVoidWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'quantum_flux':
      drawQuantumFluxWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'water_ripple':
      drawWaterRippleWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'spirograph':
      drawSpirographWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'starfield_warp':
      drawStarfieldWarpWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
    case 'vinyl_record':
      drawVinylRecordWave(ctx, width, height, chroma, mel, beatPulse, time);
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
// --- RIBBON STATE ---
let ribbonState = {
  smoothedChroma: new Array(12).fill(0),
  smoothedMel: [],
  smoothedBeat: 0,
  lastTime: 0
};

function drawRibbonWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  if (!ribbonState.lastTime) ribbonState.lastTime = time;
  ribbonState.lastTime = time;

  // Smoothing audio data
  ribbonState.smoothedBeat += (beatPulse - ribbonState.smoothedBeat) * 0.12;
  for (let i = 0; i < 12; i++) {
    ribbonState.smoothedChroma[i] += ((chroma[i] || 0) - ribbonState.smoothedChroma[i]) * 0.1;
  }
  
  if (mel && mel.length > 0) {
    if (ribbonState.smoothedMel.length !== mel.length) {
      ribbonState.smoothedMel = [...mel];
    } else {
      for (let i = 0; i < mel.length; i++) {
        ribbonState.smoothedMel[i] += (mel[i] - ribbonState.smoothedMel[i]) * 0.1;
      }
    }
  }

  const settings = getEffectiveWaveformSettings('ribbon');
  const centerY = height * (settings.basePosition / 100);
  const ribbonHeight = height * (settings.maxAmplitude / 100) * 0.3;
  const numPoints = 80; // Increased for smoothness
  
  const sChroma = ribbonState.smoothedChroma;
  const sMel = ribbonState.smoothedMel;
  const sBeat = ribbonState.smoothedBeat;

  // Sort and draw all 12 chroma ribbons
  const sortedIndices = [...Array(12).keys()].sort((a, b) => sChroma[a] - sChroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = sChroma[chromaIdx];
    if (chromaValue < 0.05) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const yOffset = (chromaIdx - 5.5) * (ribbonHeight * 0.15); // Dynamic spread
    const speed = 1.2 + chromaIdx * 0.06;
    const phase = chromaIdx * Math.PI / 6;
    const waveAmplitude = 10 + chromaValue * 30;
    
    const topPoints = [];
    const bottomPoints = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * width;
      
      // Get mel for local variation
      let melInfluence = 0.5;
      if (sMel && sMel.length > 0) {
        const melIdx = Math.floor(t * sMel.length);
        melInfluence = Math.max(0.3, Math.min(1, (sMel[melIdx] + 10) / 10));
      }
      
      const wave = Math.sin(t * Math.PI * 2.5 + time * speed + phase) * waveAmplitude * melInfluence * (1 + sBeat * 0.4);
      const thickness = ribbonHeight * (0.4 + chromaValue * 0.6) * (1 + sBeat * 0.2);
      
      topPoints.push({ x, y: centerY + yOffset + wave - thickness / 2 });
      bottomPoints.push({ x, y: centerY + yOffset + wave + thickness / 2 });
    }
    
    // Draw ribbon shape with quadratic curves for extra smoothness
    ctx.beginPath();
    ctx.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 1; i < topPoints.length - 1; i++) {
      const xc = (topPoints[i].x + topPoints[i + 1].x) / 2;
      const yc = (topPoints[i].y + topPoints[i + 1].y) / 2;
      ctx.quadraticCurveTo(topPoints[i].x, topPoints[i].y, xc, yc);
    }
    ctx.lineTo(topPoints[topPoints.length - 1].x, topPoints[topPoints.length - 1].y);
    
    ctx.lineTo(bottomPoints[bottomPoints.length - 1].x, bottomPoints[bottomPoints.length - 1].y);
    for (let i = bottomPoints.length - 2; i > 0; i--) {
      const xc = (bottomPoints[i].x + bottomPoints[i - 1].x) / 2;
      const yc = (bottomPoints[i].y + bottomPoints[i - 1].y) / 2;
      ctx.quadraticCurveTo(bottomPoints[i].x, bottomPoints[i].y, xc, yc);
    }
    ctx.lineTo(bottomPoints[0].x, bottomPoints[0].y);
    ctx.closePath();
    
    const alpha = 0.2 + chromaValue * 0.6;
    const lightness = 40 + chromaValue * 25;
    
    const gradient = ctx.createLinearGradient(0, centerY + yOffset - 50, 0, centerY + yOffset + 50);
    gradient.addColorStop(0, `hsla(${hue}, 80%, ${lightness + 15}%, ${alpha * 0.6})`);
    gradient.addColorStop(0.5, `hsla(${hue}, 90%, ${lightness}%, ${alpha})`);
    gradient.addColorStop(1, `hsla(${hue}, 80%, ${lightness - 15}%, ${alpha * 0.6})`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Subtle inner highlight
    if (chromaValue > 0.3) {
      ctx.lineWidth = 0.5 + chromaValue * 1.5;
      ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${alpha * 0.4})`;
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
// --- CIRCULAR DOTS STATE ---
let circularDotsState = {
  smoothedChroma: new Array(12).fill(0),
  smoothedMel: [],
  smoothedBeat: 0,
  lastTime: 0
};

function drawCircularDotsWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;

  if (!circularDotsState.lastTime) circularDotsState.lastTime = time;
  circularDotsState.lastTime = time;

  // Smoothing audio data
  circularDotsState.smoothedBeat += (beatPulse - circularDotsState.smoothedBeat) * 0.12;
  for (let i = 0; i < 12; i++) {
    circularDotsState.smoothedChroma[i] += ((chroma[i] || 0) - circularDotsState.smoothedChroma[i]) * 0.1;
  }
  
  if (mel && mel.length > 0) {
    if (circularDotsState.smoothedMel.length !== mel.length) {
      circularDotsState.smoothedMel = [...mel];
    } else {
      for (let i = 0; i < mel.length; i++) {
        circularDotsState.smoothedMel[i] += (mel[i] - circularDotsState.smoothedMel[i]) * 0.1;
      }
    }
  }

  const settings = getEffectiveWaveformSettings('circular_dots');
  const centerY = height * (settings.basePosition / 100);
  const maxAmplitude = height * (settings.maxAmplitude / 100);
  const numDots = 50; // Increased for smoother lines
  
  const sChroma = circularDotsState.smoothedChroma;
  const sMel = circularDotsState.smoothedMel;
  const sBeat = circularDotsState.smoothedBeat;

  // Sort chroma (draw quieter first)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => sChroma[a] - sChroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = sChroma[chromaIdx];
    if (chromaValue < 0.05) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const yOffset = (chromaIdx - 5.5) * (maxAmplitude * 0.05);
    const speed = 1.2 + chromaIdx * 0.08;
    const phaseOffset = chromaIdx * 0.5;
    
    for (let i = 0; i < numDots; i++) {
      const t = i / numDots;
      const x = t * width;
      
      // Get mel for local variation
      let melInfluence = 0.5;
      if (sMel && sMel.length > 0) {
        const melIdx = Math.floor(t * sMel.length);
        melInfluence = Math.max(0.3, Math.min(1, (sMel[melIdx] + 10) / 10));
      }
      
      // Wave with phase offset
      const wave = Math.sin(t * Math.PI * 3.5 + time * speed + phaseOffset);
      const y = centerY + yOffset + wave * chromaValue * maxAmplitude * 0.4 * melInfluence * (1 + sBeat * 0.4);
      
      // Size reflects audio intensity
      const size = (1.2 + chromaValue * 4 + melInfluence * 2) * settings.maxAmplitude / 50;
      const alpha = 0.3 + chromaValue * 0.6;
      const lightness = 45 + chromaValue * 25;
      
      // Gradient fill for 3D glow effect
      const dotGradient = ctx.createRadialGradient(x - size * 0.25, y - size * 0.25, 0, x, y, size);
      dotGradient.addColorStop(0, `hsla(${hue}, 90%, ${lightness + 20}%, ${alpha})`);
      dotGradient.addColorStop(0.4, `hsla(${hue}, 85%, ${lightness}%, ${alpha * 0.8})`);
      dotGradient.addColorStop(1, `hsla(${hue}, 80%, ${lightness - 15}%, 0)`);
      
      ctx.fillStyle = dotGradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Add a tiny spark in the center for high energy
      if (chromaValue > 0.6 && sBeat > 0.5) {
        ctx.fillStyle = `hsla(${hue}, 100%, 95%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Neon lines - 12 chroma colored neon waves
 */
let neonLinesState = {
  sChroma: new Float32Array(12).fill(0),
  sMel: null,
  sBeat: 0
};

function drawNeonLinesWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('neon_lines');
  const centerY = height * (settings.basePosition / 100);
  const maxAmplitude = height * (settings.maxAmplitude / 100);
  const numPoints = 120;
  
  // Initialize state if needed
  if (!neonLinesState.sMel || (mel && neonLinesState.sMel.length !== mel.length)) {
    neonLinesState.sMel = new Float32Array(mel ? mel.length : 1).fill(0);
  }

  // Smooth values
  const lerp = 0.1;
  neonLinesState.sBeat += (beatPulse - neonLinesState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    neonLinesState.sChroma[i] += (chroma[i] - neonLinesState.sChroma[i]) * lerp;
  }
  if (mel) {
    for (let i = 0; i < mel.length; i++) {
      neonLinesState.sMel[i] += (mel[i] - neonLinesState.sMel[i]) * lerp;
    }
  }

  const sChroma = neonLinesState.sChroma;
  const sBeat = neonLinesState.sBeat;
  const sMel = neonLinesState.sMel;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  
  // Sort chroma (draw quieter first)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => sChroma[a] - sChroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = sChroma[chromaIdx] || 0;
    if (chromaValue < 0.05) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const yOffset = (chromaIdx - 5.5) * 6;
    const speed = 1.0 + chromaIdx * 0.1;
    const phaseOffset = chromaIdx * Math.PI / 6;
    const amplitude = maxAmplitude * (0.2 + chromaValue * 0.8) * (1 + sBeat * 0.5);
    
    // Draw trail/glow
    ctx.shadowBlur = 15 + chromaValue * 20;
    ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.8)`;
    
    ctx.beginPath();
    ctx.lineWidth = 2 + chromaValue * 3;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * width;
      
      let melInfluence = 0.5;
      if (sMel && sMel.length > 0) {
        const melIdx = Math.floor(t * (sMel.length - 1));
        melInfluence = Math.max(0.1, (sMel[melIdx] + 15) / 15);
      }
      
      const wave1 = Math.sin(t * Math.PI * 2 + time * speed + phaseOffset);
      const wave2 = Math.sin(t * Math.PI * 4 + time * speed * 1.4 + phaseOffset) * 0.4;
      const wave3 = Math.cos(t * Math.PI * 1.5 - time * 0.8) * 0.2;
      
      const y = centerY + yOffset + (wave1 + wave2 + wave3) * amplitude * melInfluence;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    const alpha = 0.3 + chromaValue * 0.6;
    ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
    ctx.stroke();
    
    // Bright core
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1 + chromaValue;
    ctx.strokeStyle = `hsla(${hue}, 50%, 95%, ${alpha})`;
    ctx.stroke();
  }
  
  ctx.restore();
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
  
  // Dynamic columns based on window width - one column every 30 pixels
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const numColumns = Math.floor(windowWidth / 30);
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
    const dropSpeed = (2 + melValue * 3 + beatPulse * 2) * .2;
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
let kaleidoscopeState = {
  sChroma: new Float32Array(12).fill(0),
  sMel: null,
  sBeat: 0,
  rotation: 0,
  drift: 0,
  particles: []
};

function drawKaleidoscopeWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('kaleidoscope');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxRadius = Math.min(width, height) * (settings.maxAmplitude / 100) * 0.8;
  const numSectors = 12; // 6 axes of symmetry (12 mirrored triangles)
  const sectorAngle = (Math.PI * 2) / numSectors;
  
  // Initialize state
  if (!kaleidoscopeState.sMel || (mel && kaleidoscopeState.sMel.length !== mel.length)) {
    kaleidoscopeState.sMel = new Float32Array(mel ? mel.length : 1).fill(0);
    // Initialize some random particles for the "inner" kaleidoscope motion
    kaleidoscopeState.particles = Array.from({ length: 15 }, () => ({
      r: Math.random(),
      angle: Math.random() * Math.PI * 2,
      size: 5 + Math.random() * 15,
      speed: 0.2 + Math.random() * 0.5,
      type: Math.floor(Math.random() * 3)
    }));
  }

  // Smooth values
  const lerp = 0.08;
  kaleidoscopeState.sBeat += (beatPulse - kaleidoscopeState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    kaleidoscopeState.sChroma[i] += (chroma[i] - kaleidoscopeState.sChroma[i]) * lerp;
  }
  if (mel) {
    for (let i = 0; i < mel.length; i++) {
      kaleidoscopeState.sMel[i] += (mel[i] - kaleidoscopeState.sMel[i]) * lerp;
    }
  }

  const sChroma = kaleidoscopeState.sChroma;
  const sBeat = kaleidoscopeState.sBeat;
  const sMel = kaleidoscopeState.sMel;
  
  // Update rotations with momentum
  kaleidoscopeState.rotation += 0.005 + sBeat * 0.02;
  kaleidoscopeState.drift += 0.002 + sChroma[0] * 0.01;

  ctx.save();
  ctx.translate(centerX, centerY);
  
  // Outer Ambient Glow
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, `hsla(${time * 10 % 360}, 50%, 10%, 0.3)`);
  ctx.fillStyle = grad;
  ctx.fillRect(-width/2, -height/2, width, height);

  ctx.rotate(kaleidoscopeState.rotation);

  // Draw 12 mirrored sectors
  for (let i = 0; i < numSectors; i++) {
    ctx.save();
    ctx.rotate(i * sectorAngle);
    
    // Mirror every other sector
    if (i % 2 === 1) {
      ctx.scale(1, -1);
    }

    // Clip to triangle sector
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(maxRadius, 0);
    ctx.arc(0, 0, maxRadius, 0, sectorAngle);
    ctx.closePath();
    ctx.clip();

    // --- DRAW PATTERN INSIDE SECTOR ---
    // Background based on chroma
    const mainChromaIdx = i % 12;
    const hue = CHROMA_HUES[mainChromaIdx];
    const cVal = sChroma[mainChromaIdx];
    
    ctx.globalCompositeOperation = 'lighter';
    
    // 1. Draw drifting particles
    kaleidoscopeState.particles.forEach((p, pIdx) => {
      const pMel = sMel[pIdx % sMel.length] || 0;
      const r = ((p.r * maxRadius) + time * p.speed * 20) % maxRadius;
      const angle = p.angle + kaleidoscopeState.drift;
      
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const size = p.size * (1 + sBeat * 1.5) * (1 + (pMel + 10) / 20);
      
      ctx.fillStyle = `hsla(${(hue + pIdx * 20) % 360}, 80%, 60%, ${0.2 + cVal * 0.4})`;
      ctx.shadowBlur = 5 + cVal * 15;
      ctx.shadowColor = ctx.fillStyle;
      
      if (p.type === 0) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 1) {
        ctx.fillRect(x - size/2, y - size/2, size, size);
      } else {
        ctx.beginPath();
        const rot = time + pIdx;
        ctx.moveTo(x + Math.cos(rot) * size, y + Math.sin(rot) * size);
        ctx.lineTo(x + Math.cos(rot + 2.4) * size, y + Math.sin(rot + 2.4) * size);
        ctx.lineTo(x + Math.cos(rot + 4.2) * size, y + Math.sin(rot + 4.2) * size);
        ctx.closePath();
        ctx.fill();
      }
    });

    // 2. Draw "Energy Rays"
    const numRays = 4;
    for (let r = 0; r < numRays; r++) {
      const rayAngle = (r / numRays) * sectorAngle;
      const mIdx = Math.floor((r / numRays) * sMel.length);
      const mVal = (sMel[mIdx] + 15) / 15;
      
      const rayLen = maxRadius * mVal * (0.8 + sBeat * 0.2);
      
      const rayGrad = ctx.createLinearGradient(0, 0, Math.cos(rayAngle) * rayLen, Math.sin(rayAngle) * rayLen);
      rayGrad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.8)`);
      rayGrad.addColorStop(1, `hsla(${(hue + 40) % 360}, 100%, 50%, 0)`);
      
      ctx.strokeStyle = rayGrad;
      ctx.lineWidth = 1 + cVal * 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(rayAngle) * rayLen, Math.sin(rayAngle) * rayLen);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw central Hub
  ctx.beginPath();
  const hubRadius = 20 + sBeat * 30;
  const hubGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hubRadius);
  hubGrad.addColorStop(0, '#fff');
  hubGrad.addColorStop(0.5, `hsla(${time * 50 % 360}, 100%, 70%, 0.5)`);
  hubGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = hubGrad;
  ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}

let lightningState = {
  sChroma: new Float32Array(12).fill(0),
  sMel: null,
  sBeat: 0,
  bolts: []
};

/**
 * Lightning Storm - Electric bolts that branch based on mel energy
 * Chroma controls bolt colors, mel controls branching intensity
 */
function drawLightningWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('lightning');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxTravel = height * (settings.maxAmplitude / 100);
  
  // Initialize state
  if (!lightningState.sMel || (mel && lightningState.sMel.length !== mel.length)) {
    lightningState.sMel = new Float32Array(mel ? mel.length : 1).fill(0);
  }

  // Smooth values
  const lerp = 0.12;
  lightningState.sBeat += (beatPulse - lightningState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    lightningState.sChroma[i] += (chroma[i] - lightningState.sChroma[i]) * lerp;
  }
  if (mel) {
    for (let i = 0; i < mel.length; i++) {
      lightningState.sMel[i] += (mel[i] - lightningState.sMel[i]) * lerp;
    }
  }

  const sChroma = lightningState.sChroma;
  const sBeat = lightningState.sBeat;
  const sMel = lightningState.sMel;

  // Manage persistent bolts
  const totalEnergy = sChroma.reduce((a, b) => a + b, 0) / 12;
  
  // High energy / beat triggers new bolts
  if (sBeat > 0.6 && Math.random() < 0.2 + totalEnergy * 0.3 && lightningState.bolts.length < 15) {
    const idx = Math.floor(Math.random() * 12);
    lightningState.bolts.push({
      id: Math.random(),
      startTime: time,
      duration: 0.1 + Math.random() * 0.2,
      chromaIdx: idx,
      angle: Math.random() * Math.PI * 2,
      startX: (Math.random() - 0.5) * 50, // Slight offset from center
      startY: (Math.random() - 0.5) * 50,
      complexity: 3 + Math.floor(sChroma[idx] * 5)
    });
  }

  // Filter out dead bolts
  lightningState.bolts = lightningState.bolts.filter(b => time - b.startTime < b.duration);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.globalCompositeOperation = 'lighter';
  
  // Ambient radial flash on beats
  if (sBeat > 0.7) {
    const flashGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxTravel);
    flashGrad.addColorStop(0, `hsla(0, 0%, 100%, ${sBeat * 0.15})`);
    flashGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(0, 0, maxTravel, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw each active bolt
  lightningState.bolts.forEach(bolt => {
    const age = (time - bolt.startTime) / bolt.duration;
    const chromaValue = sChroma[bolt.chromaIdx];
    const hue = CHROMA_HUES[bolt.chromaIdx];
    const mVal = (sMel[bolt.chromaIdx % sMel.length] + 15) / 15;
    
    // Bolt structure
    const travel = maxTravel * mVal * (0.6 + Math.random() * 0.4);
    const endX = Math.cos(bolt.angle) * travel;
    const endY = Math.sin(bolt.angle) * travel;
    
    drawBolt(ctx, bolt.startX, bolt.startY, endX, endY, hue, chromaValue, age, 0, 3);
  });

  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);

  // Recursive bolt drawing logic
  function drawBolt(ctx, x1, y1, x2, y2, hue, chromaValue, age, depth, maxDepth) {
    if (depth > maxDepth) return;
    
    const segments = 4 + Math.floor(chromaValue * 6);
    const points = [{ x: x1, y: y1 }];
    
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const bx = x1 + (x2 - x1) * t;
      const by = y1 + (y2 - y1) * t;
      
      // Jitter based on bolt age and depth
      const jitter = (1 - age) * 50 * (1 / (depth + 1));
      points.push({
        x: bx + (Math.random() - 0.5) * jitter,
        y: by + (Math.random() - 0.5) * jitter
      });
    }

    const alpha = (1 - age) * (0.9 - depth * 0.2);
    const lineWidth = (3 - depth * 0.7) * (0.6 + chromaValue);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Outer Glow
    ctx.shadowBlur = 12 * (1 - age);
    ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.9)`;
    ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${alpha})`;
    ctx.lineWidth = lineWidth;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // High-energy Core
    ctx.strokeStyle = `hsla(${hue}, 50%, 100%, ${alpha})`;
    ctx.lineWidth = lineWidth * 0.4;
    ctx.stroke();

    // Branching logic
    if (depth < maxDepth && Math.random() < 0.4 * (1 - depth * 0.2)) {
      const bAge = age + 0.05; 
      if (bAge < 1) {
        const branchAngle = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * 1.5;
        const branchLen = 40 + Math.random() * 60;
        const bx2 = points[points.length-1].x + Math.cos(branchAngle) * branchLen;
        const by2 = points[points.length-1].y + Math.sin(branchAngle) * branchLen;
        drawBolt(ctx, points[points.length-1].x, points[points.length-1].y, bx2, by2, 
                 (hue + 30) % 360, chromaValue, bAge, depth + 1, maxDepth);
      }
    }
  }
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
  
  // Determine number of tornados based on screen width/height
  const isLandscape = width > height;
  const numTornados = isLandscape ? 3 : 2;
  const spacingX = width / numTornados;

  for (let tIdx = 0; tIdx < numTornados; tIdx++) {
    const centerX = spacingX * (tIdx + 0.5);
    const tOffset = tIdx * Math.PI * 0.5; // Offset for each tornado
    const tTime = time + tIdx * 10; // Time offset for particles/rotation

    // basePosition controls where the tornado base is
    const baseY = height * (settings.basePosition / 100);
    // maxAmplitude controls tornado height (how far up it reaches)
    const tornadoHeight = height * (settings.maxAmplitude / 100);
    
    // Tornado parameters
    const baseWidth = (spacingX * 0.4) + beatPulse * 50;
    const topWidth = (spacingX * 0.05) + beatPulse * 10;
    
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
        
        const chromaIdx = (band + tIdx * 4) % 12;
        const chromaValue = chroma[chromaIdx] || 0.3;
        const hue = CHROMA_HUES[chromaIdx];
        
        // Spiral rotation
        const spiralAngle = t * Math.PI * 6 + tTime * 3 * (1 + t);
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
    const numDebris = 30; // Slightly reduced for multi-instance performance
    for (let i = 0; i < numDebris; i++) {
      const chromaIdx = (i + tIdx * 3) % 12;
      const chromaValue = chroma[chromaIdx] || 0.3;
      const hue = CHROMA_HUES[chromaIdx];
      
      // Particle height cycles
      const cycleSpeed = 0.3 + (i % 5) * 0.1;
      const heightT = ((tTime * cycleSpeed + i * 0.2) % 1);
      const y = baseY - heightT * tornadoHeight;
      
      // Width at this height
      const widthAtY = baseWidth * (1 - heightT * 0.85) + topWidth * heightT * 0.85;
      
      // Spiral around
      const spiralAngle = heightT * Math.PI * 8 + i * 0.5 + tTime * 2;
      const radius = widthAtY * 0.6 + Math.sin(tTime * 3 + i) * 20;
      
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
        const trailAngle = trailT * Math.PI * 8 + i * 0.5 + tTime * 2;
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
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

let geoMandalaState = {
  sChroma: new Float32Array(12).fill(0),
  sMel: null,
  sBeat: 0,
  rotation: 0
};

/**
 * Geometric Mandala 🔮 - Sacred geometry that rotates with music
 * Each chroma note adds geometric elements that scale and rotate
 */
function drawGeoMandalaWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('geo_mandala');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxRadius = Math.min(width, height) * (settings.maxAmplitude / 100);
  
  // Initialize state
  if (!geoMandalaState.sMel || (mel && geoMandalaState.sMel.length !== mel.length)) {
    geoMandalaState.sMel = new Float32Array(mel ? mel.length : 1).fill(0);
  }

  // Smooth values
  const lerp = 0.08;
  geoMandalaState.sBeat += (beatPulse - geoMandalaState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    geoMandalaState.sChroma[i] += (chroma[i] - geoMandalaState.sChroma[i]) * lerp;
  }
  if (mel) {
    for (let i = 0; i < mel.length; i++) {
      geoMandalaState.sMel[i] += (mel[i] - geoMandalaState.sMel[i]) * lerp;
    }
  }

  const sChroma = geoMandalaState.sChroma;
  const sBeat = geoMandalaState.sBeat;
  const sMel = geoMandalaState.sMel;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.globalCompositeOperation = 'lighter';
  
  // Update rotation with momentum
  geoMandalaState.rotation += 0.005 + sBeat * 0.015;

  const numLayers = 8;
  for (let layer = numLayers - 1; layer >= 0; layer--) {
    const layerT = layer / numLayers;
    const cIdx = (layer * 2) % 12;
    const hue = CHROMA_HUES[cIdx];
    const cVal = sChroma[cIdx];
    const mVal = (sMel[layer % sMel.length] + 15) / 15;
    
    // Smooth radius pulsing
    const baseR = maxRadius * (0.2 + layerT * 0.8);
    const layerRadius = baseR * (1 + sBeat * 0.15);
    
    ctx.save();
    const layerRot = geoMandalaState.rotation * (1 + layer * 0.2) * (layer % 2 === 0 ? 1 : -1);
    ctx.rotate(layerRot);
    
    ctx.shadowBlur = 10 + cVal * 20;
    ctx.shadowColor = `hsla(${hue}, 100%, 65%, ${0.2 + cVal * 0.4})`;

    const numPoints = 6 + (layer * 2);
    const angleStep = (Math.PI * 2) / numPoints;

    if (layer >= 6) {
      // OUTER: Spirograph Curves
      ctx.beginPath();
      const curvePoints = 120;
      for (let i = 0; i <= curvePoints; i++) {
        const theta = (i / curvePoints) * Math.PI * 2;
        const r1 = layerRadius * 0.7;
        const r2 = layerRadius * 0.3 * mVal;
        const x = (r1 + r2) * Math.cos(theta) - r2 * Math.cos(((r1 + r2) / r2) * theta);
        const y = (r1 + r2) * Math.sin(theta) - r2 * Math.sin(((r1 + r2) / r2) * theta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${0.1 + cVal * 0.5})`;
      ctx.lineWidth = 1 + cVal * 2;
      ctx.stroke();
    } 
    else if (layer >= 3) {
      // MID: Blooming Petals/Clovers
      for (let p = 0; p < numPoints; p++) {
        const angle = p * angleStep;
        ctx.save();
        ctx.rotate(angle);
        
        const pLen = layerRadius * 0.4 * mVal;
        const pWid = pLen * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(layerRadius - pLen, 0);
        ctx.bezierCurveTo(
          layerRadius - pLen / 2, -pWid,
          layerRadius + pWid / 2, -pWid / 2,
          layerRadius, 0
        );
        ctx.bezierCurveTo(
          layerRadius + pWid / 2, pWid / 2,
          layerRadius - pLen / 2, pWid,
          layerRadius - pLen, 0
        );
        
        const grad = ctx.createLinearGradient(layerRadius - pLen, 0, layerRadius, 0);
        grad.addColorStop(0, `hsla(${hue}, 100%, 60%, 0)`);
        grad.addColorStop(0.5, `hsla(${(hue + 30) % 360}, 100%, 75%, ${0.2 + cVal * 0.5})`);
        grad.addColorStop(1, `hsla(${hue}, 100%, 90%, 0)`);
        
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Glowing veins
        ctx.strokeStyle = `hsla(${hue}, 100%, 95%, ${0.1 + cVal * 0.2})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(layerRadius - pLen, 0);
        ctx.lineTo(layerRadius, 0);
        ctx.stroke();
        
        ctx.restore();
      }
    } 
    else {
      // INNER: Pulsing Crystalline Stars
      ctx.beginPath();
      for (let p = 0; p < numPoints * 2; p++) {
        const r = (p % 2 === 0) ? layerRadius : (layerRadius * 0.3 * mVal);
        const a = p * (angleStep / 2);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      
      const starAlpha = 0.1 + cVal * 0.4;
      const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, layerRadius);
      starGrad.addColorStop(0, `hsla(${hue}, 100%, 90%, ${starAlpha})`);
      starGrad.addColorStop(1, `hsla(${(hue + 40) % 360}, 100%, 50%, 0)`);
      
      ctx.fillStyle = starGrad;
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 100%, 95%, ${0.5 + cVal * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  // Divine Core
  const coreRad = 40 + sBeat * 50;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRad);
  coreGrad.addColorStop(0, '#fff');
  coreGrad.addColorStop(0.2, `hsla(${time * 40 % 360}, 100%, 85%, 0.9)`);
  coreGrad.addColorStop(0.5, `hsla(${time * 40 % 360}, 100%, 60%, 0.3)`);
  coreGrad.addColorStop(1, 'transparent');
  
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coreRad, 0, Math.PI * 2);
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
 * Glitched Art 2 🖥️ - The Cyber-Sequel. Deep data corruption, pixel shards, and temporal jitter.
 * Improved motion state, multi-axial displacement, and hue-cycle malfunctions.
 */
function drawGlitchArt2Wave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('glitch_art_2');
  const intensity = (settings.maxAmplitude / 80) * (0.5 + beatPulse);
  
  // Update State
  const lerp = 0.15;
  glitch2State.sBeat += (beatPulse - glitch2State.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    glitch2State.sChroma[i] += (chroma[i] - glitch2State.sChroma[i]) * lerp;
  }
  
  // Dominant Mood
  let dominantIdx = 0;
  let maxV = 0;
  for (let i = 0; i < 12; i++) {
    if (glitch2State.sChroma[i] > maxV) {
      maxV = glitch2State.sChroma[i];
      dominantIdx = i;
    }
  }
  const baseHue = CHROMA_HUES[dominantIdx];

  ctx.save();
  
  // 1. Screen Shake / Temporal Jitter
  if (glitch2State.sBeat > 0.6) {
    const shakeX = (Math.random() - 0.5) * 40 * glitch2State.sBeat;
    const shakeY = (Math.random() - 0.5) * 20 * glitch2State.sBeat;
    ctx.translate(shakeX, shakeY);
    
    // RGB Split Overlay (Flash)
    if (Math.random() > 0.8) {
      ctx.fillStyle = `rgba(255, 0, 0, 0.1)`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // 2. Data Corruption Blocks (Background Layer)
  const numBlocks = 10 + Math.floor(glitch2State.sBeat * 20);
  for (let i = 0; i < numBlocks; i++) {
    const t = (time * 15 + i * 7) % 100;
    if (t < 5) { // Only manifest briefly
      const blockX = Math.random() * width;
      const blockY = Math.random() * height;
      const blockW = 20 + Math.random() * 200 * intensity;
      const blockH = 2 + Math.random() * 50 * intensity;
      
      const hue = (baseHue + Math.random() * 60 - 30 + 360) % 360;
      ctx.fillStyle = `hsla(${hue}, 90%, 50%, ${0.2 + Math.random() * 0.3})`;
      ctx.fillRect(blockX, blockY, blockW, blockH);
      
      // Horizontal "Scanline" spill from block
      if (Math.random() > 0.5) {
        ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.fillRect(0, blockY + blockH/2, width, 1);
      }
    }
  }

  // 3. Pixel Shards (Procedural Waveform)
  const numShards = 40;
  const shardWidth = width / numShards;
  
  for (let i = 0; i < numShards; i++) {
    const mIdx = Math.floor((i / numShards) * (mel?.length || 1));
    const mVal = mel ? (mel[mIdx] + 10) / 10 : 0.5;
    const cIdx = i % 12;
    const cVal = glitch2State.sChroma[cIdx];
    
    const x = i * shardWidth;
    const baseY = height * (settings.basePosition / 100);
    const h = (mVal * 150 + cVal * 100) * intensity;
    
    // Jitter shard X position
    const jitterX = Math.sin(time * 20 + i) * 10 * glitch2State.sBeat;
    
    // Draw Shard
    const hue = (CHROMA_HUES[cIdx] + time * 20) % 360;
    const grad = ctx.createLinearGradient(x, baseY - h, x, baseY + h);
    grad.addColorStop(0, `hsla(${hue}, 100%, 60%, 0)`);
    grad.addColorStop(0.5, `hsla(${hue}, 100%, 70%, ${0.6 + cVal * 0.4})`);
    grad.addColorStop(1, `hsla(${hue}, 100%, 60%, 0)`);
    
    ctx.fillStyle = grad;
    ctx.fillRect(x + jitterX, baseY - h, shardWidth - 2, h * 2);

    // Occasional "dead pixel" vertical line
    if (i % 7 === 0 && Math.random() > 0.95) {
        ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.4)`;
        ctx.fillRect(x + jitterX, 0, 1, height);
    }
  }

  // 4. Ghosting / Afterimage (Simple Simulated)
  if (glitch2State.sBeat > 0.7 && Math.random() > 0.5) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.3;
    const ghostOffset = 15;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(ghostOffset, 0, 2, height);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(-ghostOffset, 0, 2, height);
    ctx.restore();
  }

  // 5. Binary / Hex Static (Occasional Overlay)
  if (time % 2 > 1.8) {
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const hexChars = '0123456789ABCDEF';
    for(let j=0; j<10; j++) {
        const hx = Math.random() * width;
        const hy = Math.random() * height;
        const char = hexChars[Math.floor(Math.random()*hexChars.length)];
        ctx.fillText(char, hx, hy);
    }
  }

  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Glitch Art 3 📡 - Corrupted broadcast: a bold mel waveform whose R/G/B
 * channels tear apart on beats, with quantized jump-cut glitches, a rolling
 * VHS tracking band, and digital block-rain in chroma colors
 */
function drawGlitchArt3Wave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('glitch_art_3');
  const centerY = height * (settings.basePosition / 100);
  const amp = height * 0.5 * (settings.maxAmplitude / 100);

  // Deterministic pseudo-random from a seed — glitches snap on quantized time
  const rand = (seed) => {
    const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  // Time quantized to jump-cut steps; steps shorten when the music slaps
  const stepLen = beatPulse > 0.6 ? 0.09 : 0.22;
  const tq = Math.floor(time / stepLen);
  const glitchAmount = Math.min(1, beatPulse * 1.2 + rand(tq) * 0.25);

  const melAt = (t) => {
    if (!mel || mel.length === 0) return 0.5;
    const idx = Math.floor(Math.max(0, Math.min(0.999, t)) * mel.length);
    return Math.max(0, Math.min(1, (mel[idx] + 10) / 10));
  };

  let dominantIdx = 0;
  for (let i = 1; i < 12; i++) {
    if ((chroma[i] || 0) > (chroma[dominantIdx] || 0)) dominantIdx = i;
  }
  const dominantHue = CHROMA_HUES[dominantIdx];

  // Waveform y at horizontal position t, sliced into tearing segments
  const numSegments = 12;
  const waveYAt = (t, channelShift) => {
    const seg = Math.floor(t * numSegments);
    const tear = (rand(tq * 31 + seg) - 0.5) * amp * 0.8 * glitchAmount;
    const m = melAt(t);
    const wave = Math.sin(t * Math.PI * 5 + time * 2.2) * 0.3 + Math.sin(t * Math.PI * 11 - time * 3.7) * 0.15;
    return centerY - (m * 0.7 + wave * 0.3) * amp + tear + channelShift;
  };

  // Draw the waveform three times: R, G, B channels split by the glitch
  ctx.globalCompositeOperation = 'lighter';
  const split = 3 + glitchAmount * 18;
  const channels = [
    { color: `rgba(255, 40, 60, 0.8)`, dx: -split, dy: -split * 0.3 },
    { color: `rgba(40, 255, 120, 0.8)`, dx: 0, dy: 0 },
    { color: `rgba(60, 120, 255, 0.8)`, dx: split, dy: split * 0.3 }
  ];
  const points = 96;
  for (const ch of channels) {
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const seg = Math.floor(t * numSegments);
      // Segments also shift horizontally when tearing
      const hShift = (rand(tq * 17 + seg * 7) - 0.5) * width * 0.04 * glitchAmount;
      const x = t * width + hShift + ch.dx;
      const y = waveYAt(t, ch.dy);
      // Break the path at segment boundaries so tears are hard cuts
      if (i === 0 || Math.floor(((i - 1) / points) * numSegments) !== seg) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = ch.color;
    ctx.lineWidth = 2.5 + beatPulse * 2;
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';

  // Solid fill under the green (true) channel, torn per-segment
  for (let seg = 0; seg < numSegments; seg++) {
    const t0 = seg / numSegments;
    const t1 = (seg + 1) / numSegments;
    const hShift = (rand(tq * 17 + seg * 7) - 0.5) * width * 0.04 * glitchAmount;
    const chromaIdx = seg % 12;
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;

    ctx.beginPath();
    const segPts = 8;
    for (let i = 0; i <= segPts; i++) {
      const t = t0 + (t1 - t0) * (i / segPts);
      const x = t * width + hShift;
      const y = waveYAt(t, 0);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(t1 * width + hShift, centerY + amp * 0.25);
    ctx.lineTo(t0 * width + hShift, centerY + amp * 0.25);
    ctx.closePath();
    ctx.fillStyle = `hsla(${CHROMA_HUES[chromaIdx]}, 90%, 55%, ${0.08 + chromaValue * 0.2})`;
    ctx.fill();
  }

  // Rolling VHS tracking band — displaces a horizontal strip as it sweeps
  const bandY = ((time * 0.13) % 1) * height * 1.2 - height * 0.1;
  const bandH = 14 + beatPulse * 30;
  ctx.fillStyle = `rgba(255, 255, 255, ${0.04 + beatPulse * 0.06})`;
  ctx.fillRect(0, bandY, width, bandH);
  ctx.fillStyle = `hsla(${dominantHue}, 90%, 60%, ${0.05 + glitchAmount * 0.1})`;
  ctx.fillRect((rand(tq * 3) - 0.5) * width * 0.1, bandY + bandH, width, 2);

  // Digital block-rain: falling squares in chroma colors, denser when loud
  const numBlocks = 22;
  for (let b = 0; b < numBlocks; b++) {
    const colX = rand(b * 13) * width;
    const fallSpeed = 0.15 + rand(b * 29) * 0.35;
    const by = (((time * fallSpeed + rand(b * 7)) % 1)) * height;
    const chromaIdx = b % 12;
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.2 && rand(tq + b) > 0.3) continue;
    const bs = 3 + chromaValue * 10 + (rand(tq * 5 + b) < glitchAmount ? 8 : 0);
    ctx.fillStyle = `hsla(${CHROMA_HUES[chromaIdx]}, 95%, 60%, ${0.25 + chromaValue * 0.5})`;
    ctx.fillRect(colX, by, bs, bs);
    // Trailing echo block
    ctx.fillStyle = `hsla(${CHROMA_HUES[chromaIdx]}, 95%, 60%, ${(0.25 + chromaValue * 0.5) * 0.3})`;
    ctx.fillRect(colX, by - bs * 2, bs, bs);
  }

  // Full-frame corruption on the hardest hits: inverted bars + freeze flicker
  if (glitchAmount > 0.75) {
    const numBars = 3;
    for (let i = 0; i < numBars; i++) {
      const barY = rand(tq * 41 + i) * height;
      const barH = 4 + rand(tq * 43 + i) * 26;
      ctx.fillStyle = `hsla(${(dominantHue + 180) % 360}, 100%, 60%, ${0.15 * glitchAmount})`;
      ctx.fillRect(0, barY, width, barH);
    }
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * glitchAmount})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(width * 0.02, height * 0.02, width * 0.96, height * 0.96);
  }

  // Faint scanlines to sell the broadcast
  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }

  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Maze Mystery 🌀 - Infinite trippy maze tunnel: nested maze rings endlessly
 * zoom out of the center, twisting as they grow, walls glowing chroma colors.
 * The zoom is a seamless loop; energy drives speed, beats kick the twist.
 */
function drawMazeMysteryWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('maze_mystery');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxRadius = Math.max(width, height) * 0.75 * (settings.maxAmplitude / 100);

  let melEnergy = 0.5;
  if (mel && mel.length > 0) {
    const avg = mel.reduce((a, b) => a + b, 0) / mel.length;
    melEnergy = Math.max(0, Math.min(1, (avg + 10) / 10));
  }

  // Deterministic pseudo-random so the maze is stable per ring/cell
  const rand = (seed) => {
    const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };

  const numRings = 11;
  const growth = 1.45;                       // radius ratio between rings
  const zoomSpeed = 0.25 + melEnergy * 0.5 + beatPulse * 0.3;
  const zoomPhase = (time * zoomSpeed) % 1;  // 0..1, seamless loop
  const twist = time * 0.15 + beatPulse * 0.12;

  // Each ring's identity shifts by 1 every loop so walls stay consistent
  // as rings flow outward (ring k today is ring k+1's pattern next cycle)
  const epoch = Math.floor(time * zoomSpeed);

  for (let k = numRings - 1; k >= 0; k--) {
    // Ring radius grows exponentially with the loop phase folded in
    const fk = k + zoomPhase;
    const radius = maxRadius * Math.pow(growth, fk - numRings + 1);
    if (radius < 4 || radius > maxRadius * 1.2) continue;

    const ringSeed = (epoch + numRings - 1 - k) * 97;
    const depth = radius / maxRadius;        // 0 center .. 1 edge
    const cells = 8 + (k % 3) * 4;           // walls per ring
    const rot = twist * (1 - depth * 0.6) + rand(ringSeed) * Math.PI * 2;
    const innerR = radius / growth;

    const chromaIdx = (epoch + numRings - 1 - k) % 12;
    const chromaValue = chroma[chromaIdx] || 0;
    const hue = CHROMA_HUES[chromaIdx];
    const fade = Math.sin(Math.min(1, depth) * Math.PI); // fade in center, fade at edge
    const alpha = fade * (0.25 + chromaValue * 0.45 + beatPulse * 0.2);
    if (alpha < 0.02) continue;

    ctx.strokeStyle = `hsla(${hue}, 85%, ${50 + chromaValue * 25}%, ${alpha})`;
    ctx.lineWidth = (1 + depth * 3) * (1 + beatPulse * 0.6);
    ctx.shadowColor = `hsla(${hue}, 90%, 60%, ${alpha})`;
    ctx.shadowBlur = 4 + chromaValue * 10 + beatPulse * 8;
    ctx.lineCap = 'round';

    // Maze walls on this ring: arc segments (corridors) + radial spokes (doors)
    ctx.beginPath();
    for (let c = 0; c < cells; c++) {
      const a0 = (c / cells) * Math.PI * 2 + rot;
      const a1 = ((c + 1) / cells) * Math.PI * 2 + rot;
      const cellSeed = ringSeed + c * 13;

      // Arc wall present ~70% of the time
      if (rand(cellSeed) < 0.7) {
        const trim = (a1 - a0) * 0.08;
        ctx.moveTo(centerX + Math.cos(a0 + trim) * radius, centerY + Math.sin(a0 + trim) * radius);
        ctx.arc(centerX, centerY, radius, a0 + trim, a1 - trim);
      }
      // Radial wall (blocked door) ~40% of the time
      if (rand(cellSeed + 7) < 0.4) {
        ctx.moveTo(centerX + Math.cos(a0) * innerR, centerY + Math.sin(a0) * innerR);
        ctx.lineTo(centerX + Math.cos(a0) * radius, centerY + Math.sin(a0) * radius);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Runner lights racing through the corridors — one per strong chroma note
  for (let i = 0; i < 12; i++) {
    const chromaValue = chroma[i] || 0;
    if (chromaValue < 0.35) continue;
    const hue = CHROMA_HUES[i];
    // Each runner spirals outward in its own loop, synced to the zoom
    const runPhase = ((time * zoomSpeed * 0.5 + i / 12) % 1);
    const rr = maxRadius * Math.pow(growth, runPhase * 4 - 4);
    const ra = runPhase * Math.PI * 6 + i * (Math.PI / 6) + twist;
    const rx = centerX + Math.cos(ra) * rr;
    const ry = centerY + Math.sin(ra) * rr;
    const fade = Math.sin(runPhase * Math.PI);

    ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${fade * (0.5 + chromaValue * 0.5)})`;
    ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.9)`;
    ctx.shadowBlur = 10 + beatPulse * 12;
    ctx.beginPath();
    ctx.arc(rx, ry, 3 + chromaValue * 4 + beatPulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // The mystery at the center of the maze
  let dominantIdx = 0;
  for (let i = 1; i < 12; i++) {
    if ((chroma[i] || 0) > (chroma[dominantIdx] || 0)) dominantIdx = i;
  }
  const coreHue = CHROMA_HUES[dominantIdx];
  const coreR = maxRadius * 0.045 * (1 + beatPulse * 0.5 + Math.sin(time * 3) * 0.1);
  const core = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreR * 3);
  core.addColorStop(0, `hsla(${coreHue}, 100%, 80%, ${0.8 + beatPulse * 0.2})`);
  core.addColorStop(0.4, `hsla(${coreHue}, 90%, 55%, 0.4)`);
  core.addColorStop(1, 'transparent');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(centerX, centerY, coreR * 3, 0, Math.PI * 2);
  ctx.fill();

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
 * Ocean Waves 🌊 - Atmospheric sea with reactive sun/moon and multi-layer parallax waves
 * Uses state-based smoothing for fluid swells and persistent foam.
 */
function drawOceanWavesWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('ocean_waves');
  // basePosition controls where the ocean sits
  const baseY = height * (settings.basePosition / 100);
  // maxAmplitude controls wave height
  const maxAmp = height * (settings.maxAmplitude / 100);

  // Initialize/Update state
  if (!oceanState.sMel || (mel && oceanState.sMel.length !== mel.length)) {
    oceanState.sMel = new Float32Array(mel ? mel.length : 1).fill(0);
  }
  const lerp = 0.08;
  oceanState.sBeat += (beatPulse - oceanState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    oceanState.sChroma[i] += (chroma[i] - oceanState.sChroma[i]) * lerp;
  }
  if (mel) {
    for (let i = 0; i < mel.length; i++) {
      oceanState.sMel[i] += (mel[i] - oceanState.sMel[i]) * lerp;
    }
  }

  // Determine dominant mood (Warm/Sunset vs Cool/Moonlight)
  let energySum = 0;
  let warmEnergy = 0; // Hues 0-60 (Red-Yellow)
  let coolEnergy = 0; // Hues 180-240 (Blue-Cyan)
  
  for (let i = 0; i < 12; i++) {
    const val = oceanState.sChroma[i];
    energySum += val;
    const hue = CHROMA_HUES[i];
    if (hue <= 60 || hue >= 330) warmEnergy += val;
    if (hue >= 180 && hue <= 270) coolEnergy += val;
  }
  
  const isNight = coolEnergy > warmEnergy;
  const avgEnergy = energySum / 12;

  // 1. Draw Atmospheric Backdrop (Gradient Sky)
  ctx.save();
  const skyGrad = ctx.createLinearGradient(0, 0, 0, baseY);
  if (isNight) {
    skyGrad.addColorStop(0, '#000814');
    skyGrad.addColorStop(0.7, '#001d3d');
    skyGrad.addColorStop(1, '#003566');
  } else {
    skyGrad.addColorStop(0, '#ff9e00');
    skyGrad.addColorStop(0.5, '#ff6700');
    skyGrad.addColorStop(1, '#ff0054');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, baseY + 20);

  // 2. Draw Celestial Body (Sun/Moon)
  const celX = width * 0.75;
  const celY = baseY * 0.4;
  const celSize = 40 + oceanState.sBeat * 20;
  
  ctx.beginPath();
  const celGrad = ctx.createRadialGradient(celX, celY, celSize * 0.2, celX, celY, celSize);
  if (isNight) {
    celGrad.addColorStop(0, '#fdfcf0');
    celGrad.addColorStop(0.5, '#e2e2e2');
    celGrad.addColorStop(1, 'rgba(226, 226, 226, 0)');
  } else {
    celGrad.addColorStop(0, '#ffffff');
    celGrad.addColorStop(0.4, '#fff9c4');
    celGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  }
  ctx.fillStyle = celGrad;
  ctx.arc(celX, celY, celSize, 0, Math.PI * 2);
  ctx.fill();

  // 3. Draw Water Layers (Parallax)
  const layers = 5;
  for (let l = 0; l < layers; l++) {
    const layerDepth = (l + 1) / layers;
    const layerY = baseY + (l * (height - baseY) / layers);
    const layerFreq = 0.002 + l * 0.001;
    const layerSpeed = time * (0.5 + l * 0.2);
    
    // Wave height based on mel for specific frequency bands
    const mIdx = Math.floor(l * (oceanState.sMel.length / layers));
    const melBounce = (oceanState.sMel[mIdx] || 0) * 15;
    const amplitude = (15 + l * 10) * (0.5 + oceanState.sBeat) + melBounce;

    ctx.beginPath();
    ctx.moveTo(0, height);
    
    for (let x = 0; x <= width; x += 15) {
      // Composition of 3 octaves
      const noise1 = Math.sin(x * layerFreq + layerSpeed);
      const noise2 = Math.sin(x * layerFreq * 2.5 - layerSpeed * 1.3) * 0.5;
      const noise3 = Math.sin(x * layerFreq * 0.5 + layerSpeed * 0.7) * 1.5;
      
      const waveY = layerY + (noise1 + noise2 + noise3) * amplitude;
      ctx.lineTo(x, waveY);
    }
    
    ctx.lineTo(width, height);
    ctx.closePath();

    // Water Gradient
    const waterGrad = ctx.createLinearGradient(0, layerY - amplitude, 0, height);
    const h = isNight ? 210 : 200;
    const s = isNight ? 80 : 70;
    const l_val = isNight ? (20 + l * 5) : (30 + l * 8);
    
    waterGrad.addColorStop(0, `hsla(${h}, ${s}%, ${l_val}%, 0.9)`);
    waterGrad.addColorStop(1, `hsla(${h}, ${s + 10}%, ${l_val - 10}%, 1.0)`);
    ctx.fillStyle = waterGrad;
    ctx.fill();

    // Specular Highlight on crests
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + l * 0.1})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Celestial Reflection on this layer
    const reflectX = celX;
    const reflectWidth = 60 + l * 40 + oceanState.sBeat * 30;
    const reflectGrad = ctx.createRadialGradient(reflectX, layerY, 5, reflectX, layerY, reflectWidth);
    const refColor = isNight ? '255, 255, 255' : '255, 240, 200';
    reflectGrad.addColorStop(0, `rgba(${refColor}, ${0.3 + l * 0.1})`);
    reflectGrad.addColorStop(1, `rgba(${refColor}, 0)`);
    
    ctx.fillStyle = reflectGrad;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillRect(reflectX - reflectWidth / 2, layerY - 10, reflectWidth, 20);
    ctx.globalCompositeOperation = 'source-over';
  }

  // 4. Foam Particles
  if (oceanState.foamParticles.length < 50 && oceanState.sBeat > 0.5) {
    for (let i = 0; i < 3; i++) {
      oceanState.foamParticles.push({
        x: Math.random() * width,
        y: baseY + Math.random() * (height - baseY),
        vx: (Math.random() - 0.5) * 2,
        vy: -0.5 - Math.random() * 1.5,
        life: 1.0,
        size: 1 + Math.random() * 3
      });
    }
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  for (let i = oceanState.foamParticles.length - 1; i >= 0; i--) {
    const p = oceanState.foamParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.015;
    if (p.life <= 0) {
      oceanState.foamParticles.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Galaxy Spiral 🌀 - Spinning galaxy with stars and cosmic dust
 * Arms spiral based on time, stars pulse with chroma
 */

/**
 * Galaxy Spiral 🌀 - Spinning galaxy with cosmic dust and rhythmic pulses
 * Uses state-based smoothing for fluid rotation and organic "melodic" thickness
 */
function drawGalaxySpiralWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('galaxy_spiral');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxRadius = Math.min(width, height) * (settings.maxAmplitude / 100);

  // Initialize and smooth state
  if (!galaxyState.sMel || (mel && galaxyState.sMel.length !== mel.length)) {
    galaxyState.sMel = new Float32Array(mel ? mel.length : 1).fill(0);
  }
  const lerp = 0.1;
  galaxyState.sBeat += (beatPulse - galaxyState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    galaxyState.sChroma[i] += (chroma[i] - galaxyState.sChroma[i]) * lerp;
  }
  if (mel) {
    for (let i = 0; i < mel.length; i++) {
        galaxyState.sMel[i] += (mel[i] - galaxyState.sMel[i]) * lerp;
    }
  }

  // Update persistent rotation
  const totalEnergy = galaxyState.sChroma.reduce((a, b) => a + b, 0) / 12;
  galaxyState.rotation += (0.01 + totalEnergy * 0.05);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  
  // Draw spiral arms
  const numArms = 2; // Precise, high-impact arms
  const pointsPerArm = 120;
  
  for (let arm = 0; arm < numArms; arm++) {
    const armOffset = (arm / numArms) * Math.PI * 2;
    const chromaIdx = (arm * 6) % 12;
    const chromaValue = galaxyState.sChroma[chromaIdx];
    const armHue = CHROMA_HUES[chromaIdx];
    
    for (let p = 0; p < pointsPerArm; p++) {
      const t = p / pointsPerArm;
      const radius = t * maxRadius;
      
      // Logarithmic spiral with organic wobble
      const spiralAngle = armOffset + t * Math.PI * 5 + galaxyState.rotation + Math.sin(time * 0.5 + t * 4) * 0.2;
      
      const mIdx = Math.floor(t * (galaxyState.sMel.length - 1));
      const mVal = (galaxyState.sMel[mIdx] + 15) / 15;
      
      // Perspective transform
      const x = centerX + Math.cos(spiralAngle) * radius;
      const y = centerY + Math.sin(spiralAngle) * radius * 0.5;
      
      const size = (1.5 + mVal * 3 + galaxyState.sBeat * 2) * (1 - t * 0.4);
      const alpha = (0.2 + chromaValue * 0.6) * (1 - t * 0.5);
      
      // Cosmic Ether (Gas)
      if (p % 4 === 0) {
        ctx.fillStyle = `hsla(${armHue}, 80%, 60%, ${alpha * 0.15})`;
        ctx.beginPath();
        ctx.arc(x, y, size * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Individual Stars & Twinkle
      if (p % 2 === 0) {
        const twinkle = 0.8 + Math.sin(time * 5 + p) * 0.2;
        ctx.fillStyle = `hsla(${armHue}, 30%, 95%, ${alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // Dynamic streaks
        if (p % 10 === 0 && chromaValue > 0.5) {
          ctx.strokeStyle = `hsla(${armHue}, 100%, 80%, ${alpha * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(spiralAngle + Math.PI/2) * 10, y + Math.sin(spiralAngle + Math.PI/2) * 5);
          ctx.stroke();
        }
      }
    }
  }
  
  // Central core
  const coreRadius = (25 + galaxyState.sBeat * 20 + totalEnergy * 30);
  const coreHue = CHROMA_HUES[Math.floor(time) % 12];
  
  const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 1.5);
  coreGrad.addColorStop(0, `hsla(${coreHue}, 60%, 90%, 0.8)`);
  coreGrad.addColorStop(0.4, `hsla(${coreHue}, 80%, 60%, 0.3)`);
  coreGrad.addColorStop(1, 'transparent');
  
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, coreRadius * 1.5, coreRadius * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Lava Lamp 🫧 - Hypnotic floating blobs that rise, merge, and pulse with the beat
 * Organic, chill aesthetic with warm gradients and soft glow
 */
function drawLavaLampWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const minDim = Math.min(width, height);
  
  // Smooth state updates
  const lerp = 0.08;
  lavaLampState.sBeat += (beatPulse - lavaLampState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    lavaLampState.sChroma[i] += (chroma[i] - lavaLampState.sChroma[i]) * lerp;
  }
  
  // Initialize blobs on first run
  if (!lavaLampState.initialized || lavaLampState.blobs.length === 0) {
    lavaLampState.blobs = [];
    const numBlobs = 6;
    for (let i = 0; i < numBlobs; i++) {
      lavaLampState.blobs.push({
        x: 0.2 + Math.random() * 0.6,
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.001,
        vy: -0.001 - Math.random() * 0.002,
        baseSize: 0.08 + Math.random() * 0.1,
        size: 0.1,
        hue: Math.random() * 60, // Warm hues: 0-60 (red to yellow)
        phase: Math.random() * Math.PI * 2
      });
    }
    lavaLampState.initialized = true;
  }
  
  // Find dominant chroma for color influence
  let dominantIdx = 0;
  let maxVal = 0;
  for (let i = 0; i < 12; i++) {
    if (lavaLampState.sChroma[i] > maxVal) {
      maxVal = lavaLampState.sChroma[i];
      dominantIdx = i;
    }
  }
  const dominantHue = CHROMA_HUES[dominantIdx];
  
  ctx.save();
  
  // Draw lamp container background (dark with subtle gradient)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#1a0a1a');
  bgGrad.addColorStop(0.5, '#0d0510');
  bgGrad.addColorStop(1, '#1a0a1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
  
  // Draw subtle "heat convection" lines
  ctx.strokeStyle = 'rgba(255, 100, 50, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const x = width * (0.2 + i * 0.08);
    ctx.beginPath();
    ctx.moveTo(x, height);
    for (let y = height; y > 0; y -= 20) {
      const wave = Math.sin(y * 0.01 + time * 0.5 + i) * 10;
      ctx.lineTo(x + wave, y);
    }
    ctx.stroke();
  }
  
  // Update and draw blobs
  ctx.globalCompositeOperation = 'lighter';
  
  for (let blob of lavaLampState.blobs) {
    // Wobble movement
    blob.phase += 0.02;
    const wobbleX = Math.sin(blob.phase) * 0.002;
    const wobbleY = Math.sin(blob.phase * 0.7) * 0.0005;
    
    // Beat reaction
    const beatBoost = lavaLampState.sBeat * 0.003;
    
    // Update position
    blob.x += blob.vx + wobbleX;
    blob.y += blob.vy + wobbleY - beatBoost;
    
    // Bounce off walls (with damping)
    if (blob.x < 0.15) { blob.x = 0.15; blob.vx = Math.abs(blob.vx) * 0.8; }
    if (blob.x > 0.85) { blob.x = 0.85; blob.vx = -Math.abs(blob.vx) * 0.8; }
    
    // Wrap vertically (respawn at bottom when reaching top)
    if (blob.y < -0.1) {
      blob.y = 1.1;
      blob.x = 0.3 + Math.random() * 0.4;
      blob.vx = (Math.random() - 0.5) * 0.001;
    }
    if (blob.y > 1.1) {
      blob.y = 1.1;
      blob.vy = -Math.abs(blob.vy);
    }
    
    // Size pulsing with beat and chroma
    const chromaBoost = lavaLampState.sChroma[dominantIdx] * 0.03;
    const beatSize = lavaLampState.sBeat * 0.04;
    blob.size += (blob.baseSize + chromaBoost + beatSize - blob.size) * 0.1;
    
    // Draw blob with layered gradients for soft glow
    const bx = blob.x * width;
    const by = blob.y * height;
    const br = blob.size * minDim;
    
    // Calculate hue (blend between blob's base hue and dominant music hue)
    const hue = (blob.hue + dominantHue * 0.3) % 360;
    
    // Outer glow (largest, most transparent)
    const glowGrad = ctx.createRadialGradient(bx, by, 0, bx, by, br * 2);
    glowGrad.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.3)`);
    glowGrad.addColorStop(0.5, `hsla(${hue}, 100%, 50%, 0.1)`);
    glowGrad.addColorStop(1, `hsla(${hue}, 100%, 40%, 0)`);
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Main blob body
    const blobGrad = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, 0, bx, by, br);
    blobGrad.addColorStop(0, `hsla(${hue + 20}, 100%, 80%, 0.9)`);
    blobGrad.addColorStop(0.4, `hsla(${hue}, 100%, 60%, 0.8)`);
    blobGrad.addColorStop(0.8, `hsla(${hue - 10}, 100%, 45%, 0.7)`);
    blobGrad.addColorStop(1, `hsla(${hue - 20}, 100%, 30%, 0.5)`);
    ctx.fillStyle = blobGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    
    // Specular highlight (small bright spot)
    const specGrad = ctx.createRadialGradient(bx - br * 0.4, by - br * 0.4, 0, bx - br * 0.3, by - br * 0.3, br * 0.4);
    specGrad.addColorStop(0, `rgba(255, 255, 255, 0.6)`);
    specGrad.addColorStop(0.5, `rgba(255, 255, 255, 0.2)`);
    specGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw "merge" effect where blobs overlap (simplified metaball look)
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < lavaLampState.blobs.length; i++) {
    for (let j = i + 1; j < lavaLampState.blobs.length; j++) {
      const b1 = lavaLampState.blobs[i];
      const b2 = lavaLampState.blobs[j];
      const dx = (b1.x - b2.x) * width;
      const dy = (b1.y - b2.y) * height;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const r1 = b1.size * minDim;
      const r2 = b2.size * minDim;
      const overlap = (r1 + r2) - dist;
      
      if (overlap > 0 && dist > 0) {
        // Draw a glowing bridge between overlapping blobs
        const mx = ((b1.x + b2.x) / 2) * width;
        const my = ((b1.y + b2.y) / 2) * height;
        const bridgeSize = Math.min(overlap * 0.5, r1 * 0.5, r2 * 0.5);
        const hue = (b1.hue + b2.hue + dominantHue) / 3;
        
        const bridgeGrad = ctx.createRadialGradient(mx, my, 0, mx, my, bridgeSize);
        bridgeGrad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.6)`);
        bridgeGrad.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
        ctx.fillStyle = bridgeGrad;
        ctx.beginPath();
        ctx.arc(mx, my, bridgeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  // Subtle vignette for lamp container feel
  const vignetteGrad = ctx.createRadialGradient(width / 2, height / 2, minDim * 0.3, width / 2, height / 2, minDim * 0.8);
  vignetteGrad.addColorStop(0, 'transparent');
  vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = vignetteGrad;
  ctx.fillRect(0, 0, width, height);
  
  // Glass reflection overlay (subtle)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.beginPath();
  ctx.ellipse(width * 0.3, height * 0.3, width * 0.15, height * 0.25, -0.3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Synthwave Horizon 🌅🛤️ - Outrun/Retrowave infinite grid racing toward you
 * Features: Neon sun, perspective grid floor, VHS scanlines, beat-reactive glitches
 * Inspired by Glitch Art 2's smooth state, randomness that syncs with music
 */
function drawSynthwaveHorizonWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('synthwave_horizon');
  const intensity = (settings.maxAmplitude / 70) * (0.6 + beatPulse * 0.4);
  
  // Smooth state updates (like Glitch Art 2)
  const lerp = 0.12;
  synthwaveState.sBeat += (beatPulse - synthwaveState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    synthwaveState.sChroma[i] += (chroma[i] - synthwaveState.sChroma[i]) * lerp;
  }
  
  // Find dominant chroma
  let dominantIdx = 0;
  let maxVal = 0;
  for (let i = 0; i < 12; i++) {
    if (synthwaveState.sChroma[i] > maxVal) {
      maxVal = synthwaveState.sChroma[i];
      dominantIdx = i;
    }
  }
  const dominantHue = CHROMA_HUES[dominantIdx];
  
  // Secondary chroma for accent
  let secondaryIdx = (dominantIdx + 6) % 12;
  const secondaryHue = CHROMA_HUES[secondaryIdx];
  
  ctx.save();
  
  // === SCREEN SHAKE (Beat-reactive, like Glitch Art 2) ===
  if (synthwaveState.sBeat > 0.7) {
    const shakeX = (Math.sin(time * 50) * 3 + Math.cos(time * 37) * 2) * synthwaveState.sBeat;
    const shakeY = (Math.cos(time * 43) * 2) * synthwaveState.sBeat;
    ctx.translate(shakeX, shakeY);
  }
  
  // === HORIZON POSITION ===
  const horizonY = height * (settings.basePosition / 100);
  
  // === SKY GRADIENT (Sunset vibes) ===
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  // Deep purple to hot pink/orange
  skyGrad.addColorStop(0, `hsla(280, 60%, 8%, 1)`);
  skyGrad.addColorStop(0.3, `hsla(300, 70%, 15%, 1)`);
  skyGrad.addColorStop(0.6, `hsla(330, 80%, 25%, 1)`);
  skyGrad.addColorStop(0.85, `hsla(${(dominantHue + 350) % 360}, 90%, 40%, 1)`);
  skyGrad.addColorStop(1, `hsla(${(dominantHue + 30) % 360}, 100%, 55%, 1)`);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, horizonY);
  
  // === NEON SUN (Striped, pulsing) ===
  const sunX = width / 2;
  const sunY = horizonY;
  const baseSunRadius = Math.min(width, height) * 0.18;
  const sunPulse = 1 + synthwaveState.sBeat * 0.15;
  synthwaveState.sunPulse += (sunPulse - synthwaveState.sunPulse) * 0.2;
  const sunRadius = baseSunRadius * synthwaveState.sunPulse;
  
  // Sun glow (outer halo)
  ctx.globalCompositeOperation = 'lighter';
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2.5);
  sunGlow.addColorStop(0, `hsla(${(dominantHue + 30) % 360}, 100%, 70%, 0.4)`);
  sunGlow.addColorStop(0.4, `hsla(330, 100%, 60%, 0.2)`);
  sunGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalCompositeOperation = 'source-over';
  
  // Sun body (solid gradient)
  const sunBodyGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
  sunBodyGrad.addColorStop(0, `hsla(50, 100%, 70%, 1)`);
  sunBodyGrad.addColorStop(0.3, `hsla(40, 100%, 60%, 1)`);
  sunBodyGrad.addColorStop(0.6, `hsla(${(dominantHue + 20) % 360}, 100%, 55%, 1)`);
  sunBodyGrad.addColorStop(1, `hsla(330, 100%, 50%, 1)`);
  ctx.fillStyle = sunBodyGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, Math.PI, 0); // Only upper half visible above horizon
  ctx.fill();
  
  // Sun stripes (horizontal scanlines through sun - iconic synthwave look)
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, Math.PI, 0);
  ctx.clip();
  
  ctx.fillStyle = `rgba(${10}, ${5}, ${20}, 0.95)`;
  const stripeCount = 8;
  for (let i = 0; i < stripeCount; i++) {
    const stripeY = sunY - sunRadius + (i * 2 + 1) * (sunRadius / stripeCount);
    const stripeHeight = (sunRadius / stripeCount) * (0.3 + i * 0.08);
    ctx.fillRect(sunX - sunRadius, stripeY, sunRadius * 2, stripeHeight);
  }
  ctx.restore();
  
  // === GRID FLOOR (Perspective racing toward camera) ===
  const gridHeight = height - horizonY;
  
  // Grid floor gradient (dark purple to near-black)
  const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  floorGrad.addColorStop(0, `hsla(280, 80%, 12%, 1)`);
  floorGrad.addColorStop(0.5, `hsla(280, 70%, 6%, 1)`);
  floorGrad.addColorStop(1, `hsla(280, 60%, 3%, 1)`);
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizonY, width, gridHeight);
  
  // Grid movement (racing toward camera)
  const gridSpeed = 0.5 + synthwaveState.sBeat * 0.3 + maxVal * 0.2;
  synthwaveState.gridOffset = (synthwaveState.gridOffset + gridSpeed) % 50;
  
  // === HORIZONTAL GRID LINES (Perspective spacing) ===
  ctx.strokeStyle = `hsla(300, 100%, 60%, ${0.4 + synthwaveState.sBeat * 0.3})`;
  ctx.lineWidth = 1.5;
  
  const numHorizLines = 20;
  for (let i = 0; i < numHorizLines; i++) {
    // Exponential spacing for perspective
    const t = (i + synthwaveState.gridOffset / 50) / numHorizLines;
    const perspectiveT = Math.pow(t, 2.5); // Exponential curve
    const lineY = horizonY + perspectiveT * gridHeight;
    
    if (lineY > horizonY && lineY < height) {
      // Line thickness increases as it gets closer
      ctx.lineWidth = 0.5 + perspectiveT * 2;
      
      // Brightness increases for closer lines
      const alpha = 0.15 + perspectiveT * 0.5;
      const hue = (300 + synthwaveState.sChroma[i % 12] * 30) % 360;
      ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
      
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(width, lineY);
      ctx.stroke();
    }
  }
  
  // === VERTICAL GRID LINES (Converge to vanishing point) ===
  const vanishingX = width / 2;
  const vanishingY = horizonY;
  const numVertLines = 24;
  
  for (let i = 0; i < numVertLines; i++) {
    const t = i / (numVertLines - 1);
    const bottomX = t * width;
    
    // Thickness based on distance from center
    const distFromCenter = Math.abs(t - 0.5);
    ctx.lineWidth = 0.8 + (1 - distFromCenter) * 1.5;
    
    // Color influenced by chroma
    const chromaIdx = i % 12;
    const chromaVal = synthwaveState.sChroma[chromaIdx];
    const hue = (280 + chromaVal * 40 + i * 3) % 360;
    const alpha = 0.2 + chromaVal * 0.3 + (1 - distFromCenter) * 0.2;
    
    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
    
    ctx.beginPath();
    ctx.moveTo(vanishingX, vanishingY);
    ctx.lineTo(bottomX, height);
    ctx.stroke();
  }
  
  // === NEON GLOW ON GRID (Beat-reactive scanline) ===
  synthwaveState.scanY = (synthwaveState.scanY + 2 + synthwaveState.sBeat * 3) % gridHeight;
  const scanLineY = horizonY + synthwaveState.scanY;
  
  const scanGrad = ctx.createLinearGradient(0, scanLineY - 20, 0, scanLineY + 20);
  scanGrad.addColorStop(0, 'transparent');
  scanGrad.addColorStop(0.5, `hsla(${secondaryHue}, 100%, 70%, ${0.3 + synthwaveState.sBeat * 0.4})`);
  scanGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = scanGrad;
  ctx.fillRect(0, scanLineY - 20, width, 40);
  
  // === GLITCH EFFECTS (Like Glitch Art 2) ===
  if (synthwaveState.sBeat > 0.6) {
    synthwaveState.glitchFrame++;
    
    // RGB Split on high beats
    if (synthwaveState.glitchFrame % 3 === 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255, 0, 100, 0.05)`;
      ctx.fillRect(3, 0, width, height);
      ctx.fillStyle = `rgba(0, 255, 255, 0.05)`;
      ctx.fillRect(-3, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }
    
    // Random glitch blocks (deterministic randomness like Glitch Art 2)
    const numBlocks = Math.floor(synthwaveState.sBeat * 8);
    for (let i = 0; i < numBlocks; i++) {
      const seed = Math.sin(i * 4567.89 + Math.floor(time * 15));
      const seed2 = Math.cos(i * 2345.67 + Math.floor(time * 12));
      
      if (Math.abs(seed) > 0.7) {
        const blockX = ((seed + 1) / 2) * width;
        const blockY = horizonY + ((seed2 + 1) / 2) * gridHeight;
        const blockW = 30 + Math.abs(seed) * 100;
        const blockH = 2 + Math.abs(seed2) * 8;
        
        const glitchHue = (dominantHue + i * 30) % 360;
        ctx.fillStyle = `hsla(${glitchHue}, 100%, 60%, ${0.2 + synthwaveState.sBeat * 0.3})`;
        ctx.fillRect(blockX, blockY, blockW, blockH);
      }
    }
  }
  
  // === VHS SCANLINES (Subtle CRT effect) ===
  ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }
  
  // === MEL SPECTRUM MOUNTAINS (Optional silhouette at horizon) ===
  if (mel && mel.length > 0) {
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    
    const numPoints = Math.min(mel.length, 64);
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * width;
      const melVal = Math.max(0, (mel[i] + 10) / 10);
      const mountainHeight = melVal * 40 * intensity;
      ctx.lineTo(x, horizonY - mountainHeight);
    }
    
    ctx.lineTo(width, horizonY);
    ctx.closePath();
    
    const mountainGrad = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY);
    mountainGrad.addColorStop(0, `hsla(280, 60%, 15%, 0.8)`);
    mountainGrad.addColorStop(1, `hsla(280, 60%, 8%, 0.9)`);
    ctx.fillStyle = mountainGrad;
    ctx.fill();
  }
  
  // === PALM TREE SILHOUETTES (Optional sides) ===
  const drawPalm = (px, py, scale, flip) => {
    ctx.save();
    ctx.translate(px, py);
    if (flip) ctx.scale(-1, 1);
    ctx.scale(scale, scale);
    
    // Trunk
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(5, -40, 8, -80);
    ctx.lineTo(12, -80);
    ctx.quadraticCurveTo(10, -40, 6, 0);
    ctx.closePath();
    ctx.fill();
    
    // Leaves (simple triangular fronds)
    const leafAngles = [-0.8, -0.4, 0, 0.4, 0.8, -1.2, 1.2];
    for (const angle of leafAngles) {
      ctx.save();
      ctx.translate(10, -80);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(25, -10, 50, 5);
      ctx.quadraticCurveTo(25, 5, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    
    ctx.restore();
  };
  
  // Draw palms on sides (only if there's space)
  if (width > 400) {
    drawPalm(width * 0.08, horizonY + 10, 0.8 + synthwaveState.sBeat * 0.1, false);
    drawPalm(width * 0.92, horizonY + 10, 0.7 + synthwaveState.sBeat * 0.1, true);
  }
  
  // === CHROMATIC VIGNETTE ===
  const vignetteGrad = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.8);
  vignetteGrad.addColorStop(0, 'transparent');
  vignetteGrad.addColorStop(0.7, 'transparent');
  vignetteGrad.addColorStop(1, 'rgba(10, 0, 20, 0.5)');
  ctx.fillStyle = vignetteGrad;
  ctx.fillRect(0, 0, width, height);
  
  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Volcanic Magma 🌋 - A dark, cracked obsidian floor with glowing lava beneath
 * Lava brightens and flows faster during bass-heavy sections.
 * Ash particles float upward and catch the light of the current dominant chroma hue.
 */
function drawVolcanicMagmaWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;

  const settings = getEffectiveWaveformSettings('volcanic_magma');
  const lerp = 0.12;

  volcanicState.sBeat += (beatPulse - volcanicState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    volcanicState.sChroma[i] += ((chroma[i] || 0) - volcanicState.sChroma[i]) * lerp;
  }

  const avgBass = (mel && mel.length > 0) ? (mel.slice(0, 15).reduce((a, b) => a + b, 0) / 15 + 10) / 10 : 0;
  volcanicState.sBass += (Math.max(0, Math.min(1, avgBass)) - volcanicState.sBass) * lerp;

  let dominantIdx = 0, maxVal = 0;
  for (let i = 0; i < 12; i++) {
    if (volcanicState.sChroma[i] > maxVal) { maxVal = volcanicState.sChroma[i]; dominantIdx = i; }
  }
  const dominantHue = CHROMA_HUES[dominantIdx];
  const melAt = (t) => {
    if (!mel || mel.length === 0) return 0.5;
    const idx = Math.floor(Math.max(0, Math.min(0.999, t)) * mel.length);
    return Math.max(0, Math.min(1, (mel[idx] + 10) / 10));
  };

  ctx.save();

  // Camera shake on heavy beats
  if (volcanicState.sBeat > 0.75) {
    ctx.translate((Math.random() - 0.5) * 5 * volcanicState.sBeat, (Math.random() - 0.5) * 5 * volcanicState.sBeat);
  }

  // Night sky, warmed from below by the eruption
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#04030a');
  bgGrad.addColorStop(0.55, `hsl(345, 45%, ${4 + volcanicState.sBass * 8}%)`);
  bgGrad.addColorStop(1, `hsl(15, 80%, ${8 + volcanicState.sBass * 14}%)`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const lakeTop = height * (settings.basePosition / 100);
  const craterX = width / 2;
  const volcHeight = height * 0.45 * (0.9 + volcanicState.sBass * 0.15);
  const craterY = lakeTop - volcHeight;
  const craterHalf = width * 0.045;

  // Crater glow lights the sky, pulsing with the beat
  const glow = ctx.createRadialGradient(craterX, craterY, 0, craterX, craterY, width * 0.55);
  glow.addColorStop(0, `hsla(18, 100%, 55%, ${0.25 + volcanicState.sBeat * 0.35})`);
  glow.addColorStop(0.4, `hsla(${dominantHue}, 70%, 40%, ${0.08 + volcanicState.sBeat * 0.08})`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, lakeTop);

  // Distant ridge (parallax layer)
  ctx.fillStyle = '#0b0710';
  ctx.beginPath();
  ctx.moveTo(0, lakeTop);
  for (let i = 0; i <= 20; i++) {
    const x = (i / 20) * width;
    const y = lakeTop - height * 0.12 * (0.5 + 0.5 * Math.sin(i * 1.7 + 2.3));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, lakeTop);
  ctx.closePath();
  ctx.fill();

  // Main volcano silhouette
  ctx.fillStyle = '#080510';
  ctx.beginPath();
  ctx.moveTo(craterX - width * 0.42, lakeTop);
  ctx.quadraticCurveTo(craterX - width * 0.18, lakeTop - volcHeight * 0.55, craterX - craterHalf, craterY);
  ctx.lineTo(craterX + craterHalf, craterY);
  ctx.quadraticCurveTo(craterX + width * 0.18, lakeTop - volcHeight * 0.55, craterX + width * 0.42, lakeTop);
  ctx.closePath();
  ctx.fill();

  // Crater mouth, always molten
  const mouthGrad = ctx.createRadialGradient(craterX, craterY, 0, craterX, craterY, craterHalf * 2.2);
  mouthGrad.addColorStop(0, `hsla(30, 100%, ${60 + volcanicState.sBeat * 25}%, 0.95)`);
  mouthGrad.addColorStop(0.5, `hsla(15, 100%, 45%, 0.5)`);
  mouthGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = mouthGrad;
  ctx.beginPath();
  ctx.ellipse(craterX, craterY, craterHalf * 2.2, craterHalf * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lava rivers down the slopes — width and brightness ride the mel bands
  const rivers = [
    { xOff: -0.02, spread: -0.16, melT: 0.1 },
    { xOff: 0.01, spread: 0.10, melT: 0.3 },
    { xOff: -0.005, spread: -0.06, melT: 0.55 },
    { xOff: 0.02, spread: 0.19, melT: 0.8 }
  ];
  for (const rv of rivers) {
    const intensity = melAt(rv.melT);
    if (intensity < 0.15) continue;
    const startX = craterX + rv.xOff * width;
    const endX = craterX + rv.spread * width * 2.2;
    const wobble = Math.sin(time * 1.5 + rv.melT * 20) * width * 0.01;

    const riverGrad = ctx.createLinearGradient(0, craterY, 0, lakeTop);
    riverGrad.addColorStop(0, `hsla(35, 100%, ${55 + intensity * 25}%, ${0.5 + intensity * 0.5})`);
    riverGrad.addColorStop(1, `hsla(8, 100%, 42%, ${0.3 + intensity * 0.4})`);
    ctx.strokeStyle = riverGrad;
    ctx.lineWidth = (1.5 + intensity * 6) * (1 + volcanicState.sBeat * 0.4);
    ctx.lineCap = 'round';
    ctx.shadowColor = 'hsla(20, 100%, 50%, 0.8)';
    ctx.shadowBlur = 6 + intensity * 10;
    ctx.beginPath();
    ctx.moveTo(startX, craterY + 4);
    ctx.bezierCurveTo(
      startX + wobble, craterY + volcHeight * 0.4,
      (startX + endX) / 2 - wobble, craterY + volcHeight * 0.75,
      endX, lakeTop
    );
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Eruption: lava bombs on strong beats
  if (beatPulse > 0.75 && volcanicState.bombs.length < 18) {
    const burst = 2 + Math.round(beatPulse * 3);
    for (let i = 0; i < burst; i++) {
      volcanicState.bombs.push({
        x: craterX + (Math.random() - 0.5) * craterHalf * 2,
        y: craterY,
        vx: (Math.random() - 0.5) * 9,
        vy: -7 - Math.random() * 11,
        gv: 0.35,
        sz: 2 + Math.random() * 4,
        hue: 15 + Math.random() * 25,
        trail: []
      });
    }
  }

  ctx.globalCompositeOperation = 'lighter';
  for (let i = volcanicState.bombs.length - 1; i >= 0; i--) {
    const b = volcanicState.bombs[i];
    b.x += b.vx;
    b.y += b.vy;
    b.vy += b.gv;

    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 8) b.trail.shift();

    ctx.beginPath();
    ctx.strokeStyle = `hsla(${b.hue}, 100%, 55%, 0.35)`;
    ctx.lineWidth = b.sz * 0.6;
    b.trail.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    const bombGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.sz * 2.5);
    bombGrad.addColorStop(0, `hsla(${b.hue}, 100%, 75%, 1)`);
    bombGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bombGrad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.sz * 2, 0, Math.PI * 2);
    ctx.fill();

    // Splash when a bomb hits the lake
    if (b.y > lakeTop) {
      const splash = ctx.createRadialGradient(b.x, lakeTop, 0, b.x, lakeTop, b.sz * 8);
      splash.addColorStop(0, `hsla(${b.hue}, 100%, 65%, 0.7)`);
      splash.addColorStop(1, 'transparent');
      ctx.fillStyle = splash;
      ctx.beginPath();
      ctx.ellipse(b.x, lakeTop, b.sz * 8, b.sz * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      volcanicState.bombs.splice(i, 1);
    }
  }
  ctx.globalCompositeOperation = 'source-over';

  // Embers drifting up, tinted by the dominant note
  if (volcanicState.ashParticles.length < 70 && Math.random() < 0.35 + volcanicState.sBeat * 0.4) {
    const fromCrater = Math.random() < 0.5;
    volcanicState.ashParticles.push({
      x: fromCrater ? craterX + (Math.random() - 0.5) * craterHalf * 3 : Math.random() * width,
      y: fromCrater ? craterY : lakeTop + Math.random() * (height - lakeTop),
      vx: (Math.random() - 0.5) * 1.2,
      vy: -0.8 - Math.random() * 2.2,
      sz: 1 + Math.random() * 2,
      hue: Math.random() < 0.7 ? 20 + Math.random() * 25 : dominantHue,
      life: 1.0,
      decay: 0.004 + Math.random() * 0.01
    });
  }

  ctx.globalCompositeOperation = 'lighter';
  for (let i = volcanicState.ashParticles.length - 1; i >= 0; i--) {
    const p = volcanicState.ashParticles[i];
    p.y += p.vy * (1 + volcanicState.sBeat);
    p.x += p.vx + Math.sin(time * 2 + i) * 0.4;
    p.life -= p.decay;
    if (p.life <= 0 || p.y < -20) {
      volcanicState.ashParticles.splice(i, 1);
      continue;
    }
    ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${0.6 * p.life})`;
    ctx.fillRect(p.x, p.y, p.sz, p.sz);
  }
  ctx.globalCompositeOperation = 'source-over';

  // Magma lake: the surface IS the mel spectrum, mirrored glow beneath
  const lakeDepth = height - lakeTop;
  const points = 80;
  const waveAmp = Math.min(lakeDepth * 0.8, height * 0.5 * (settings.maxAmplitude / 100));

  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const m = melAt(t);
    const churn = Math.sin(t * Math.PI * 6 + time * 2) * 0.08 + Math.sin(t * Math.PI * 13 - time * 3.1) * 0.05;
    const y = lakeTop - (m * 0.85 + churn) * waveAmp * (1 + volcanicState.sBeat * 0.25) + waveAmp * 0.15;
    ctx.lineTo(t * width, Math.min(height, y));
  }
  ctx.lineTo(width, height);
  ctx.closePath();

  const lakeGrad = ctx.createLinearGradient(0, lakeTop - waveAmp, 0, height);
  lakeGrad.addColorStop(0, `hsla(40, 100%, ${60 + volcanicState.sBeat * 20}%, 0.95)`);
  lakeGrad.addColorStop(0.35, 'hsla(20, 100%, 48%, 0.9)');
  lakeGrad.addColorStop(1, 'hsla(0, 90%, 22%, 0.95)');
  ctx.fillStyle = lakeGrad;
  ctx.shadowColor = 'hsla(25, 100%, 50%, 0.7)';
  ctx.shadowBlur = 14 + volcanicState.sBeat * 18;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Bright crust line along the lava surface
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const m = melAt(t);
    const churn = Math.sin(t * Math.PI * 6 + time * 2) * 0.08 + Math.sin(t * Math.PI * 13 - time * 3.1) * 0.05;
    const y = lakeTop - (m * 0.85 + churn) * waveAmp * (1 + volcanicState.sBeat * 0.25) + waveAmp * 0.15;
    if (i === 0) ctx.moveTo(t * width, Math.min(height, y));
    else ctx.lineTo(t * width, Math.min(height, y));
  }
  ctx.strokeStyle = `hsla(45, 100%, ${70 + volcanicState.sBeat * 20}%, 0.9)`;
  ctx.lineWidth = 2 + volcanicState.sBeat * 2;
  ctx.stroke();

  // Smoke plume drifting from the crater
  ctx.fillStyle = `hsla(${dominantHue}, 15%, 12%, 0.35)`;
  for (let s = 0; s < 5; s++) {
    const rise = ((time * 0.12 + s * 0.2) % 1);
    const px = craterX + Math.sin(time * 0.7 + s * 2.1) * width * 0.04 * (1 + rise * 3);
    const py = craterY - rise * height * 0.5;
    const pr = craterHalf * (0.6 + rise * 3);
    ctx.globalAlpha = (1 - rise) * 0.4;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
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
let particleExplosionState = {
  activeExplosions: [], // Array of {x, y, startTime, hue, intensity, particles}
  lastBeatPulse: 0,
  sChroma: new Float32Array(12).fill(0)
};

/**
 * Particle Explosion 🎆 - Dynamic, physics-based bursts that react to beats
 * High-energy core with gravity-affected embers and shockwaves
 */
function drawParticleExplosionWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('particle_explosion');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const spreadMultiplier = settings.maxAmplitude / 50;

  // Smooth chroma
  for (let i = 0; i < 12; i++) {
    particleExplosionState.sChroma[i] += (chroma[i] - particleExplosionState.sChroma[i]) * 0.15;
  }

  // Trigger new explosion on beat or significant surge
  if (beatPulse > 0.6 && particleExplosionState.lastBeatPulse <= 0.6) {
    const avgMel = mel ? mel.reduce((a, b) => a + b, 0) / mel.length : 0;
    const intensity = Math.max(0.5, (avgMel + 15) / 15);
    
    // Choose strongest chroma for color
    let maxIdx = 0;
    for(let i=1; i<12; i++) if(chroma[i] > chroma[maxIdx]) maxIdx = i;

    // Create particles for this specific burst
    const count = Math.floor(60 + intensity * 80);
    const particles = [];
    for(let i=0; i<count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 8) * spreadMultiplier * intensity;
      particles.push({
        x: 0, y: 0, // Relative to explosion center
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.03,
        size: 1 + Math.random() * 3
      });
    }

    particleExplosionState.activeExplosions.push({
      x: centerX + (Math.random() - 0.5) * width * 0.4,
      y: centerY + (Math.random() - 0.5) * height * 0.2,
      startTime: time,
      hue: CHROMA_HUES[maxIdx],
      intensity,
      particles
    });
  }
  particleExplosionState.lastBeatPulse = beatPulse;

  // Constant "ambient" center ember (reacts to mel)
  const avgMel = mel ? mel.reduce((a, b) => a + b, 0) / mel.length : 0;
  const ambientScale = Math.max(0.2, (avgMel + 10) / 10);
  
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Update and draw explosions
  particleExplosionState.activeExplosions = particleExplosionState.activeExplosions.filter(exp => {
    const age = time - exp.startTime;
    if (age > 2.0 || age < 0) return false;

    const fade = Math.max(0, 1 - age / 2.0);
    
    // Shockwave
    if (age < 0.5) {
      const swRadius = Math.max(0, age * 800 * exp.intensity);
      const swAlpha = (1 - age / 0.5) * 0.5;
      ctx.strokeStyle = `hsla(${exp.hue}, 90%, 70%, ${swAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, swRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Particles
    exp.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity
      p.vx *= 0.98; // Air resistance
      p.life -= p.decay;

      if (p.life > 0) {
        const x = exp.x + p.x;
        const y = exp.y + p.y;
        const alpha = p.life * fade;
        const size = p.size * (0.5 + p.life * 0.5) * exp.intensity;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 5);
        grad.addColorStop(0, `hsla(${exp.hue}, 100%, 80%, ${alpha})`);
        grad.addColorStop(0.3, `hsla(${exp.hue}, 80%, 60%, ${alpha * 0.4})`);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `white`;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    return true;
  });

  // Center Glow
  const glowRadius = (50 + beatPulse * 100) * ambientScale;
  const centerGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
  centerGrad.addColorStop(0, `hsla(${time * 50 % 360}, 80%, 70%, 0.4)`);
  centerGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
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
  pacX: 0.1,
  lastTime: 0,
  pellets: [],        // { eatenUntil } indexed along the wave
  blueUntil: 0,
  lastBlueTime: 0
};

const PACMAN_NUM_PELLETS = 36;

function drawPacmanWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('pacman');
  const baseY = height * (settings.basePosition / 100);
  const maxAmplitude = height * 0.5 * (settings.maxAmplitude / 100);
  const size = Math.min(width, height) * 0.055;

  if (pacmanState.pellets.length !== PACMAN_NUM_PELLETS) {
    pacmanState.pellets = Array.from({ length: PACMAN_NUM_PELLETS }, () => ({ eatenUntil: 0 }));
  }

  let melEnergy = 0.5;
  if (mel && mel.length > 0) {
    const avg = mel.reduce((a, b) => a + b, 0) / mel.length;
    melEnergy = Math.max(0, Math.min(1, (avg + 10) / 10));
  }

  // The waveform path Pac-Man rides: mel bands shape it, gentle motion from time
  const waveY = (x) => {
    let melV = 0.5;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(((x % 1) + 1) % 1 * (mel.length - 1));
      melV = Math.max(0, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    const swell = Math.sin(x * Math.PI * 4 + time * 1.1) * 0.4
                + Math.sin(x * Math.PI * 7 - time * 0.7) * 0.25
                + Math.sin(x * Math.PI * 2 + time * 0.4) * 0.35;
    return baseY - swell * maxAmplitude * (0.35 + melV * 0.65) * (1 + beatPulse * 0.15);
  };

  // Scrolling neon grid backdrop
  const gridSize = 40;
  const scroll = (time * 30) % gridSize;
  ctx.strokeStyle = `rgba(20, 20, 80, ${0.25 + beatPulse * 0.25})`;
  ctx.lineWidth = 1;
  for (let x = -scroll; x < width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Advance Pac-Man along the wave (dt from playback time, clamped for seeks/pauses)
  const dt = Math.max(0, Math.min(0.1, time - pacmanState.lastTime));
  pacmanState.lastTime = time;
  const pacSpeed = 0.05 * (0.6 + melEnergy * 0.8 + beatPulse * 0.9);
  pacmanState.pacX = (pacmanState.pacX + pacSpeed * dt + 1) % 1;

  // Big beat => blue ghost mode (with cooldown)
  if (beatPulse > 0.85 && time > pacmanState.blueUntil && time - pacmanState.lastBlueTime > 12) {
    pacmanState.blueUntil = time + 3.5;
    pacmanState.lastBlueTime = time;
  }
  const blueMode = time < pacmanState.blueUntil;

  // Dominant chroma note colors the wave trail
  let dominantIdx = 0;
  for (let i = 1; i < 12; i++) {
    if ((chroma[i] || 0) > (chroma[dominantIdx] || 0)) dominantIdx = i;
  }
  const trailHue = CHROMA_HUES[dominantIdx];

  // Draw the wave path as a glowing dotted trail
  const pathSteps = 120;
  ctx.beginPath();
  for (let i = 0; i <= pathSteps; i++) {
    const x = i / pathSteps;
    const px = x * width;
    const py = waveY(x);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = `hsla(${trailHue}, 80%, 55%, ${0.15 + melEnergy * 0.2 + beatPulse * 0.15})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 10]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pellets live on the wave; Pac-Man eats them as he passes, they regrow behind him
  for (let i = 0; i < PACMAN_NUM_PELLETS; i++) {
    const pellet = pacmanState.pellets[i];
    const x = (i + 0.5) / PACMAN_NUM_PELLETS;
    const isPower = i % 9 === 4;

    let distAhead = x - pacmanState.pacX;
    if (distAhead < -0.5) distAhead += 1;
    if (distAhead > 0.5) distAhead -= 1;

    if (Math.abs(distAhead) < (size * 0.6) / width && time > pellet.eatenUntil) {
      pellet.eatenUntil = time + 6;
    }
    if (time < pellet.eatenUntil) continue;

    const px = x * width;
    const py = waveY(x);
    const chromaIdx = i % 12;
    const chromaValue = chroma[chromaIdx] || 0;

    if (isPower) {
      const pulse = 0.7 + Math.sin(time * 6 + i) * 0.3;
      ctx.fillStyle = `hsla(${CHROMA_HUES[chromaIdx]}, 90%, ${55 + chromaValue * 25}%, ${0.6 + chromaValue * 0.4})`;
      ctx.shadowColor = `hsla(${CHROMA_HUES[chromaIdx]}, 90%, 60%, 0.8)`;
      ctx.shadowBlur = 8 + beatPulse * 10;
      ctx.beginPath();
      ctx.arc(px, py, (5 + chromaValue * 4) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = `hsla(35, 60%, ${70 + chromaValue * 15}%, ${0.5 + chromaValue * 0.4})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.5 + chromaValue * 2 + beatPulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ghosts trail Pac-Man along the same wave; in blue mode they turn blue and fall back
  const ghostColors = [0, 330, 180, 40]; // Blinky, Pinky, Inky, Clyde
  for (let g = 0; g < 4; g++) {
    const flee = blueMode ? (pacmanState.blueUntil - time) / 3.5 : 0;
    const gap = 0.07 + g * 0.055 + flee * 0.12 + Math.sin(time * 2 + g * 1.7) * 0.012;
    const gx = ((pacmanState.pacX - gap) % 1 + 1) % 1;
    const gpx = gx * width;
    const gpy = waveY(gx) + Math.sin(time * 5 + g * 2) * 3;

    const flash = blueMode && (pacmanState.blueUntil - time < 1) && Math.sin(time * 12) > 0;
    const bodyColor = blueMode
      ? (flash ? '#ffffff' : '#2121de')
      : `hsl(${ghostColors[g]}, 100%, ${55 + beatPulse * 15}%)`;

    // Slope tells the ghost which way it's looking
    const slope = waveY(gx + 0.01) - waveY(gx - 0.01);

    ctx.fillStyle = bodyColor;
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = 6 + beatPulse * 8;
    ctx.beginPath();
    ctx.arc(gpx, gpy - size * 0.2, size / 2, Math.PI, 0);
    ctx.lineTo(gpx + size / 2, gpy + size / 2);
    const feet = 4;
    for (let k = 0; k < feet; k++) {
      const fx1 = gpx + size / 2 - ((k + 0.5) * size) / feet;
      const fx2 = gpx + size / 2 - ((k + 1) * size) / feet;
      ctx.quadraticCurveTo(fx1, gpy + size / 2 - size * 0.18, fx2, gpy + size / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    if (blueMode && !flash) {
      // Scared face
      ctx.fillStyle = '#ffb8ae';
      ctx.beginPath();
      ctx.arc(gpx - size * 0.15, gpy - size * 0.2, size * 0.08, 0, Math.PI * 2);
      ctx.arc(gpx + size * 0.15, gpy - size * 0.2, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffb8ae';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let z = 0; z < 4; z++) {
        const zx = gpx - size * 0.3 + (z * size * 0.2);
        ctx.lineTo(zx, gpy + size * 0.05 + (z % 2 === 0 ? 3 : -3));
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(gpx - size * 0.15, gpy - size * 0.2, size * 0.15, 0, Math.PI * 2);
      ctx.arc(gpx + size * 0.15, gpy - size * 0.2, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1919a6';
      const lookX = 2;
      const lookY = Math.max(-2, Math.min(2, slope * 0.5));
      ctx.beginPath();
      ctx.arc(gpx - size * 0.15 + lookX, gpy - size * 0.2 + lookY, size * 0.07, 0, Math.PI * 2);
      ctx.arc(gpx + size * 0.15 + lookX, gpy - size * 0.2 + lookY, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Pac-Man rides the wave, facing along its slope, chomping to the beat
  const px = pacmanState.pacX * width;
  const py = waveY(pacmanState.pacX);
  const slope = waveY(pacmanState.pacX + 0.01) - waveY(pacmanState.pacX - 0.01);
  const dir = Math.atan2(slope, 0.02 * width);
  const chompSpeed = 8 + melEnergy * 10 + beatPulse * 8;
  const mouth = (0.08 + Math.abs(Math.sin(time * chompSpeed)) * 0.22) * Math.PI;
  const pacSize = (size / 2) * (1 + beatPulse * 0.2);

  ctx.fillStyle = '#FFFF00';
  ctx.shadowColor = 'rgba(255, 255, 0, 0.7)';
  ctx.shadowBlur = 10 + beatPulse * 15;
  ctx.beginPath();
  ctx.arc(px, py, pacSize, dir + mouth, dir + Math.PI * 2 - mouth);
  ctx.lineTo(px, py);
  ctx.fill();
  ctx.shadowBlur = 0;

  drawWaveLabels(ctx, width, height, chroma);
}

// --- SNAKE STATE ---
let snakeState = {
    snake: [],
    dir: {x:1, y:0},
    nextDir: {x:1, y:0},
    lastBeat: 0
};
// Grid size
const SNAKE_GRID = 30; 

export function resetSnakeState() {
    snakeState.snake = [];
    snakeState.dir = {x:1, y:0};
    snakeState.nextDir = {x:1, y:0};
    snakeState.lastBeat = 0;
}

function drawSnakeWave(ctx, width, height, chroma, mel, beatPulse, time) {
    const cellSize = width / SNAKE_GRID;
    const gridH = Math.floor(height / cellSize);
    
    // Initialize Snake
    if(snakeState.snake.length === 0) {
        snakeState.snake = [{x: 15, y: 15}, {x:14, y:15}, {x:13, y:15}, {x:12, y:15}];
    }
    
    // Direction change based on dominant chroma (giving "control" to the music)
    let maxChroma = 0; let maxVal = 0;
    chroma.forEach((v, i) => { if(v > maxVal) { maxVal = v; maxChroma = i; } });
    
    // Buffer the next direction, preventing 180-degree turns from current direction
    const currentDir = snakeState.dir;
    
    if (beatPulse > 0.7 && Math.random() < 0.2) {
         // Random rhythmic pivot
         if (currentDir.x !== 0) {
             snakeState.nextDir = Math.random() > 0.5 ? {x: 0, y: 1} : {x: 0, y: -1};
         } else {
             snakeState.nextDir = Math.random() > 0.5 ? {x: 1, y: 0} : {x: -1, y: 0};
         }
    } 
    else if (maxVal > 0.5) {
        if (maxChroma <= 2 && currentDir.y !== 1) snakeState.nextDir = {x:0, y:-1}; // Up
        else if (maxChroma <= 5 && currentDir.x !== -1) snakeState.nextDir = {x:1, y:0}; // Right
        else if (maxChroma <= 8 && currentDir.y !== -1) snakeState.nextDir = {x:0, y:1}; // Down
        else if (maxChroma >= 9 && currentDir.x !== 1) snakeState.nextDir = {x:-1, y:0}; // Left
    }

    // Move Update - Fixed interval (Grid-aligned movement)
    if (time - snakeState.lastBeat > 0.1) {
        snakeState.lastBeat = time;
        snakeState.dir = snakeState.nextDir;
        
        let head = snakeState.snake[0];
        let nx = (head.x + snakeState.dir.x + SNAKE_GRID) % SNAKE_GRID;
        let ny = (head.y + snakeState.dir.y + gridH) % gridH;
        
        // Anti-Overlap Logic: If next move hits body, try to pivot automatically (like a smart player)
        const isBody = (x, y) => snakeState.snake.some(seg => seg.x === x && seg.y === y);
        
        if (isBody(nx, ny)) {
            // Collision detected! Try to find an empty neighbor
            const possibilities = [{x:0,y:1}, {x:0,y:-1}, {x:1,y:0}, {x:-1,y:0}];
            for (let p of possibilities) {
                // Don't go back 180
                if (p.x === -snakeState.dir.x && p.y === -snakeState.dir.y) continue;
                
                let tx = (head.x + p.x + SNAKE_GRID) % SNAKE_GRID;
                let ty = (head.y + p.y + gridH) % gridH;
                if (!isBody(tx, ty)) {
                    nx = tx; ny = ty;
                    snakeState.dir = p;
                    snakeState.nextDir = p;
                    break;
                }
            }
        }

        const newHead = { x: nx, y: ny };
        snakeState.snake.unshift(newHead);
        
        // Growth Logic based on music energy
        const targetLen = 8 + Math.floor(beatPulse * 20);
        while (snakeState.snake.length > targetLen) {
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

// --- RAIN TETRIS STATE ---
// Define classic Tetris pieces (tetrominoes)
const TETROMINO_SHAPES = {
    I: [[1,1,1,1]], // Line
    O: [[1,1],[1,1]], // Square
    T: [[0,1,0],[1,1,1]], // T-shape
    S: [[0,1,1],[1,1,0]], // S-shape
    Z: [[1,1,0],[0,1,1]], // Z-shape
    J: [[1,0,0],[1,1,1]], // J-shape
    L: [[0,0,1],[1,1,1]]  // L-shape
};

const TETROMINO_COLORS = {
    I: 180, // Cyan
    O: 60,  // Yellow
    T: 280, // Purple
    S: 120, // Green
    Z: 0,   // Red
    J: 240, // Blue
    L: 30   // Orange
};

let rainTetrisState = {
    pieces: [],        // Active falling pieces
    settledGrid: {},   // Grid of settled blocks: key = "x,y", value = {hue, glow}
    lastBeat: 0,
    bpmInterval: 0.5,
    gridCols: 40,      // Doubled to make blocks half the size
    gridRows: 40,
    blockSize: 0,
    pieceCount: 0,     // Track total pieces dropped
    lastWaveform: 'rain_tetris'
};

// Helper function to reset Rain Tetris state
function resetRainTetrisState() {
    rainTetrisState.pieces = [];
    rainTetrisState.settledGrid = {};
    rainTetrisState.pieceCount = 0;
    rainTetrisState.lastBeat = 0;
}

// Helper function to rotate tetromino shape
function rotateTetromino(shape, rotations) {
    let rotated = shape;
    for (let i = 0; i < rotations; i++) {
        const rows = rotated.length;
        const cols = rotated[0].length;
        const newShape = [];
        
        for (let c = 0; c < cols; c++) {
            const newRow = [];
            for (let r = rows - 1; r >= 0; r--) {
                newRow.push(rotated[r][c]);
            }
            newShape.push(newRow);
        }
        rotated = newShape;
    }
    return rotated;
}

function drawRainTetrisWave(ctx, width, height, chroma, mel, beatPulse, time) {
    // Calculate block size to fill entire canvas
    const cols = rainTetrisState.gridCols;
    const blockSize = width / cols; // Use full width
    const rows = Math.floor(height / blockSize);
    rainTetrisState.blockSize = blockSize;
    rainTetrisState.gridRows = rows;
    
    // Check if we need to reset (60 pieces dropped or waveform changed)
    if (rainTetrisState.pieceCount >= 60) {
        rainTetrisState.pieces = [];
        rainTetrisState.settledGrid = {};
        rainTetrisState.pieceCount = 0;
    }
    
    // Detect dominant chroma for color selection
    let maxChroma = 0;
    let maxVal = 0;
    chroma.forEach((v, i) => { 
        if(v > maxVal) { 
            maxVal = v; 
            maxChroma = i; 
        } 
    });
    
    // Spawn new tetromino on beat (only if under 60 pieces)
    if (beatPulse > 0.7 && time - rainTetrisState.lastBeat > 0.4 && rainTetrisState.pieceCount < 60) {
        rainTetrisState.lastBeat = time;
        
        // Choose random tetromino type
        const types = Object.keys(TETROMINO_SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        const baseShape = TETROMINO_SHAPES[type];
        
        // Random rotation: 0, 90, 180, or 270 degrees (0, 1, 2, or 3 rotations)
        const rotations = Math.floor(Math.random() * 4);
        const shape = rotateTetromino(baseShape, rotations);
        
        // Random spawn position across the X axis
        const pieceWidth = shape[0].length;
        const maxStartCol = cols - pieceWidth;
        const startCol = Math.floor(Math.random() * (maxStartCol + 1));
        
        // Add chroma influence to color
        const baseHue = TETROMINO_COLORS[type];
        const hue = (baseHue + maxChroma * 15) % 360;
        
        rainTetrisState.pieces.push({
            type: type,
            shape: shape,
            col: startCol,
            row: -shape.length, // Start above screen
            targetRow: -shape.length,
            hue: hue,
            glow: beatPulse,
            spawnTime: time,
            rotation: rotations
        });
        
        rainTetrisState.pieceCount++;
    }
    
    // Update pieces - slower fall speed
    const moveInterval = 1.5; 
    
    rainTetrisState.pieces = rainTetrisState.pieces.filter(piece => {
        const timeSinceSpawn = time - piece.spawnTime;
        const expectedRow = Math.floor(timeSinceSpawn / moveInterval) + piece.row;
        
        // Check if piece can move down
        if (canMovePiece(piece, piece.col, expectedRow + 1, cols, rows)) {
            // Smooth interpolation
            const moveFraction = (timeSinceSpawn % moveInterval) / moveInterval;
            const eased = moveFraction < 0.5 ? 2 * moveFraction * moveFraction : 1 - Math.pow(-2 * moveFraction + 2, 2) / 2;
            piece.row = expectedRow + eased;
            piece.targetRow = expectedRow + 1;
            
            // Decay glow
            piece.glow *= 0.95;
            return true; // Keep piece
        } else {
            // Lock piece in place
            lockPiece(piece, expectedRow, time);
            return false; // Remove piece
        }
    });
    
    // Clear completed lines
    clearCompletedLines(cols, rows);
    
    // Clean old settled blocks (fade out after 20 seconds)
    Object.keys(rainTetrisState.settledGrid).forEach(key => {
        const block = rainTetrisState.settledGrid[key];
        const timeSinceSettled = time - block.settleTime;
        
        // Only start fading after 20 seconds
        if (timeSinceSettled > 20) {
            block.glow *= 0.98;
            if (block.glow < 0.05) {
                delete rainTetrisState.settledGrid[key];
            }
        }
    });
    
    // Update last waveform
    rainTetrisState.lastWaveform = 'rain_tetris';
    
    // Draw settled blocks first
    Object.keys(rainTetrisState.settledGrid).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const block = rainTetrisState.settledGrid[key];
        
        const posX = x * blockSize;
        const posY = y * blockSize;
        
        // Glow effect
        const glowIntensity = Math.max(0.2, block.glow);
        ctx.shadowBlur = 10 + glowIntensity * 15;
        ctx.shadowColor = `hsl(${block.hue}, 100%, 50%)`;
        
        // Block color
        const saturation = 90;
        const lightness = 35 + block.glow * 25;
        ctx.fillStyle = `hsl(${block.hue}, ${saturation}%, ${lightness}%)`;
        
        // Draw block with slight padding
        const padding = 2;
        ctx.fillRect(
            posX + padding, 
            posY + padding, 
            blockSize - padding * 2, 
            blockSize - padding * 2
        );
        
        // Inner highlight
        ctx.fillStyle = `hsla(${block.hue}, 100%, 70%, ${0.2 + block.glow * 0.3})`;
        ctx.fillRect(
            posX + blockSize * 0.25, 
            posY + blockSize * 0.25, 
            blockSize * 0.3, 
            blockSize * 0.3
        );
    });
    
    // Draw active falling pieces
    rainTetrisState.pieces.forEach(piece => {
        const shape = piece.shape;
        
        // Glow effect (like Rhythm Snake)
        const glowIntensity = Math.max(0.4, piece.glow);
        ctx.shadowBlur = 20 + glowIntensity * 30;
        ctx.shadowColor = `hsl(${piece.hue}, 100%, 50%)`;
        
        // Draw each block of the tetromino
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const x = (piece.col + c) * blockSize;
                    const y = (piece.row + r) * blockSize;
                    
                    // Skip if off-screen top
                    if (y < -blockSize) continue;
                    
                    // Block color
                    const saturation = 95;
                    const lightness = 45 + piece.glow * 35;
                    ctx.fillStyle = `hsl(${piece.hue}, ${saturation}%, ${lightness}%)`;
                    
                    // Draw block with slight padding
                    const padding = 2;
                    ctx.fillRect(
                        x + padding, 
                        y + padding, 
                        blockSize - padding * 2, 
                        blockSize - padding * 2
                    );
                    
                    // Inner highlight for depth
                    ctx.fillStyle = `hsla(${piece.hue}, 100%, 75%, ${0.4 + piece.glow * 0.5})`;
                    ctx.fillRect(
                        x + blockSize * 0.25, 
                        y + blockSize * 0.25, 
                        blockSize * 0.3, 
                        blockSize * 0.3
                    );
                }
            }
        }
    });
    
    ctx.shadowBlur = 0;
}

// Helper function: Check if piece can move to new position
function canMovePiece(piece, newCol, newRow, gridCols, gridRows) {
    const shape = piece.shape;
    const floorRow = Math.floor(newRow);
    
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const x = newCol + c;
                const y = floorRow + r;
                
                // Check boundaries
                if (x < 0 || x >= gridCols || y >= gridRows) {
                    return false;
                }
                
                // Check collision with settled blocks
                const key = `${x},${y}`;
                if (rainTetrisState.settledGrid[key]) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Helper function: Lock piece into settled grid
function lockPiece(piece, row, time) {
    const shape = piece.shape;
    const floorRow = Math.floor(row);
    
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const x = piece.col + c;
                const y = floorRow + r;
                
                // Add to settled grid
                if (y >= 0) {
                    const key = `${x},${y}`;
                    rainTetrisState.settledGrid[key] = {
                        hue: piece.hue,
                        glow: Math.max(0.5, piece.glow),
                        settleTime: time
                    };
                }
            }
        }
    }
}

// Helper function: Clear completed lines
function clearCompletedLines(gridCols, gridRows) {
    const linesToClear = [];
    
    // Check each row
    for (let y = 0; y < gridRows; y++) {
        let isComplete = true;
        for (let x = 0; x < gridCols; x++) {
            const key = `${x},${y}`;
            if (!rainTetrisState.settledGrid[key]) {
                isComplete = false;
                break;
            }
        }
        if (isComplete) {
            linesToClear.push(y);
        }
    }
    
    // Clear completed lines and shift blocks down
    linesToClear.forEach(lineY => {
        // Remove the line
        for (let x = 0; x < gridCols; x++) {
            const key = `${x},${lineY}`;
            delete rainTetrisState.settledGrid[key];
        }
        
        // Shift all blocks above down by one
        const newGrid = {};
        Object.keys(rainTetrisState.settledGrid).forEach(key => {
            const [x, y] = key.split(',').map(Number);
            if (y < lineY) {
                // Move block down
                const newKey = `${x},${y + 1}`;
                newGrid[newKey] = rainTetrisState.settledGrid[key];
            } else {
                // Keep block where it is
                newGrid[key] = rainTetrisState.settledGrid[key];
            }
        });
        rainTetrisState.settledGrid = newGrid;
    });
}

// --- DVD BOUNCER STATE ---
let dvdBouncerState = {
    x: 100,
    y: 100,
    vx: 2,
    vy: 1.5,
    hue: 0,
    cornerHitTime: 0,
    lastBounce: 0,
    initialized: false
};

function drawDVDBouncerWave(ctx, width, height, chroma, mel, beatPulse, time) {
    // Initialize position if first time
    if (!dvdBouncerState.initialized) {
        dvdBouncerState.x = width / 2;
        dvdBouncerState.y = height / 2;
        dvdBouncerState.initialized = true;
    }
    
    // DVD logo size
    const logoWidth = Math.min(width, height) * 0.2;
    const logoHeight = logoWidth * 0.6;
    
    // Get dominant chroma for base color
    let maxChroma = 0;
    let maxVal = 0;
    chroma.forEach((v, i) => { 
        if(v > maxVal) { 
            maxVal = v; 
            maxChroma = i; 
        } 
    });
    
    // Calculate average energy for speed boost
    let avgEnergy = 0;
    if (mel && mel.length) {
        avgEnergy = mel.reduce((a,b) => a+b, 0) / mel.length;
    }
    
    // Speed multiplier based on energy and beat
    const speedMultiplier = 1 + avgEnergy * 2 + beatPulse * 1.5;
    
    // Update position
    dvdBouncerState.x += dvdBouncerState.vx * speedMultiplier;
    dvdBouncerState.y += dvdBouncerState.vy * speedMultiplier;
    
    // Check for corner hit (within small threshold)
    const cornerThreshold = 20;
    let hitCorner = false;
    
    // Check boundaries and bounce
    if (dvdBouncerState.x <= 0 || dvdBouncerState.x + logoWidth >= width) {
        dvdBouncerState.vx *= -1;
        dvdBouncerState.x = Math.max(0, Math.min(width - logoWidth, dvdBouncerState.x));
        dvdBouncerState.hue = (dvdBouncerState.hue + 60) % 360;
        dvdBouncerState.lastBounce = time;
        
        // Check if near top or bottom corner
        if (dvdBouncerState.y <= cornerThreshold || dvdBouncerState.y + logoHeight >= height - cornerThreshold) {
            hitCorner = true;
        }
    }
    
    if (dvdBouncerState.y <= 0 || dvdBouncerState.y + logoHeight >= height) {
        dvdBouncerState.vy *= -1;
        dvdBouncerState.y = Math.max(0, Math.min(height - logoHeight, dvdBouncerState.y));
        dvdBouncerState.hue = (dvdBouncerState.hue + 60) % 360;
        dvdBouncerState.lastBounce = time;
        
        // Check if near left or right corner
        if (dvdBouncerState.x <= cornerThreshold || dvdBouncerState.x + logoWidth >= width - cornerThreshold) {
            hitCorner = true;
        }
    }
    
    // Corner hit celebration!
    if (hitCorner) {
        dvdBouncerState.cornerHitTime = time;
    }
    
    // Draw background trail
    const trailLength = 10;
    const timeSinceBounce = time - dvdBouncerState.lastBounce;
    for (let i = trailLength; i > 0; i--) {
        const alpha = (i / trailLength) * 0.1 * Math.max(0, 1 - timeSinceBounce);
        ctx.fillStyle = `hsla(${dvdBouncerState.hue}, 100%, 50%, ${alpha})`;
        const offsetX = -dvdBouncerState.vx * i * 3;
        const offsetY = -dvdBouncerState.vy * i * 3;
        ctx.fillRect(
            dvdBouncerState.x + offsetX,
            dvdBouncerState.y + offsetY,
            logoWidth,
            logoHeight
        );
    }
    
    // Corner hit celebration effect
    const timeSinceCorner = time - dvdBouncerState.cornerHitTime;
    if (timeSinceCorner < 2) {
        // Explosion particles
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = timeSinceCorner * 200 * (1 - timeSinceCorner / 2);
            const px = dvdBouncerState.x + logoWidth / 2 + Math.cos(angle) * distance;
            const py = dvdBouncerState.y + logoHeight / 2 + Math.sin(angle) * distance;
            const particleAlpha = Math.max(0, 1 - timeSinceCorner / 2);
            
            ctx.fillStyle = `hsla(${(dvdBouncerState.hue + i * 10) % 360}, 100%, 50%, ${particleAlpha})`;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Screen flash
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, 0.3 * (1 - timeSinceCorner / 2))})`;
        ctx.fillRect(0, 0, width, height);
    }
    
    // Draw the DVD logo
    const glowIntensity = 20 + beatPulse * 30 + (timeSinceCorner < 2 ? 50 : 0);
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = `hsl(${dvdBouncerState.hue}, 100%, 50%)`;
    
    // Logo background
    ctx.fillStyle = `hsl(${dvdBouncerState.hue}, 100%, ${40 + beatPulse * 20}%)`;
    ctx.fillRect(dvdBouncerState.x, dvdBouncerState.y, logoWidth, logoHeight);
    
    // DVD text
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = `bold ${logoHeight * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DVD', dvdBouncerState.x + logoWidth / 2, dvdBouncerState.y + logoHeight / 2);
    
    // Inner glow effect
    ctx.fillStyle = `hsla(${dvdBouncerState.hue}, 100%, 70%, 0.3)`;
    ctx.fillRect(
        dvdBouncerState.x + logoWidth * 0.1,
        dvdBouncerState.y + logoHeight * 0.1,
        logoWidth * 0.3,
        logoHeight * 0.3
    );
    
    ctx.shadowBlur = 0;
    
    // Draw audio visualization bars at edges
    if (chroma && chroma.length) {
        const barWidth = width / chroma.length;
        ctx.globalAlpha = 0.3;
        
        chroma.forEach((value, i) => {
            const hue = (i / chroma.length) * 360;
            const barHeight = value * height * 0.2;
            
            // Bottom bars
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
        });
        
        ctx.globalAlpha = 1;
    }
}

// --- GUMMY STATE ---
let gummyState = {
    hexagons: [],
    initialized: false
};

function drawGummyWave(ctx, width, height, chroma, mel, beatPulse, time) {
    // Dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Initialize honeycomb grid structure (store relative positions only)
    if (!gummyState.initialized) {
        gummyState.hexagons = [];
        
        // Create honeycomb grid with relative positions
        for (let row = -7; row <= 7; row++) {
            for (let col = -7; col <= 7; col++) {
                gummyState.hexagons.push({ row, col });
            }
        }
        gummyState.initialized = true;
    }
    
    // Check window dimensions to determine number of hexagons
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const isLandscape = windowWidth > windowHeight;
    const numHexagons = isLandscape ? 3 : 2;
    
    // Calculate spacing and size for multiple hexagons
    const mainRadius = Math.min(width / numHexagons, height) * 0.35 * (1 + beatPulse * 0.05);
    const spacing = width / numHexagons;
    
    // Draw each main hexagon
    for (let hexIndex = 0; hexIndex < numHexagons; hexIndex++) {
        const centerX = spacing * (hexIndex + 0.5);
        const centerY = height / 2;
        
        const hexSize = mainRadius / 6;
        const hexHeight = hexSize * Math.sqrt(3);
        const hexWidth = hexSize * 2;
        
        // Draw all honeycomb hexagons with rainbow gradient
        gummyState.hexagons.forEach((hex, index) => {
            // Calculate absolute position based on current dimensions
            const x = centerX + hex.col * hexWidth * 0.75;
            const y = centerY + hex.row * hexHeight + (hex.col % 2) * hexHeight * 0.5;
            
            // Check if hexagon is inside the main hexagon boundary
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist >= mainRadius * 0.9) return; // Skip hexagons outside boundary
            
            // Calculate position-based hue for rainbow effect
            const angle = Math.atan2(dy, dx);
            
            // Rainbow hue based on angle and distance, offset by hexagon index
            const baseHue = ((angle + Math.PI) / (Math.PI * 2)) * 360 + time * 20 + hexIndex * 120;
            const distFactor = (dist / mainRadius);
            const hue = (baseHue + distFactor * 120) % 360;
            
            // Get chroma value for this hue
            const chromaIndex = Math.floor((hue / 360) * 12) % 12;
            const chromaValue = chroma[chromaIndex] || 0;
            
            // Get mel value based on position and hexagon index
            const melIndex = Math.floor((distFactor + hexIndex / numHexagons) * (mel?.length - 1 || 0)) % mel?.length;
            const melValue = mel && mel[melIndex] ? mel[melIndex] : 0;
            
            // Color intensity reacts to music
            const saturation = 75 + chromaValue * 25;
            const lightness = 60 + melValue * 15 + beatPulse * 10;
            const scale = 1 + melValue * 0.1 + beatPulse * 0.08;
            
            // Draw hexagon
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const hexAngle = (Math.PI / 3) * i;
                const px = Math.cos(hexAngle) * hexSize;
                const py = Math.sin(hexAngle) * hexSize;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            
            // Gradient fill
            const gradient = ctx.createRadialGradient(
                -hexSize * 0.3, -hexSize * 0.3, 0,
                0, 0, hexSize
            );
            gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness + 15}%)`);
            gradient.addColorStop(0.7, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
            gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`);
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Black outline
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Glossy highlight
            const highlightGrad = ctx.createRadialGradient(
                -hexSize * 0.35, -hexSize * 0.35, 0,
                -hexSize * 0.35, -hexSize * 0.35, hexSize * 0.5
            );
            highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = highlightGrad;
            ctx.beginPath();
            ctx.arc(-hexSize * 0.25, -hexSize * 0.25, hexSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        // Draw large hexagon border (tan/beige outline)
        ctx.save();
        ctx.translate(centerX, centerY);
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const x = Math.cos(angle) * mainRadius;
            const y = Math.sin(angle) * mainRadius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        // Tan border with gradient
        const borderGradient = ctx.createLinearGradient(-mainRadius, -mainRadius, mainRadius, mainRadius);
        borderGradient.addColorStop(0, '#a08060');
        borderGradient.addColorStop(0.5, '#c0a080');
        borderGradient.addColorStop(1, '#806040');
        
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 25 + beatPulse * 5;
        ctx.stroke();
        
        // Inner shadow on border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        ctx.restore();
    }
}

// --- SACRED GEOMETRY ---
// --- SACRED GEOMETRY STATE ---
let sacredGeometryState = {
    smoothedBeat: 0,
    rotation: 0,
    lastTime: 0
};

function drawSacredGeometryWave(ctx, width, height, chroma, mel, beatPulse, time) {
    if (!sacredGeometryState.lastTime) sacredGeometryState.lastTime = time;
    const deltaTime = Math.max(0, Math.min(0.1, time - sacredGeometryState.lastTime));
    sacredGeometryState.lastTime = time;

    const settings = getEffectiveWaveformSettings('sacred_geometry');
    const centerX = width / 2;
    const centerY = height * (settings.basePosition / 100);
    const scale = settings.maxAmplitude / 100;
    
    // Smooth beat pulse for visual transitions
    sacredGeometryState.smoothedBeat += (beatPulse - sacredGeometryState.smoothedBeat) * 0.1;
    // Rotation speed tied to beat
    sacredGeometryState.rotation += deltaTime * (0.25 + sacredGeometryState.smoothedBeat * 0.6);

    // Calculate energy with proper normalization
    let energy = 0;
    if (mel && mel.length) {
        const rawEnergy = mel.reduce((a, b) => a + b, 0) / mel.length;
        energy = Math.max(0, Math.min(1, (rawEnergy + 10) / 10)); // Normalize dB
    }

    // Mathematical Sacred Geometry scaling
    // In a perfect Flower of Life, circle radius = distance between centers
    const R = Math.min(width, height) * 0.12 * scale;
    const circleSize = R * (0.9 + sacredGeometryState.smoothedBeat * 0.2);
    
    const maxLayers = 4;
    const activeLayers = 1.5 + energy * 1.5 + sacredGeometryState.smoothedBeat * 1.5;

    ctx.lineWidth = 1.2 + energy * 2;

    const rot = sacredGeometryState.rotation;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);

    // Draw from center outwards on a true hexagonal lattice (Flower of Life)
    for (let l = 0; l <= maxLayers; l++) {
        const layerActive = Math.max(0, Math.min(1, activeLayers - l));
        if (layerActive <= 0 && l > 0) continue; // Always draw center

        const circleCount = l === 0 ? 1 : 6 * l;
        const layerAlpha = layerActive * (0.2 + energy * 0.4 + sacredGeometryState.smoothedBeat * 0.3);
        const circleColor = `hsla(${(time * 15 + l * 40) % 360}, 75%, 65%, ${layerAlpha})`;
        const lineColor = `hsla(${(time * 15 + l * 40) % 360}, 75%, 65%, ${0.08 * Math.max(0, (sacredGeometryState.smoothedBeat - 0.3) * 1.5) * layerActive})`;

        for (let i = 0; i < circleCount; i++) {
            // Hex ring position: walk the six edges between corners so circles interlock
            let lx, ly;
            if (l === 0) {
                lx = 0; ly = 0;
            } else {
                const side = Math.floor(i / l);
                const step = i % l;
                const a1 = (side / 6) * Math.PI * 2;
                const a2 = ((side + 1) / 6) * Math.PI * 2;
                const t = step / l;
                lx = (Math.cos(a1) * (1 - t) + Math.cos(a2) * t) * l * R;
                ly = (Math.sin(a1) * (1 - t) + Math.sin(a2) * t) * l * R;
            }
            // Rotate the whole lattice together so layers stay aligned
            const cx = centerX + lx * cosR - ly * sinR;
            const cy = centerY + lx * sinR + ly * cosR;

            ctx.strokeStyle = circleColor;
            ctx.beginPath();
            ctx.arc(cx, cy, circleSize, 0, Math.PI * 2);
            ctx.stroke();

            // Connect to center with synchronized lines
            if (l > 0 && sacredGeometryState.smoothedBeat > 0.3) {
                ctx.strokeStyle = lineColor;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(cx, cy);
                ctx.stroke();
            }
        }
    }
    
    // Central Geometric Figure - Strictly locked to the 2nd layer radius
    const vertices = 6;
    const polyR = R * 2; 
    const polyAlpha = 0.3 + sacredGeometryState.smoothedBeat * 0.6;
    
    if (polyAlpha > 0.01) {
        ctx.strokeStyle = `hsla(${(time * 15) % 360}, 100%, 90%, ${polyAlpha})`;
        ctx.lineWidth = 2.0;
        
        // Use a single path for the hexagon to prevent cumulative brightness
        ctx.beginPath();
        for (let i = 0; i <= vertices; i++) {
            const angle = (i / vertices) * Math.PI * 2 + sacredGeometryState.rotation; 
            const x = centerX + Math.cos(angle) * polyR;
            const y = centerY + Math.sin(angle) * polyR;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Inner connections drawn once per vertex
        if (sacredGeometryState.smoothedBeat > 0.1) {
            ctx.save();
            ctx.globalAlpha = 0.2 * sacredGeometryState.smoothedBeat;
            for (let i = 0; i < vertices; i++) {
                const angle = (i / vertices) * Math.PI * 2 + sacredGeometryState.rotation; 
                const x = centerX + Math.cos(angle) * polyR;
                const y = centerY + Math.sin(angle) * polyR;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(centerX, centerY);
                ctx.stroke();
            }
            ctx.restore();
        }
    }
    
    drawWaveLabels(ctx, width, height, chroma);
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
/**
 * Quantum Flux 🌊⚛️ - Advanced 3D morphing waveform with quantum particle effects
 * Combines terrain-style 3D rendering with morphing geometry, particle trails, and energy fields
 * Features: Dynamic mesh deformation, chromatic aberration, depth-of-field blur, holographic shimmer
 */
// --- QUANTUM FLUX STATE ---
let quantumFluxState = {
    smoothedBeat: 0,
    smoothedMel: [],
    smoothedChroma: new Array(12).fill(0),
    lastTime: 0
};

function drawQuantumFluxWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  if (!quantumFluxState.lastTime) quantumFluxState.lastTime = time;
  quantumFluxState.lastTime = time;

  // Smoothing
  quantumFluxState.smoothedBeat += (beatPulse - quantumFluxState.smoothedBeat) * 0.15;
  for (let i = 0; i < 12; i++) {
    quantumFluxState.smoothedChroma[i] += ((chroma[i] || 0) - quantumFluxState.smoothedChroma[i]) * 0.1;
  }
  
  // Initialize or update smoothed mel
  if (mel && mel.length > 0) {
    if (quantumFluxState.smoothedMel.length !== mel.length) {
      quantumFluxState.smoothedMel = [...mel];
    } else {
      for (let i = 0; i < mel.length; i++) {
        quantumFluxState.smoothedMel[i] += (mel[i] - quantumFluxState.smoothedMel[i]) * 0.15;
      }
    }
  }

  const settings = getEffectiveWaveformSettings('quantum_flux');
  const centerY = height * (settings.basePosition / 100);
  const fluxIntensity = settings.maxAmplitude / 100;
  
  // Use smoothed values for calculations
  const sChroma = quantumFluxState.smoothedChroma;
  const sMel = quantumFluxState.smoothedMel;
  const sBeat = quantumFluxState.smoothedBeat;

  // Find dominant and secondary chroma for color scheme
  let dominantIdx = 0, secondaryIdx = 0;
  let maxChroma = 0, secondMax = 0;
  for (let i = 0; i < 12; i++) {
    const val = sChroma[i];
    if (val > maxChroma) {
      secondMax = maxChroma;
      secondaryIdx = dominantIdx;
      maxChroma = val;
      dominantIdx = i;
    } else if (val > secondMax) {
      secondMax = val;
      secondaryIdx = i;
    }
  }
  const primaryHue = CHROMA_HUES[dominantIdx];
  const secondaryHue = CHROMA_HUES[secondaryIdx];
  
  // Multi-layered background with quantum field effect
  const bgGradient = ctx.createRadialGradient(width/2, centerY, 0, width/2, centerY, Math.max(width, height) * 0.8);
  bgGradient.addColorStop(0, `hsla(${primaryHue}, 50%, 5%, 0.9)`);
  bgGradient.addColorStop(0.4, `hsla(${secondaryHue}, 40%, 8%, 0.7)`);
  bgGradient.addColorStop(1, `hsla(${primaryHue}, 30%, 3%, 0.5)`);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Energy field rings that pulse outward
  const numRings = 6;
  for (let r = 0; r < numRings; r++) {
    const ringPhase = (time * 0.3 + r * 0.5) % 2;
    const ringRadius = (ringPhase / 2) * Math.max(width, height) * 1.2;
    const ringAlpha = (1 - ringPhase / 2) * 0.15 * (0.5 + sBeat * 0.5);
    
    if (ringAlpha > 0.01) {
      ctx.strokeStyle = `hsla(${primaryHue + r * 15}, 70%, 60%, ${ringAlpha})`;
      ctx.lineWidth = 1.5 + sBeat * 2.5;
      ctx.beginPath();
      ctx.arc(width/2, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  // 3D Mesh Grid with quantum deformation
  const gridRows = 30; // Reduced slightly for performance
  const gridCols = 40;
  const gridPoints = [];
  
  const horizonY = centerY - height * fluxIntensity * 0.6;
  const groundY = centerY + height * fluxIntensity * 0.4;
  
  for (let row = 0; row < gridRows; row++) {
    const rowPoints = [];
    const rowT = row / (gridRows - 1);
    const baseY = horizonY + (groundY - horizonY) * rowT;
    
    const perspectiveScale = 0.15 + rowT * 0.85;
    const rowWidth = width * perspectiveScale * 1.2;
    const startX = (width - rowWidth) / 2;
    
    for (let col = 0; col < gridCols; col++) {
      const colT = col / (gridCols - 1);
      const x = startX + colT * rowWidth;
      
      const wave1 = Math.sin(colT * Math.PI * 4 + time * 2 + rowT * 2.5) * 0.4;
      const wave2 = Math.cos(colT * Math.PI * 6 - time * 1.6 + rowT * 1.8) * 0.3;
      const wave3 = Math.sin((colT + rowT) * Math.PI * 8 + time * 2.8) * 0.2;
      
      const dx = colT - 0.5;
      const dy = rowT - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ripple = Math.sin(dist * Math.PI * 8 - time * 3.5) * 0.3 * Math.exp(-dist * 2);
      
      const melIdx = sMel ? Math.floor(colT * sMel.length) : 0;
      const melValue = sMel && sMel[melIdx] !== undefined ? Math.max(0, (sMel[melIdx] + 10) / 10) : 0.4;
      
      const chromaIdx = Math.floor(colT * 11.99);
      const chromaValue = sChroma[chromaIdx] || 0.3;
      
      const beatWave = Math.sin(colT * Math.PI * 3 + time * 1.5) * sBeat * 0.4;
      
      const totalDeformation = (wave1 + wave2 + wave3 + ripple + beatWave) * melValue;
      const heightMultiplier = height * fluxIntensity * 0.5 * perspectiveScale;
      const heightOffset = totalDeformation * heightMultiplier;
      
      rowPoints.push({
        x,
        y: baseY - heightOffset,
        baseY,
        melValue,
        chromaIdx,
        chromaValue,
        perspectiveScale,
        deformation: totalDeformation
      });
    }
    gridPoints.push(rowPoints);
  }
  
  ctx.globalCompositeOperation = 'lighter';
  
  for (let row = 0; row < gridRows - 1; row++) {
    const rowT = row / gridRows;
    for (let col = 0; col < gridCols - 1; col++) {
      const p1 = gridPoints[row][col];
      const p2 = gridPoints[row][col + 1];
      const p3 = gridPoints[row + 1][col + 1];
      const p4 = gridPoints[row + 1][col];
      
      const avgDeformation = Math.abs((p1.deformation + p2.deformation + p3.deformation + p4.deformation) / 4);
      const avgChromaValue = (p1.chromaValue + p2.chromaValue + p3.chromaValue + p4.chromaValue) / 4;
      const avgMel = (p1.melValue + p2.melValue + p3.melValue + p4.melValue) / 4;
      
      const hueShift = avgDeformation * 60 + rowT * 30 + time * 20;
      const hue = (primaryHue + hueShift) % 360;
      const depthAlpha = 0.25 + rowT * 0.45 + avgChromaValue * 0.2;
      
      const lightness = 25 + avgMel * 30 + avgDeformation * 20 + sBeat * 15;
      const saturation = 50 + avgChromaValue * 30 + sBeat * 20;
      
      const quadGradient = ctx.createLinearGradient(p1.x, p1.y, p3.x, p3.y);
      quadGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${depthAlpha * 0.35})`);
      quadGradient.addColorStop(1, `hsla(${(hue + 20) % 360}, ${saturation}%, ${lightness + 5}%, ${depthAlpha * 0.55})`);
      
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fillStyle = quadGradient;
      ctx.fill();
      
      if (avgChromaValue > 0.55 || avgDeformation > 0.35) {
        ctx.strokeStyle = `hsla(${hue}, ${saturation + 20}%, ${lightness + 25}%, ${depthAlpha * 0.6})`;
        ctx.lineWidth = 0.4 + avgChromaValue * 1.2;
        ctx.stroke();
      }
    }
  }
  
  ctx.globalCompositeOperation = 'source-over';
  
  // Holographic shimmer particles
  const numParticles = Math.floor(25 + sBeat * 15);
  for (let i = 0; i < numParticles; i++) {
    const seed1 = Math.sin(i * 123.456 + time * 0.4);
    const seed2 = Math.cos(i * 789.012 + time * 0.6);
    const px = width * 0.2 + ((seed1 + 1) / 2) * width * 0.6;
    const py = horizonY + ((seed2 + 1) / 2) * (groundY - horizonY) * 0.5;
    const driftY = py - ((time + i * 0.1) % 3) * 30;
    
    if (driftY < horizonY - 50) continue;
    const particleAge = ((time + i * 0.1) % 3) / 3;
    const particleAlpha = (1 - particleAge) * 0.5;
    const chromaIdx = i % 12;
    const hue = CHROMA_HUES[chromaIdx];
    const particleSize = 1.5 + sChroma[chromaIdx] * 4 + sBeat * 2.5;
    
    const glowGradient = ctx.createRadialGradient(px, driftY, 0, px, driftY, particleSize * 3);
    glowGradient.addColorStop(0, `hsla(${hue}, 100%, 75%, ${particleAlpha})`);
    glowGradient.addColorStop(0.5, `hsla(${hue}, 90%, 65%, ${particleAlpha * 0.4})`);
    glowGradient.addColorStop(1, `hsla(${hue}, 80%, 55%, 0)`);
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(px, driftY, particleSize * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Central Beam
  const beamHeight = height * fluxIntensity * 0.8 * (0.6 + sBeat * 0.4);
  const beamGradient = ctx.createLinearGradient(width/2, centerY - beamHeight, width/2, centerY + beamHeight);
  beamGradient.addColorStop(0, 'transparent');
  beamGradient.addColorStop(0.3, `hsla(${primaryHue}, 80%, 60%, 0.12)`);
  beamGradient.addColorStop(0.5, `hsla(${secondaryHue}, 90%, 70%, 0.2)`);
  beamGradient.addColorStop(0.7, `hsla(${primaryHue}, 80%, 60%, 0.12)`);
  beamGradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = beamGradient;
  ctx.fillRect(width/2 - 30, centerY - beamHeight, 60, beamHeight * 2);
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Water Ripple 💧🌊 - Realistic 3D water droplet ripples with depth and highlights
 * Based on the asymptotic solution to linearized water wave equations
 * Features: Realistic shading, highlights, shadows, and 3D depth appearance
 * Optimized: Uses efficient circle rendering with gradient effects
 */
function drawWaterRippleWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('water_ripple');
  const centerY = height * (settings.basePosition / 100);
  const scale = settings.maxAmplitude / 100;
  
  // Constants for ripple effect
  const estimatedBPM = 120;
  const dropletInterval = (60 / estimatedBPM) * 1.5; // New droplet every ~0.75s
  const waveSpeed = 200; // Pixels per second expansion
  
  // Find dominant chroma for background
  let dominantIdx = 0;
  let maxChroma = 0;
  for (let i = 0; i < 12; i++) {
    if (chroma[i] > maxChroma) {
      maxChroma = chroma[i];
      dominantIdx = i;
    }
  }
  const dominantHue = CHROMA_HUES[dominantIdx];
  
  // Deep water background
  const bgGradient = ctx.createRadialGradient(width/2, centerY, 0, width/2, centerY, Math.max(width, height) * 0.8);
  bgGradient.addColorStop(0, `hsla(${dominantHue}, 50%, 15%, 1)`);
  bgGradient.addColorStop(0.5, `hsla(${dominantHue}, 60%, 8%, 1)`);
  bgGradient.addColorStop(1, `hsla(${dominantHue}, 60%, 4%, 1)`);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Calculate active droplets based on time
  const numDroplets = Math.floor(time / dropletInterval) + 1;
  const historyCount = 15; // How many past droplets to keep tracking
  const startIdx = Math.max(0, numDroplets - historyCount);
  
  // Draw ripples for each active droplet
  for (let i = startIdx; i < numDroplets; i++) {
    const dropTimeStart = i * dropletInterval;
    const age = time - dropTimeStart;
    
    if (age < 0) continue;
    
    // Position logic: Circular pattern around center
    const chromaIdx = i % 12;
    const hue = CHROMA_HUES[chromaIdx];
    // Use current chroma value if available, otherwise default fallback
    const noteIntensity = chroma[chromaIdx] !== undefined ? chroma[chromaIdx] : 0.5;
    
    // Spiral position - calculate based on SPAWN time to keep position fixed for a given droplet
    // We use a pseudo-random but deterministic radius based on the index to vary position without jittering
    const angle = (chromaIdx / 12) * Math.PI * 2 + (dropTimeStart * 0.2); 
    
    // Use a deterministic "random" value derived from index for radius variation
    // Math.sin(i * 123) gives a stable value between -1 and 1 for this droplet
    const deterministicRandom = Math.sin(i * 123.45); 
    const radiusVariation = 0.8 + 0.3 * (0.5 + 0.5 * deterministicRandom); // Range 0.8 to 1.1
    
    const radiusPos = (Math.min(width, height) * 0.35) * scale * radiusVariation;
    
    const dropX = width/2 + Math.cos(angle) * radiusPos;
    const dropY = centerY + Math.sin(angle) * radiusPos; // respecting basePosition
    
    // Dynamic ripple properties based on music data
    const ripplesPerDrop = 2 + Math.floor(noteIntensity * 4); // 2 to 6 rings based on intensity
    const rippleDelay = 0.25; // seconds between rings
    const thicknessScale = 1 + beatPulse * 1.5; // Pulse thickness with beat
    
    for (let r = 0; r < ripplesPerDrop; r++) {
      const ringAge = age - (r * rippleDelay);
      if (ringAge < 0) continue;
      
      const radius = ringAge * waveSpeed;
      const maxRadius = Math.min(width, height) * 0.8;
      
      if (radius > maxRadius) continue;
      
      // Calculate opacity/visibility
      const progress = radius / maxRadius;
      const baseAlpha = 1 - progress;
      // Fade out over time and distance
      const alpha = baseAlpha * Math.exp(-ringAge * 0.5) * (noteIntensity + 0.4);
      
      if (alpha < 0.02) continue;
      
      // Draw 3D-ish Ripple Ring (Shadow, Main, Highlight)
      
      // Shadow (outer/darker)
      ctx.beginPath();
      ctx.arc(dropX, dropY, radius + 2, 0, Math.PI * 2);
      ctx.lineWidth = 4 * thicknessScale;
      ctx.strokeStyle = `hsla(${hue}, 60%, 10%, ${alpha * 0.6})`;
      ctx.stroke();
      
      // Main body
      ctx.beginPath();
      ctx.arc(dropX, dropY, radius, 0, Math.PI * 2);
      ctx.lineWidth = 3 * thicknessScale;
      ctx.strokeStyle = `hsla(${hue}, 80%, 50%, ${alpha})`;
      ctx.stroke();
      
      // Highlight (inner/lighter)
      ctx.beginPath();
      // Ensure non-negative radius
      ctx.arc(dropX, dropY, Math.max(0, radius - 2), 0, Math.PI * 2);
      ctx.lineWidth = 1.5 * thicknessScale;
      ctx.strokeStyle = `hsla(${hue}, 90%, 85%, ${alpha * 0.9})`;
      ctx.stroke();
    }
    
    // Impact splash (only when very fresh)
    if (age < 0.3) {
      const splashProgress = age / 0.3;
      const splashRadius = 5 + (splashProgress * 40 * (1 + beatPulse));
      const splashAlpha = 1 - splashProgress;
      
      // Glow
      const grad = ctx.createRadialGradient(dropX, dropY, 0, dropX, dropY, splashRadius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${splashAlpha})`);
      grad.addColorStop(0.5, `hsla(${hue}, 100%, 70%, ${splashAlpha * 0.8})`);
      grad.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(dropX, dropY, splashRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Spirograph - hypotrochoid curves, one per active chroma note
 */
function drawSpirographWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('spirograph');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxRadius = Math.min(width, height) * 0.5 * (settings.maxAmplitude / 100);

  let melEnergy = 0.5;
  if (mel && mel.length > 0) {
    const avg = mel.reduce((a, b) => a + b, 0) / mel.length;
    melEnergy = Math.max(0, Math.min(1, (avg + 10) / 10));
  }

  const rotation = time * 0.15;

  for (let chromaIdx = 0; chromaIdx < 12; chromaIdx++) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.15) continue;

    const hue = CHROMA_HUES[chromaIdx];
    const R = maxRadius * (0.5 + chromaValue * 0.5) * (1 + beatPulse * 0.15);
    const r = R * (0.2 + (chromaIdx % 5) * 0.08);
    const d = r * (0.5 + melEnergy);
    const lobes = 3 + (chromaIdx % 4) * 2;
    const k = (lobes - 1) / lobes;
    const steps = 180;

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2 * lobes + rotation + chromaIdx * 0.3;
      const x = centerX + (R - r) * Math.cos(t) + d * Math.cos(t * k / (1 - k));
      const y = centerY + (R - r) * Math.sin(t) - d * Math.sin(t * k / (1 - k));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    const alpha = 0.25 + chromaValue * 0.5 + beatPulse * 0.15;
    ctx.strokeStyle = `hsla(${hue}, 85%, ${50 + chromaValue * 20}%, ${alpha})`;
    ctx.lineWidth = 1 + chromaValue * 2 + beatPulse;
    ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.6)`;
    ctx.shadowBlur = 6 + beatPulse * 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Starfield Warp - stars streaking outward from center, warp speed follows energy
 */
function drawStarfieldWarpWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('starfield_warp');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxDist = Math.max(width, height) * 0.7 * (settings.maxAmplitude / 100);

  let melEnergy = 0.5;
  if (mel && mel.length > 0) {
    const avg = mel.reduce((a, b) => a + b, 0) / mel.length;
    melEnergy = Math.max(0, Math.min(1, (avg + 10) / 10));
  }

  const warpSpeed = 0.3 + melEnergy * 1.2 + beatPulse * 0.8;
  const numStars = 140;

  for (let s = 0; s < numStars; s++) {
    const seed = s * 127.31;
    const angle = (seed % 6.283) + Math.floor(seed / 6.283) * 0.618;
    const cycleLength = 2.5 + (s % 7) * 0.6;
    const progress = ((time * warpSpeed + seed) % cycleLength) / cycleLength;
    const dist = progress * progress * maxDist;
    if (dist < 4) continue;

    const chromaIdx = s % 12;
    const chromaValue = chroma[chromaIdx] || 0;
    const hue = CHROMA_HUES[chromaIdx];

    const x = centerX + Math.cos(angle) * dist;
    const y = centerY + Math.sin(angle) * dist;
    if (x < 0 || x > width || y < 0 || y > height) continue;

    const streakLength = dist * (0.05 + melEnergy * 0.15 + beatPulse * 0.1);
    const tailX = centerX + Math.cos(angle) * Math.max(0, dist - streakLength);
    const tailY = centerY + Math.sin(angle) * Math.max(0, dist - streakLength);

    const alpha = progress * (0.4 + chromaValue * 0.5 + beatPulse * 0.2);
    const grad = ctx.createLinearGradient(tailX, tailY, x, y);
    grad.addColorStop(0, `hsla(${hue}, 80%, 60%, 0)`);
    grad.addColorStop(1, `hsla(${hue}, 80%, ${60 + chromaValue * 25}%, ${alpha})`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1 + progress * 2 + chromaValue * 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Vinyl Record - spinning disc whose grooves ripple with mel energy,
 * chroma notes light up groove arcs, tonearm tracks playback progress
 */
function drawVinylRecordWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('vinyl_record');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const discRadius = Math.min(width, height) * 0.5 * (settings.maxAmplitude / 100) * (1 + beatPulse * 0.03);

  let melEnergy = 0.5;
  if (mel && mel.length > 0) {
    const avg = mel.reduce((a, b) => a + b, 0) / mel.length;
    melEnergy = Math.max(0, Math.min(1, (avg + 10) / 10));
  }

  const spin = time * (1.5 + melEnergy * 1.5 + beatPulse);

  const disc = ctx.createRadialGradient(centerX, centerY, discRadius * 0.2, centerX, centerY, discRadius);
  disc.addColorStop(0, `rgba(30, 30, 35, 0.95)`);
  disc.addColorStop(1, `rgba(10, 10, 14, 0.95)`);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(centerX, centerY, discRadius, 0, Math.PI * 2);
  ctx.fill();

  const labelRadius = discRadius * 0.28;
  const numGrooves = 14;
  const grooveSpan = discRadius * 0.92 - labelRadius * 1.15;

  for (let g = 0; g < numGrooves; g++) {
    const t = g / (numGrooves - 1);
    const baseRadius = labelRadius * 1.15 + t * grooveSpan;

    let wobble = 0;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(t * (mel.length - 1));
      wobble = Math.max(0, Math.min(1, (mel[melIdx] + 10) / 10));
    }

    const chromaIdx = g % 12;
    const chromaValue = chroma[chromaIdx] || 0;
    const hue = CHROMA_HUES[chromaIdx];

    const steps = 90;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const ripple = Math.sin(angle * 6 + spin + g * 0.7) * wobble * 4 * (1 + beatPulse);
      const r = baseRadius + ripple;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    if (chromaValue > 0.2) {
      ctx.strokeStyle = `hsla(${hue}, 80%, ${45 + chromaValue * 30}%, ${0.2 + chromaValue * 0.6})`;
      ctx.lineWidth = 1 + chromaValue * 1.5 + beatPulse;
      ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.5)`;
      ctx.shadowBlur = 5 + chromaValue * 8;
    } else {
      ctx.strokeStyle = `rgba(120, 120, 130, ${0.12 + wobble * 0.15})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Light sheen sweeping with the spin
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, discRadius, 0, Math.PI * 2);
  ctx.clip();
  const sheenAngle = spin * 0.5;
  const sheen = ctx.createLinearGradient(
    centerX - Math.cos(sheenAngle) * discRadius, centerY - Math.sin(sheenAngle) * discRadius,
    centerX + Math.cos(sheenAngle) * discRadius, centerY + Math.sin(sheenAngle) * discRadius
  );
  sheen.addColorStop(0.42, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(0.5, `rgba(255, 255, 255, ${0.05 + melEnergy * 0.06})`);
  sheen.addColorStop(0.58, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(centerX - discRadius, centerY - discRadius, discRadius * 2, discRadius * 2);
  ctx.restore();

  // Center label colored by dominant chroma note
  let dominantIdx = 0;
  for (let i = 1; i < 12; i++) {
    if ((chroma[i] || 0) > (chroma[dominantIdx] || 0)) dominantIdx = i;
  }
  const labelHue = CHROMA_HUES[dominantIdx];
  const label = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, labelRadius);
  label.addColorStop(0, `hsla(${labelHue}, 70%, ${40 + beatPulse * 20}%, 0.95)`);
  label.addColorStop(1, `hsla(${labelHue}, 75%, 25%, 0.95)`);
  ctx.fillStyle = label;
  ctx.beginPath();
  ctx.arc(centerX, centerY, labelRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(5, 5, 8, 0.95)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, discRadius * 0.02 + 2, 0, Math.PI * 2);
  ctx.fill();

  // Tonearm resting on the groove, angle drifts slowly inward over time
  const armProgress = (time % 180) / 180;
  const needleRadius = discRadius * 0.92 - armProgress * grooveSpan;
  const armAngle = -Math.PI / 4 + beatPulse * 0.02;
  const needleX = centerX + Math.cos(armAngle) * needleRadius;
  const needleY = centerY + Math.sin(armAngle) * needleRadius;
  const pivotX = centerX + Math.cos(armAngle) * discRadius * 1.15;
  const pivotY = centerY + Math.sin(armAngle) * discRadius * 1.15;

  ctx.strokeStyle = `rgba(200, 200, 210, 0.8)`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(needleX, needleY);
  ctx.stroke();

  ctx.fillStyle = `hsla(${labelHue}, 85%, 65%, ${0.7 + beatPulse * 0.3})`;
  ctx.shadowColor = `hsla(${labelHue}, 90%, 60%, 0.8)`;
  ctx.shadowBlur = 8 + beatPulse * 12;
  ctx.beginPath();
  ctx.arc(needleX, needleY, 4 + beatPulse * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  drawWaveLabels(ctx, width, height, chroma);
}

// Helper function to convert HSL to RGB
function hslToRgb(h, s, l) {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
