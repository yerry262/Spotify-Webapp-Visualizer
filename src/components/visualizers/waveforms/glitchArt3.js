import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Glitch Art 3 📡 - Corrupted broadcast: a bold mel waveform whose R/G/B
 * channels tear apart on beats, with quantized jump-cut glitches, a rolling
 * VHS tracking band, and digital block-rain in chroma colors
 */
export function drawGlitchArt3Wave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('glitch_art_3');
  const centerY = height * (settings.basePosition / 100);
  const amp = height * 0.5 * (settings.maxAmplitude / 100);

  // Deterministic pseudo-random from a seed — glitches snap on quantized time
  const rand = (seed) => {
    const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  // Time quantized to jump-cut steps; steps shorten when the music slaps
  const stepLen = beatPulse > 0.6 ? 0.09 : 0.22;
  const tq = Math.floor(time / stepLen);
  const glitchAmount = Math.min(1, beatPulse * 1.2 + rand(tq) * 0.25);

  const melAt = (t) => {
    if (!mel || mel.length === 0) return 0.5;
    const idx = Math.floor(Math.max(0, Math.min(0.999, t)) * mel.length);
    return Math.max(0, Math.min(1, (mel[idx] + 10) / 10));
  };

  let dominantIdx = 0;
  for (let i = 1; i < 12; i++) {
    if ((chroma[i] || 0) > (chroma[dominantIdx] || 0)) dominantIdx = i;
  }
  const dominantHue = CHROMA_HUES[dominantIdx];

  // Waveform y at horizontal position t, sliced into tearing segments
  const numSegments = 12;
  const waveYAt = (t, channelShift) => {
    const seg = Math.floor(t * numSegments);
    const tear = (rand(tq * 31 + seg) - 0.5) * amp * 0.8 * glitchAmount;
    const m = melAt(t);
    const wave = Math.sin(t * Math.PI * 5 + time * 2.2) * 0.3 + Math.sin(t * Math.PI * 11 - time * 3.7) * 0.15;
    return centerY - (m * 0.7 + wave * 0.3) * amp + tear + channelShift;
  };

  // Draw the waveform three times: R, G, B channels split by the glitch
  ctx.globalCompositeOperation = 'lighter';
  const split = 3 + glitchAmount * 18;
  const channels = [
    { color: `rgba(255, 40, 60, 0.8)`, dx: -split, dy: -split * 0.3 },
    { color: `rgba(40, 255, 120, 0.8)`, dx: 0, dy: 0 },
    { color: `rgba(60, 120, 255, 0.8)`, dx: split, dy: split * 0.3 }
  ];
  const points = 96;
  for (const ch of channels) {
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const seg = Math.floor(t * numSegments);
      // Segments also shift horizontally when tearing
      const hShift = (rand(tq * 17 + seg * 7) - 0.5) * width * 0.04 * glitchAmount;
      const x = t * width + hShift + ch.dx;
      const y = waveYAt(t, ch.dy);
      // Break the path at segment boundaries so tears are hard cuts
      if (i === 0 || Math.floor(((i - 1) / points) * numSegments) !== seg) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = ch.color;
    ctx.lineWidth = 2.5 + beatPulse * 2;
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';

  // Solid fill under the green (true) channel, torn per-segment
  for (let seg = 0; seg < numSegments; seg++) {
    const t0 = seg / numSegments;
    const t1 = (seg + 1) / numSegments;
    const hShift = (rand(tq * 17 + seg * 7) - 0.5) * width * 0.04 * glitchAmount;
    const chromaIdx = seg % 12;
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;

    ctx.beginPath();
    const segPts = 8;
    for (let i = 0; i <= segPts; i++) {
      const t = t0 + (t1 - t0) * (i / segPts);
      const x = t * width + hShift;
      const y = waveYAt(t, 0);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(t1 * width + hShift, centerY + amp * 0.25);
    ctx.lineTo(t0 * width + hShift, centerY + amp * 0.25);
    ctx.closePath();
    ctx.fillStyle = `hsla(${CHROMA_HUES[chromaIdx]}, 90%, 55%, ${0.08 + chromaValue * 0.2})`;
    ctx.fill();
  }

  // Rolling VHS tracking band — displaces a horizontal strip as it sweeps
  const bandY = ((time * 0.13) % 1) * height * 1.2 - height * 0.1;
  const bandH = 14 + beatPulse * 30;
  ctx.fillStyle = `rgba(255, 255, 255, ${0.04 + beatPulse * 0.06})`;
  ctx.fillRect(0, bandY, width, bandH);
  ctx.fillStyle = `hsla(${dominantHue}, 90%, 60%, ${0.05 + glitchAmount * 0.1})`;
  ctx.fillRect((rand(tq * 3) - 0.5) * width * 0.1, bandY + bandH, width, 2);

  // Digital block-rain: falling squares in chroma colors, denser when loud
  const numBlocks = 22;
  for (let b = 0; b < numBlocks; b++) {
    const colX = rand(b * 13) * width;
    const fallSpeed = 0.15 + rand(b * 29) * 0.35;
    const by = (((time * fallSpeed + rand(b * 7)) % 1)) * height;
    const chromaIdx = b % 12;
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.2 && rand(tq + b) > 0.3) continue;
    const bs = 3 + chromaValue * 10 + (rand(tq * 5 + b) < glitchAmount ? 8 : 0);
    ctx.fillStyle = `hsla(${CHROMA_HUES[chromaIdx]}, 95%, 60%, ${0.25 + chromaValue * 0.5})`;
    ctx.fillRect(colX, by, bs, bs);
    // Trailing echo block
    ctx.fillStyle = `hsla(${CHROMA_HUES[chromaIdx]}, 95%, 60%, ${(0.25 + chromaValue * 0.5) * 0.3})`;
    ctx.fillRect(colX, by - bs * 2, bs, bs);
  }

  // Full-frame corruption on the hardest hits: inverted bars + freeze flicker
  if (glitchAmount > 0.75) {
    const numBars = 3;
    for (let i = 0; i < numBars; i++) {
      const barY = rand(tq * 41 + i) * height;
      const barH = 4 + rand(tq * 43 + i) * 26;
      ctx.fillStyle = `hsla(${(dominantHue + 180) % 360}, 100%, 60%, ${0.15 * glitchAmount})`;
      ctx.fillRect(0, barY, width, barH);
    }
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * glitchAmount})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(width * 0.02, height * 0.02, width * 0.96, height * 0.96);
  }

  // Faint scanlines to sell the broadcast
  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }

  drawWaveLabels(ctx, width, height, chroma);
}
