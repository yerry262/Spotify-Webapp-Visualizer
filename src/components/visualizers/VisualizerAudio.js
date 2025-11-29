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
export const WAVEFORM_DEFAULTS = {
  layered: { basePosition: 95, maxAmplitude: 50 },
  oscilloscope: { basePosition: 60, maxAmplitude: 30 },
  bars: { basePosition: 95, maxAmplitude: 50 },
  ribbon: { basePosition: 50, maxAmplitude: 15 },
  mirrored: { basePosition: 50, maxAmplitude: 50 },
  dotted: { basePosition: 50, maxAmplitude: 40 },
  pixelated: { basePosition: 95, maxAmplitude: 50 },
  mesh3d: { basePosition: 95, maxAmplitude: 45 },
  gradient_bars: { basePosition: 95, maxAmplitude: 50 },
  sine_layers: { basePosition: 50, maxAmplitude: 50 },
  circular_dots: { basePosition: 60, maxAmplitude: 40 },
  neon_lines: { basePosition: 50, maxAmplitude: 50 }
};

// Waveform settings state
let waveformSettings = {
  maxAmplitude: 45, // Custom slider value (used when useCustomSettings is true)
  basePosition: 60, // Custom slider value (used when useCustomSettings is true)
  useCustomSettings: false // Toggle: false = use hardcoded defaults, true = use sliders
};

// Waveform settings getters/setters
export function getWaveformSettings() {
  return { ...waveformSettings };
}

export function setWaveformSettings(settings) {
  waveformSettings = { ...waveformSettings, ...settings };
}

export function setWaveformMaxAmplitude(amplitude) {
  waveformSettings.maxAmplitude = Math.max(10, Math.min(50, amplitude));
}

export function setWaveformBasePosition(position) {
  waveformSettings.basePosition = Math.max(25, Math.min(100, position));
}

// Get effective waveform settings (either custom or hardcoded defaults based on toggle)
export function getEffectiveWaveformSettings(styleId) {
  if (waveformSettings.useCustomSettings) {
    return {
      basePosition: waveformSettings.basePosition,
      maxAmplitude: waveformSettings.maxAmplitude
    };
  }
  // Use hardcoded defaults for the current style
  return WAVEFORM_DEFAULTS[styleId] || WAVEFORM_DEFAULTS.layered;
}

// Particle settings state
let particleSettings = {
  enabled: true,
  count: 20,
  size: 1.0,
  speed: 1.0
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

// Export waveform styles for menu
export const WAVEFORM_STYLES = [
  { id: 'layered', name: 'Layered Waves' },
  { id: 'oscilloscope', name: 'Oscilloscope' },
  { id: 'bars', name: 'Spectrum Bars' },
  { id: 'ribbon', name: 'Flowing Ribbons' },
  { id: 'mirrored', name: 'Mirrored Wave' },
  { id: 'dotted', name: 'Particle Dots' },
  { id: 'pixelated', name: 'Pixelated' },
  { id: 'mesh3d', name: '3D Mesh' },
  { id: 'gradient_bars', name: 'Gradient Bars' },
  { id: 'sine_layers', name: 'Sine Layers' },
  { id: 'circular_dots', name: 'Circular Dots' },
  { id: 'neon_lines', name: 'Neon Lines' }
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
    lastWaveformStyleChange = 0; // Force immediate change on next frame
  }
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
  if (isAutoWaveformMode && time - lastWaveformStyleChange > 30) {
    let newStyle;
    do {
      newStyle = Math.floor(Math.random() * WAVEFORM_STYLES.length);
    } while (newStyle === currentWaveformStyle && WAVEFORM_STYLES.length > 1);
    currentWaveformStyle = newStyle;
    lastWaveformStyleChange = time;
  }
  
  // Background with fade trail
  ctx.fillStyle = 'rgba(10, 10, 15, 0.12)';
  ctx.fillRect(0, 0, width, height);
  
  // Beat flash effect
  if (vizState.beatPulse > 0.5) {
    ctx.fillStyle = `hsla(${vizState.dominantHue}, 70%, 50%, ${vizState.beatPulse * 0.1})`;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Draw all visualization components
  const pitch = frame.pitch || 0;
  
  // Draw waveform FIRST (behind other elements)
  drawChromaSoundWaves(ctx, width, height, frame.chroma, frame.mel, vizState.beatPulse, time);
  
  // Then draw particles, mel ring, chroma wheel, and pitch orb on top
  updateAndDrawParticles(ctx, width, height, vizState.beatPulse, vizState.dominantHue, vizState.energyLevel, vizState, pitch);
  drawCircularMel(ctx, centerX, centerY, radius, frame.mel, vizState.beatPulse, vizState.dominantHue);
  drawChromaWheel(ctx, centerX, centerY, radius, frame.chroma, vizState.chromaRotation, vizState.beatPulse);
  drawPitchOrb(ctx, centerX, centerY, radius, pitch, frame.pitchConfidence || 0, vizState.beatPulse, vizState.dominantHue);
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
    case 'layered':
    default:
      drawLayeredWave(ctx, width, height, chroma, mel, beatPulse, time);
      break;
  }
}

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
