import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Mirrored waveform - 12 chroma waves mirrored
 */
export function drawMirroredWave(ctx, width, height, chroma, mel, beatPulse, time) {
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
