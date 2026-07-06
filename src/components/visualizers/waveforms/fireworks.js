import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Fireworks Show 🎆 - Exploding fireworks with sparkling trails
 * Each chroma note triggers a firework with that color
 */
export function drawFireworksWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('fireworks');
  // basePosition controls where fireworks launch from (ground level)
  const launchY = height * (settings.basePosition / 100);
  // maxAmplitude controls how high fireworks can explode
  const explosionHeight = height * (settings.maxAmplitude / 100);
  
  // Generate fireworks based on chroma peaks
  const numFireworks = 8;
  
  for (let fw = 0; fw < numFireworks; fw++) {
    const chromaIdx = fw % 12;
    const chromaValue = chroma[chromaIdx] || 0;
    
    if (chromaValue < 0.2) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    
    // Firework position - use deterministic "random" based on index
    const seed1 = Math.sin(fw * 1234.5 + Math.floor(time * 0.5) * 100);
    const seed2 = Math.cos(fw * 5678.9 + Math.floor(time * 0.5) * 100);
    const centerX = width * 0.15 + ((seed1 + 1) / 2) * width * 0.7;
    // Position fireworks between launch point and explosion height
    const centerY = launchY - ((seed2 + 1) / 2) * explosionHeight;
    
    // Explosion phase (cycles every 2 seconds offset by firework index)
    const explosionCycle = ((time + fw * 0.4) % 2) / 2;
    const explosionRadius = explosionCycle * 120 * chromaValue + beatPulse * 30;
    const fadeOut = 1 - explosionCycle;
    
    // Get mel for spark count
    const melIdx = Math.floor((fw / numFireworks) * (mel?.length || 1));
    const melValue = mel ? Math.max(0.3, (mel[melIdx] + 10) / 10) : 0.5;
    
    // Draw explosion sparks
    const numSparks = Math.floor(20 + melValue * 30);
    for (let spark = 0; spark < numSparks; spark++) {
      const sparkAngle = (spark / numSparks) * Math.PI * 2;
      const sparkSpeed = 0.5 + Math.sin(spark * 123.456) * 0.5;
      const sparkRadius = explosionRadius * sparkSpeed;
      
      // Gravity effect - sparks fall as they travel
      const gravityOffset = explosionCycle * explosionCycle * 40;
      
      const sparkX = centerX + Math.cos(sparkAngle) * sparkRadius;
      const sparkY = centerY + Math.sin(sparkAngle) * sparkRadius + gravityOffset;
      
      // Spark trail
      const trailLength = 5;
      for (let t = 0; t < trailLength; t++) {
        const trailT = 1 - t / trailLength;
        const trailRadius = sparkRadius * (1 - t * 0.15);
        const trailGravity = (explosionCycle - t * 0.02) * (explosionCycle - t * 0.02) * 40;
        const trailX = centerX + Math.cos(sparkAngle) * trailRadius;
        const trailY = centerY + Math.sin(sparkAngle) * trailRadius + trailGravity;
        
        const trailAlpha = fadeOut * chromaValue * trailT * 0.6;
        const trailSize = (3 - t * 0.4) * chromaValue;
        
        ctx.fillStyle = `hsla(${hue}, 90%, ${60 + t * 8}%, ${trailAlpha})`;
        ctx.beginPath();
        ctx.arc(trailX, trailY, Math.max(0.5, trailSize), 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Spark head with glow
      const sparkAlpha = fadeOut * chromaValue * 0.9;
      const sparkSize = 2 + chromaValue * 3;
      
      // Glow
      const glowGradient = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, sparkSize * 4);
      glowGradient.addColorStop(0, `hsla(${hue}, 100%, 80%, ${sparkAlpha * 0.8})`);
      glowGradient.addColorStop(0.5, `hsla(${hue}, 90%, 60%, ${sparkAlpha * 0.3})`);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize * 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Core
      ctx.fillStyle = `hsla(${hue}, 50%, 95%, ${sparkAlpha})`;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Central flash at explosion start
    if (explosionCycle < 0.2) {
      const flashAlpha = (0.2 - explosionCycle) * 5 * chromaValue;
      const flashGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
      flashGradient.addColorStop(0, `hsla(${hue}, 50%, 100%, ${flashAlpha})`);
      flashGradient.addColorStop(0.3, `hsla(${hue}, 80%, 70%, ${flashAlpha * 0.5})`);
      flashGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = flashGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Ambient sparkles in background
  const numSparkles = 30;
  for (let i = 0; i < numSparkles; i++) {
    const sparkleX = ((Math.sin(i * 999.99) + 1) / 2) * width;
    const sparkleY = ((Math.cos(i * 888.88) + 1) / 2) * height * 0.7;
    const twinkle = Math.sin(time * 5 + i * 2) * 0.5 + 0.5;
    const chromaIdx = i % 12;
    const chromaValue = chroma[chromaIdx] || 0.2;
    
    if (twinkle > 0.7 && chromaValue > 0.3) {
      const hue = CHROMA_HUES[chromaIdx];
      ctx.fillStyle = `hsla(${hue}, 70%, 80%, ${twinkle * chromaValue * 0.6})`;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
