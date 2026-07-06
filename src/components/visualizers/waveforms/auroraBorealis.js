import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Aurora Borealis - Flowing curtains of light with chroma colors
 */
export function drawAuroraBorealisWave(ctx, width, height, chroma, mel, beatPulse, time) {
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
