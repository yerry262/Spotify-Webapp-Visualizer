import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

// --- RIBBON STATE ---
let ribbonState = {
  smoothedChroma: new Array(12).fill(0),
  smoothedMel: [],
  smoothedBeat: 0,
  lastTime: 0
};

export function drawRibbonWave(ctx, width, height, chroma, mel, beatPulse, time) {
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
