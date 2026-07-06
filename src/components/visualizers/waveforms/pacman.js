import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

// --- PACMAN STATE ---
let pacmanState = {
  pacX: 0.1,
  lastTime: 0,
  pellets: [],        // { eatenUntil } indexed along the wave
  blueUntil: 0,
  lastBlueTime: 0
};

const PACMAN_NUM_PELLETS = 36;

export function drawPacmanWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('pacman');
  const baseY = height * (settings.basePosition / 100);
  const maxAmplitude = height * 0.5 * (settings.maxAmplitude / 100);
  const size = Math.min(width, height) * 0.055;

  if (pacmanState.pellets.length !== PACMAN_NUM_PELLETS) {
    pacmanState.pellets = Array.from({ length: PACMAN_NUM_PELLETS }, () => ({ eatenUntil: 0 }));
  }

  let melEnergy = 0.5;
  if (mel && mel.length > 0) {
    const avg = mel.reduce((a, b) => a + b, 0) / mel.length;
    melEnergy = Math.max(0, Math.min(1, (avg + 10) / 10));
  }

  // The waveform path Pac-Man rides: mel bands shape it, gentle motion from time
  const waveY = (x) => {
    let melV = 0.5;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(((x % 1) + 1) % 1 * (mel.length - 1));
      melV = Math.max(0, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    const swell = Math.sin(x * Math.PI * 4 + time * 1.1) * 0.4
                + Math.sin(x * Math.PI * 7 - time * 0.7) * 0.25
                + Math.sin(x * Math.PI * 2 + time * 0.4) * 0.35;
    return baseY - swell * maxAmplitude * (0.35 + melV * 0.65) * (1 + beatPulse * 0.15);
  };

  // Scrolling neon grid backdrop
  const gridSize = 40;
  const scroll = (time * 30) % gridSize;
  ctx.strokeStyle = `rgba(20, 20, 80, ${0.25 + beatPulse * 0.25})`;
  ctx.lineWidth = 1;
  for (let x = -scroll; x < width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Advance Pac-Man along the wave (dt from playback time, clamped for seeks/pauses)
  const dt = Math.max(0, Math.min(0.1, time - pacmanState.lastTime));
  pacmanState.lastTime = time;
  const pacSpeed = 0.05 * (0.6 + melEnergy * 0.8 + beatPulse * 0.9);
  pacmanState.pacX = (pacmanState.pacX + pacSpeed * dt + 1) % 1;

  // Big beat => blue ghost mode (with cooldown)
  if (beatPulse > 0.85 && time > pacmanState.blueUntil && time - pacmanState.lastBlueTime > 12) {
    pacmanState.blueUntil = time + 3.5;
    pacmanState.lastBlueTime = time;
  }
  const blueMode = time < pacmanState.blueUntil;

  // Dominant chroma note colors the wave trail
  let dominantIdx = 0;
  for (let i = 1; i < 12; i++) {
    if ((chroma[i] || 0) > (chroma[dominantIdx] || 0)) dominantIdx = i;
  }
  const trailHue = CHROMA_HUES[dominantIdx];

  // Draw the wave path as a glowing dotted trail
  const pathSteps = 120;
  ctx.beginPath();
  for (let i = 0; i <= pathSteps; i++) {
    const x = i / pathSteps;
    const px = x * width;
    const py = waveY(x);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = `hsla(${trailHue}, 80%, 55%, ${0.15 + melEnergy * 0.2 + beatPulse * 0.15})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 10]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pellets live on the wave; Pac-Man eats them as he passes, they regrow behind him
  for (let i = 0; i < PACMAN_NUM_PELLETS; i++) {
    const pellet = pacmanState.pellets[i];
    const x = (i + 0.5) / PACMAN_NUM_PELLETS;
    const isPower = i % 9 === 4;

    let distAhead = x - pacmanState.pacX;
    if (distAhead < -0.5) distAhead += 1;
    if (distAhead > 0.5) distAhead -= 1;

    if (Math.abs(distAhead) < (size * 0.6) / width && time > pellet.eatenUntil) {
      pellet.eatenUntil = time + 6;
    }
    if (time < pellet.eatenUntil) continue;

    const px = x * width;
    const py = waveY(x);
    const chromaIdx = i % 12;
    const chromaValue = chroma[chromaIdx] || 0;

    if (isPower) {
      const pulse = 0.7 + Math.sin(time * 6 + i) * 0.3;
      ctx.fillStyle = `hsla(${CHROMA_HUES[chromaIdx]}, 90%, ${55 + chromaValue * 25}%, ${0.6 + chromaValue * 0.4})`;
      ctx.shadowColor = `hsla(${CHROMA_HUES[chromaIdx]}, 90%, 60%, 0.8)`;
      ctx.shadowBlur = 8 + beatPulse * 10;
      ctx.beginPath();
      ctx.arc(px, py, (5 + chromaValue * 4) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = `hsla(35, 60%, ${70 + chromaValue * 15}%, ${0.5 + chromaValue * 0.4})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.5 + chromaValue * 2 + beatPulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ghosts trail Pac-Man along the same wave; in blue mode they turn blue and fall back
  const ghostColors = [0, 330, 180, 40]; // Blinky, Pinky, Inky, Clyde
  for (let g = 0; g < 4; g++) {
    const flee = blueMode ? (pacmanState.blueUntil - time) / 3.5 : 0;
    const gap = 0.07 + g * 0.055 + flee * 0.12 + Math.sin(time * 2 + g * 1.7) * 0.012;
    const gx = ((pacmanState.pacX - gap) % 1 + 1) % 1;
    const gpx = gx * width;
    const gpy = waveY(gx) + Math.sin(time * 5 + g * 2) * 3;

    const flash = blueMode && (pacmanState.blueUntil - time < 1) && Math.sin(time * 12) > 0;
    const bodyColor = blueMode
      ? (flash ? '#ffffff' : '#2121de')
      : `hsl(${ghostColors[g]}, 100%, ${55 + beatPulse * 15}%)`;

    // Slope tells the ghost which way it's looking
    const slope = waveY(gx + 0.01) - waveY(gx - 0.01);

    ctx.fillStyle = bodyColor;
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = 6 + beatPulse * 8;
    ctx.beginPath();
    ctx.arc(gpx, gpy - size * 0.2, size / 2, Math.PI, 0);
    ctx.lineTo(gpx + size / 2, gpy + size / 2);
    const feet = 4;
    for (let k = 0; k < feet; k++) {
      const fx1 = gpx + size / 2 - ((k + 0.5) * size) / feet;
      const fx2 = gpx + size / 2 - ((k + 1) * size) / feet;
      ctx.quadraticCurveTo(fx1, gpy + size / 2 - size * 0.18, fx2, gpy + size / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    if (blueMode && !flash) {
      // Scared face
      ctx.fillStyle = '#ffb8ae';
      ctx.beginPath();
      ctx.arc(gpx - size * 0.15, gpy - size * 0.2, size * 0.08, 0, Math.PI * 2);
      ctx.arc(gpx + size * 0.15, gpy - size * 0.2, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffb8ae';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let z = 0; z < 4; z++) {
        const zx = gpx - size * 0.3 + (z * size * 0.2);
        ctx.lineTo(zx, gpy + size * 0.05 + (z % 2 === 0 ? 3 : -3));
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(gpx - size * 0.15, gpy - size * 0.2, size * 0.15, 0, Math.PI * 2);
      ctx.arc(gpx + size * 0.15, gpy - size * 0.2, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1919a6';
      const lookX = 2;
      const lookY = Math.max(-2, Math.min(2, slope * 0.5));
      ctx.beginPath();
      ctx.arc(gpx - size * 0.15 + lookX, gpy - size * 0.2 + lookY, size * 0.07, 0, Math.PI * 2);
      ctx.arc(gpx + size * 0.15 + lookX, gpy - size * 0.2 + lookY, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Pac-Man rides the wave, facing along its slope, chomping to the beat
  const px = pacmanState.pacX * width;
  const py = waveY(pacmanState.pacX);
  const slope = waveY(pacmanState.pacX + 0.01) - waveY(pacmanState.pacX - 0.01);
  const dir = Math.atan2(slope, 0.02 * width);
  const chompSpeed = 8 + melEnergy * 10 + beatPulse * 8;
  const mouth = (0.08 + Math.abs(Math.sin(time * chompSpeed)) * 0.22) * Math.PI;
  const pacSize = (size / 2) * (1 + beatPulse * 0.2);

  ctx.fillStyle = '#FFFF00';
  ctx.shadowColor = 'rgba(255, 255, 0, 0.7)';
  ctx.shadowBlur = 10 + beatPulse * 15;
  ctx.beginPath();
  ctx.arc(px, py, pacSize, dir + mouth, dir + Math.PI * 2 - mouth);
  ctx.lineTo(px, py);
  ctx.fill();
  ctx.shadowBlur = 0;

  drawWaveLabels(ctx, width, height, chroma);
}
