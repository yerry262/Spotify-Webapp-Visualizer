import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Water Ripple 💧🌊 - Realistic 3D water droplet ripples with depth and highlights
 * Based on the asymptotic solution to linearized water wave equations
 * Features: Realistic shading, highlights, shadows, and 3D depth appearance
 * Optimized: Uses efficient circle rendering with gradient effects
 */
export function drawWaterRippleWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('water_ripple');
  const centerY = height * (settings.basePosition / 100);
  const scale = settings.maxAmplitude / 100;
  
  // Constants for ripple effect
  const estimatedBPM = 120;
  const dropletInterval = (60 / estimatedBPM) * 1.5; // New droplet every ~0.75s
  const waveSpeed = 200; // Pixels per second expansion
  
  // Find dominant chroma for background
  let dominantIdx = 0;
  let maxChroma = 0;
  for (let i = 0; i < 12; i++) {
    if (chroma[i] > maxChroma) {
      maxChroma = chroma[i];
      dominantIdx = i;
    }
  }
  const dominantHue = CHROMA_HUES[dominantIdx];
  
  // Deep water background
  const bgGradient = ctx.createRadialGradient(width/2, centerY, 0, width/2, centerY, Math.max(width, height) * 0.8);
  bgGradient.addColorStop(0, `hsla(${dominantHue}, 50%, 15%, 1)`);
  bgGradient.addColorStop(0.5, `hsla(${dominantHue}, 60%, 8%, 1)`);
  bgGradient.addColorStop(1, `hsla(${dominantHue}, 60%, 4%, 1)`);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Calculate active droplets based on time
  const numDroplets = Math.floor(time / dropletInterval) + 1;
  const historyCount = 15; // How many past droplets to keep tracking
  const startIdx = Math.max(0, numDroplets - historyCount);
  
  // Draw ripples for each active droplet
  for (let i = startIdx; i < numDroplets; i++) {
    const dropTimeStart = i * dropletInterval;
    const age = time - dropTimeStart;
    
    if (age < 0) continue;
    
    // Position logic: Circular pattern around center
    const chromaIdx = i % 12;
    const hue = CHROMA_HUES[chromaIdx];
    // Use current chroma value if available, otherwise default fallback
    const noteIntensity = chroma[chromaIdx] !== undefined ? chroma[chromaIdx] : 0.5;
    
    // Spiral position - calculate based on SPAWN time to keep position fixed for a given droplet
    // We use a pseudo-random but deterministic radius based on the index to vary position without jittering
    const angle = (chromaIdx / 12) * Math.PI * 2 + (dropTimeStart * 0.2); 
    
    // Use a deterministic "random" value derived from index for radius variation
    // Math.sin(i * 123) gives a stable value between -1 and 1 for this droplet
    const deterministicRandom = Math.sin(i * 123.45); 
    const radiusVariation = 0.8 + 0.3 * (0.5 + 0.5 * deterministicRandom); // Range 0.8 to 1.1
    
    const radiusPos = (Math.min(width, height) * 0.35) * scale * radiusVariation;
    
    const dropX = width/2 + Math.cos(angle) * radiusPos;
    const dropY = centerY + Math.sin(angle) * radiusPos; // respecting basePosition
    
    // Dynamic ripple properties based on music data
    const ripplesPerDrop = 2 + Math.floor(noteIntensity * 4); // 2 to 6 rings based on intensity
    const rippleDelay = 0.25; // seconds between rings
    const thicknessScale = 1 + beatPulse * 1.5; // Pulse thickness with beat
    
    for (let r = 0; r < ripplesPerDrop; r++) {
      const ringAge = age - (r * rippleDelay);
      if (ringAge < 0) continue;
      
      const radius = ringAge * waveSpeed;
      const maxRadius = Math.min(width, height) * 0.8;
      
      if (radius > maxRadius) continue;
      
      // Calculate opacity/visibility
      const progress = radius / maxRadius;
      const baseAlpha = 1 - progress;
      // Fade out over time and distance
      const alpha = baseAlpha * Math.exp(-ringAge * 0.5) * (noteIntensity + 0.4);
      
      if (alpha < 0.02) continue;
      
      // Draw 3D-ish Ripple Ring (Shadow, Main, Highlight)
      
      // Shadow (outer/darker)
      ctx.beginPath();
      ctx.arc(dropX, dropY, radius + 2, 0, Math.PI * 2);
      ctx.lineWidth = 4 * thicknessScale;
      ctx.strokeStyle = `hsla(${hue}, 60%, 10%, ${alpha * 0.6})`;
      ctx.stroke();
      
      // Main body
      ctx.beginPath();
      ctx.arc(dropX, dropY, radius, 0, Math.PI * 2);
      ctx.lineWidth = 3 * thicknessScale;
      ctx.strokeStyle = `hsla(${hue}, 80%, 50%, ${alpha})`;
      ctx.stroke();
      
      // Highlight (inner/lighter)
      ctx.beginPath();
      // Ensure non-negative radius
      ctx.arc(dropX, dropY, Math.max(0, radius - 2), 0, Math.PI * 2);
      ctx.lineWidth = 1.5 * thicknessScale;
      ctx.strokeStyle = `hsla(${hue}, 90%, 85%, ${alpha * 0.9})`;
      ctx.stroke();
    }
    
    // Impact splash (only when very fresh)
    if (age < 0.3) {
      const splashProgress = age / 0.3;
      const splashRadius = 5 + (splashProgress * 40 * (1 + beatPulse));
      const splashAlpha = 1 - splashProgress;
      
      // Glow
      const grad = ctx.createRadialGradient(dropX, dropY, 0, dropX, dropY, splashRadius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${splashAlpha})`);
      grad.addColorStop(0.5, `hsla(${hue}, 100%, 70%, ${splashAlpha * 0.8})`);
      grad.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(dropX, dropY, splashRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
