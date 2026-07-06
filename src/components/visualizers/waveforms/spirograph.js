import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Spirograph - hypotrochoid curves, one per active chroma note
 */
export function drawSpirographWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('spirograph');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxRadius = Math.min(width, height) * 0.5 * (settings.maxAmplitude / 100);

  let melEnergy = 0.5;
  if (mel && mel.length > 0) {
    const avg = mel.reduce((a, b) => a + b, 0) / mel.length;
    melEnergy = Math.max(0, Math.min(1, (avg + 10) / 10));
  }

  const rotation = time * 0.15;

  for (let chromaIdx = 0; chromaIdx < 12; chromaIdx++) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.15) continue;

    const hue = CHROMA_HUES[chromaIdx];
    const R = maxRadius * (0.5 + chromaValue * 0.5) * (1 + beatPulse * 0.15);
    const r = R * (0.2 + (chromaIdx % 5) * 0.08);
    const d = r * (0.5 + melEnergy);
    const lobes = 3 + (chromaIdx % 4) * 2;
    const k = (lobes - 1) / lobes;
    const steps = 180;

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2 * lobes + rotation + chromaIdx * 0.3;
      const x = centerX + (R - r) * Math.cos(t) + d * Math.cos(t * k / (1 - k));
      const y = centerY + (R - r) * Math.sin(t) - d * Math.sin(t * k / (1 - k));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    const alpha = 0.25 + chromaValue * 0.5 + beatPulse * 0.15;
    ctx.strokeStyle = `hsla(${hue}, 85%, ${50 + chromaValue * 20}%, ${alpha})`;
    ctx.lineWidth = 1 + chromaValue * 2 + beatPulse;
    ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.6)`;
    ctx.shadowBlur = 6 + beatPulse * 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawWaveLabels(ctx, width, height, chroma);
}
