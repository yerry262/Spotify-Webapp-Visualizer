import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

// --- Waveform Specific Animation States ---
let oceanState = { sChroma: new Float32Array(12).fill(0), sMel: null, sBeat: 0, timeOffset: 0, foamParticles: [] };

/**
 * Ocean Waves 🌊 - Atmospheric sea with reactive sun/moon and multi-layer parallax waves
 * Uses state-based smoothing for fluid swells and persistent foam.
 */
export function drawOceanWavesWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('ocean_waves');
  // basePosition controls where the ocean sits
  const baseY = height * (settings.basePosition / 100);
  // maxAmplitude controls wave height
  const maxAmp = height * (settings.maxAmplitude / 100);

  // Initialize/Update state
  if (!oceanState.sMel || (mel && oceanState.sMel.length !== mel.length)) {
    oceanState.sMel = new Float32Array(mel ? mel.length : 1).fill(0);
  }
  const lerp = 0.08;
  oceanState.sBeat += (beatPulse - oceanState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    oceanState.sChroma[i] += (chroma[i] - oceanState.sChroma[i]) * lerp;
  }
  if (mel) {
    for (let i = 0; i < mel.length; i++) {
      oceanState.sMel[i] += (mel[i] - oceanState.sMel[i]) * lerp;
    }
  }

  // Determine dominant mood (Warm/Sunset vs Cool/Moonlight)
  let energySum = 0;
  let warmEnergy = 0; // Hues 0-60 (Red-Yellow)
  let coolEnergy = 0; // Hues 180-240 (Blue-Cyan)
  
  for (let i = 0; i < 12; i++) {
    const val = oceanState.sChroma[i];
    energySum += val;
    const hue = CHROMA_HUES[i];
    if (hue <= 60 || hue >= 330) warmEnergy += val;
    if (hue >= 180 && hue <= 270) coolEnergy += val;
  }
  
  const isNight = coolEnergy > warmEnergy;
  const avgEnergy = energySum / 12;
  // Amplitude slider scales all wave layers (1.0 at the 50% default)
  const ampScale = maxAmp / (height * 0.5);

  // 1. Draw Atmospheric Backdrop (Gradient Sky)
  ctx.save();
  const skyGrad = ctx.createLinearGradient(0, 0, 0, baseY);
  if (isNight) {
    skyGrad.addColorStop(0, '#000814');
    skyGrad.addColorStop(0.7, '#001d3d');
    skyGrad.addColorStop(1, '#003566');
  } else {
    skyGrad.addColorStop(0, '#ff9e00');
    skyGrad.addColorStop(0.5, '#ff6700');
    skyGrad.addColorStop(1, '#ff0054');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, baseY + 20);

  // 2. Draw Celestial Body (Sun/Moon)
  const celX = width * 0.75;
  const celY = baseY * 0.4;
  // Sun/moon swells with overall chroma energy as well as the beat
  const celSize = 40 + oceanState.sBeat * 20 + avgEnergy * 25;
  
  ctx.beginPath();
  const celGrad = ctx.createRadialGradient(celX, celY, celSize * 0.2, celX, celY, celSize);
  if (isNight) {
    celGrad.addColorStop(0, '#fdfcf0');
    celGrad.addColorStop(0.5, '#e2e2e2');
    celGrad.addColorStop(1, 'rgba(226, 226, 226, 0)');
  } else {
    celGrad.addColorStop(0, '#ffffff');
    celGrad.addColorStop(0.4, '#fff9c4');
    celGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  }
  ctx.fillStyle = celGrad;
  ctx.arc(celX, celY, celSize, 0, Math.PI * 2);
  ctx.fill();

  // 3. Draw Water Layers (Parallax)
  const layers = 5;
  for (let l = 0; l < layers; l++) {
    const layerY = baseY + (l * (height - baseY) / layers);
    const layerFreq = 0.002 + l * 0.001;
    const layerSpeed = time * (0.5 + l * 0.2);

    // Wave height based on mel for specific frequency bands
    const mIdx = Math.floor(l * (oceanState.sMel.length / layers));
    const melBounce = (oceanState.sMel[mIdx] || 0) * 15;
    const amplitude = ((15 + l * 10) * (0.5 + oceanState.sBeat) + melBounce) * ampScale;

    ctx.beginPath();
    ctx.moveTo(0, height);
    
    for (let x = 0; x <= width; x += 15) {
      // Composition of 3 octaves
      const noise1 = Math.sin(x * layerFreq + layerSpeed);
      const noise2 = Math.sin(x * layerFreq * 2.5 - layerSpeed * 1.3) * 0.5;
      const noise3 = Math.sin(x * layerFreq * 0.5 + layerSpeed * 0.7) * 1.5;
      
      const waveY = layerY + (noise1 + noise2 + noise3) * amplitude;
      ctx.lineTo(x, waveY);
    }
    
    ctx.lineTo(width, height);
    ctx.closePath();

    // Water Gradient
    const waterGrad = ctx.createLinearGradient(0, layerY - amplitude, 0, height);
    const h = isNight ? 210 : 200;
    const s = isNight ? 80 : 70;
    const l_val = isNight ? (20 + l * 5) : (30 + l * 8);
    
    waterGrad.addColorStop(0, `hsla(${h}, ${s}%, ${l_val}%, 0.9)`);
    waterGrad.addColorStop(1, `hsla(${h}, ${s + 10}%, ${l_val - 10}%, 1.0)`);
    ctx.fillStyle = waterGrad;
    ctx.fill();

    // Specular Highlight on crests
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + l * 0.1})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Celestial Reflection on this layer
    const reflectX = celX;
    const reflectWidth = 60 + l * 40 + oceanState.sBeat * 30;
    const reflectGrad = ctx.createRadialGradient(reflectX, layerY, 5, reflectX, layerY, reflectWidth);
    const refColor = isNight ? '255, 255, 255' : '255, 240, 200';
    reflectGrad.addColorStop(0, `rgba(${refColor}, ${0.3 + l * 0.1})`);
    reflectGrad.addColorStop(1, `rgba(${refColor}, 0)`);
    
    ctx.fillStyle = reflectGrad;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillRect(reflectX - reflectWidth / 2, layerY - 10, reflectWidth, 20);
    ctx.globalCompositeOperation = 'source-over';
  }

  // 4. Foam Particles
  if (oceanState.foamParticles.length < 50 && oceanState.sBeat > 0.5) {
    for (let i = 0; i < 3; i++) {
      oceanState.foamParticles.push({
        x: Math.random() * width,
        y: baseY + Math.random() * (height - baseY),
        vx: (Math.random() - 0.5) * 2,
        vy: -0.5 - Math.random() * 1.5,
        life: 1.0,
        size: 1 + Math.random() * 3
      });
    }
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  for (let i = oceanState.foamParticles.length - 1; i >= 0; i--) {
    const p = oceanState.foamParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.015;
    if (p.life <= 0) {
      oceanState.foamParticles.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Galaxy Spiral 🌀 - Spinning galaxy with stars and cosmic dust
 * Arms spiral based on time, stars pulse with chroma
 */
