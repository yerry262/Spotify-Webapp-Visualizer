import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Kaleidoscope - Mirrored geometric patterns that rotate with beat
 * Uses chroma for segment colors and mel for pattern complexity
 */
let kaleidoscopeState = {
  sChroma: new Float32Array(12).fill(0),
  sMel: null,
  sBeat: 0,
  rotation: 0,
  drift: 0,
  particles: []
};

export function drawKaleidoscopeWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('kaleidoscope');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxRadius = Math.min(width, height) * (settings.maxAmplitude / 100) * 0.8;
  const numSectors = 12; // 6 axes of symmetry (12 mirrored triangles)
  const sectorAngle = (Math.PI * 2) / numSectors;
  
  // Initialize state
  if (!kaleidoscopeState.sMel || (mel && kaleidoscopeState.sMel.length !== mel.length)) {
    kaleidoscopeState.sMel = new Float32Array(mel ? mel.length : 1).fill(0);
    // Initialize some random particles for the "inner" kaleidoscope motion
    kaleidoscopeState.particles = Array.from({ length: 15 }, () => ({
      r: Math.random(),
      angle: Math.random() * Math.PI * 2,
      size: 5 + Math.random() * 15,
      speed: 0.2 + Math.random() * 0.5,
      type: Math.floor(Math.random() * 3)
    }));
  }

  // Smooth values
  const lerp = 0.08;
  kaleidoscopeState.sBeat += (beatPulse - kaleidoscopeState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    kaleidoscopeState.sChroma[i] += (chroma[i] - kaleidoscopeState.sChroma[i]) * lerp;
  }
  if (mel) {
    for (let i = 0; i < mel.length; i++) {
      kaleidoscopeState.sMel[i] += (mel[i] - kaleidoscopeState.sMel[i]) * lerp;
    }
  }

  const sChroma = kaleidoscopeState.sChroma;
  const sBeat = kaleidoscopeState.sBeat;
  const sMel = kaleidoscopeState.sMel;
  
  // Update rotations with momentum
  kaleidoscopeState.rotation += 0.005 + sBeat * 0.02;
  kaleidoscopeState.drift += 0.002 + sChroma[0] * 0.01;

  ctx.save();
  ctx.translate(centerX, centerY);
  
  // Outer Ambient Glow
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, `hsla(${time * 10 % 360}, 50%, 10%, 0.3)`);
  ctx.fillStyle = grad;
  ctx.fillRect(-width/2, -height/2, width, height);

  ctx.rotate(kaleidoscopeState.rotation);

  // Draw 12 mirrored sectors
  for (let i = 0; i < numSectors; i++) {
    ctx.save();
    ctx.rotate(i * sectorAngle);
    
    // Mirror every other sector
    if (i % 2 === 1) {
      ctx.scale(1, -1);
    }

    // Clip to triangle sector
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(maxRadius, 0);
    ctx.arc(0, 0, maxRadius, 0, sectorAngle);
    ctx.closePath();
    ctx.clip();

    // --- DRAW PATTERN INSIDE SECTOR ---
    // Background based on chroma
    const mainChromaIdx = i % 12;
    const hue = CHROMA_HUES[mainChromaIdx];
    const cVal = sChroma[mainChromaIdx];
    
    ctx.globalCompositeOperation = 'lighter';
    
    // 1. Draw drifting particles
    kaleidoscopeState.particles.forEach((p, pIdx) => {
      const pMel = sMel[pIdx % sMel.length] || 0;
      const r = ((p.r * maxRadius) + time * p.speed * 20) % maxRadius;
      const angle = p.angle + kaleidoscopeState.drift;
      
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const size = p.size * (1 + sBeat * 1.5) * (1 + (pMel + 10) / 20);
      
      ctx.fillStyle = `hsla(${(hue + pIdx * 20) % 360}, 80%, 60%, ${0.2 + cVal * 0.4})`;
      ctx.shadowBlur = 5 + cVal * 15;
      ctx.shadowColor = ctx.fillStyle;
      
      if (p.type === 0) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 1) {
        ctx.fillRect(x - size/2, y - size/2, size, size);
      } else {
        ctx.beginPath();
        const rot = time + pIdx;
        ctx.moveTo(x + Math.cos(rot) * size, y + Math.sin(rot) * size);
        ctx.lineTo(x + Math.cos(rot + 2.4) * size, y + Math.sin(rot + 2.4) * size);
        ctx.lineTo(x + Math.cos(rot + 4.2) * size, y + Math.sin(rot + 4.2) * size);
        ctx.closePath();
        ctx.fill();
      }
    });

    // 2. Draw "Energy Rays"
    const numRays = 4;
    for (let r = 0; r < numRays; r++) {
      const rayAngle = (r / numRays) * sectorAngle;
      const mIdx = Math.floor((r / numRays) * sMel.length);
      const mVal = (sMel[mIdx] + 15) / 15;
      
      const rayLen = maxRadius * mVal * (0.8 + sBeat * 0.2);
      
      const rayGrad = ctx.createLinearGradient(0, 0, Math.cos(rayAngle) * rayLen, Math.sin(rayAngle) * rayLen);
      rayGrad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.8)`);
      rayGrad.addColorStop(1, `hsla(${(hue + 40) % 360}, 100%, 50%, 0)`);
      
      ctx.strokeStyle = rayGrad;
      ctx.lineWidth = 1 + cVal * 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(rayAngle) * rayLen, Math.sin(rayAngle) * rayLen);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw central Hub
  ctx.beginPath();
  const hubRadius = 20 + sBeat * 30;
  const hubGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hubRadius);
  hubGrad.addColorStop(0, '#fff');
  hubGrad.addColorStop(0.5, `hsla(${time * 50 % 360}, 100%, 70%, 0.5)`);
  hubGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = hubGrad;
  ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}
