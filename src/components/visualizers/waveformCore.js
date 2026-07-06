/**
 * waveformCore.js
 *
 * Shared foundation used by every waveform module: chroma color palette,
 * pitch class names, per-style position/amplitude defaults, the settings
 * state (custom overrides + fullscreen targets + smoothing), and the
 * pitch-class label strip drawn along the bottom of most waveforms.
 */

// Pitch class names for visualization
export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Chroma hues for pitch class visualization (0-330 in 30 degree steps)
export const CHROMA_HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

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
  matrix_rain_2:    { basePosition: 100, maxAmplitude: 100, basePositionFullScreen: 100, maxAmplitudeFullScreen: 100, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  plasma_fire:      { basePosition: 95,  maxAmplitude: 90, basePositionFullScreen: 95,  maxAmplitudeFullScreen: 90, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  helix_dna:        { basePosition: 100,  maxAmplitude: 50, basePositionFullScreen: 100,  maxAmplitudeFullScreen: 55, particles: { enabled: true, count: 5, size: 2.0, speed: 0.5 }, centerElements: { chromaWheel: false, circularMel: true, pitchOrb: false, beatFlash: false } },
  pacman:           { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  snake:            { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: true, circularMel: false, pitchOrb: false, beatFlash: false } },
  rain_tetris:      { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 50, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  galaga:           { basePosition: 88,  maxAmplitude: 60, basePositionFullScreen: 90,  maxAmplitudeFullScreen: 70, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  neon_pong:        { basePosition: 50,  maxAmplitude: 70, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 80, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
  super_galaxy:     { basePosition: 50,  maxAmplitude: 50, basePositionFullScreen: 50,  maxAmplitudeFullScreen: 60, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },
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
  minion_mayhem:    { basePosition: 88,  maxAmplitude: 55, basePositionFullScreen: 90,  maxAmplitudeFullScreen: 65, particles: { enabled: false, count: 0, size: 1.0, speed: 1.0 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: true } },
  lyric_flow:       { basePosition: 92,  maxAmplitude: 35, basePositionFullScreen: 94,  maxAmplitudeFullScreen: 40, particles: { enabled: true, count: 3, size: 1.5, speed: 0.4 }, centerElements: { chromaWheel: false, circularMel: false, pitchOrb: false, beatFlash: false } },

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

export function drawWaveLabels(ctx, width, height, chroma) {
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
