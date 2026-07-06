import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * 3D Mesh/wireframe wave - 12 chroma colored lines with depth
 */
export function drawMesh3DWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('mesh3d');
  const baseY = height * (settings.basePosition / 100);
  const maxHeight = height * (settings.maxAmplitude / 100);
  const numPoints = 50;
  const perspective = 0.6;
  
  // Sort chroma (draw quieter/back first)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (let lineIdx = 0; lineIdx < sortedIndices.length; lineIdx++) {
    const chromaIdx = sortedIndices[lineIdx];
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const lineProgress = lineIdx / 12;
    const yOffset = lineProgress * 25 * perspective;
    const scale = 0.5 + chromaValue * 0.5;
    const alpha = 0.4 + chromaValue * 0.5;
    const phaseOffset = chromaIdx * 0.5;
    const speed = 1.5 + chromaIdx * 0.1;
    
    ctx.beginPath();
    ctx.strokeStyle = `hsla(${hue}, 80%, ${50 + chromaValue * 20}%, ${alpha})`;
    ctx.lineWidth = 1 + chromaValue * 2;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * width;
      
      // Get mel value for local height
      let melValue = 0.3;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor(t * mel.length);
        melValue = Math.max(0.1, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      const wave = Math.sin(t * Math.PI * 4 + time * speed + phaseOffset);
      const y = baseY - yOffset - (melValue * maxHeight * scale * (0.5 + wave * 0.5)) * (1 + beatPulse * 0.3);
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    // Glow for prominent notes
    if (chromaValue > 0.4) {
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.6)`;
      ctx.shadowBlur = 8 * chromaValue;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
