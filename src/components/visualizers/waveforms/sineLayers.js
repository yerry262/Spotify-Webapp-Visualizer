import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Sine wave layers - 12 chroma colored sine waves
 */
export function drawSineLayersWave(ctx, width, height, chroma, mel, beatPulse, time) {
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
