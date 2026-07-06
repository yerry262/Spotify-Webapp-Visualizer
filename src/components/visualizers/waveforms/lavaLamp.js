import { CHROMA_HUES, drawWaveLabels } from '../waveformCore';

let lavaLampState = { blobs: [], sChroma: new Float32Array(12).fill(0), sBeat: 0, initialized: false };

/**
 * Lava Lamp 🫧 - Hypnotic floating blobs that rise, merge, and pulse with the beat
 * Organic, chill aesthetic with warm gradients and soft glow
 */
export function drawLavaLampWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const minDim = Math.min(width, height);
  
  // Smooth state updates
  const lerp = 0.08;
  lavaLampState.sBeat += (beatPulse - lavaLampState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    lavaLampState.sChroma[i] += (chroma[i] - lavaLampState.sChroma[i]) * lerp;
  }
  
  // Initialize blobs on first run
  if (!lavaLampState.initialized || lavaLampState.blobs.length === 0) {
    lavaLampState.blobs = [];
    const numBlobs = 6;
    for (let i = 0; i < numBlobs; i++) {
      lavaLampState.blobs.push({
        x: 0.2 + Math.random() * 0.6,
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.001,
        vy: -0.001 - Math.random() * 0.002,
        baseSize: 0.08 + Math.random() * 0.1,
        size: 0.1,
        hue: Math.random() * 60, // Warm hues: 0-60 (red to yellow)
        phase: Math.random() * Math.PI * 2
      });
    }
    lavaLampState.initialized = true;
  }
  
  // Find dominant chroma for color influence
  let dominantIdx = 0;
  let maxVal = 0;
  for (let i = 0; i < 12; i++) {
    if (lavaLampState.sChroma[i] > maxVal) {
      maxVal = lavaLampState.sChroma[i];
      dominantIdx = i;
    }
  }
  const dominantHue = CHROMA_HUES[dominantIdx];
  
  ctx.save();
  
  // Draw lamp container background (dark with subtle gradient)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#1a0a1a');
  bgGrad.addColorStop(0.5, '#0d0510');
  bgGrad.addColorStop(1, '#1a0a1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
  
  // Draw subtle "heat convection" lines
  ctx.strokeStyle = 'rgba(255, 100, 50, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const x = width * (0.2 + i * 0.08);
    ctx.beginPath();
    ctx.moveTo(x, height);
    for (let y = height; y > 0; y -= 20) {
      const wave = Math.sin(y * 0.01 + time * 0.5 + i) * 10;
      ctx.lineTo(x + wave, y);
    }
    ctx.stroke();
  }
  
  // Update and draw blobs
  ctx.globalCompositeOperation = 'lighter';
  
  for (let blob of lavaLampState.blobs) {
    // Wobble movement
    blob.phase += 0.02;
    const wobbleX = Math.sin(blob.phase) * 0.002;
    const wobbleY = Math.sin(blob.phase * 0.7) * 0.0005;
    
    // Beat reaction
    const beatBoost = lavaLampState.sBeat * 0.003;
    
    // Update position
    blob.x += blob.vx + wobbleX;
    blob.y += blob.vy + wobbleY - beatBoost;
    
    // Bounce off walls (with damping)
    if (blob.x < 0.15) { blob.x = 0.15; blob.vx = Math.abs(blob.vx) * 0.8; }
    if (blob.x > 0.85) { blob.x = 0.85; blob.vx = -Math.abs(blob.vx) * 0.8; }
    
    // Wrap vertically (respawn at bottom when reaching top)
    if (blob.y < -0.1) {
      blob.y = 1.1;
      blob.x = 0.3 + Math.random() * 0.4;
      blob.vx = (Math.random() - 0.5) * 0.001;
    }
    if (blob.y > 1.1) {
      blob.y = 1.1;
      blob.vy = -Math.abs(blob.vy);
    }
    
    // Size pulsing with beat and chroma
    const chromaBoost = lavaLampState.sChroma[dominantIdx] * 0.03;
    const beatSize = lavaLampState.sBeat * 0.04;
    blob.size += (blob.baseSize + chromaBoost + beatSize - blob.size) * 0.1;
    
    // Draw blob with layered gradients for soft glow
    const bx = blob.x * width;
    const by = blob.y * height;
    const br = blob.size * minDim;
    
    // Calculate hue (blend between blob's base hue and dominant music hue)
    const hue = (blob.hue + dominantHue * 0.3) % 360;
    
    // Outer glow (largest, most transparent)
    const glowGrad = ctx.createRadialGradient(bx, by, 0, bx, by, br * 2);
    glowGrad.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.3)`);
    glowGrad.addColorStop(0.5, `hsla(${hue}, 100%, 50%, 0.1)`);
    glowGrad.addColorStop(1, `hsla(${hue}, 100%, 40%, 0)`);
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Main blob body
    const blobGrad = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, 0, bx, by, br);
    blobGrad.addColorStop(0, `hsla(${hue + 20}, 100%, 80%, 0.9)`);
    blobGrad.addColorStop(0.4, `hsla(${hue}, 100%, 60%, 0.8)`);
    blobGrad.addColorStop(0.8, `hsla(${hue - 10}, 100%, 45%, 0.7)`);
    blobGrad.addColorStop(1, `hsla(${hue - 20}, 100%, 30%, 0.5)`);
    ctx.fillStyle = blobGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    
    // Specular highlight (small bright spot)
    const specGrad = ctx.createRadialGradient(bx - br * 0.4, by - br * 0.4, 0, bx - br * 0.3, by - br * 0.3, br * 0.4);
    specGrad.addColorStop(0, `rgba(255, 255, 255, 0.6)`);
    specGrad.addColorStop(0.5, `rgba(255, 255, 255, 0.2)`);
    specGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw "merge" effect where blobs overlap (simplified metaball look)
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < lavaLampState.blobs.length; i++) {
    for (let j = i + 1; j < lavaLampState.blobs.length; j++) {
      const b1 = lavaLampState.blobs[i];
      const b2 = lavaLampState.blobs[j];
      const dx = (b1.x - b2.x) * width;
      const dy = (b1.y - b2.y) * height;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const r1 = b1.size * minDim;
      const r2 = b2.size * minDim;
      const overlap = (r1 + r2) - dist;
      
      if (overlap > 0 && dist > 0) {
        // Draw a glowing bridge between overlapping blobs
        const mx = ((b1.x + b2.x) / 2) * width;
        const my = ((b1.y + b2.y) / 2) * height;
        const bridgeSize = Math.min(overlap * 0.5, r1 * 0.5, r2 * 0.5);
        const hue = (b1.hue + b2.hue + dominantHue) / 3;
        
        const bridgeGrad = ctx.createRadialGradient(mx, my, 0, mx, my, bridgeSize);
        bridgeGrad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.6)`);
        bridgeGrad.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
        ctx.fillStyle = bridgeGrad;
        ctx.beginPath();
        ctx.arc(mx, my, bridgeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  // Subtle vignette for lamp container feel
  const vignetteGrad = ctx.createRadialGradient(width / 2, height / 2, minDim * 0.3, width / 2, height / 2, minDim * 0.8);
  vignetteGrad.addColorStop(0, 'transparent');
  vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = vignetteGrad;
  ctx.fillRect(0, 0, width, height);
  
  // Glass reflection overlay (subtle)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.beginPath();
  ctx.ellipse(width * 0.3, height * 0.3, width * 0.15, height * 0.25, -0.3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}
