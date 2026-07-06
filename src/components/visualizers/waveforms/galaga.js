import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

// --- GALAGA SWARM STATE ---
let galagaState = {
  shipX: 0.5, lasers: [], explosions: [], stars: [], lastTime: 0, initialized: false
};

export function drawGalagaWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('galaga');
  const shipY = height * (settings.basePosition / 100);
  const swarmDepth = height * 0.55 * (settings.maxAmplitude / 100);

  // Clamp dt so seeks don't teleport everything
  let dt = time - galagaState.lastTime;
  if (dt < 0 || dt > 0.1) dt = 0.016;
  galagaState.lastTime = time;

  if (!galagaState.initialized) {
    galagaState.stars = Array.from({ length: 60 }, (_, i) => ({
      x: (i * 0.618) % 1, y: (i * 0.382) % 1, speed: 0.3 + (i % 5) * 0.2, size: 0.5 + (i % 3) * 0.7
    }));
    galagaState.initialized = true;
  }

  let energy = 0.3;
  if (mel && mel.length) {
    energy = Math.max(0.1, Math.min(1, (mel.reduce((a, b) => a + b, 0) / mel.length + 10) / 10));
  }

  // Scrolling starfield, faster when the song pushes
  for (const star of galagaState.stars) {
    star.y = (star.y + star.speed * (0.3 + energy) * dt) % 1;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + star.size * 0.25})`;
    ctx.fillRect(star.x * width, star.y * height, star.size, star.size * 2);
  }

  // Enemy swarm: 12 columns (one per note) x 3 rows in classic formation,
  // wobbling side to side; a bug's glow = its note's intensity
  const cols = 12, rows = 3;
  const wobble = Math.sin(time * 1.2) * width * 0.04;
  const colWidth = (width * 0.8) / cols;
  let domIdx = 0;
  for (let i = 1; i < 12; i++) if (chroma[i] > chroma[domIdx]) domIdx = i;

  for (let c = 0; c < cols; c++) {
    const v = chroma[c] || 0;
    for (let r = 0; r < rows; r++) {
      const bx = width * 0.1 + c * colWidth + colWidth / 2 + wobble * (r % 2 ? 1 : -1);
      const by = height * 0.12 + r * (swarmDepth / rows) + Math.sin(time * 2 + c * 0.5 + r) * 6 * (0.5 + beatPulse);
      const hue = CHROMA_HUES[c];
      const size = (5 + v * 7) * (1 + beatPulse * 0.25) * (1 - r * 0.15);

      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;
      ctx.shadowBlur = 4 + v * 14;
      ctx.fillStyle = `hsla(${hue}, 90%, ${45 + v * 30}%, ${0.35 + v * 0.6})`;
      // Bug body: diamond + wing dots, reads 8-bit at a distance
      ctx.beginPath();
      ctx.moveTo(bx, by - size);
      ctx.lineTo(bx + size, by);
      ctx.lineTo(bx, by + size);
      ctx.lineTo(bx - size, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(bx - size * 1.5, by - size * 0.3, size * 0.6, size * 0.6);
      ctx.fillRect(bx + size * 0.9, by - size * 0.3, size * 0.6, size * 0.6);
    }
  }
  ctx.shadowBlur = 0;

  // Ship glides toward the loudest note's column
  const targetX = 0.1 + (domIdx + 0.5) / cols * 0.8;
  galagaState.shipX += (targetX - galagaState.shipX) * Math.min(1, dt * 6);
  const sx = galagaState.shipX * width;

  // Beat = fire! Laser streaks up at the dominant column, bug explodes
  if (beatPulse > 0.85 && galagaState.lasers.length < 6) {
    galagaState.lasers.push({ x: sx, y: shipY, hue: CHROMA_HUES[domIdx], col: domIdx, born: time });
  }
  galagaState.lasers = galagaState.lasers.filter(l => time - l.born < 0.5);
  for (const laser of galagaState.lasers) {
    laser.y -= height * 2.2 * dt;
    ctx.shadowColor = `hsla(${laser.hue}, 100%, 70%, 1)`;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = `hsla(${laser.hue}, 100%, 75%, 0.95)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(laser.x, laser.y);
    ctx.lineTo(laser.x, laser.y + 18);
    ctx.stroke();
    // Impact: explosion at the column's front row
    const hitY = height * 0.12 + (rows - 1) * (swarmDepth / rows);
    if (laser.y <= hitY && !laser.hit) {
      laser.hit = true;
      galagaState.explosions.push({ x: laser.x, y: hitY, hue: laser.hue, born: time });
    }
  }
  galagaState.explosions = galagaState.explosions.filter(e => time - e.born < 0.45);
  for (const boom of galagaState.explosions) {
    const a = (time - boom.born) / 0.45;
    for (let p = 0; p < 8; p++) {
      const ang = (p / 8) * Math.PI * 2;
      const d = a * 30;
      ctx.fillStyle = `hsla(${boom.hue}, 100%, 65%, ${1 - a})`;
      ctx.fillRect(boom.x + Math.cos(ang) * d - 2, boom.y + Math.sin(ang) * d - 2, 4, 4);
    }
  }
  ctx.shadowBlur = 0;

  // Player ship (chunky pixel fighter), thrusters flare with the bass
  const bass = mel && mel.length ? Math.max(0, (mel[0] + 10) / 10) : 0.3;
  const s = Math.min(width, height) * 0.022 * (1 + beatPulse * 0.15);
  ctx.fillStyle = '#e8e8ff';
  ctx.fillRect(sx - s * 0.4, shipY - s * 2, s * 0.8, s * 2);
  ctx.fillRect(sx - s * 1.6, shipY - s * 0.6, s * 3.2, s);
  ctx.fillStyle = `hsla(${CHROMA_HUES[domIdx]}, 90%, 60%, 0.9)`;
  ctx.fillRect(sx - s * 0.25, shipY - s * 2.7, s * 0.5, s * 0.7);
  ctx.fillStyle = `hsla(30, 100%, ${50 + bass * 30}%, ${0.5 + bass * 0.5})`;
  ctx.fillRect(sx - s * 0.9, shipY + s * 0.4, s * 0.5, s * (0.8 + bass * 1.5));
  ctx.fillRect(sx + s * 0.4, shipY + s * 0.4, s * 0.5, s * (0.8 + bass * 1.5));

  drawWaveLabels(ctx, width, height, chroma);
}
