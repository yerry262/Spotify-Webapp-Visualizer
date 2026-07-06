import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

let synthwaveState = { sChroma: new Float32Array(12).fill(0), sBeat: 0, gridOffset: 0, sunPulse: 0, glitchFrame: 0, scanY: 0 };

/**
 * Synthwave Horizon 🌅🛤️ - Outrun/Retrowave infinite grid racing toward you
 * Features: Neon sun, perspective grid floor, VHS scanlines, beat-reactive glitches
 * Inspired by Glitch Art 2's smooth state, randomness that syncs with music
 */
export function drawSynthwaveHorizonWave(ctx, width, height, chroma, mel, beatPulse, time) {
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
  
  // === SCREEN SHAKE (Beat-reactive, ramps in smoothly to avoid flicker) ===
  const shakeAmount = Math.max(0, (synthwaveState.sBeat - 0.7) / 0.3);
  if (shakeAmount > 0) {
    const shakeX = (Math.sin(time * 50) * 3 + Math.cos(time * 37) * 2) * shakeAmount;
    const shakeY = (Math.cos(time * 43) * 2) * shakeAmount;
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
      // Hue keyed to screen position (not loop index) so the scroll wrap is seamless
      const hue = (300 + maxVal * 30 * perspectiveT) % 360;
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
  
  // === NEON GLOW ON GRID (Beat-reactive scanline, fades at both ends of travel) ===
  synthwaveState.scanY = (synthwaveState.scanY + 2 + synthwaveState.sBeat * 3) % gridHeight;
  const scanLineY = horizonY + synthwaveState.scanY;
  const scanFade = Math.sin((synthwaveState.scanY / gridHeight) * Math.PI);

  const scanGrad = ctx.createLinearGradient(0, scanLineY - 20, 0, scanLineY + 20);
  scanGrad.addColorStop(0, 'transparent');
  scanGrad.addColorStop(0.5, `hsla(${secondaryHue}, 100%, 70%, ${(0.3 + synthwaveState.sBeat * 0.4) * scanFade})`);
  scanGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = scanGrad;
  ctx.fillRect(0, scanLineY - 20, width, 40);
  
  // === GLITCH EFFECTS (Like Glitch Art 2) ===
  if (synthwaveState.sBeat > 0.6) {
    // RGB Split on high beats — steady tint scaled by beat, no frame strobing
    const splitAlpha = 0.05 * Math.min(1, (synthwaveState.sBeat - 0.6) / 0.3);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255, 0, 100, ${splitAlpha})`;
    ctx.fillRect(3, 0, width, height);
    ctx.fillStyle = `rgba(0, 255, 255, ${splitAlpha})`;
    ctx.fillRect(-3, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';

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
