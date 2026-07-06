import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Glitch Art 📺 - Digital glitch effects with RGB splitting and scan lines
 * Intensity based on beat, colors shift with chroma
 */
export function drawGlitchArtWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('glitch_art');
  // basePosition controls vertical center of glitch effect concentration
  const centerY = height * (settings.basePosition / 100);
  // maxAmplitude controls the spread/intensity of glitch slices
  const spreadMultiplier = settings.maxAmplitude / 50; // normalize to 1.0 at 50%
  
  // Find dominant chroma for base color
  let dominantIdx = 0;
  let maxChroma = 0;
  for (let i = 0; i < 12; i++) {
    if (chroma[i] > maxChroma) {
      maxChroma = chroma[i];
      dominantIdx = i;
    }
  }
  const dominantHue = CHROMA_HUES[dominantIdx];
  
  // Calculate glitch intensity based on beat and mel
  const avgMel = mel ? mel.reduce((a, b) => a + b, 0) / mel.length : 0;
  const glitchIntensity = Math.max(0.1, (avgMel + 10) / 10) + beatPulse * 0.5;
  
  // Horizontal glitch slices
  const numSlices = 15 + Math.floor(glitchIntensity * 10);
  for (let i = 0; i < numSlices; i++) {
    // Pseudo-random based on time and index
    const seed = Math.sin(i * 12345.67 + Math.floor(time * 5) * 0.1);
    const seed2 = Math.cos(i * 67890.12 + Math.floor(time * 7) * 0.15);
    
    // Slices concentrate around the basePosition slider and spread with the
    // amplitude slider (was previously uniform across the full screen)
    const sliceY = centerY + seed * height * 0.5 * spreadMultiplier;
    const sliceHeight = (3 + Math.abs(seed2) * 30 * glitchIntensity) * spreadMultiplier;
    
    const chromaIdx = i % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // RGB shift offset
    const rgbShift = (10 + glitchIntensity * 30) * Math.sin(time * 10 + i);
    
    // Only draw if chroma is active or random trigger
    if (chromaValue > 0.2 || Math.abs(seed) > 0.7) {
      // Red channel (shifted left)
      ctx.fillStyle = `hsla(0, 100%, 50%, ${0.15 * chromaValue * glitchIntensity})`;
      ctx.fillRect(rgbShift, sliceY, width * 0.4, sliceHeight);
      
      // Green channel (center)
      ctx.fillStyle = `hsla(120, 100%, 50%, ${0.12 * chromaValue * glitchIntensity})`;
      ctx.fillRect(width * 0.3, sliceY, width * 0.4, sliceHeight);
      
      // Blue channel (shifted right)
      ctx.fillStyle = `hsla(240, 100%, 50%, ${0.15 * chromaValue * glitchIntensity})`;
      ctx.fillRect(width * 0.6 - rgbShift, sliceY, width * 0.4, sliceHeight);
      
      // Main color slice
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.3 * chromaValue})`;
      ctx.fillRect(0, sliceY, width, sliceHeight * 0.5);
    }
  }
  
  // Scan lines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 2);
  }
  
  // Static noise blocks
  const numBlocks = 20 + Math.floor(glitchIntensity * 30);
  for (let i = 0; i < numBlocks; i++) {
    const seed = Math.sin(i * 9876.54 + time * 20);
    const seed2 = Math.cos(i * 5432.1 + time * 15);
    
    if (Math.abs(seed) > 0.6) {
      const blockX = ((seed + 1) / 2) * width;
      const blockY = ((seed2 + 1) / 2) * height;
      const blockW = 5 + Math.abs(seed) * 40 * glitchIntensity;
      const blockH = 3 + Math.abs(seed2) * 20 * glitchIntensity;
      
      const chromaIdx = i % 12;
      const hue = CHROMA_HUES[chromaIdx];
      const chromaValue = chroma[chromaIdx] || 0.3;
      
      ctx.fillStyle = `hsla(${hue}, ${60 + chromaValue * 40}%, ${50 + chromaValue * 30}%, ${0.4 + chromaValue * 0.4})`;
      ctx.fillRect(blockX, blockY, blockW, blockH);
    }
  }
  
  // Vertical glitch bars (chromatic aberration style)
  const numBars = 5 + Math.floor(beatPulse * 10);
  for (let i = 0; i < numBars; i++) {
    const seed = Math.sin(i * 3333.33 + Math.floor(time * 8));
    if (Math.abs(seed) > 0.7) {
      const barX = ((seed + 1) / 2) * width;
      const barWidth = 2 + Math.abs(seed) * 10 * glitchIntensity;
      
      const chromaIdx = i % 12;
      const hue = CHROMA_HUES[chromaIdx];
      
      ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${0.3 * glitchIntensity})`;
      ctx.fillRect(barX, 0, barWidth, height);
    }
  }
  
  // CRT monitor corner vignette
  const vignetteGradient = ctx.createRadialGradient(width/2, height/2, Math.min(width, height) * 0.3, width/2, height/2, Math.max(width, height) * 0.7);
  vignetteGradient.addColorStop(0, 'transparent');
  vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Occasional "data corruption" text
  if (beatPulse > 0.5) {
    ctx.font = '10px monospace';
    ctx.fillStyle = `hsla(${dominantHue}, 80%, 70%, ${beatPulse * 0.8})`;
    const errorTexts = ['ERR', '0x00', '####', 'NULL', '???', 'SYNC'];
    for (let i = 0; i < 5; i++) {
      const seed = Math.sin(i * 1111.11 + Math.floor(time * 12));
      const x = ((seed + 1) / 2) * width;
      const y = ((Math.cos(i * 2222.22 + time) + 1) / 2) * height;
      ctx.fillText(errorTexts[i % errorTexts.length], x, y);
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
