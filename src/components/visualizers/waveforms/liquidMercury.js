import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Liquid Mercury - Metallic blobs that merge and separate with mel
 * Creates organic, flowing metallic shapes
 */
export function drawLiquidMercuryWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('liquid_mercury');
  // basePosition controls vertical center of the blob field
  const centerY = height * (settings.basePosition / 100);
  // maxAmplitude controls blob size and spread
  const sizeMultiplier = settings.maxAmplitude / 50; // normalize to 1.0 at 50%
  const numBlobs = 20;
  
  // Calculate blob positions based on mel and time
  const blobs = [];
  for (let i = 0; i < numBlobs; i++) {
    const t = i / numBlobs;
    const chromaIdx = i % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    
    // Get mel value for this blob
    const melIdx = Math.floor(t * (mel?.length || 1));
    const melValue = mel ? Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10)) : 0.5;
    
    // Base position
    const baseX = t * width;
    const baseY = centerY;
    
    // Organic movement
    const moveX = Math.sin(time * 1.5 + i * 0.7) * 30 * melValue;
    const moveY = Math.cos(time * 1.2 + i * 0.5) * 40 * melValue + 
                  Math.sin(time * 2 + i) * 20 * chromaValue;
    
    // Size based on mel and chroma, scaled by settings
    const size = (15 + melValue * 35 + chromaValue * 25 + beatPulse * 15) * sizeMultiplier;
    
    blobs.push({
      x: baseX + moveX,
      y: baseY + moveY,
      size,
      chromaIdx,
      chromaValue,
      melValue
    });
  }
  
  // Draw metaball-style merged blobs
  // We'll approximate by drawing overlapping gradients
  for (let layer = 0; layer < 3; layer++) {
    const layerScale = 1 - layer * 0.2;
    
    for (const blob of blobs) {
      const hue = CHROMA_HUES[blob.chromaIdx];
      const size = blob.size * layerScale;
      
      // Create metallic gradient
      const gradient = ctx.createRadialGradient(
        blob.x - size * 0.3, blob.y - size * 0.3, 0,
        blob.x, blob.y, size
      );
      
      // Metallic silver-ish color influenced by chroma
      const baseLight = 70 + layer * 10;
      const saturation = 20 + blob.chromaValue * 40;
      
      gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${baseLight + 20}%, ${0.4 - layer * 0.1})`);
      gradient.addColorStop(0.4, `hsla(${hue}, ${saturation}%, ${baseLight}%, ${0.5 - layer * 0.1})`);
      gradient.addColorStop(0.8, `hsla(${hue}, ${saturation + 20}%, ${baseLight - 20}%, ${0.4 - layer * 0.1})`);
      gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${baseLight - 30}%, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      // Organic blob shape using bezier curves
      const numPoints = 8;
      for (let p = 0; p <= numPoints; p++) {
        const angle = (p / numPoints) * Math.PI * 2;
        const wobble = Math.sin(angle * 3 + time * 3 + blob.x * 0.1) * size * 0.2 * blob.melValue;
        const r = size + wobble;
        const px = blob.x + Math.cos(angle) * r;
        const py = blob.y + Math.sin(angle) * r * 0.6; // Squash vertically
        
        if (p === 0) {
          ctx.moveTo(px, py);
        } else {
          const prevAngle = ((p - 1) / numPoints) * Math.PI * 2;
          const prevWobble = Math.sin(prevAngle * 3 + time * 3 + blob.x * 0.1) * size * 0.2 * blob.melValue;
          const prevR = size + prevWobble;
          
          const cpAngle = (angle + prevAngle) / 2;
          const cpR = (r + prevR) / 2 * 1.1;
          const cpX = blob.x + Math.cos(cpAngle) * cpR;
          const cpY = blob.y + Math.sin(cpAngle) * cpR * 0.6;
          
          ctx.quadraticCurveTo(cpX, cpY, px, py);
        }
      }
      ctx.closePath();
      ctx.fill();
      
      // Add specular highlight
      if (layer === 0 && blob.chromaValue > 0.3) {
        const highlightGrad = ctx.createRadialGradient(
          blob.x - size * 0.4, blob.y - size * 0.4, 0,
          blob.x - size * 0.2, blob.y - size * 0.2, size * 0.4
        );
        highlightGrad.addColorStop(0, `rgba(255, 255, 255, ${0.4 * blob.chromaValue})`);
        highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlightGrad;
        ctx.beginPath();
        ctx.ellipse(blob.x - size * 0.3, blob.y - size * 0.25, size * 0.25, size * 0.15, -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
