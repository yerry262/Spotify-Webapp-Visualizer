import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Bar/spectrum analyzer style - chroma colored
 */
export function drawBarWave(ctx, width, height, chroma, mel, beatPulse, _time) {
  const settings = getEffectiveWaveformSettings('bars');
  const baseY = height * (settings.basePosition / 100);
  const maxBarHeight = height * (settings.maxAmplitude / 100);
  const numBars = mel && mel.length > 0 ? Math.min(mel.length, 48) : 48;
  const barWidth = width / numBars * 0.85;
  const gap = width / numBars * 0.15;
  
  for (let i = 0; i < numBars; i++) {
    const t = i / numBars;
    const x = i * (barWidth + gap) + gap / 2;
    
    // Get value from mel
    let value = 0.3;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(i * mel.length / numBars);
      value = Math.max(0.1, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    
    // Map to chroma for color - each bar gets color from corresponding pitch class
    const chromaIdx = Math.floor(t * 12);
    const chromaValue = chroma[chromaIdx] || 0.5;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Height influenced by both mel and chroma
    const barHeight = value * maxBarHeight * (0.5 + chromaValue * 0.5) * (1 + beatPulse * 0.5);
    
    // Gradient bar
    const gradient = ctx.createLinearGradient(x, baseY, x, baseY - barHeight);
    const lightness = 40 + chromaValue * 25;
    gradient.addColorStop(0, `hsla(${hue}, 80%, ${lightness}%, 0.9)`);
    gradient.addColorStop(0.5, `hsla(${hue}, 85%, ${lightness + 15}%, 0.85)`);
    gradient.addColorStop(1, `hsla(${hue}, 90%, ${lightness + 25}%, 0.8)`);
    
    ctx.fillStyle = gradient;
    
    // Rounded rect
    const radius = Math.min(barWidth / 2, 3);
    ctx.beginPath();
    ctx.roundRect(x, baseY - barHeight, barWidth, barHeight, [radius, radius, 0, 0]);
    ctx.fill();
    
    // Top highlight for loud notes
    if (chromaValue > 0.5) {
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.8)`;
      ctx.shadowBlur = 8 * chromaValue;
      ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${chromaValue})`;
      ctx.beginPath();
      ctx.roundRect(x, baseY - barHeight, barWidth, 3, [radius, radius, 0, 0]);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Flowing ribbon style - 12 chroma ribbons
 */
