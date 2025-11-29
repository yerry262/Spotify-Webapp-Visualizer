/**
 * VisualizerAudio.js
 * 
 * EXACT 1:1 COPY of test-runner.html visualization functions
 * DO NOT MODIFY unless also updating test-runner.html
 */

// Pitch class names for visualization
export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Chroma hues for pitch class visualization (0-330 in 30 degree steps)
export const CHROMA_HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

/**
 * Initialize particle system
 * EXACT COPY from test-runner.html initParticles()
 */
export function initParticles(width, height) {
  const NUM_PARTICLES = 40;
  const particles = [];
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      hue: Math.random() * 60 + 100,
      alpha: Math.random() * 0.5 + 0.3
    });
  }
  return particles;
}

/**
 * REAL VISUALIZATION: Full visualization with actual audio data
 * EXACT COPY from test-runner.html drawRealVisualization()
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
  
  // Background with fade trail
  ctx.fillStyle = 'rgba(10, 10, 15, 0.12)';
  ctx.fillRect(0, 0, width, height);
  
  // Beat flash effect
  if (vizState.beatPulse > 0.5) {
    ctx.fillStyle = `hsla(${vizState.dominantHue}, 70%, 50%, ${vizState.beatPulse * 0.1})`;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Draw all visualization components
  updateAndDrawParticles(ctx, width, height, vizState.beatPulse, vizState.dominantHue, vizState.energyLevel, vizState);
  drawCircularMel(ctx, centerX, centerY, radius, frame.mel, vizState.beatPulse, vizState.dominantHue);
  drawChromaWheel(ctx, centerX, centerY, radius, frame.chroma, vizState.chromaRotation, vizState.beatPulse);
  drawPitchOrb(ctx, centerX, centerY, radius, frame.pitch || 0, frame.pitchConfidence || 0, vizState.beatPulse, vizState.dominantHue);
  drawChromaSoundWaves(ctx, width, height, frame.chroma, frame.mel, vizState.beatPulse, time);
}

/**
 * Draw circular mel spectrogram around the edges
 * EXACT COPY from test-runner.html drawCircularMel()
 */
function drawCircularMel(ctx, centerX, centerY, radius, mel, beatPulse, dominantHue) {
  if (!mel || mel.length === 0) return;
  
  const numBars = mel.length;
  const angleStep = (Math.PI * 2) / numBars;
  const maxBarHeight = radius * 0.3;
  
  for (let i = 0; i < numBars; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const value = Math.max(0, Math.min(1, (mel[i] + 10) / 10));
    const barHeight = value * maxBarHeight * (1 + beatPulse * 0.3);
    
    const innerRadius = radius * 0.85;
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
    const lightness = 40 + value * 35 + beatPulse * 15;
    
    ctx.fillStyle = `hsla(${hue}, 75%, ${lightness}%, ${0.7 + value * 0.3})`;
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
 * Draw chroma wheel as a rotating flower
 * EXACT COPY from test-runner.html drawChromaWheel()
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
    
    // Pitch class label
    const labelDist = radius * 0.75;
    const labelX = centerX + Math.cos(angle) * labelDist;
    const labelY = centerY + Math.sin(angle) * labelDist;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + value * 0.5})`;
    ctx.font = '9px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PITCH_CLASSES[i], labelX, labelY);
  }
}

/**
 * Draw central pitch orb with 3D effect
 * EXACT COPY from test-runner.html drawPitchOrb()
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
 * Update and draw particles
 * EXACT COPY from test-runner.html updateAndDrawParticles()
 */
function updateAndDrawParticles(ctx, width, height, beatPulse, dominantHue, energyLevel, vizState) {
  if (!vizState.particles || vizState.particles.length === 0) {
    vizState.particles = initParticles(width, height);
  }
  
  const centerX = width / 2;
  const centerY = height / 2;
  
  for (let p of vizState.particles) {
    // Apply energy-based velocity boost
    const boost = 1 + energyLevel * 2 + beatPulse * 3;
    p.x += p.vx * boost;
    p.y += p.vy * boost;
    
    // Wrap around edges
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
    
    // Draw particle with energy-reactive size
    const size = p.size * (1 + beatPulse * 2 + energyLevel);
    const hue = (p.hue + dominantHue) % 360;
    
    ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${p.alpha * (0.5 + energyLevel * 0.5)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Chroma-colored sound waves - layered waves for each pitch class
 * EXACT COPY from test-runner.html drawChromaSoundWaves()
 */
function drawChromaSoundWaves(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const baseY = height * 0.92;
  const maxWaveHeight = height * 0.15;
  const numPoints = 60;
  
  // Draw 12 layered waves, one for each pitch class
  // Draw from back to front (lowest intensity to highest)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue; // Skip very quiet pitch classes
    
    const hue = CHROMA_HUES[chromaIdx];
    const waveHeight = maxWaveHeight * (0.3 + chromaValue * 0.7);
    const phaseOffset = chromaIdx * 0.5; // Each pitch class has different phase
    const speed = 1.5 + chromaIdx * 0.1;
    
    ctx.beginPath();
    
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * width;
      const t = i / numPoints;
      
      // Create organic wave shape using multiple sine waves
      const wave1 = Math.sin(t * Math.PI * 4 + time * speed + phaseOffset) * 0.5;
      const wave2 = Math.sin(t * Math.PI * 6 + time * speed * 1.3 + phaseOffset) * 0.3;
      const wave3 = Math.sin(t * Math.PI * 2 + time * speed * 0.7 + phaseOffset) * 0.2;
      
      // Combine waves with energy from mel if available
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
        // Use quadratic curves for smoother waves
        const prevX = ((i - 1) / numPoints) * width;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(cpX, y, x, y);
      }
    }
    
    // Complete the wave shape
    ctx.lineTo(width, baseY + 5);
    ctx.lineTo(0, baseY + 5);
    ctx.closePath();
    
    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, baseY - waveHeight, 0, baseY + 5);
    const alpha = 0.3 + chromaValue * 0.5 + beatPulse * 0.2;
    const lightness = 45 + chromaValue * 20;
    gradient.addColorStop(0, `hsla(${hue}, 85%, ${lightness + 15}%, ${alpha})`);
    gradient.addColorStop(0.5, `hsla(${hue}, 80%, ${lightness}%, ${alpha * 0.7})`);
    gradient.addColorStop(1, `hsla(${hue}, 75%, ${lightness - 10}%, 0.05)`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add glow effect for prominent pitch classes
    if (chromaValue > 0.5) {
      ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.5)`;
      ctx.shadowBlur = 8 * chromaValue;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  // Draw pitch class labels at bottom
  const labelY = baseY + 18;
  ctx.font = '8px "Orbitron", monospace';
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
