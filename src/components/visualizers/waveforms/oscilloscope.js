import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Oscilloscope-style wave - 12 chroma-colored lines
 */
export function drawOscilloscopeWave(ctx, width, height, chroma, mel, beatPulse, time) {
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
