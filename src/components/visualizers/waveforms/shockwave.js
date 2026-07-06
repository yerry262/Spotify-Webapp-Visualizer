import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Shockwave Rings - Expanding circular ripples from beat impacts
 */
export function drawShockwaveWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('shockwave');
  const centerY = height * (settings.basePosition / 100);
  const maxRadius = height * (settings.maxAmplitude / 100) * 1.5;
  const centerX = width / 2;
  
  // Number of active rings based on beat
  const numRings = 12;
  const ringSpacing = 1.5; // Time between ring spawns
  
  // Draw rings from oldest (largest) to newest (smallest)
  for (let ring = numRings - 1; ring >= 0; ring--) {
    const ringTime = (time + ring * ringSpacing / numRings) % ringSpacing;
    const ringProgress = ringTime / ringSpacing; // 0 to 1
    
    // Map ring to chroma
    const chromaIdx = ring % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel for ring distortion
    let melInfluence = 0.5;
    if (mel && mel.length > 0) {
      const melIdx = ring % mel.length;
      melInfluence = Math.max(0.3, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    
    // Ring expands and fades
    const radius = ringProgress * maxRadius * (0.5 + chromaValue * 0.5) * (1 + beatPulse * 0.3);
    const alpha = (1 - ringProgress) * (0.3 + chromaValue * 0.5) * melInfluence;
    
    if (alpha < 0.05 || radius < 5) continue;
    
    // Draw distorted ring (wave on the circle)
    ctx.beginPath();
    const numPoints = 60;
    
    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      
      // Distortion waves
      const distortion1 = Math.sin(angle * 6 + time * 3 + ring) * 8 * melInfluence;
      const distortion2 = Math.sin(angle * 10 + time * 5 + ring * 0.5) * 4 * chromaValue;
      
      const r = radius + distortion1 + distortion2;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r * 0.4; // Squash for perspective
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    
    // Ring style
    const lightness = 50 + chromaValue * 25;
    ctx.strokeStyle = `hsla(${hue}, 85%, ${lightness}%, ${alpha})`;
    ctx.lineWidth = 2 + (1 - ringProgress) * 3 + chromaValue * 2;
    
    // Glow for prominent rings
    if (chromaValue > 0.3 && ringProgress < 0.5) {
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${alpha})`;
      ctx.shadowBlur = 12 * chromaValue;
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Inner glow fill for newest rings
    if (ringProgress < 0.3) {
      const fillAlpha = (0.3 - ringProgress) * chromaValue * 0.3;
      ctx.fillStyle = `hsla(${hue}, 80%, 50%, ${fillAlpha})`;
      ctx.fill();
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
