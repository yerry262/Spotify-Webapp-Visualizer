/**
 * VisualizerAudio.js
 * 
 * Enhanced visualization with dynamic effects
 */

import {
  PITCH_CLASSES, CHROMA_HUES, WAVEFORM_DEFAULTS, updateWaveformAnimationState,
} from './waveformCore';
import { WAVEFORM_RENDERERS, resetSnakeState, resetRainTetrisState } from './waveforms';

// Re-export the shared core so existing consumers keep working
export {
  PITCH_CLASSES, CHROMA_HUES, WAVEFORM_DEFAULTS, setVisualizerFullScreen,
  getWaveformSettings, setWaveformSettings, setWaveformMaxAmplitude,
  setWaveformBasePosition, getEffectiveWaveformSettings, drawWaveLabels,
  updateWaveformAnimationState,
} from './waveformCore';
export { resetSnakeState } from './waveforms';

// Waveform style tracking (changes every 30 seconds)
// autoWaveformInterval may be Infinity: no timed advance — the Random/Cycle
// buttons then act as one-shot "re-roll"/"next" triggers.
export let autoWaveformInterval = 30;
export const setWaveformAutoInterval = (seconds) => { autoWaveformInterval = seconds; };
let currentWaveformStyle = 0;
let lastWaveformStyleChange = 0;
let isAutoWaveformMode = true; // Auto-switch mode
let autoRotateMode = 'random'; // 'random' | 'cycle' (sequential through the menu)

export function getWaveformRotateMode() {
  return autoRotateMode;
}

export function setWaveformRotateMode(mode) {
  autoRotateMode = mode === 'cycle' ? 'cycle' : 'random';
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
  // New styles (July 2026) — newest first
  { id: 'matrix_rain_2', name: 'Matrix Rain 2' },
  { id: 'lyric_flow', name: 'Lyric Flow' },
  { id: 'galaga', name: 'Galaga Swarm' },
  { id: 'neon_pong', name: 'Neon Pong' },
  { id: 'super_galaxy', name: 'Super Galaxy' },
  { id: 'spirograph', name: 'Spirograph' },
  { id: 'starfield_warp', name: 'Starfield Warp' },
  { id: 'vinyl_record', name: 'Vinyl Record' },
  { id: 'glitch_art_3', name: 'Glitch Art 3' },
  { id: 'maze_mystery', name: 'Maze Mystery' },
  { id: 'minion_mayhem', name: 'Minion Mayhem' },
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
    
    const timedAdvance = Number.isFinite(autoWaveformInterval) &&
      time - lastWaveformStyleChange > autoWaveformInterval;
    if (timedAdvance || lastWaveformStyleChange < -9000) {
      let newStyle;
      if (autoRotateMode === 'cycle') {
        newStyle = (currentWaveformStyle + 1) % WAVEFORM_STYLES.length;
      } else {
        do {
          newStyle = Math.floor(Math.random() * WAVEFORM_STYLES.length);
        } while (newStyle === currentWaveformStyle && WAVEFORM_STYLES.length > 1);
      }
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
  
  const renderer = WAVEFORM_RENDERERS[style] || WAVEFORM_RENDERERS.layered;
  renderer(ctx, width, height, chroma, mel, beatPulse, time);
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

