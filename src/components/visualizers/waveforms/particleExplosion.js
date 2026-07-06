import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Particle Explosion 💥 - Bursting particles from center that react to music
 * Particles spread based on mel, colors from chroma
 */
let particleExplosionState = {
  activeExplosions: [], // Array of {x, y, startTime, hue, intensity, particles}
  lastBeatPulse: 0,
  sChroma: new Float32Array(12).fill(0)
};

/**
 * Particle Explosion 🎆 - Dynamic, physics-based bursts that react to beats
 * High-energy core with gravity-affected embers and shockwaves
 */
export function drawParticleExplosionWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('particle_explosion');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const spreadMultiplier = settings.maxAmplitude / 50;

  // Smooth chroma
  for (let i = 0; i < 12; i++) {
    particleExplosionState.sChroma[i] += (chroma[i] - particleExplosionState.sChroma[i]) * 0.15;
  }

  // Trigger new explosion on beat or significant surge
  if (beatPulse > 0.6 && particleExplosionState.lastBeatPulse <= 0.6) {
    const avgMel = mel ? mel.reduce((a, b) => a + b, 0) / mel.length : 0;
    const intensity = Math.max(0.5, (avgMel + 15) / 15);
    
    // Choose strongest chroma for color
    let maxIdx = 0;
    for(let i=1; i<12; i++) if(chroma[i] > chroma[maxIdx]) maxIdx = i;

    // Create particles for this specific burst
    const count = Math.floor(60 + intensity * 80);
    const particles = [];
    for(let i=0; i<count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 8) * spreadMultiplier * intensity;
      particles.push({
        x: 0, y: 0, // Relative to explosion center
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.03,
        size: 1 + Math.random() * 3
      });
    }

    particleExplosionState.activeExplosions.push({
      x: centerX + (Math.random() - 0.5) * width * 0.4,
      y: centerY + (Math.random() - 0.5) * height * 0.2,
      startTime: time,
      hue: CHROMA_HUES[maxIdx],
      intensity,
      particles
    });
  }
  particleExplosionState.lastBeatPulse = beatPulse;

  // Constant "ambient" center ember (reacts to mel)
  const avgMel = mel ? mel.reduce((a, b) => a + b, 0) / mel.length : 0;
  const ambientScale = Math.max(0.2, (avgMel + 10) / 10);
  
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Update and draw explosions
  particleExplosionState.activeExplosions = particleExplosionState.activeExplosions.filter(exp => {
    const age = time - exp.startTime;
    if (age > 2.0 || age < 0) return false;

    const fade = Math.max(0, 1 - age / 2.0);
    
    // Shockwave
    if (age < 0.5) {
      const swRadius = Math.max(0, age * 800 * exp.intensity);
      const swAlpha = (1 - age / 0.5) * 0.5;
      ctx.strokeStyle = `hsla(${exp.hue}, 90%, 70%, ${swAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, swRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Particles
    exp.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity
      p.vx *= 0.98; // Air resistance
      p.life -= p.decay;

      if (p.life > 0) {
        const x = exp.x + p.x;
        const y = exp.y + p.y;
        const alpha = p.life * fade;
        const size = p.size * (0.5 + p.life * 0.5) * exp.intensity;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 5);
        grad.addColorStop(0, `hsla(${exp.hue}, 100%, 80%, ${alpha})`);
        grad.addColorStop(0.3, `hsla(${exp.hue}, 80%, 60%, ${alpha * 0.4})`);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `white`;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    return true;
  });

  // Center Glow
  const glowRadius = (50 + beatPulse * 100) * ambientScale;
  const centerGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
  centerGrad.addColorStop(0, `hsla(${time * 50 % 360}, 80%, 70%, 0.4)`);
  centerGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}

/**
 * Draw pitch class labels at bottom of screen
 */
