import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Neon lines - 12 chroma colored neon waves
 */
let neonLinesState = {
  sChroma: new Float32Array(12).fill(0),
  sMel: null,
  sBeat: 0
};

export function drawNeonLinesWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('neon_lines');
  const centerY = height * (settings.basePosition / 100);
  const maxAmplitude = height * (settings.maxAmplitude / 100);
  const numPoints = 120;
  
  // Initialize state if needed
  if (!neonLinesState.sMel || (mel && neonLinesState.sMel.length !== mel.length)) {
    neonLinesState.sMel = new Float32Array(mel ? mel.length : 1).fill(0);
  }

  // Smooth values
  const lerp = 0.1;
  neonLinesState.sBeat += (beatPulse - neonLinesState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    neonLinesState.sChroma[i] += (chroma[i] - neonLinesState.sChroma[i]) * lerp;
  }
  if (mel) {
    for (let i = 0; i < mel.length; i++) {
      neonLinesState.sMel[i] += (mel[i] - neonLinesState.sMel[i]) * lerp;
    }
  }

  const sChroma = neonLinesState.sChroma;
  const sBeat = neonLinesState.sBeat;
  const sMel = neonLinesState.sMel;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  
  // Sort chroma (draw quieter first)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => sChroma[a] - sChroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = sChroma[chromaIdx] || 0;
    if (chromaValue < 0.05) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const yOffset = (chromaIdx - 5.5) * 6;
    const speed = 1.0 + chromaIdx * 0.1;
    const phaseOffset = chromaIdx * Math.PI / 6;
    const amplitude = maxAmplitude * (0.2 + chromaValue * 0.8) * (1 + sBeat * 0.5);
    
    // Draw trail/glow
    ctx.shadowBlur = 15 + chromaValue * 20;
    ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.8)`;
    
    ctx.beginPath();
    ctx.lineWidth = 2 + chromaValue * 3;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * width;
      
      let melInfluence = 0.5;
      if (sMel && sMel.length > 0) {
        const melIdx = Math.floor(t * (sMel.length - 1));
        melInfluence = Math.max(0.1, (sMel[melIdx] + 15) / 15);
      }
      
      const wave1 = Math.sin(t * Math.PI * 2 + time * speed + phaseOffset);
      const wave2 = Math.sin(t * Math.PI * 4 + time * speed * 1.4 + phaseOffset) * 0.4;
      const wave3 = Math.cos(t * Math.PI * 1.5 - time * 0.8) * 0.2;
      
      const y = centerY + yOffset + (wave1 + wave2 + wave3) * amplitude * melInfluence;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    const alpha = 0.3 + chromaValue * 0.6;
    ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
    ctx.stroke();
    
    // Bright core
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1 + chromaValue;
    ctx.strokeStyle = `hsla(${hue}, 50%, 95%, ${alpha})`;
    ctx.stroke();
  }
  
  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}
