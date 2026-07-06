/**
 * VisualizerGalaxy.js
 *
 * Super Galaxy — a Mario-Galaxy-inspired playable-feeling waveform.
 * A little star-runner sprints around tiny planetoids, launch-star jumps
 * between them on big beats, star bits rain with the treble, and every
 * planet is alive with its own slice of the chromagram.
 */

import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from './waveformCore';

// Planet layout: each planet owns a band of the 12 chroma notes
const PLANET_DEFS = [
  { notes: [0, 1],   ox: 0.18, oy: 0.30, baseR: 0.075 },
  { notes: [2, 3],   ox: 0.78, oy: 0.22, baseR: 0.060 },
  { notes: [4, 5],   ox: 0.50, oy: 0.55, baseR: 0.095 }, // home world, center
  { notes: [6, 7],   ox: 0.15, oy: 0.75, baseR: 0.055 },
  { notes: [8, 9],   ox: 0.84, oy: 0.68, baseR: 0.070 },
  { notes: [10, 11], ox: 0.55, oy: 0.14, baseR: 0.050 },
];

let galaxyState = {
  planetIdx: 2,          // which planet the runner is on
  surfaceAngle: 0,       // where on the planet's surface
  jump: null,            // { from, to, t } while flying between planets
  jumpCooldown: 0,
  starBits: [],
  sparkles: [],
  bgStars: [],
  spiralPhase: 0,
  lastTime: 0,
  initialized: false,
};

function planetEnergy(chroma, def) {
  let e = 0;
  for (const n of def.notes) e += chroma[n] || 0;
  return e / def.notes.length;
}

function planetHue(chroma, def) {
  let best = def.notes[0];
  for (const n of def.notes) if ((chroma[n] || 0) > (chroma[best] || 0)) best = n;
  return CHROMA_HUES[best];
}

function drawBackdrop(ctx, width, height, energy, beatPulse, time) {
  // Deep space with a slow-breathing nebula tint
  const grad = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) * 0.8
  );
  grad.addColorStop(0, `hsla(${250 + Math.sin(time * 0.1) * 30}, 60%, ${8 + energy * 6}%, 1)`);
  grad.addColorStop(1, 'hsla(240, 70%, 3%, 1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Parallax starfield
  for (const star of galaxyState.bgStars) {
    const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(time * star.tw + star.phase));
    ctx.fillStyle = `hsla(${star.hue}, 40%, 85%, ${twinkle * (0.25 + energy * 0.4)})`;
    ctx.fillRect(star.x * width, star.y * height, star.size, star.size);
  }

  // Central galaxy swirl behind the home planet
  galaxyState.spiralPhase += 0.003 + energy * 0.006 + beatPulse * 0.004;
  const cx = width / 2, cy = height * 0.55;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let arm = 0; arm < 3; arm++) {
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const p = i / 40;
      const ang = galaxyState.spiralPhase + arm * (Math.PI * 2 / 3) + p * 4.5;
      const r = p * Math.min(width, height) * 0.45;
      const px = cx + Math.cos(ang) * r;
      const py = cy + Math.sin(ang) * r * 0.5;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = `hsla(${270 + arm * 25}, 70%, 55%, ${0.05 + energy * 0.07})`;
    ctx.lineWidth = 10 + beatPulse * 8;
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlanet(ctx, px, py, r, hue, energy, beatPulse, time, isCurrent) {
  // Gravity field ring — swells with the planet's own notes
  ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${0.08 + energy * 0.25})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(px, py, r * (1.5 + energy * 0.5 + beatPulse * 0.15), 0, Math.PI * 2);
  ctx.stroke();

  // Body with a lit hemisphere (sun toward screen center)
  const body = ctx.createRadialGradient(px - r * 0.35, py - r * 0.35, r * 0.1, px, py, r);
  body.addColorStop(0, `hsla(${hue}, 75%, ${55 + energy * 25}%, 1)`);
  body.addColorStop(0.7, `hsla(${hue}, 70%, ${32 + energy * 15}%, 1)`);
  body.addColorStop(1, `hsla(${hue}, 75%, 14%, 1)`);
  ctx.shadowColor = `hsla(${hue}, 90%, 60%, ${0.4 + energy * 0.5})`;
  ctx.shadowBlur = 10 + energy * 30 + (isCurrent ? beatPulse * 20 : 0);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Craters that drift with rotation
  ctx.fillStyle = `hsla(${hue}, 60%, 20%, 0.5)`;
  for (let c = 0; c < 3; c++) {
    const ca = time * 0.3 + c * 2.1;
    const cd = r * (0.3 + (c % 2) * 0.3);
    ctx.beginPath();
    ctx.arc(px + Math.cos(ca) * cd, py + Math.sin(ca) * cd * 0.8, r * (0.12 + c * 0.04), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRunner(ctx, x, y, angle, size, hue, beatPulse, running) {
  // Original little star-runner: round body, stubby limbs, star on the head
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2); // feet toward the planet

  const squash = 1 + beatPulse * 0.25;

  // Legs: scissor while running on a planet, tuck streamlined during flight
  ctx.strokeStyle = '#2b2b45';
  ctx.lineWidth = size * 0.22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (running) {
    const kick = Math.sin(angle * 14) * size * 0.3;
    ctx.moveTo(-size * 0.25, size * 0.5);
    ctx.lineTo(-size * 0.35 + kick, size * 0.95);
    ctx.moveTo(size * 0.25, size * 0.5);
    ctx.lineTo(size * 0.35 - kick, size * 0.95);
  } else {
    ctx.moveTo(-size * 0.2, size * 0.5);
    ctx.lineTo(-size * 0.15, size * 1.05);
    ctx.moveTo(size * 0.2, size * 0.5);
    ctx.lineTo(size * 0.15, size * 1.05);
  }
  ctx.stroke();

  // Body
  ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.9)`;
  ctx.shadowBlur = size * 1.2;
  const bodyGrad = ctx.createRadialGradient(0, -size * 0.1, size * 0.1, 0, 0, size);
  bodyGrad.addColorStop(0, '#fff7d6');
  bodyGrad.addColorStop(1, `hsl(${hue}, 85%, 60%)`);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.75, size * 0.75 * squash, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Eyes
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.ellipse(-size * 0.22, -size * 0.15, size * 0.1, size * 0.18, 0, 0, Math.PI * 2);
  ctx.ellipse(size * 0.22, -size * 0.15, size * 0.1, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Star on the head
  ctx.fillStyle = '#ffe95c';
  ctx.shadowColor = 'rgba(255, 233, 92, 0.9)';
  ctx.shadowBlur = size * 0.8;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const sr = i % 2 === 0 ? size * 0.28 : size * 0.12;
    const sa = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const sx = Math.cos(sa) * sr;
    const sy = -size * 0.95 + Math.sin(sa) * sr;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawSuperGalaxyWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('super_galaxy');
  const scale = settings.maxAmplitude / 50; // planets grow with the amplitude slider

  let dt = time - galaxyState.lastTime;
  if (dt < 0 || dt > 0.1) dt = 0.016; // survive seeks
  galaxyState.lastTime = time;
  if (galaxyState.jumpCooldown > 0) galaxyState.jumpCooldown -= dt;

  if (!galaxyState.initialized) {
    galaxyState.bgStars = Array.from({ length: 90 }, (_, i) => ({
      x: (i * 0.618) % 1,
      y: (i * 0.417) % 1,
      size: 0.6 + (i % 3) * 0.7,
      tw: 0.5 + (i % 7) * 0.35,
      phase: i * 1.7,
      hue: 200 + (i % 5) * 30,
    }));
    galaxyState.initialized = true;
  }

  let energy = 0.3;
  let treble = 0.3;
  if (mel && mel.length) {
    const norm = (v) => Math.max(0, Math.min(1, (v + 10) / 10));
    energy = norm(mel.reduce((a, b) => a + b, 0) / mel.length);
    const third = Math.floor(mel.length / 3);
    treble = norm(mel.slice(-third).reduce((a, b) => a + b, 0) / third);
  }

  drawBackdrop(ctx, width, height, energy, beatPulse, time);

  // Resolve planet screen positions (gentle orbital drift so the system is alive)
  const planets = PLANET_DEFS.map((def, i) => {
    const drift = 0.012;
    const px = (def.ox + Math.sin(time * 0.15 + i * 1.3) * drift) * width;
    const py = (def.oy + Math.cos(time * 0.12 + i * 2.1) * drift) * height;
    const e = planetEnergy(chroma, def);
    const r = def.baseR * Math.min(width, height) * scale * (1 + e * 0.25 + beatPulse * 0.06);
    return { px, py, r, e, hue: planetHue(chroma, def) };
  });

  // Star bits rain with the treble, pulled in by the nearest planet's gravity
  if (treble > 0.45 && Math.random() < treble * 0.5 && galaxyState.starBits.length < 60) {
    galaxyState.starBits.push({
      x: Math.random() * width, y: -10,
      vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 80,
      hue: CHROMA_HUES[Math.floor(Math.random() * 12)],
      born: time,
    });
  }
  galaxyState.starBits = galaxyState.starBits.filter(b => time - b.born < 6 && b.y < height + 20);
  for (const bit of galaxyState.starBits) {
    // Gravity toward nearest planet
    let nearest = planets[0], nd = Infinity;
    for (const p of planets) {
      const d = (p.px - bit.x) ** 2 + (p.py - bit.y) ** 2;
      if (d < nd) { nd = d; nearest = p; }
    }
    const dist = Math.sqrt(nd) || 1;
    const pull = 5200 * (nearest.r / dist) / dist;
    bit.vx += ((nearest.px - bit.x) / dist) * pull * dt * 60;
    bit.vy += ((nearest.py - bit.y) / dist) * pull * dt * 60;
    bit.x += bit.vx * dt;
    bit.y += bit.vy * dt;

    // Collected: burst into a sparkle
    if (dist < nearest.r) {
      galaxyState.sparkles.push({ x: bit.x, y: bit.y, hue: bit.hue, born: time });
      bit.born = -99; // expire
      continue;
    }
    const tw = 0.6 + 0.4 * Math.sin(time * 8 + bit.x);
    ctx.fillStyle = `hsla(${bit.hue}, 95%, 70%, ${tw})`;
    ctx.beginPath();
    ctx.arc(bit.x, bit.y, 2.5 + tw * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Planets
  planets.forEach((p, i) => drawPlanet(ctx, p.px, p.py, p.r, p.hue, p.e, beatPulse, time, i === galaxyState.planetIdx));

  // ---- RUNNER LOGIC ----
  const cur = planets[galaxyState.planetIdx];

  if (galaxyState.jump) {
    // Launch-star flight: bezier arc between planets with a rainbow trail
    const j = galaxyState.jump;
    j.t += dt / j.dur;
    const from = planets[j.from], to = planets[j.to];
    const mx = (from.px + to.px) / 2, my = (from.py + to.py) / 2;
    const dx = to.px - from.px, dy = to.py - from.py;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const arcX = mx - (dy / len) * len * 0.35;
    const arcY = my + (dx / len) * len * 0.35;
    const t = Math.min(1, j.t);
    const u = 1 - t;
    const x = u * u * from.px + 2 * u * t * arcX + t * t * to.px;
    const y = u * u * from.py + 2 * u * t * arcY + t * t * to.py;

    // Rainbow contrail
    j.trail.push({ x, y, born: time });
    j.trail = j.trail.filter(tr => time - tr.born < 0.6);
    j.trail.forEach((tr, k) => {
      const a = 1 - (time - tr.born) / 0.6;
      ctx.fillStyle = `hsla(${(k * 24 + time * 120) % 360}, 95%, 65%, ${a * 0.6})`;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, 5 * a + 1, 0, Math.PI * 2);
      ctx.fill();
    });

    const ang = Math.atan2(y - arcY, x - arcX);
    drawRunner(ctx, x, y, ang, Math.min(width, height) * 0.028 * scale, cur.hue, beatPulse, false);

    if (j.t >= 1) {
      galaxyState.planetIdx = j.to;
      galaxyState.surfaceAngle = Math.atan2(y - to.py, x - to.px);
      galaxyState.jump = null;
      galaxyState.jumpCooldown = 1.2;
      // Landing sparkle burst
      for (let s = 0; s < 8; s++) {
        galaxyState.sparkles.push({ x, y, hue: (s * 45) % 360, born: time });
      }
    }
  } else {
    // Run around the surface — pace follows the music's energy
    galaxyState.surfaceAngle += dt * (0.8 + energy * 2.4 + beatPulse * 1.2);
    const rx = cur.px + Math.cos(galaxyState.surfaceAngle) * (cur.r + Math.min(width, height) * 0.018 * scale);
    const ry = cur.py + Math.sin(galaxyState.surfaceAngle) * (cur.r + Math.min(width, height) * 0.018 * scale);
    drawRunner(ctx, rx, ry, galaxyState.surfaceAngle, Math.min(width, height) * 0.028 * scale, cur.hue, beatPulse, true);

    // Big beat + cooldown over = LAUNCH STAR to the most energetic other planet
    if (beatPulse > 0.9 && galaxyState.jumpCooldown <= 0) {
      let best = -1, bestE = -1;
      planets.forEach((p, i) => {
        if (i !== galaxyState.planetIdx && p.e > bestE) { bestE = p.e; best = i; }
      });
      if (best >= 0) {
        // Launch star flash at takeoff
        ctx.fillStyle = 'hsla(45, 100%, 75%, 0.9)';
        ctx.shadowColor = 'hsla(45, 100%, 70%, 1)';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(rx, ry, 14 + beatPulse * 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        galaxyState.jump = { from: galaxyState.planetIdx, to: best, t: 0, dur: 0.9, trail: [] };
      }
    }
  }

  // Sparkles (star-bit collection + landings)
  galaxyState.sparkles = galaxyState.sparkles.filter(s => time - s.born < 0.5);
  for (const s of galaxyState.sparkles) {
    const a = (time - s.born) / 0.5;
    for (let p = 0; p < 5; p++) {
      const ang = (p / 5) * Math.PI * 2 + s.born * 9;
      const d = a * 22;
      ctx.fillStyle = `hsla(${s.hue}, 100%, 75%, ${1 - a})`;
      ctx.fillRect(s.x + Math.cos(ang) * d - 1.5, s.y + Math.sin(ang) * d - 1.5, 3, 3);
    }
  }

  // Reset shared ctx state
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  drawWaveLabels(ctx, width, height, chroma);
}
