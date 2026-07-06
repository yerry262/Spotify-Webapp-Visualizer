import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Pixelated/blocky waveform - chroma colored blocks
 */
export function drawPixelatedWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('pixelated');
  const baseY = height * (settings.basePosition / 100);
  const maxHeight = height * (settings.maxAmplitude / 100);
  const blockSize = 6;
  const numBlocks = Math.floor(width / blockSize);
  
  for (let i = 0; i < numBlocks; i++) {
    const t = i / numBlocks;
    const x = i * blockSize;
    
    // Map to chroma for color
    const chromaIdx = Math.floor(t * 12);
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel value for height
    let melValue = 0.3;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(t * mel.length);
      melValue = Math.max(0.1, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    
    // Height based on both mel and chroma
    const wave = Math.sin(t * Math.PI * 3 + time * 2) * 0.15;
    const combinedValue = (melValue * 0.6 + chromaValue * 0.4 + wave) * (1 + beatPulse * 0.3);
    const blockHeight = Math.floor(combinedValue * maxHeight / blockSize) * blockSize;
    const lightness = 40 + chromaValue * 30;
    
    // Draw stacked blocks
    const numStackedBlocks = Math.max(1, Math.floor(blockHeight / blockSize));
    for (let j = 0; j < numStackedBlocks; j++) {
      const by = baseY - (j + 1) * blockSize;
      const alpha = 0.5 + (j / numStackedBlocks) * 0.4;
      ctx.fillStyle = `hsla(${hue}, 85%, ${lightness + j * 2}%, ${alpha})`;
      ctx.fillRect(x + 1, by + 1, blockSize - 2, blockSize - 2);
    }
    
    // Top glow for loud notes
    if (chromaValue > 0.5 && numStackedBlocks > 2) {
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.8)`;
      ctx.shadowBlur = 6;
      ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${chromaValue})`;
      ctx.fillRect(x + 1, baseY - blockHeight + 1, blockSize - 2, blockSize - 2);
      ctx.shadowBlur = 0;
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
