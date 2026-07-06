import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Sound Tornado 🌪️ - A spiraling vortex with particles swirling upward
 * Particles spiral based on mel frequencies, tornado width pulses with beat
 */
export function drawSoundTornadoWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('sound_tornado');
  
  // Determine number of tornados based on screen width/height
  const isLandscape = width > height;
  const numTornados = isLandscape ? 3 : 2;
  const spacingX = width / numTornados;

  for (let tIdx = 0; tIdx < numTornados; tIdx++) {
    const centerX = spacingX * (tIdx + 0.5);
    const tTime = time + tIdx * 10; // Time offset for particles/rotation

    // basePosition controls where the tornado base is
    const baseY = height * (settings.basePosition / 100);
    // maxAmplitude controls tornado height (how far up it reaches)
    const tornadoHeight = height * (settings.maxAmplitude / 100);
    
    // Tornado parameters
    const baseWidth = (spacingX * 0.4) + beatPulse * 50;
    const topWidth = (spacingX * 0.05) + beatPulse * 10;
    
    // Calculate average mel for overall intensity
    const avgMel = mel ? mel.reduce((a, b) => a + b, 0) / mel.length : 0;
    const intensity = Math.max(0.3, (avgMel + 10) / 10);
    
    // Draw tornado layers (back to front)
    for (let layer = 2; layer >= 0; layer--) {
      const layerOffset = layer * 15;
      
      // Draw spiral bands
      const numBands = 20;
      for (let band = 0; band < numBands; band++) {
        const t = band / numBands;
        const y = baseY - t * tornadoHeight;
        
        // Width narrows toward top
        const widthAtY = baseWidth * (1 - t * 0.85) + topWidth * t * 0.85;
        
        const chromaIdx = (band + tIdx * 4) % 12;
        const chromaValue = chroma[chromaIdx] || 0.3;
        const hue = CHROMA_HUES[chromaIdx];
        
        // Spiral rotation
        const spiralAngle = t * Math.PI * 6 + tTime * 3 * (1 + t);
        const spiralOffset = Math.sin(spiralAngle) * widthAtY * 0.3;
        
        // Band height based on mel
        const melIdx = Math.floor(t * (mel?.length || 1));
        const melValue = mel ? Math.max(0.1, (mel[melIdx] + 10) / 10) : 0.3;
        const bandHeight = 8 + melValue * 15;
        
        const x1 = centerX + spiralOffset - widthAtY / 2 + layerOffset;
        const x2 = centerX + spiralOffset + widthAtY / 2 + layerOffset;
        
        // Gradient for depth
        const gradient = ctx.createLinearGradient(x1, y, x2, y);
        const alpha = (0.3 + chromaValue * 0.4) * (1 - layer * 0.2);
        const lightness = 50 + chromaValue * 20 - layer * 10;
        
        gradient.addColorStop(0, `hsla(${hue}, 70%, ${lightness - 10}%, ${alpha * 0.3})`);
        gradient.addColorStop(0.3, `hsla(${hue}, 80%, ${lightness}%, ${alpha})`);
        gradient.addColorStop(0.7, `hsla(${hue}, 80%, ${lightness}%, ${alpha})`);
        gradient.addColorStop(1, `hsla(${hue}, 70%, ${lightness - 10}%, ${alpha * 0.3})`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(centerX + spiralOffset + layerOffset, y, widthAtY / 2, bandHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw debris particles spiraling around
    const numDebris = 30; // Slightly reduced for multi-instance performance
    for (let i = 0; i < numDebris; i++) {
      const chromaIdx = (i + tIdx * 3) % 12;
      const chromaValue = chroma[chromaIdx] || 0.3;
      const hue = CHROMA_HUES[chromaIdx];
      
      // Particle height cycles
      const cycleSpeed = 0.3 + (i % 5) * 0.1;
      const heightT = ((tTime * cycleSpeed + i * 0.2) % 1);
      const y = baseY - heightT * tornadoHeight;
      
      // Width at this height
      const widthAtY = baseWidth * (1 - heightT * 0.85) + topWidth * heightT * 0.85;
      
      // Spiral around
      const spiralAngle = heightT * Math.PI * 8 + i * 0.5 + tTime * 2;
      const radius = widthAtY * 0.6 + Math.sin(tTime * 3 + i) * 20;
      
      const x = centerX + Math.cos(spiralAngle) * radius;
      const particleY = y + Math.sin(spiralAngle * 2) * 10;
      
      const size = 2 + chromaValue * 4 + beatPulse * 2;
      const alpha = 0.4 + chromaValue * 0.5;
      
      // Particle glow
      const gradient = ctx.createRadialGradient(x, particleY, 0, x, particleY, size * 3);
      gradient.addColorStop(0, `hsla(${hue}, 90%, 70%, ${alpha})`);
      gradient.addColorStop(0.5, `hsla(${hue}, 80%, 50%, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, particleY, size * 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Motion trail
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha * 0.4})`;
      ctx.lineWidth = size * 0.5;
      ctx.beginPath();
      for (let trail = 0; trail < 5; trail++) {
        const trailT = heightT - trail * 0.02;
        if (trailT < 0) continue;
        const trailY = baseY - trailT * tornadoHeight;
        const trailWidth = baseWidth * (1 - trailT * 0.85) + topWidth * trailT * 0.85;
        const trailAngle = trailT * Math.PI * 8 + i * 0.5 + tTime * 2;
        const trailRadius = trailWidth * 0.6;
        const trailX = centerX + Math.cos(trailAngle) * trailRadius;
        if (trail === 0) ctx.moveTo(trailX, trailY);
        else ctx.lineTo(trailX, trailY);
      }
      ctx.stroke();
    }
    
    // Ground dust cloud
    const dustGradient = ctx.createRadialGradient(centerX, baseY, 0, centerX, baseY, baseWidth * 1.5);
    dustGradient.addColorStop(0, `rgba(100, 80, 60, ${0.4 * intensity})`);
    dustGradient.addColorStop(0.5, `rgba(80, 60, 40, ${0.2 * intensity})`);
    dustGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = dustGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, baseY, baseWidth * 1.5, 40 + beatPulse * 20, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
