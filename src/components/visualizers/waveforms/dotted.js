import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Dotted/particle wave - 12 chroma dot waves
 */
export function drawDottedWave(ctx, width, height, chroma, mel, beatPulse, time) {
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
