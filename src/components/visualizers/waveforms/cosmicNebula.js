import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Cosmic Nebula 🌠 - Swirling cosmic clouds with stars that pulse to the beat
 * Features gas clouds, twinkling stars, and gravitational distortion
 */
export function drawCosmicNebulaWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('cosmic_nebula');
  const centerX = width / 2;
  // basePosition controls vertical center of the nebula
  const centerY = height * (settings.basePosition / 100);
  // maxAmplitude controls the size/spread of the nebula
  const sizeMultiplier = settings.maxAmplitude / 45; // normalize to 1.0 at default 45%
  
  // Draw swirling nebula clouds
  const numClouds = 8;
  for (let cloud = 0; cloud < numClouds; cloud++) {
    const chromaIdx = cloud % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel for cloud density
    const melIdx = Math.floor((cloud / numClouds) * (mel?.length || 1));
    const melValue = mel ? Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10)) : 0.5;
    
    // Spiral rotation - scaled by sizeMultiplier
    const spiralAngle = (cloud / numClouds) * Math.PI * 2 + time * 0.3;
    const spiralRadius = (100 + melValue * 150 + beatPulse * 50) * sizeMultiplier;
    
    const cloudX = centerX + Math.cos(spiralAngle) * spiralRadius;
    const cloudY = centerY + Math.sin(spiralAngle) * spiralRadius * 0.5;
    const cloudSize = (80 + chromaValue * 120 + melValue * 60) * sizeMultiplier;
    
    // Multi-layered cloud gradient
    for (let layer = 2; layer >= 0; layer--) {
      const layerSize = cloudSize * (1 + layer * 0.4);
      const gradient = ctx.createRadialGradient(cloudX, cloudY, 0, cloudX, cloudY, layerSize);
      
      const alpha = (0.15 - layer * 0.04) * chromaValue;
      gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, ${alpha * 1.5})`);
      gradient.addColorStop(0.3, `hsla(${hue}, 70%, 50%, ${alpha})`);
      gradient.addColorStop(0.6, `hsla(${(hue + 30) % 360}, 60%, 40%, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      // Irregular cloud shape with bezier curves
      const numPoints = 12;
      for (let p = 0; p <= numPoints; p++) {
        const angle = (p / numPoints) * Math.PI * 2;
        const wobble = Math.sin(angle * 3 + time * 2 + cloud) * layerSize * 0.3 * melValue;
        const distort = Math.cos(angle * 5 + time * 1.5) * layerSize * 0.2;
        const r = layerSize + wobble + distort;
        const px = cloudX + Math.cos(angle) * r;
        const py = cloudY + Math.sin(angle) * r * 0.6;
        
        if (p === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  
  // Draw twinkling stars
  const numStars = 60;
  for (let i = 0; i < numStars; i++) {
    // Use deterministic random based on index
    const seed = i * 12345.67;
    const starX = ((Math.sin(seed) + 1) / 2) * width;
    const starY = ((Math.cos(seed * 1.1) + 1) / 2) * height * 0.9;
    
    const chromaIdx = i % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Twinkle effect based on time and beat
    const twinkle = Math.sin(time * 3 + i * 0.5) * 0.5 + 0.5;
    const beatTwinkle = chromaValue > 0.5 ? beatPulse : 0;
    const brightness = twinkle * chromaValue + beatTwinkle;
    const size = 1 + brightness * 3;
    
    if (brightness > 0.2) {
      // Star glow
      const gradient = ctx.createRadialGradient(starX, starY, 0, starX, starY, size * 4);
      gradient.addColorStop(0, `hsla(${hue}, 60%, 90%, ${brightness * 0.8})`);
      gradient.addColorStop(0.3, `hsla(${hue}, 70%, 70%, ${brightness * 0.4})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(starX, starY, size * 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Star core
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(starX, starY, size, 0, Math.PI * 2);
      ctx.fill();
      
      // Cross flare for bright stars
      if (brightness > 0.6) {
        ctx.strokeStyle = `hsla(${hue}, 50%, 90%, ${brightness * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(starX - size * 3, starY);
        ctx.lineTo(starX + size * 3, starY);
        ctx.moveTo(starX, starY - size * 3);
        ctx.lineTo(starX, starY + size * 3);
        ctx.stroke();
      }
    }
  }
  
  // Gravitational lens effect in center
  const lensGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60 + beatPulse * 30);
  lensGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
  lensGradient.addColorStop(0.5, 'rgba(100, 50, 150, 0.1)');
  lensGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = lensGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 60 + beatPulse * 30, 0, Math.PI * 2);
  ctx.fill();
  
  drawWaveLabels(ctx, width, height, chroma);
}
