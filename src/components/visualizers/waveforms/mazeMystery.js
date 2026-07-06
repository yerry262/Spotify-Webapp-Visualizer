import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Maze Mystery 🌀 - Infinite trippy maze tunnel: nested maze rings endlessly
 * zoom out of the center, twisting as they grow, walls glowing chroma colors.
 * The zoom is a seamless loop; energy drives speed, beats kick the twist.
 */
export function drawMazeMysteryWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('maze_mystery');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxRadius = Math.max(width, height) * 0.75 * (settings.maxAmplitude / 100);

  let melEnergy = 0.5;
  if (mel && mel.length > 0) {
    const avg = mel.reduce((a, b) => a + b, 0) / mel.length;
    melEnergy = Math.max(0, Math.min(1, (avg + 10) / 10));
  }

  // Deterministic pseudo-random so the maze is stable per ring/cell
  const rand = (seed) => {
    const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };

  const numRings = 11;
  const growth = 1.45;                       // radius ratio between rings
  const zoomSpeed = 0.25 + melEnergy * 0.5 + beatPulse * 0.3;
  const zoomPhase = (time * zoomSpeed) % 1;  // 0..1, seamless loop
  const twist = time * 0.15 + beatPulse * 0.12;

  // Each ring's identity shifts by 1 every loop so walls stay consistent
  // as rings flow outward (ring k today is ring k+1's pattern next cycle)
  const epoch = Math.floor(time * zoomSpeed);

  for (let k = numRings - 1; k >= 0; k--) {
    // Ring radius grows exponentially with the loop phase folded in
    const fk = k + zoomPhase;
    const radius = maxRadius * Math.pow(growth, fk - numRings + 1);
    if (radius < 4 || radius > maxRadius * 1.2) continue;

    const ringSeed = (epoch + numRings - 1 - k) * 97;
    const depth = radius / maxRadius;        // 0 center .. 1 edge
    const cells = 8 + (k % 3) * 4;           // walls per ring
    const rot = twist * (1 - depth * 0.6) + rand(ringSeed) * Math.PI * 2;
    const innerR = radius / growth;

    const chromaIdx = (epoch + numRings - 1 - k) % 12;
    const chromaValue = chroma[chromaIdx] || 0;
    const hue = CHROMA_HUES[chromaIdx];
    const fade = Math.sin(Math.min(1, depth) * Math.PI); // fade in center, fade at edge
    const alpha = fade * (0.25 + chromaValue * 0.45 + beatPulse * 0.2);
    if (alpha < 0.02) continue;

    ctx.strokeStyle = `hsla(${hue}, 85%, ${50 + chromaValue * 25}%, ${alpha})`;
    ctx.lineWidth = (1 + depth * 3) * (1 + beatPulse * 0.6);
    ctx.shadowColor = `hsla(${hue}, 90%, 60%, ${alpha})`;
    ctx.shadowBlur = 4 + chromaValue * 10 + beatPulse * 8;
    ctx.lineCap = 'round';

    // Maze walls on this ring: arc segments (corridors) + radial spokes (doors)
    ctx.beginPath();
    for (let c = 0; c < cells; c++) {
      const a0 = (c / cells) * Math.PI * 2 + rot;
      const a1 = ((c + 1) / cells) * Math.PI * 2 + rot;
      const cellSeed = ringSeed + c * 13;

      // Arc wall present ~70% of the time
      if (rand(cellSeed) < 0.7) {
        const trim = (a1 - a0) * 0.08;
        ctx.moveTo(centerX + Math.cos(a0 + trim) * radius, centerY + Math.sin(a0 + trim) * radius);
        ctx.arc(centerX, centerY, radius, a0 + trim, a1 - trim);
      }
      // Radial wall (blocked door) ~40% of the time
      if (rand(cellSeed + 7) < 0.4) {
        ctx.moveTo(centerX + Math.cos(a0) * innerR, centerY + Math.sin(a0) * innerR);
        ctx.lineTo(centerX + Math.cos(a0) * radius, centerY + Math.sin(a0) * radius);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Runner lights racing through the corridors — one per strong chroma note
  for (let i = 0; i < 12; i++) {
    const chromaValue = chroma[i] || 0;
    if (chromaValue < 0.35) continue;
    const hue = CHROMA_HUES[i];
    // Each runner spirals outward in its own loop, synced to the zoom
    const runPhase = ((time * zoomSpeed * 0.5 + i / 12) % 1);
    const rr = maxRadius * Math.pow(growth, runPhase * 4 - 4);
    const ra = runPhase * Math.PI * 6 + i * (Math.PI / 6) + twist;
    const rx = centerX + Math.cos(ra) * rr;
    const ry = centerY + Math.sin(ra) * rr;
    const fade = Math.sin(runPhase * Math.PI);

    ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${fade * (0.5 + chromaValue * 0.5)})`;
    ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.9)`;
    ctx.shadowBlur = 10 + beatPulse * 12;
    ctx.beginPath();
    ctx.arc(rx, ry, 3 + chromaValue * 4 + beatPulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // The mystery at the center of the maze
  let dominantIdx = 0;
  for (let i = 1; i < 12; i++) {
    if ((chroma[i] || 0) > (chroma[dominantIdx] || 0)) dominantIdx = i;
  }
  const coreHue = CHROMA_HUES[dominantIdx];
  const coreR = maxRadius * 0.045 * (1 + beatPulse * 0.5 + Math.sin(time * 3) * 0.1);
  const core = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreR * 3);
  core.addColorStop(0, `hsla(${coreHue}, 100%, 80%, ${0.8 + beatPulse * 0.2})`);
  core.addColorStop(0.4, `hsla(${coreHue}, 90%, 55%, 0.4)`);
  core.addColorStop(1, 'transparent');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(centerX, centerY, coreR * 3, 0, Math.PI * 2);
  ctx.fill();

  drawWaveLabels(ctx, width, height, chroma);
}
