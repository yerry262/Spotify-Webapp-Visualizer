import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Gradient bars with intense glow - chroma colored
 */
export function drawGradientBarsWave(ctx, width, height, chroma, mel, beatPulse, _time) {
  const settings = getEffectiveWaveformSettings('gradient_bars');
  const baseY = height * (settings.basePosition / 100);
  const maxHeight = height * (settings.maxAmplitude / 100);
  const numBars = 60;
  const barWidth = width / numBars;
  
  for (let i = 0; i < numBars; i++) {
    const t = i / numBars;
    const x = i * barWidth;
    
    // Map to chroma
    const chromaIdx = Math.floor(t * 12);
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel value
    let melValue = 0.3;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(t * mel.length);
      melValue = Math.max(0.1, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    
    // Height based on both
    const barHeight = melValue * maxHeight * (0.5 + chromaValue * 0.5) * (1 + beatPulse * 0.4);
    const lightness = 35 + chromaValue * 25;
    
    // Create gradient for each bar
    const gradient = ctx.createLinearGradient(x, baseY, x, baseY - barHeight);
    gradient.addColorStop(0, `hsla(${hue}, 90%, ${lightness}%, 0.9)`);
    gradient.addColorStop(0.5, `hsla(${hue}, 85%, ${lightness + 20}%, 0.85)`);
    gradient.addColorStop(1, `hsla(${hue}, 80%, ${lightness + 35}%, 0.8)`);
    
    // Glow effect based on chroma intensity
    if (chromaValue > 0.3) {
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${chromaValue})`;
      ctx.shadowBlur = 8 + chromaValue * 10;
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, baseY - barHeight, barWidth - 1, barHeight);
    ctx.shadowBlur = 0;
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
