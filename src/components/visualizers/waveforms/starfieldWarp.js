import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Starfield Warp - stars streaking outward from center, warp speed follows energy
 */
export function drawStarfieldWarpWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('starfield_warp');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxDist = Math.max(width, height) * 0.7 * (settings.maxAmplitude / 100);

  let melEnergy = 0.5;
  if (mel && mel.length > 0) {
    const avg = mel.reduce((a, b) => a + b, 0) / mel.length;
    melEnergy = Math.max(0, Math.min(1, (avg + 10) / 10));
  }

  const warpSpeed = 0.3 + melEnergy * 1.2 + beatPulse * 0.8;
  const numStars = 140;

  for (let s = 0; s < numStars; s++) {
    const seed = s * 127.31;
    const angle = (seed % 6.283) + Math.floor(seed / 6.283) * 0.618;
    const cycleLength = 2.5 + (s % 7) * 0.6;
    const progress = ((time * warpSpeed + seed) % cycleLength) / cycleLength;
    const dist = progress * progress * maxDist;
    if (dist < 4) continue;

    const chromaIdx = s % 12;
    const chromaValue = chroma[chromaIdx] || 0;
    const hue = CHROMA_HUES[chromaIdx];

    const x = centerX + Math.cos(angle) * dist;
    const y = centerY + Math.sin(angle) * dist;
    if (x < 0 || x > width || y < 0 || y > height) continue;

    const streakLength = dist * (0.05 + melEnergy * 0.15 + beatPulse * 0.1);
    const tailX = centerX + Math.cos(angle) * Math.max(0, dist - streakLength);
    const tailY = centerY + Math.sin(angle) * Math.max(0, dist - streakLength);

    const alpha = progress * (0.4 + chromaValue * 0.5 + beatPulse * 0.2);
    const grad = ctx.createLinearGradient(tailX, tailY, x, y);
    grad.addColorStop(0, `hsla(${hue}, 80%, 60%, 0)`);
    grad.addColorStop(1, `hsla(${hue}, 80%, ${60 + chromaValue * 25}%, ${alpha})`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1 + progress * 2 + chromaValue * 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  drawWaveLabels(ctx, width, height, chroma);
}

// Helper function to convert HSL to RGB
