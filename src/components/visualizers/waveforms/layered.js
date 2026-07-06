import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Original layered wave style
 */
export function drawLayeredWave(ctx, width, height, chroma, mel, beatPulse, time) {
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
