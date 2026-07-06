import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Neon City 🌃 - Full cyberpunk scene: parallax skylines, flying cars with
 * light trails, sweeping searchlights, rain, holo-ring in the sky, neon-edged
 * equalizer buildings, and animated wet-street reflections. Beats hit hard.
 */
export function drawNeonCityWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;

  const settings = getEffectiveWaveformSettings('neon_city');
  const groundY = height * (settings.basePosition / 100);
  const maxBuildingHeight = height * (settings.maxAmplitude / 100);

  const rand = (seed) => {
    const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const melAt = (t) => {
    if (!mel || mel.length === 0) return 0.4;
    const idx = Math.floor(Math.max(0, Math.min(0.999, t)) * mel.length);
    return Math.max(0, Math.min(1, (mel[idx] + 10) / 10));
  };

  let melEnergy = 0.5;
  if (mel && mel.length > 0) {
    const avg = mel.reduce((a, b) => a + b, 0) / mel.length;
    melEnergy = Math.max(0, Math.min(1, (avg + 10) / 10));
  }

  let dominantIdx = 0;
  for (let i = 1; i < 12; i++) {
    if ((chroma[i] || 0) > (chroma[dominantIdx] || 0)) dominantIdx = i;
  }
  const cityHue = CHROMA_HUES[dominantIdx];

  // === SKY ===
  const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGradient.addColorStop(0, 'rgba(4, 3, 16, 0.95)');
  skyGradient.addColorStop(0.6, `hsla(${(cityHue + 260) % 360}, 50%, 10%, 0.9)`);
  skyGradient.addColorStop(1, `hsla(${cityHue}, 60%, ${14 + beatPulse * 8}%, 0.85)`);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, groundY);

  // Stars
  for (let s = 0; s < 40; s++) {
    const sx = rand(s * 3.1) * width;
    const sy = rand(s * 7.7) * groundY * 0.6;
    const tw = 0.3 + Math.sin(time * (1 + rand(s) * 3) + s) * 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${tw * 0.5})`;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  // === HOLO-RING (giant hologram hanging in the sky, pulsing to the beat) ===
  const holoX = width * 0.72;
  const holoY = groundY * 0.32;
  const holoR = Math.min(width, height) * 0.13 * (1 + beatPulse * 0.12);
  ctx.globalCompositeOperation = 'lighter';
  for (let ring = 0; ring < 3; ring++) {
    const rr = holoR * (1 + ring * 0.22 + Math.sin(time * 2 + ring) * 0.03);
    ctx.strokeStyle = `hsla(${(cityHue + ring * 25) % 360}, 100%, 60%, ${(0.35 - ring * 0.09) + beatPulse * 0.25})`;
    ctx.lineWidth = 2.5 - ring * 0.5;
    ctx.shadowColor = `hsla(${cityHue}, 100%, 60%, 0.9)`;
    ctx.shadowBlur = 16 + beatPulse * 16;
    ctx.beginPath();
    ctx.arc(holoX, holoY, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Glitchy horizontal slice through the ring
  const sliceY = holoY - holoR + ((time * 0.5) % 1) * holoR * 2;
  ctx.strokeStyle = `hsla(${cityHue}, 100%, 75%, ${0.4 + beatPulse * 0.3})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(holoX - holoR * 1.2, sliceY);
  ctx.lineTo(holoX + holoR * 1.2, sliceY);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';

  // === SEARCHLIGHTS sweeping the sky ===
  for (let sl = 0; sl < 2; sl++) {
    const baseX = width * (0.18 + sl * 0.55);
    const sweep = Math.sin(time * (0.4 + sl * 0.13) + sl * 2) * 0.7;
    const beamAngle = -Math.PI / 2 + sweep;
    const beamLen = groundY * 1.1;
    const tipX = baseX + Math.cos(beamAngle) * beamLen;
    const tipY = groundY + Math.sin(beamAngle) * beamLen;
    const beamGrad = ctx.createLinearGradient(baseX, groundY, tipX, tipY);
    beamGrad.addColorStop(0, `hsla(${(cityHue + 180) % 360}, 80%, 70%, ${0.12 + beatPulse * 0.1})`);
    beamGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(baseX, groundY);
    ctx.lineTo(tipX - 30, tipY);
    ctx.lineTo(tipX + 30, tipY);
    ctx.closePath();
    ctx.fill();
  }

  // === BACKGROUND SKYLINE (parallax, dim, slow) ===
  const bgCount = 24;
  ctx.fillStyle = 'rgba(12, 10, 26, 0.9)';
  for (let b = 0; b < bgCount; b++) {
    const bw = width / bgCount;
    const bh = maxBuildingHeight * (0.25 + rand(b * 9.7) * 0.35 + melAt(b / bgCount) * 0.15);
    ctx.fillRect(b * bw, groundY - bh, bw * 0.92, bh);
  }

  // === FLYING CARS with light trails (between the two skylines) ===
  const numCars = 7;
  for (let c = 0; c < numCars; c++) {
    const speed = (0.06 + rand(c * 3.3) * 0.12) * (1 + melEnergy * 1.2 + beatPulse * 0.5);
    const dir = rand(c * 5.1) > 0.5 ? 1 : -1;
    const progress = ((time * speed + rand(c * 7.9)) % 1.2) - 0.1;
    const carX = dir > 0 ? progress * width : width - progress * width;
    const laneY = groundY * (0.35 + rand(c * 11.3) * 0.45) + Math.sin(time * 2 + c) * 5;
    if (carX < -60 || carX > width + 60) continue;

    const carHue = CHROMA_HUES[c % 12];
    const trailLen = 40 + melEnergy * 70 + beatPulse * 40;
    const trailGrad = ctx.createLinearGradient(carX - dir * trailLen, laneY, carX, laneY);
    trailGrad.addColorStop(0, 'transparent');
    trailGrad.addColorStop(1, `hsla(${carHue}, 100%, 60%, 0.7)`);
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(carX - dir * trailLen, laneY);
    ctx.lineTo(carX, laneY);
    ctx.stroke();

    ctx.fillStyle = `hsla(${carHue}, 100%, 75%, 0.95)`;
    ctx.shadowColor = `hsla(${carHue}, 100%, 60%, 1)`;
    ctx.shadowBlur = 8 + beatPulse * 8;
    ctx.fillRect(carX - 4, laneY - 1.5, 8, 3);
    ctx.shadowBlur = 0;
  }

  // === FOREGROUND BUILDINGS (the equalizer) ===
  const numBuildings = 16;
  for (let b = 0; b < numBuildings; b++) {
    const buildingT = b / numBuildings;
    const buildingX = buildingT * width;
    const buildingWidth = width / numBuildings * 0.9;

    const chromaIdx = b % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];

    const melValue = melAt(buildingT);
    const baseHeight = maxBuildingHeight * (0.3 + melValue * 0.55 + beatPulse * 0.12);
    const buildingHeight = baseHeight + Math.sin(time * 2 + b) * 8;
    const buildingY = groundY - buildingHeight;

    // Body
    const buildingGradient = ctx.createLinearGradient(buildingX, buildingY, buildingX + buildingWidth, buildingY);
    buildingGradient.addColorStop(0, 'rgba(16, 14, 28, 0.95)');
    buildingGradient.addColorStop(0.5, 'rgba(26, 22, 42, 0.95)');
    buildingGradient.addColorStop(1, 'rgba(12, 10, 22, 0.95)');
    ctx.fillStyle = buildingGradient;
    ctx.fillRect(buildingX, buildingY, buildingWidth, buildingHeight);

    // Neon edge — rooftop + sides outlined in this building's note color
    ctx.strokeStyle = `hsla(${hue}, 100%, ${55 + chromaValue * 20}%, ${0.35 + chromaValue * 0.5 + beatPulse * 0.15})`;
    ctx.lineWidth = 1.5 + chromaValue * 1.5 + beatPulse;
    ctx.shadowColor = `hsla(${hue}, 100%, 55%, 0.9)`;
    ctx.shadowBlur = 6 + chromaValue * 10 + beatPulse * 10;
    ctx.beginPath();
    ctx.moveTo(buildingX, groundY);
    ctx.lineTo(buildingX, buildingY);
    ctx.lineTo(buildingX + buildingWidth, buildingY);
    ctx.lineTo(buildingX + buildingWidth, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Windows — lit pattern scrolls upward with time, color from chroma
    const windowRows = Math.floor(buildingHeight / 15);
    const windowCols = 3;
    const windowWidth = buildingWidth * 0.2;
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const windowX = buildingX + 5 + col * (buildingWidth - 10) / windowCols;
        const windowY = buildingY + 10 + row * 15;
        const isLit = Math.sin(time * 1.5 + row * 0.8 + col * 1.3 + b * 2) > (0.4 - chromaValue * 0.4);
        if (isLit && chromaValue > 0.15) {
          const windowHue = CHROMA_HUES[(chromaIdx + row) % 12];
          ctx.fillStyle = `hsla(${windowHue}, 80%, 70%, ${0.35 + chromaValue * 0.45})`;
          ctx.fillRect(windowX, windowY, windowWidth, 8);
        } else {
          ctx.fillStyle = 'rgba(8, 8, 18, 0.85)';
          ctx.fillRect(windowX, windowY, windowWidth, 8);
        }
      }
    }

    // Neon sign strips on some buildings — flicker like dying tubes
    if (b % 3 === 0 && buildingHeight > 60) {
      const flicker = rand(Math.floor(time * 18) + b) > 0.12 ? 1 : 0.25;
      const signY = buildingY + buildingHeight * 0.3;
      ctx.strokeStyle = `hsla(${hue}, 100%, 62%, ${(0.6 + beatPulse * 0.4) * flicker})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = `hsla(${hue}, 100%, 55%, ${flicker})`;
      ctx.shadowBlur = 14 + beatPulse * 8;
      ctx.strokeRect(buildingX + 5, signY, buildingWidth * 0.8, 18);
      ctx.beginPath();
      ctx.moveTo(buildingX + 10, signY + 9);
      ctx.lineTo(buildingX + buildingWidth * 0.8, signY + 9);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Antennas with blinking beacons
    if (b % 4 === 0) {
      const antennaHeight = 18 + chromaValue * 30;
      ctx.strokeStyle = 'rgba(100, 100, 120, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(buildingX + buildingWidth / 2, buildingY);
      ctx.lineTo(buildingX + buildingWidth / 2, buildingY - antennaHeight);
      ctx.stroke();
      if (Math.sin(time * 4 + b) > 0.4) {
        ctx.fillStyle = 'hsla(0, 100%, 55%, 0.95)';
        ctx.shadowColor = 'rgba(255, 40, 40, 0.9)';
        ctx.shadowBlur = 10 + beatPulse * 10;
        ctx.beginPath();
        ctx.arc(buildingX + buildingWidth / 2, buildingY - antennaHeight, 3 + beatPulse * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  // === RAIN (intensity rides the energy) ===
  const numDrops = Math.floor(30 + melEnergy * 70);
  ctx.strokeStyle = `hsla(${(cityHue + 180) % 360}, 60%, 75%, 0.25)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let d = 0; d < numDrops; d++) {
    const fall = ((time * (0.8 + rand(d * 3.7) * 0.6) + rand(d * 9.1)) % 1);
    const rx = rand(d * 5.3) * width + fall * 30;
    const ry = fall * groundY;
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 3, ry + 10 + melEnergy * 8);
  }
  ctx.stroke();

  // === WET STREET ===
  ctx.fillStyle = 'rgba(14, 12, 24, 0.95)';
  ctx.fillRect(0, groundY, width, height - groundY);

  // Neon street-line along the curb
  ctx.fillStyle = `hsla(${cityHue}, 100%, 60%, ${0.5 + beatPulse * 0.4})`;
  ctx.shadowColor = `hsla(${cityHue}, 100%, 55%, 0.9)`;
  ctx.shadowBlur = 10 + beatPulse * 14;
  ctx.fillRect(0, groundY, width, 2.5);
  ctx.shadowBlur = 0;

  // Rippling reflections — shimmer horizontally with time
  for (let b = 0; b < numBuildings; b++) {
    const buildingT = b / numBuildings;
    const buildingX = buildingT * width;
    const buildingWidth = width / numBuildings * 0.9;
    const chromaIdx = b % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    if (chromaValue < 0.25) continue;

    const shimmer = Math.sin(time * 3 + b * 1.7) * buildingWidth * 0.06;
    const reflH = (height - groundY) * (0.4 + melAt(buildingT) * 0.5);
    const reflectionGradient = ctx.createLinearGradient(buildingX, groundY, buildingX, groundY + reflH);
    reflectionGradient.addColorStop(0, `hsla(${hue}, 85%, 55%, ${0.25 + chromaValue * 0.2 + beatPulse * 0.1})`);
    reflectionGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = reflectionGradient;
    ctx.fillRect(buildingX + shimmer, groundY, buildingWidth, reflH);
  }

  drawWaveLabels(ctx, width, height, chroma);
}
