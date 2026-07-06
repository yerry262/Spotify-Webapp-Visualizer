import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

let galaxyState = { sChroma: new Float32Array(12).fill(0), sMel: null, sBeat: 0, rotation: 0 };

/**
 * Galaxy Spiral 🌀 - Spinning galaxy with cosmic dust and rhythmic pulses
 * Uses state-based smoothing for fluid rotation and organic "melodic" thickness
 */
export function drawGalaxySpiralWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('galaxy_spiral');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxRadius = Math.min(width, height) * (settings.maxAmplitude / 100);

  // Initialize and smooth state
  if (!galaxyState.sMel || (mel && galaxyState.sMel.length !== mel.length)) {
    galaxyState.sMel = new Float32Array(mel ? mel.length : 1).fill(0);
  }
  const lerp = 0.1;
  galaxyState.sBeat += (beatPulse - galaxyState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    galaxyState.sChroma[i] += (chroma[i] - galaxyState.sChroma[i]) * lerp;
  }
  if (mel) {
    for (let i = 0; i < mel.length; i++) {
        galaxyState.sMel[i] += (mel[i] - galaxyState.sMel[i]) * lerp;
    }
  }

  // Update persistent rotation
  const totalEnergy = galaxyState.sChroma.reduce((a, b) => a + b, 0) / 12;
  galaxyState.rotation += (0.01 + totalEnergy * 0.05);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  
  // Draw spiral arms
  const numArms = 2; // Precise, high-impact arms
  const pointsPerArm = 120;
  
  for (let arm = 0; arm < numArms; arm++) {
    const armOffset = (arm / numArms) * Math.PI * 2;
    const chromaIdx = (arm * 6) % 12;
    const chromaValue = galaxyState.sChroma[chromaIdx];
    const armHue = CHROMA_HUES[chromaIdx];
    
    for (let p = 0; p < pointsPerArm; p++) {
      const t = p / pointsPerArm;
      const radius = t * maxRadius;
      
      // Logarithmic spiral with organic wobble
      const spiralAngle = armOffset + t * Math.PI * 5 + galaxyState.rotation + Math.sin(time * 0.5 + t * 4) * 0.2;
      
      const mIdx = Math.floor(t * (galaxyState.sMel.length - 1));
      const mVal = (galaxyState.sMel[mIdx] + 15) / 15;
      
      // Perspective transform
      const x = centerX + Math.cos(spiralAngle) * radius;
      const y = centerY + Math.sin(spiralAngle) * radius * 0.5;
      
      const size = (1.5 + mVal * 3 + galaxyState.sBeat * 2) * (1 - t * 0.4);
      const alpha = (0.2 + chromaValue * 0.6) * (1 - t * 0.5);
      
      // Cosmic Ether (Gas)
      if (p % 4 === 0) {
        ctx.fillStyle = `hsla(${armHue}, 80%, 60%, ${alpha * 0.15})`;
        ctx.beginPath();
        ctx.arc(x, y, size * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Individual Stars & Twinkle
      if (p % 2 === 0) {
        const twinkle = 0.8 + Math.sin(time * 5 + p) * 0.2;
        ctx.fillStyle = `hsla(${armHue}, 30%, 95%, ${alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // Dynamic streaks
        if (p % 10 === 0 && chromaValue > 0.5) {
          ctx.strokeStyle = `hsla(${armHue}, 100%, 80%, ${alpha * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(spiralAngle + Math.PI/2) * 10, y + Math.sin(spiralAngle + Math.PI/2) * 5);
          ctx.stroke();
        }
      }
    }
  }
  
  // Central core
  const coreRadius = (25 + galaxyState.sBeat * 20 + totalEnergy * 30);
  const coreHue = CHROMA_HUES[Math.floor(time) % 12];
  
  const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 1.5);
  coreGrad.addColorStop(0, `hsla(${coreHue}, 60%, 90%, 0.8)`);
  coreGrad.addColorStop(0.4, `hsla(${coreHue}, 80%, 60%, 0.3)`);
  coreGrad.addColorStop(1, 'transparent');
  
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, coreRadius * 1.5, coreRadius * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}
