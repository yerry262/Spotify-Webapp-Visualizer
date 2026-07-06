import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Plasma Fire - Rising flames with chroma colors and heat distortion
 */
export function drawPlasmaFireWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('plasma_fire');
  const baseY = height * (settings.basePosition / 100);
  const maxFlameHeight = height * (settings.maxAmplitude / 100);
  const numFlames = 50;
  
  // Draw flames from back to front
  for (let layer = 3; layer >= 0; layer--) {
    const layerScale = 0.6 + layer * 0.15;
    const layerSpeed = 3 + layer * 0.5;
    const layerOffset = layer * 0.3;
    
    for (let i = 0; i < numFlames; i++) {
      const t = i / numFlames;
      const x = t * width;
      
      // Map to chroma for color
      const chromaIdx = Math.floor(t * 12);
      const chromaValue = chroma[chromaIdx] || 0.3;
      
      // Flame colors: shift from chroma color toward orange/yellow at tips
      const baseHue = CHROMA_HUES[chromaIdx];
      
      // Get mel for flame height
      let melValue = 0.4;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor(t * mel.length);
        melValue = Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      // Flickering noise
      const noise1 = Math.sin(t * 15 + time * layerSpeed + layerOffset) * 0.3;
      const noise2 = Math.sin(t * 23 + time * layerSpeed * 1.7 + layerOffset) * 0.2;
      const noise3 = Math.sin(t * 7 + time * layerSpeed * 0.5 + layerOffset) * 0.2;
      const flicker = 0.5 + noise1 + noise2 + noise3;
      
      const flameHeight = melValue * maxFlameHeight * layerScale * flicker * (0.5 + chromaValue * 0.5) * (1 + beatPulse * 0.5);
      const flameWidth = (width / numFlames) * 1.5 * (1 + beatPulse * 0.2);
      
      // Draw flame gradient
      const gradient = ctx.createLinearGradient(x, baseY, x, baseY - flameHeight);
      const tipHue = (baseHue + 30) % 360; // Shift toward yellow/orange at tip
      
      gradient.addColorStop(0, `hsla(${baseHue}, 90%, 30%, ${0.5 + chromaValue * 0.4})`);
      gradient.addColorStop(0.3, `hsla(${baseHue}, 85%, 50%, ${0.6 + chromaValue * 0.3})`);
      gradient.addColorStop(0.6, `hsla(${tipHue}, 100%, 60%, ${0.4 + chromaValue * 0.3})`);
      gradient.addColorStop(1, `hsla(${tipHue + 20}, 100%, 70%, 0)`);
      
      // Flame shape using bezier curves
      ctx.beginPath();
      ctx.moveTo(x - flameWidth / 2, baseY);
      ctx.quadraticCurveTo(
        x - flameWidth / 4 + Math.sin(time * 5 + t * 10) * 5,
        baseY - flameHeight * 0.6,
        x + Math.sin(time * 3 + t * 8) * 8,
        baseY - flameHeight
      );
      ctx.quadraticCurveTo(
        x + flameWidth / 4 + Math.sin(time * 4 + t * 12) * 5,
        baseY - flameHeight * 0.6,
        x + flameWidth / 2,
        baseY
      );
      ctx.closePath();
      
      ctx.fillStyle = gradient;
      
      if (chromaValue > 0.3 && layer === 0) {
        ctx.shadowColor = `hsla(${baseHue}, 100%, 60%, 0.6)`;
        ctx.shadowBlur = 15 * chromaValue;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
