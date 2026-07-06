import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

let volcanicState = { sChroma: new Float32Array(12).fill(0), sBeat: 0, sBass: 0, lavaOffset: 0, ashParticles: [], bubbles: [], bombs: [], initialised: false };

/**
 * Volcanic Magma 🌋 - A dark, cracked obsidian floor with glowing lava beneath
 * Lava brightens and flows faster during bass-heavy sections.
 * Ash particles float upward and catch the light of the current dominant chroma hue.
 */
export function drawVolcanicMagmaWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;

  const settings = getEffectiveWaveformSettings('volcanic_magma');
  const lerp = 0.12;

  volcanicState.sBeat += (beatPulse - volcanicState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    volcanicState.sChroma[i] += ((chroma[i] || 0) - volcanicState.sChroma[i]) * lerp;
  }

  const avgBass = (mel && mel.length > 0) ? (mel.slice(0, 15).reduce((a, b) => a + b, 0) / 15 + 10) / 10 : 0;
  volcanicState.sBass += (Math.max(0, Math.min(1, avgBass)) - volcanicState.sBass) * lerp;

  let dominantIdx = 0, maxVal = 0;
  for (let i = 0; i < 12; i++) {
    if (volcanicState.sChroma[i] > maxVal) { maxVal = volcanicState.sChroma[i]; dominantIdx = i; }
  }
  const dominantHue = CHROMA_HUES[dominantIdx];
  const melAt = (t) => {
    if (!mel || mel.length === 0) return 0.5;
    const idx = Math.floor(Math.max(0, Math.min(0.999, t)) * mel.length);
    return Math.max(0, Math.min(1, (mel[idx] + 10) / 10));
  };

  ctx.save();

  // Camera shake on heavy beats
  if (volcanicState.sBeat > 0.75) {
    ctx.translate((Math.random() - 0.5) * 5 * volcanicState.sBeat, (Math.random() - 0.5) * 5 * volcanicState.sBeat);
  }

  // Night sky, warmed from below by the eruption
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#04030a');
  bgGrad.addColorStop(0.55, `hsl(345, 45%, ${4 + volcanicState.sBass * 8}%)`);
  bgGrad.addColorStop(1, `hsl(15, 80%, ${8 + volcanicState.sBass * 14}%)`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const lakeTop = height * (settings.basePosition / 100);
  const craterX = width / 2;
  const volcHeight = height * 0.45 * (0.9 + volcanicState.sBass * 0.15);
  const craterY = lakeTop - volcHeight;
  const craterHalf = width * 0.045;

  // Crater glow lights the sky, pulsing with the beat
  const glow = ctx.createRadialGradient(craterX, craterY, 0, craterX, craterY, width * 0.55);
  glow.addColorStop(0, `hsla(18, 100%, 55%, ${0.25 + volcanicState.sBeat * 0.35})`);
  glow.addColorStop(0.4, `hsla(${dominantHue}, 70%, 40%, ${0.08 + volcanicState.sBeat * 0.08})`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, lakeTop);

  // Distant ridge (parallax layer)
  ctx.fillStyle = '#0b0710';
  ctx.beginPath();
  ctx.moveTo(0, lakeTop);
  for (let i = 0; i <= 20; i++) {
    const x = (i / 20) * width;
    const y = lakeTop - height * 0.12 * (0.5 + 0.5 * Math.sin(i * 1.7 + 2.3));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, lakeTop);
  ctx.closePath();
  ctx.fill();

  // Main volcano silhouette
  ctx.fillStyle = '#080510';
  ctx.beginPath();
  ctx.moveTo(craterX - width * 0.42, lakeTop);
  ctx.quadraticCurveTo(craterX - width * 0.18, lakeTop - volcHeight * 0.55, craterX - craterHalf, craterY);
  ctx.lineTo(craterX + craterHalf, craterY);
  ctx.quadraticCurveTo(craterX + width * 0.18, lakeTop - volcHeight * 0.55, craterX + width * 0.42, lakeTop);
  ctx.closePath();
  ctx.fill();

  // Crater mouth, always molten
  const mouthGrad = ctx.createRadialGradient(craterX, craterY, 0, craterX, craterY, craterHalf * 2.2);
  mouthGrad.addColorStop(0, `hsla(30, 100%, ${60 + volcanicState.sBeat * 25}%, 0.95)`);
  mouthGrad.addColorStop(0.5, `hsla(15, 100%, 45%, 0.5)`);
  mouthGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = mouthGrad;
  ctx.beginPath();
  ctx.ellipse(craterX, craterY, craterHalf * 2.2, craterHalf * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lava rivers down the slopes — width and brightness ride the mel bands
  const rivers = [
    { xOff: -0.02, spread: -0.16, melT: 0.1 },
    { xOff: 0.01, spread: 0.10, melT: 0.3 },
    { xOff: -0.005, spread: -0.06, melT: 0.55 },
    { xOff: 0.02, spread: 0.19, melT: 0.8 }
  ];
  for (const rv of rivers) {
    const intensity = melAt(rv.melT);
    if (intensity < 0.15) continue;
    const startX = craterX + rv.xOff * width;
    const endX = craterX + rv.spread * width * 2.2;
    const wobble = Math.sin(time * 1.5 + rv.melT * 20) * width * 0.01;

    const riverGrad = ctx.createLinearGradient(0, craterY, 0, lakeTop);
    riverGrad.addColorStop(0, `hsla(35, 100%, ${55 + intensity * 25}%, ${0.5 + intensity * 0.5})`);
    riverGrad.addColorStop(1, `hsla(8, 100%, 42%, ${0.3 + intensity * 0.4})`);
    ctx.strokeStyle = riverGrad;
    ctx.lineWidth = (1.5 + intensity * 6) * (1 + volcanicState.sBeat * 0.4);
    ctx.lineCap = 'round';
    ctx.shadowColor = 'hsla(20, 100%, 50%, 0.8)';
    ctx.shadowBlur = 6 + intensity * 10;
    ctx.beginPath();
    ctx.moveTo(startX, craterY + 4);
    ctx.bezierCurveTo(
      startX + wobble, craterY + volcHeight * 0.4,
      (startX + endX) / 2 - wobble, craterY + volcHeight * 0.75,
      endX, lakeTop
    );
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Eruption: lava bombs on strong beats
  if (beatPulse > 0.75 && volcanicState.bombs.length < 18) {
    const burst = 2 + Math.round(beatPulse * 3);
    for (let i = 0; i < burst; i++) {
      volcanicState.bombs.push({
        x: craterX + (Math.random() - 0.5) * craterHalf * 2,
        y: craterY,
        vx: (Math.random() - 0.5) * 9,
        vy: -7 - Math.random() * 11,
        gv: 0.35,
        sz: 2 + Math.random() * 4,
        hue: 15 + Math.random() * 25,
        trail: []
      });
    }
  }

  ctx.globalCompositeOperation = 'lighter';
  for (let i = volcanicState.bombs.length - 1; i >= 0; i--) {
    const b = volcanicState.bombs[i];
    b.x += b.vx;
    b.y += b.vy;
    b.vy += b.gv;

    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 8) b.trail.shift();

    ctx.beginPath();
    ctx.strokeStyle = `hsla(${b.hue}, 100%, 55%, 0.35)`;
    ctx.lineWidth = b.sz * 0.6;
    b.trail.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    const bombGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.sz * 2.5);
    bombGrad.addColorStop(0, `hsla(${b.hue}, 100%, 75%, 1)`);
    bombGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bombGrad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.sz * 2, 0, Math.PI * 2);
    ctx.fill();

    // Splash when a bomb hits the lake
    if (b.y > lakeTop) {
      const splash = ctx.createRadialGradient(b.x, lakeTop, 0, b.x, lakeTop, b.sz * 8);
      splash.addColorStop(0, `hsla(${b.hue}, 100%, 65%, 0.7)`);
      splash.addColorStop(1, 'transparent');
      ctx.fillStyle = splash;
      ctx.beginPath();
      ctx.ellipse(b.x, lakeTop, b.sz * 8, b.sz * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      volcanicState.bombs.splice(i, 1);
    }
  }
  ctx.globalCompositeOperation = 'source-over';

  // Embers drifting up, tinted by the dominant note
  if (volcanicState.ashParticles.length < 70 && Math.random() < 0.35 + volcanicState.sBeat * 0.4) {
    const fromCrater = Math.random() < 0.5;
    volcanicState.ashParticles.push({
      x: fromCrater ? craterX + (Math.random() - 0.5) * craterHalf * 3 : Math.random() * width,
      y: fromCrater ? craterY : lakeTop + Math.random() * (height - lakeTop),
      vx: (Math.random() - 0.5) * 1.2,
      vy: -0.8 - Math.random() * 2.2,
      sz: 1 + Math.random() * 2,
      hue: Math.random() < 0.7 ? 20 + Math.random() * 25 : dominantHue,
      life: 1.0,
      decay: 0.004 + Math.random() * 0.01
    });
  }

  ctx.globalCompositeOperation = 'lighter';
  for (let i = volcanicState.ashParticles.length - 1; i >= 0; i--) {
    const p = volcanicState.ashParticles[i];
    p.y += p.vy * (1 + volcanicState.sBeat);
    p.x += p.vx + Math.sin(time * 2 + i) * 0.4;
    p.life -= p.decay;
    if (p.life <= 0 || p.y < -20) {
      volcanicState.ashParticles.splice(i, 1);
      continue;
    }
    ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${0.6 * p.life})`;
    ctx.fillRect(p.x, p.y, p.sz, p.sz);
  }
  ctx.globalCompositeOperation = 'source-over';

  // Magma lake: the surface IS the mel spectrum, mirrored glow beneath
  const lakeDepth = height - lakeTop;
  const points = 80;
  const waveAmp = Math.min(lakeDepth * 0.8, height * 0.5 * (settings.maxAmplitude / 100));

  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const m = melAt(t);
    const churn = Math.sin(t * Math.PI * 6 + time * 2) * 0.08 + Math.sin(t * Math.PI * 13 - time * 3.1) * 0.05;
    const y = lakeTop - (m * 0.85 + churn) * waveAmp * (1 + volcanicState.sBeat * 0.25) + waveAmp * 0.15;
    ctx.lineTo(t * width, Math.min(height, y));
  }
  ctx.lineTo(width, height);
  ctx.closePath();

  const lakeGrad = ctx.createLinearGradient(0, lakeTop - waveAmp, 0, height);
  lakeGrad.addColorStop(0, `hsla(40, 100%, ${60 + volcanicState.sBeat * 20}%, 0.95)`);
  lakeGrad.addColorStop(0.35, 'hsla(20, 100%, 48%, 0.9)');
  lakeGrad.addColorStop(1, 'hsla(0, 90%, 22%, 0.95)');
  ctx.fillStyle = lakeGrad;
  ctx.shadowColor = 'hsla(25, 100%, 50%, 0.7)';
  ctx.shadowBlur = 14 + volcanicState.sBeat * 18;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Bright crust line along the lava surface
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const m = melAt(t);
    const churn = Math.sin(t * Math.PI * 6 + time * 2) * 0.08 + Math.sin(t * Math.PI * 13 - time * 3.1) * 0.05;
    const y = lakeTop - (m * 0.85 + churn) * waveAmp * (1 + volcanicState.sBeat * 0.25) + waveAmp * 0.15;
    if (i === 0) ctx.moveTo(t * width, Math.min(height, y));
    else ctx.lineTo(t * width, Math.min(height, y));
  }
  ctx.strokeStyle = `hsla(45, 100%, ${70 + volcanicState.sBeat * 20}%, 0.9)`;
  ctx.lineWidth = 2 + volcanicState.sBeat * 2;
  ctx.stroke();

  // Smoke plume drifting from the crater
  ctx.fillStyle = `hsla(${dominantHue}, 15%, 12%, 0.35)`;
  for (let s = 0; s < 5; s++) {
    const rise = ((time * 0.12 + s * 0.2) % 1);
    const px = craterX + Math.sin(time * 0.7 + s * 2.1) * width * 0.04 * (1 + rise * 3);
    const py = craterY - rise * height * 0.5;
    const pr = craterHalf * (0.6 + rise * 3);
    ctx.globalAlpha = (1 - rise) * 0.4;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}
