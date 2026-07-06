import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Fractal Tree - Recursive branching trees that grow with mel energy
 * Each chroma value creates a tree that grows/shrinks with its intensity
 */
export function drawFractalTreeWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('fractal_tree');
  // basePosition controls where the ground/tree base is
  const groundY = height * (settings.basePosition / 100);
  // maxAmplitude controls tree height
  const maxTreeHeight = height * (settings.maxAmplitude / 100);
  const numTrees = 6;
  const treeSpacing = width / (numTrees + 1);
  
  for (let tree = 0; tree < numTrees; tree++) {
    const chromaIdx = (tree * 2) % 12;
    const chromaValue = chroma[chromaIdx] || 0.3;
    const hue = CHROMA_HUES[chromaIdx];
    
    const treeX = (tree + 1) * treeSpacing;
    const treeHeight = maxTreeHeight * (0.4 + chromaValue * 0.6) * (1 + beatPulse * 0.2);
    
    // Get mel for branching angle variation
    const melIdx = tree % (mel?.length || 1);
    const melValue = mel ? Math.max(0.2, Math.min(1, (mel[melIdx] + 10) / 10)) : 0.5;
    
    // Draw tree recursively
    drawBranch(ctx, treeX, groundY, -Math.PI / 2, treeHeight, hue, chromaValue, melValue, beatPulse, time, 0, 7);
  }
  
  function drawBranch(ctx, x, y, angle, length, hue, chromaValue, melValue, beatPulse, time, depth, maxDepth) {
    if (depth >= maxDepth || length < 3) return;
    
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;
    
    // Branch thickness decreases with depth
    const thickness = (maxDepth - depth) * 0.8 + chromaValue * 2;
    
    // Color shifts toward leaves at tips
    const depthHue = (hue + depth * 10) % 360;
    const lightness = 30 + depth * 5 + chromaValue * 15;
    const alpha = 0.6 + chromaValue * 0.4 - depth * 0.05;
    
    ctx.strokeStyle = `hsla(${depthHue}, 70%, ${lightness}%, ${alpha})`;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Glow for prominent branches
    if (depth < 3 && chromaValue > 0.4) {
      ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.4)`;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Calculate branch angles with sway
    const sway = Math.sin(time * 2 + depth * 0.5 + x * 0.01) * 0.1 * melValue;
    const spreadAngle = 0.4 + melValue * 0.3 + beatPulse * 0.1;
    const lengthRatio = 0.65 + chromaValue * 0.1;
    
    // Left branch
    drawBranch(ctx, endX, endY, angle - spreadAngle + sway, length * lengthRatio,
               hue, chromaValue * 0.9, melValue, beatPulse, time, depth + 1, maxDepth);
    
    // Right branch
    drawBranch(ctx, endX, endY, angle + spreadAngle + sway, length * lengthRatio,
               hue, chromaValue * 0.9, melValue, beatPulse, time, depth + 1, maxDepth);
    
    // Center branch for high energy
    if (melValue > 0.6 && depth < maxDepth - 2) {
      drawBranch(ctx, endX, endY, angle + sway * 2, length * lengthRatio * 0.8,
                 (hue + 30) % 360, chromaValue * 0.7, melValue, beatPulse, time, depth + 1, maxDepth);
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
