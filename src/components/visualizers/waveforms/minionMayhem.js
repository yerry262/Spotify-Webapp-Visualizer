import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Minion Mayhem 🍌 - Full banana warzone. The equalizer crowd still bounces
 * to their mel bands, but now: minion-piloted rockets launch on the beats
 * and burst into banana fireworks, an airship cruises the sky dropping
 * banana-bombs, and little minions sprint across the floor chasing bananas
 * while explosions go off around them. Stateful with clamped time deltas.
 */
let minionMayhemState = null;

function minionDrawBanana(ctx, x, y, size, spin, bright) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.strokeStyle = `hsl(48, 95%, ${bright}%)`;
  ctx.lineWidth = size * 0.32;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, -size * 0.35, size, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.fillStyle = '#6b4a1b';
  ctx.beginPath();
  ctx.arc(Math.cos(Math.PI * 0.15) * size, -size * 0.35 + Math.sin(Math.PI * 0.15) * size, size * 0.13, 0, Math.PI * 2);
  ctx.arc(Math.cos(Math.PI * 0.85) * size, -size * 0.35 + Math.sin(Math.PI * 0.85) * size, size * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Tiny minion for runners and rocket pilots. pose: 'run' | 'ride' | 'panic'
function minionDrawMini(ctx, x, y, size, pose, phase, facing) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  const w = size, h = size * 1.4, r = w / 2;

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = Math.max(1.5, w * 0.13);
  ctx.lineCap = 'round';
  if (pose === 'run') {
    const legSwing = Math.sin(phase) * w * 0.45;
    ctx.beginPath();
    ctx.moveTo(-w * 0.18, -h * 0.1);
    ctx.lineTo(-w * 0.18 + legSwing, 0);
    ctx.moveTo(w * 0.18, -h * 0.1);
    ctx.lineTo(w * 0.18 - legSwing, 0);
    ctx.stroke();
  }

  const bodyBottom = pose === 'run' ? -h * 0.1 : 0;
  const topY = bodyBottom - h;
  ctx.fillStyle = 'hsl(52, 95%, 58%)';
  ctx.beginPath();
  ctx.arc(0, topY + r, r, Math.PI, 0);
  ctx.lineTo(r, bodyBottom - r * 0.6);
  ctx.arc(0, bodyBottom - r * 0.6, r, 0, Math.PI);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#2b5ba8';
  ctx.beginPath();
  ctx.arc(0, bodyBottom - r * 0.6, r, 0, Math.PI);
  ctx.rect(-r, bodyBottom - r * 0.6 - h * 0.1, w, h * 0.1);
  ctx.fill();

  const eyeY = topY + h * 0.3;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-r, eyeY - w * 0.08, w, w * 0.16);
  ctx.fillStyle = '#c8c8c8';
  ctx.beginPath();
  ctx.arc(w * 0.08, eyeY, w * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(w * 0.08, eyeY, w * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a3d1e';
  ctx.beginPath();
  ctx.arc(w * 0.14, eyeY, w * 0.07, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = Math.max(1, w * 0.08);
  ctx.beginPath();
  if (pose === 'panic') {
    ctx.ellipse(w * 0.05, topY + h * 0.55, w * 0.16, w * 0.2, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(w * 0.05, topY + h * 0.5, w * 0.15, Math.PI * 0.15, Math.PI * 0.85);
  }
  ctx.stroke();

  ctx.strokeStyle = 'hsl(52, 95%, 50%)';
  ctx.lineWidth = Math.max(1.5, w * 0.15);
  const armY = topY + h * 0.6;
  ctx.beginPath();
  if (pose === 'panic') {
    ctx.moveTo(-r * 0.8, armY);
    ctx.lineTo(-r * 1.3, topY - h * 0.05 + Math.sin(phase * 3) * w * 0.15);
    ctx.moveTo(r * 0.8, armY);
    ctx.lineTo(r * 1.3, topY - h * 0.05 - Math.sin(phase * 3) * w * 0.15);
  } else if (pose === 'ride') {
    ctx.moveTo(-r * 0.8, armY);
    ctx.lineTo(-r * 1.2, topY + h * 0.1);
    ctx.moveTo(r * 0.8, armY);
    ctx.lineTo(r * 1.2, topY + h * 0.1);
  } else {
    const swing = Math.cos(phase) * w * 0.35;
    ctx.moveTo(-r * 0.8, armY);
    ctx.lineTo(-r * 0.8 - swing, armY + h * 0.15);
    ctx.moveTo(r * 0.8, armY);
    ctx.lineTo(r * 0.8 + swing, armY + h * 0.15);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawMinionMayhemWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('minion_mayhem');
  const floorY = height * (settings.basePosition / 100);
  const maxJump = height * 0.5 * (settings.maxAmplitude / 100);

  // --- Mayhem state: rockets, explosions, runners, airship ---
  if (!minionMayhemState || minionMayhemState.width !== width) {
    minionMayhemState = {
      width,
      lastTime: time,
      lastBeat: 0,
      bombCooldown: 0,
      rockets: [],
      explosions: [],
      debris: [],
      ship: { x: width * 0.2, dir: 1, bombs: [] },
      runners: Array.from({ length: 5 }, (_, i) => ({
        x: (i + 0.5) * width / 5,
        dir: i % 2 === 0 ? 1 : -1,
        speed: 60 + i * 25,
        size: 16 + (i % 3) * 5,
        panicUntil: 0,
      })),
    };
  }
  const state = minionMayhemState;
  const dt = Math.min(Math.max(time - state.lastTime, 0), 0.1);
  state.lastTime = time;
  const beatEdge = beatPulse > 0.6 && state.lastBeat <= 0.6;
  state.lastBeat = beatPulse;

  const spawnExplosion = (x, y, size) => {
    state.explosions.push({ x, y, size, age: 0 });
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI * (0.15 + Math.random() * 0.7);
      const sp = size * (3 + Math.random() * 5);
      state.debris.push({
        x, y,
        vx: Math.cos(ang) * sp * (Math.random() > 0.5 ? 1 : -1),
        vy: Math.sin(ang) * sp,
        spin: Math.random() * 6,
        spinV: (Math.random() - 0.5) * 12,
        size: 6 + Math.random() * 7,
        age: 0,
      });
    }
    // Nearby runners panic
    for (const r of state.runners) {
      if (Math.abs(r.x - x) < width * 0.25) r.panicUntil = time + 1.2;
    }
  };

  // Rockets launch on beat edges (and always keep a little action going)
  if (beatEdge || (state.rockets.length === 0 && Math.random() < dt * 0.5)) {
    state.rockets.push({
      x: width * (0.1 + Math.random() * 0.8),
      y: floorY,
      vy: -(height * (0.35 + Math.random() * 0.25)),
      wobblePhase: Math.random() * 10,
      burstY: height * (0.12 + Math.random() * 0.3),
      size: 14 + Math.random() * 10,
    });
  }

  // Airship cruises and drops banana-bombs on hard hits
  const ship = state.ship;
  ship.x += ship.dir * (40 + beatPulse * 60) * dt;
  if (ship.x > width * 0.92) ship.dir = -1;
  if (ship.x < width * 0.08) ship.dir = 1;
  state.bombCooldown -= dt;
  const shipY = height * 0.12 + Math.sin(time * 1.2) * 8;
  if (beatPulse > 0.75 && state.bombCooldown <= 0) {
    ship.bombs.push({ x: ship.x, y: shipY + 24, vy: 0 });
    state.bombCooldown = 1.5;
  }
  for (let i = ship.bombs.length - 1; i >= 0; i--) {
    const b = ship.bombs[i];
    b.vy += height * 0.9 * dt;
    b.y += b.vy * dt;
    if (b.y >= floorY - 4) {
      spawnExplosion(b.x, floorY - 10, 26);
      ship.bombs.splice(i, 1);
    }
  }

  // Rockets fly, wobble, then burst into banana fireworks
  for (let i = state.rockets.length - 1; i >= 0; i--) {
    const rk = state.rockets[i];
    rk.y += rk.vy * dt;
    rk.x += Math.sin(time * 6 + rk.wobblePhase) * 20 * dt;
    if (rk.y <= rk.burstY) {
      spawnExplosion(rk.x, rk.y, rk.size * 2.2);
      state.rockets.splice(i, 1);
    }
  }

  // Explosions age out; banana debris flies with gravity
  for (let i = state.explosions.length - 1; i >= 0; i--) {
    state.explosions[i].age += dt;
    if (state.explosions[i].age > 0.7) state.explosions.splice(i, 1);
  }
  for (let i = state.debris.length - 1; i >= 0; i--) {
    const d = state.debris[i];
    d.age += dt;
    d.vy += height * 0.8 * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.spin += d.spinV * dt;
    if (d.age > 2.5 || d.y > floorY + 20) state.debris.splice(i, 1);
  }

  // Runners sprint along the floor, bouncing off the edges
  for (const r of state.runners) {
    const panicking = time < r.panicUntil;
    const runSpeed = r.speed * (0.6 + beatPulse * 0.8) * (panicking ? 2.2 : 1);
    r.x += r.dir * runSpeed * dt;
    if (r.x > width - 20) { r.x = width - 20; r.dir = -1; }
    if (r.x < 20) { r.x = 20; r.dir = 1; }
  }

  const rand = (seed) => {
    const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const melAt = (t) => {
    if (!mel || mel.length === 0) return 0.5;
    const idx = Math.floor(Math.max(0, Math.min(0.999, t)) * mel.length);
    return Math.max(0, Math.min(1, (mel[idx] + 10) / 10));
  };

  let dominantIdx = 0;
  for (let i = 1; i < 12; i++) {
    if ((chroma[i] || 0) > (chroma[dominantIdx] || 0)) dominantIdx = i;
  }
  const spotHue = CHROMA_HUES[dominantIdx];

  // Concert spotlight sweeping in the dominant note's color
  const spotX = width / 2 + Math.sin(time * 0.8) * width * 0.3;
  const spot = ctx.createRadialGradient(spotX, 0, 0, spotX, 0, height * 1.1);
  spot.addColorStop(0, `hsla(${spotHue}, 80%, 55%, ${0.12 + beatPulse * 0.15})`);
  spot.addColorStop(1, 'transparent');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, width, height);

  // Stage floor
  ctx.fillStyle = 'rgba(30, 22, 40, 0.6)';
  ctx.fillRect(0, floorY, width, height - floorY);
  ctx.strokeStyle = `hsla(${spotHue}, 70%, 55%, ${0.3 + beatPulse * 0.4})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(width, floorY);
  ctx.stroke();

  // --- Airship with minion pilot, dropping banana-bombs ---
  {
    const sx = ship.x, sy = shipY;
    const hullW = Math.min(width * 0.14, 150), hullH = hullW * 0.38;
    ctx.save();
    ctx.scale(ship.dir, 1);
    const fx = ship.dir * sx;
    // Balloon hull
    const hull = ctx.createLinearGradient(fx, sy - hullH, fx, sy + hullH);
    hull.addColorStop(0, '#8a8f9c');
    hull.addColorStop(0.5, '#5c6270');
    hull.addColorStop(1, '#3a3f4a');
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.ellipse(fx, sy, hullW / 2, hullH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tail fin
    ctx.fillStyle = '#2b5ba8';
    ctx.beginPath();
    ctx.moveTo(fx - hullW * 0.45, sy);
    ctx.lineTo(fx - hullW * 0.62, sy - hullH * 0.55);
    ctx.lineTo(fx - hullW * 0.62, sy + hullH * 0.55);
    ctx.closePath();
    ctx.fill();
    // Gondola
    ctx.fillStyle = '#3a3f4a';
    ctx.fillRect(fx - hullW * 0.18, sy + hullH * 0.42, hullW * 0.36, hullH * 0.36);
    // Spinning propeller at the nose
    const propLen = hullH * (0.55 + beatPulse * 0.25);
    ctx.strokeStyle = 'rgba(220, 225, 235, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx + hullW * 0.5, sy - Math.sin(time * 30) * propLen);
    ctx.lineTo(fx + hullW * 0.5, sy + Math.sin(time * 30) * propLen);
    ctx.stroke();
    ctx.restore();
    // Pilot peeking from the gondola
    minionDrawMini(ctx, sx, sy + hullH * 0.8, hullH * 0.5, 'ride', time * 4, ship.dir);
    // Falling banana-bombs
    for (const b of ship.bombs) {
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
      ctx.fill();
      // Sparking fuse
      ctx.fillStyle = `hsl(${30 + Math.random() * 30}, 100%, 60%)`;
      ctx.beginPath();
      ctx.arc(b.x + 3, b.y - 8, 2.5 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
      minionDrawBanana(ctx, b.x, b.y - 2, 6, time * 8, 60);
    }
  }

  // --- Rockets with minion riders and flame trails ---
  for (const rk of state.rockets) {
    const rs = rk.size;
    // Flame trail
    for (let f = 0; f < 5; f++) {
      const fy = rk.y + rs * 1.2 + f * rs * 0.5;
      const flick = Math.sin(time * 40 + f * 2 + rk.wobblePhase) * rs * 0.15;
      ctx.fillStyle = `hsla(${35 - f * 6}, 100%, ${60 - f * 8}%, ${0.8 - f * 0.15})`;
      ctx.beginPath();
      ctx.arc(rk.x + flick, fy, rs * (0.45 - f * 0.06), 0, Math.PI * 2);
      ctx.fill();
    }
    // Rocket body
    ctx.save();
    ctx.translate(rk.x, rk.y);
    const grad = ctx.createLinearGradient(-rs * 0.5, 0, rs * 0.5, 0);
    grad.addColorStop(0, '#b8404a');
    grad.addColorStop(0.5, '#e8636e');
    grad.addColorStop(1, '#8f2f38');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -rs * 1.6);
    ctx.quadraticCurveTo(rs * 0.55, -rs * 0.4, rs * 0.5, rs * 0.8);
    ctx.lineTo(-rs * 0.5, rs * 0.8);
    ctx.quadraticCurveTo(-rs * 0.55, -rs * 0.4, 0, -rs * 1.6);
    ctx.fill();
    // Fins
    ctx.fillStyle = '#8f2f38';
    ctx.beginPath();
    ctx.moveTo(-rs * 0.5, rs * 0.3);
    ctx.lineTo(-rs * 0.95, rs * 1.1);
    ctx.lineTo(-rs * 0.5, rs * 0.9);
    ctx.moveTo(rs * 0.5, rs * 0.3);
    ctx.lineTo(rs * 0.95, rs * 1.1);
    ctx.lineTo(rs * 0.5, rs * 0.9);
    ctx.fill();
    // Porthole
    ctx.fillStyle = '#bfe8ff';
    ctx.strokeStyle = '#3a3f4a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -rs * 0.4, rs * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // Rider hanging on, waving
    minionDrawMini(ctx, rk.x, rk.y - rs * 1.5, rs * 0.9, 'panic', time * 6 + rk.wobblePhase, 1);
  }

  // --- Explosions: fireball, shockwave ring, sparks ---
  for (const ex of state.explosions) {
    const p = ex.age / 0.7;
    const boomR = ex.size * (0.5 + p * 2.2);
    const fire = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, boomR);
    fire.addColorStop(0, `hsla(50, 100%, 75%, ${0.9 * (1 - p)})`);
    fire.addColorStop(0.4, `hsla(30, 100%, 55%, ${0.7 * (1 - p)})`);
    fire.addColorStop(1, 'transparent');
    ctx.fillStyle = fire;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, boomR, 0, Math.PI * 2);
    ctx.fill();
    // Shockwave ring
    ctx.strokeStyle = `hsla(48, 100%, 70%, ${0.6 * (1 - p)})`;
    ctx.lineWidth = 3 * (1 - p) + 1;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, boomR * 1.3, 0, Math.PI * 2);
    ctx.stroke();
    // Sparks
    ctx.fillStyle = `hsla(45, 100%, 65%, ${0.8 * (1 - p)})`;
    for (let s = 0; s < 8; s++) {
      const ang = (s / 8) * Math.PI * 2 + ex.size;
      const sr = boomR * (1.1 + (s % 3) * 0.15);
      ctx.beginPath();
      ctx.arc(ex.x + Math.cos(ang) * sr, ex.y + Math.sin(ang) * sr, 2.5 * (1 - p), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --- Banana debris blasted out of explosions ---
  for (const d of state.debris) {
    minionDrawBanana(ctx, d.x, d.y, d.size, d.spin, 55 + beatPulse * 15);
  }

  // Raining bananas — always a few falling, a flurry when the beat slaps
  const numBananas = 14;
  for (let b = 0; b < numBananas; b++) {
    const active = b < 5 || rand(b * 3.7) < beatPulse + 0.15;
    if (!active) continue;
    const fallSpeed = 0.12 + rand(b * 7.3) * 0.25;
    const phase = (time * fallSpeed + rand(b * 11.1)) % 1;
    const bx = rand(b * 5.9) * width + Math.sin(time * 2 + b) * 20;
    const by = phase * (floorY + 40) - 20;
    const spin = time * (2 + rand(b) * 3) + b;
    const bSize = 10 + rand(b * 13) * 8 + beatPulse * 4;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(spin);
    ctx.strokeStyle = `hsl(48, 95%, ${55 + beatPulse * 15}%)`;
    ctx.lineWidth = bSize * 0.32;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -bSize * 0.35, bSize, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    // Banana tips
    ctx.fillStyle = '#6b4a1b';
    ctx.beginPath();
    ctx.arc(Math.cos(Math.PI * 0.15) * bSize, -bSize * 0.35 + Math.sin(Math.PI * 0.15) * bSize, bSize * 0.13, 0, Math.PI * 2);
    ctx.arc(Math.cos(Math.PI * 0.85) * bSize, -bSize * 0.35 + Math.sin(Math.PI * 0.85) * bSize, bSize * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // The minion equalizer crowd
  const numMinions = Math.max(6, Math.min(12, Math.floor(width / 110)));
  const slotW = width / numMinions;
  const bodyW = Math.min(slotW * 0.62, 88);
  const bodyH = bodyW * 1.5;

  for (let m = 0; m < numMinions; m++) {
    const bandT = (m + 0.5) / numMinions;
    const energy = melAt(bandT);
    const jump = energy * maxJump * (1 + beatPulse * 0.3);
    // Squash on landing, stretch at the top of the bounce
    const stretch = 1 + Math.max(0, jump / maxJump - 0.2) * 0.15 - beatPulse * 0.08;

    const cx = slotW * (m + 0.5) + Math.sin(time * 1.5 + m * 2.1) * 4;
    const feetY = floorY - jump;
    const w = bodyW;
    const h = bodyH * stretch;
    const topY = feetY - h;
    const excited = energy > 0.55 || beatPulse > 0.5;

    // Shadow shrinks as he jumps
    const shadowScale = Math.max(0.3, 1 - jump / maxJump);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.35 * shadowScale})`;
    ctx.beginPath();
    ctx.ellipse(cx, floorY + 4, w * 0.5 * shadowScale, w * 0.12 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Capsule body
    const r = w / 2;
    ctx.fillStyle = `hsl(52, 95%, ${55 + energy * 12}%)`;
    ctx.beginPath();
    ctx.arc(cx, topY + r, r, Math.PI, 0);
    ctx.lineTo(cx + r, feetY - r * 0.7);
    ctx.arc(cx, feetY - r * 0.7, r, 0, Math.PI);
    ctx.closePath();
    ctx.fill();

    // Overalls
    ctx.fillStyle = '#2b5ba8';
    ctx.beginPath();
    ctx.arc(cx, feetY - r * 0.7, r, 0, Math.PI);
    ctx.rect(cx - r, feetY - r * 0.7 - h * 0.12, w, h * 0.12);
    ctx.fill();
    // Overall straps
    ctx.strokeStyle = '#2b5ba8';
    ctx.lineWidth = w * 0.09;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.85, topY + h * 0.42);
    ctx.lineTo(cx - r * 0.3, feetY - r * 0.7 - h * 0.10);
    ctx.moveTo(cx + r * 0.85, topY + h * 0.42);
    ctx.lineTo(cx + r * 0.3, feetY - r * 0.7 - h * 0.10);
    ctx.stroke();

    // Hair — a few wiggly strands that whip when he bounces
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.5;
    for (let hr = -2; hr <= 2; hr++) {
      const hx = cx + hr * w * 0.08;
      ctx.beginPath();
      ctx.moveTo(hx, topY + 2);
      ctx.quadraticCurveTo(
        hx + Math.sin(time * 6 + m + hr) * 4 * (0.5 + energy),
        topY - w * 0.16 - energy * 6,
        hx + hr * 2, topY - w * 0.2 - energy * 8
      );
      ctx.stroke();
    }

    // Goggle strap
    const eyeY = topY + h * 0.24;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(cx - r, eyeY - w * 0.06, w, w * 0.12);

    // One or two goggles, fixed per minion slot
    const twoEyes = rand(m * 17.3) > 0.4;
    const chromaIdx = m % 12;
    const lookX = Math.sin(time * 2 + m) * w * 0.04 + (beatPulse > 0.4 ? Math.sin(time * 20) * 2 : 0);
    const drawEye = (ex) => {
      ctx.fillStyle = '#c8c8c8';
      ctx.beginPath();
      ctx.arc(ex, eyeY, w * 0.19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(ex, eyeY, w * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `hsl(${CHROMA_HUES[chromaIdx]}, 60%, 40%)`;
      ctx.beginPath();
      ctx.arc(ex + lookX, eyeY, w * 0.07 + energy * w * 0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(ex + lookX, eyeY, w * 0.035, 0, Math.PI * 2);
      ctx.fill();
    };
    if (twoEyes) {
      drawEye(cx - w * 0.17);
      drawEye(cx + w * 0.17);
    } else {
      drawEye(cx);
    }

    // Mouth — grin normally, wide open yelling on the drops
    const mouthY = topY + h * 0.46;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    if (excited) {
      ctx.fillStyle = '#5a1f1f';
      ctx.beginPath();
      ctx.ellipse(cx, mouthY, w * 0.16, w * (0.08 + energy * 0.12 + beatPulse * 0.06), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx, mouthY - w * 0.04, w * 0.14, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }

    // Arms — up and waving when he's going off, down at his sides otherwise
    ctx.strokeStyle = `hsl(52, 95%, 50%)`;
    ctx.lineWidth = w * 0.12;
    ctx.lineCap = 'round';
    const armY = topY + h * 0.58;
    if (excited) {
      const wave = Math.sin(time * 10 + m * 3) * w * 0.12;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.9, armY);
      ctx.lineTo(cx - r * 1.35, armY - h * 0.28 + wave);
      ctx.moveTo(cx + r * 0.9, armY);
      ctx.lineTo(cx + r * 1.35, armY - h * 0.28 - wave);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.9, armY);
      ctx.lineTo(cx - r * 1.05, armY + h * 0.2);
      ctx.moveTo(cx + r * 0.9, armY);
      ctx.lineTo(cx + r * 1.05, armY + h * 0.2);
      ctx.stroke();
    }
  }

  // --- Foreground runners chasing bananas across the stage ---
  for (const r of state.runners) {
    const panicking = time < r.panicUntil;
    const runPhase = time * (10 + beatPulse * 8) + r.x * 0.05;
    const bob = Math.abs(Math.sin(runPhase)) * r.size * 0.15;
    // The banana he's chasing, always just out of reach
    if (!panicking) {
      const bx = r.x + r.dir * r.size * 2.2;
      const bBounce = Math.abs(Math.sin(time * 8 + r.speed)) * r.size * 0.8;
      minionDrawBanana(ctx, bx, floorY - r.size * 0.4 - bBounce, r.size * 0.5, time * 5 + r.speed, 60);
    }
    minionDrawMini(
      ctx, r.x, floorY - bob + 2, r.size,
      panicking ? 'panic' : 'run',
      runPhase, r.dir
    );
    // Dust kicks while sprinting
    if (!panicking) {
      ctx.fillStyle = 'rgba(200, 190, 170, 0.25)';
      for (let dk = 0; dk < 2; dk++) {
        const dp = (runPhase * 0.5 + dk * 0.5) % 1;
        ctx.beginPath();
        ctx.arc(r.x - r.dir * (r.size * 0.8 + dp * r.size), floorY - dp * 6, (1 - dp) * r.size * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // "BA-NA-NA!" flash on the biggest hits
  if (beatPulse > 0.85) {
    ctx.font = `bold ${Math.floor(width * 0.05)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = `hsla(48, 100%, 60%, ${(beatPulse - 0.85) * 5})`;
    ctx.shadowColor = 'hsla(48, 100%, 50%, 0.9)';
    ctx.shadowBlur = 16;
    ctx.fillText('BA-NA-NA!', width / 2, height * 0.18);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }

  drawWaveLabels(ctx, width, height, chroma);
}
