import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Matrix Rain - Falling digital rain with chroma colors
 */
export function drawMatrixRainWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('matrix_rain');
  const baseY = height * (settings.basePosition / 100);
  const dropHeight = height * (settings.maxAmplitude / 100);
  
  // Dynamic columns based on window width - one column every 30 pixels
  const windowWidth = window.innerWidth;
  const numColumns = Math.floor(windowWidth / 30);
  const columnWidth = width / numColumns;
  
  
  // Characters for matrix effect
  const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  
  for (let col = 0; col < numColumns; col++) {
    const t = col / numColumns;
    const x = col * columnWidth + columnWidth / 2;
    
    // Map to chroma for color
    const chromaIdx = Math.floor(t * 12);
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    // Get mel for drop speed and intensity
    let melValue = 0.4;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(t * mel.length);
      melValue = Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    
    // Unique phase for each column
    const columnPhase = col * 0.7;
    const dropSpeed = (2 + melValue * 3 + beatPulse * 2) * .2;
    const dropPos = ((time * dropSpeed + columnPhase) % 2) / 2; // 0 to 1 cycling
    
    // Number of characters in the drop
    const numChars = Math.floor(5 + chromaValue * 8 + melValue * 5);
    
    for (let char = 0; char < numChars; char++) {
      const charProgress = char / numChars;
      const y = baseY - dropHeight + (dropPos + charProgress * 0.3) * dropHeight * 1.3;
      
      // Wrap around
      const wrappedY = ((y - (baseY - dropHeight)) % dropHeight) + (baseY - dropHeight);
      
      // Skip if outside visible area
      if (wrappedY < baseY - dropHeight || wrappedY > baseY + 20) continue;
      
      // Fade based on position in drop (head is bright, tail fades)
      const alpha = (1 - charProgress) * (0.4 + chromaValue * 0.5) * (0.7 + melValue * 0.3);
      const lightness = 50 + (1 - charProgress) * 30;
      
      // Random character (changes occasionally)
      const charIndex = Math.floor((time * 0.5 + col * 0.3 + char * 0.2) * 10) % matrixChars.length;
      const displayChar = matrixChars[charIndex];
      
      ctx.fillStyle = `hsla(${hue}, 90%, ${lightness}%, ${alpha})`;
      ctx.font = `bold ${10 + chromaValue * 4}px monospace`;
      ctx.textAlign = 'center';
      
      // Glow for head of drop
      if (char === 0 && chromaValue > 0.3) {
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.9)`;
        ctx.shadowBlur = 10;
      }
      
      ctx.fillText(displayChar, x, wrappedY);
      ctx.shadowBlur = 0;
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
