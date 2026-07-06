import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

// --- NEON PONG STATE ---
let pongState = {
  x: 0.5, y: 0.5, vx: 0.32, vy: 0.21, leftY: 0.5, rightY: 0.5,
  trail: [], sparks: [], lastTime: 0
};

export function drawNeonPongWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('neon_pong');
  const courtMidY = height * (settings.basePosition / 100);
  const paddleRange = height * 0.5 * (settings.maxAmplitude / 100);

  let dt = time - pongState.lastTime;
  if (dt < 0 || dt > 0.1) dt = 0.016;
  pongState.lastTime = time;

  // Left paddle chases the BASS, right paddle chases the TREBLE
  let bass = 0.5, treble = 0.5;
  if (mel && mel.length) {
    const third = Math.floor(mel.length / 3);
    const norm = (v) => Math.max(0, Math.min(1, (v + 10) / 10));
    bass = norm(mel.slice(0, third).reduce((a, b) => a + b, 0) / third);
    treble = norm(mel.slice(-third).reduce((a, b) => a + b, 0) / third);
  }
  const leftTarget = 0.5 - (bass - 0.5) * 0.9;
  const rightTarget = 0.5 - (treble - 0.5) * 0.9;
  pongState.leftY += (leftTarget - pongState.leftY) * Math.min(1, dt * 5);
  pongState.rightY += (rightTarget - pongState.rightY) * Math.min(1, dt * 5);

  // Ball physics: energy sets pace, beats kick it harder
  const energy = (bass + treble) / 2;
  const speed = (0.25 + energy * 0.5) * (1 + beatPulse * 0.9);
  pongState.x += pongState.vx * speed * dt * 2.2;
  pongState.y += pongState.vy * speed * dt * 2.2;

  let domIdx = 0;
  for (let i = 1; i < 12; i++) if (chroma[i] > chroma[domIdx]) domIdx = i;
  const ballHue = CHROMA_HUES[domIdx];

  // Bounces (paddles always connect — the crowd goes wild forever)
  const spark = (x, y) => pongState.sparks.push({ x, y, hue: ballHue, born: time });
  if (pongState.y <= 0.06) { pongState.y = 0.06; pongState.vy = Math.abs(pongState.vy); spark(pongState.x, pongState.y); }
  if (pongState.y >= 0.94) { pongState.y = 0.94; pongState.vy = -Math.abs(pongState.vy); spark(pongState.x, pongState.y); }
  if (pongState.x <= 0.06) {
    pongState.x = 0.06; pongState.vx = Math.abs(pongState.vx);
    pongState.vy += (Math.random() - 0.5) * 0.15; spark(pongState.x, pongState.y);
  }
  if (pongState.x >= 0.94) {
    pongState.x = 0.94; pongState.vx = -Math.abs(pongState.vx);
    pongState.vy += (Math.random() - 0.5) * 0.15; spark(pongState.x, pongState.y);
  }
  // Keep vy sane
  pongState.vy = Math.max(-0.5, Math.min(0.5, pongState.vy));

  // Center net: mel spectrum as glowing dashes
  if (mel && mel.length) {
    const dashes = 16;
    for (let i = 0; i < dashes; i++) {
      const mIdx = Math.floor((i / dashes) * mel.length);
      const v = Math.max(0, Math.min(1, (mel[mIdx] + 10) / 10));
      const dy = (i + 0.5) / dashes * height;
      ctx.fillStyle = `hsla(${CHROMA_HUES[i % 12]}, 80%, 60%, ${0.15 + v * 0.5})`;
      ctx.fillRect(width / 2 - 2 - v * 3, dy - 8, 4 + v * 6, 16);
    }
  }

  // Paddles: neon slabs glowing with their band's energy
  const padH = paddleRange * 0.5;
  const padW = Math.max(6, width * 0.012);
  const drawPaddle = (px, py, hue, level) => {
    ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.9)`;
    ctx.shadowBlur = 10 + level * 25 + beatPulse * 10;
    ctx.fillStyle = `hsla(${hue}, 90%, ${55 + level * 25}%, 0.95)`;
    ctx.fillRect(px, py - padH / 2, padW, padH);
  };
  const leftPy = courtMidY + (pongState.leftY - 0.5) * 2 * paddleRange;
  const rightPy = courtMidY + (pongState.rightY - 0.5) * 2 * paddleRange;
  drawPaddle(width * 0.035, leftPy, 200, bass);      // bass = cool blue
  drawPaddle(width * 0.965 - padW, rightPy, 320, treble); // treble = hot pink
  ctx.shadowBlur = 0;

  // Ball trail
  pongState.trail.push({ x: pongState.x, y: pongState.y, born: time });
  pongState.trail = pongState.trail.filter(t => time - t.born < 0.35);
  for (const t of pongState.trail) {
    const a = 1 - (time - t.born) / 0.35;
    ctx.fillStyle = `hsla(${ballHue}, 95%, 65%, ${a * 0.35})`;
    ctx.beginPath();
    ctx.arc(t.x * width, t.y * height, 7 * a, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ball: dominant-note color, beat-pumped
  const ballR = (6 + energy * 5) * (1 + beatPulse * 0.4);
  ctx.shadowColor = `hsla(${ballHue}, 100%, 70%, 1)`;
  ctx.shadowBlur = 16 + beatPulse * 20;
  ctx.fillStyle = `hsla(${ballHue}, 95%, 70%, 1)`;
  ctx.beginPath();
  ctx.arc(pongState.x * width, pongState.y * height, ballR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Bounce sparks
  pongState.sparks = pongState.sparks.filter(sp => time - sp.born < 0.4);
  for (const sp of pongState.sparks) {
    const a = (time - sp.born) / 0.4;
    for (let p = 0; p < 6; p++) {
      const ang = (p / 6) * Math.PI * 2 + sp.born * 7;
      const d = a * 25;
      ctx.fillStyle = `hsla(${sp.hue}, 100%, 70%, ${1 - a})`;
      ctx.fillRect(sp.x * width + Math.cos(ang) * d, sp.y * height + Math.sin(ang) * d, 3, 3);
    }
  }

  drawWaveLabels(ctx, width, height, chroma);
}
