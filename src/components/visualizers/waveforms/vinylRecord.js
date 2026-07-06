import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Vinyl Record - spinning disc whose grooves ripple with mel energy,
 * chroma notes light up groove arcs, tonearm tracks playback progress
 */
export function drawVinylRecordWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('vinyl_record');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const discRadius = Math.min(width, height) * 0.5 * (settings.maxAmplitude / 100) * (1 + beatPulse * 0.03);

  let melEnergy = 0.5;
  if (mel && mel.length > 0) {
    const avg = mel.reduce((a, b) => a + b, 0) / mel.length;
    melEnergy = Math.max(0, Math.min(1, (avg + 10) / 10));
  }

  const spin = time * (1.5 + melEnergy * 1.5 + beatPulse);

  const disc = ctx.createRadialGradient(centerX, centerY, discRadius * 0.2, centerX, centerY, discRadius);
  disc.addColorStop(0, `rgba(30, 30, 35, 0.95)`);
  disc.addColorStop(1, `rgba(10, 10, 14, 0.95)`);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(centerX, centerY, discRadius, 0, Math.PI * 2);
  ctx.fill();

  const labelRadius = discRadius * 0.28;
  const numGrooves = 14;
  const grooveSpan = discRadius * 0.92 - labelRadius * 1.15;

  for (let g = 0; g < numGrooves; g++) {
    const t = g / (numGrooves - 1);
    const baseRadius = labelRadius * 1.15 + t * grooveSpan;

    let wobble = 0;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(t * (mel.length - 1));
      wobble = Math.max(0, Math.min(1, (mel[melIdx] + 10) / 10));
    }

    const chromaIdx = g % 12;
    const chromaValue = chroma[chromaIdx] || 0;
    const hue = CHROMA_HUES[chromaIdx];

    const steps = 90;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const ripple = Math.sin(angle * 6 + spin + g * 0.7) * wobble * 4 * (1 + beatPulse);
      const r = baseRadius + ripple;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    if (chromaValue > 0.2) {
      ctx.strokeStyle = `hsla(${hue}, 80%, ${45 + chromaValue * 30}%, ${0.2 + chromaValue * 0.6})`;
      ctx.lineWidth = 1 + chromaValue * 1.5 + beatPulse;
      ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.5)`;
      ctx.shadowBlur = 5 + chromaValue * 8;
    } else {
      ctx.strokeStyle = `rgba(120, 120, 130, ${0.12 + wobble * 0.15})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Light sheen sweeping with the spin
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, discRadius, 0, Math.PI * 2);
  ctx.clip();
  const sheenAngle = spin * 0.5;
  const sheen = ctx.createLinearGradient(
    centerX - Math.cos(sheenAngle) * discRadius, centerY - Math.sin(sheenAngle) * discRadius,
    centerX + Math.cos(sheenAngle) * discRadius, centerY + Math.sin(sheenAngle) * discRadius
  );
  sheen.addColorStop(0.42, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(0.5, `rgba(255, 255, 255, ${0.05 + melEnergy * 0.06})`);
  sheen.addColorStop(0.58, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(centerX - discRadius, centerY - discRadius, discRadius * 2, discRadius * 2);
  ctx.restore();

  // Center label colored by dominant chroma note
  let dominantIdx = 0;
  for (let i = 1; i < 12; i++) {
    if ((chroma[i] || 0) > (chroma[dominantIdx] || 0)) dominantIdx = i;
  }
  const labelHue = CHROMA_HUES[dominantIdx];
  const label = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, labelRadius);
  label.addColorStop(0, `hsla(${labelHue}, 70%, ${40 + beatPulse * 20}%, 0.95)`);
  label.addColorStop(1, `hsla(${labelHue}, 75%, 25%, 0.95)`);
  ctx.fillStyle = label;
  ctx.beginPath();
  ctx.arc(centerX, centerY, labelRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(5, 5, 8, 0.95)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, discRadius * 0.02 + 2, 0, Math.PI * 2);
  ctx.fill();

  // Tonearm resting on the groove, angle drifts slowly inward over time
  const armProgress = (time % 180) / 180;
  const needleRadius = discRadius * 0.92 - armProgress * grooveSpan;
  const armAngle = -Math.PI / 4 + beatPulse * 0.02;
  const needleX = centerX + Math.cos(armAngle) * needleRadius;
  const needleY = centerY + Math.sin(armAngle) * needleRadius;
  const pivotX = centerX + Math.cos(armAngle) * discRadius * 1.15;
  const pivotY = centerY + Math.sin(armAngle) * discRadius * 1.15;

  ctx.strokeStyle = `rgba(200, 200, 210, 0.8)`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(needleX, needleY);
  ctx.stroke();

  ctx.fillStyle = `hsla(${labelHue}, 85%, 65%, ${0.7 + beatPulse * 0.3})`;
  ctx.shadowColor = `hsla(${labelHue}, 90%, 60%, 0.8)`;
  ctx.shadowBlur = 8 + beatPulse * 12;
  ctx.beginPath();
  ctx.arc(needleX, needleY, 4 + beatPulse * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  drawWaveLabels(ctx, width, height, chroma);
}
