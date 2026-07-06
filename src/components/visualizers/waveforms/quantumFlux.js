import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

// --- QUANTUM FLUX STATE ---
let quantumFluxState = {
    smoothedBeat: 0,
    smoothedMel: [],
    smoothedChroma: new Array(12).fill(0),
    lastTime: 0
};

export function drawQuantumFluxWave(ctx, width, height, chroma, mel, beatPulse, time) {
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
