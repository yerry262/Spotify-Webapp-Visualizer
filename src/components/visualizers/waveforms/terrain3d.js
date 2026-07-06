import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Soundwave Terrain 🏔️ - 3D perspective terrain that rises with mel frequencies
 * Like viewing sound as a mountain landscape from above
 */
export function drawTerrain3DWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('terrain_3d');
  // basePosition controls where the ground/terrain sits
  const groundY = height * (settings.basePosition / 100);
  // maxAmplitude controls the height of the terrain peaks
  const terrainHeight = height * (settings.maxAmplitude / 100);
  const horizonY = groundY - terrainHeight;
  const numRows = 25;
  const numCols = 30;
  
  // Find dominant chroma for sun color
  let dominantIdx = 0;
  let maxChromaVal = 0;
  for (let i = 0; i < 12; i++) {
    if ((chroma[i] || 0) > maxChromaVal) {
      maxChromaVal = chroma[i];
      dominantIdx = i;
    }
  }
  const dominantHue = CHROMA_HUES[dominantIdx];
  
  // Draw background sky gradient first
  const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY + 50);
  skyGradient.addColorStop(0, `hsla(${dominantHue}, 40%, 15%, 0.6)`);
  skyGradient.addColorStop(0.7, `hsla(${dominantHue}, 60%, 30%, 0.4)`);
  skyGradient.addColorStop(1, `hsla(${dominantHue}, 70%, 50%, 0.3)`);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, horizonY + 50);
  
  // Sun/moon at horizon
  const sunX = width / 2;
  const sunY = horizonY;
  const sunRadius = 40 + beatPulse * 15;
  
  const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2.5);
  sunGradient.addColorStop(0, `hsla(${dominantHue}, 50%, 95%, 0.9)`);
  sunGradient.addColorStop(0.2, `hsla(${dominantHue}, 60%, 80%, 0.7)`);
  sunGradient.addColorStop(0.5, `hsla(${dominantHue}, 70%, 60%, 0.3)`);
  sunGradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = sunGradient;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Store terrain points for rendering
  const points = [];
  
  for (let row = 0; row < numRows; row++) {
    const rowPoints = [];
    const rowT = row / (numRows - 1);
    const y = horizonY + (groundY - horizonY) * rowT;
    
    // Perspective scaling - closer rows are wider
    const perspectiveScale = 0.2 + rowT * 0.8;
    const rowWidth = width * perspectiveScale;
    const startX = (width - rowWidth) / 2;
    
    for (let col = 0; col < numCols; col++) {
      const colT = col / (numCols - 1);
      const x = startX + colT * rowWidth;
      
      // Get mel value for terrain height
      const melIdx = mel ? Math.floor(colT * mel.length) : 0;
      const melValue = mel && mel[melIdx] !== undefined ? Math.max(0, (mel[melIdx] + 10) / 10) : 0.3;
      
      // Get chroma for coloring
      const chromaIdx = Math.floor(colT * 11.99);
      const chromaValue = chroma[chromaIdx] || 0.3;
      
      // Wave effect moving through terrain
      const waveOffset = Math.sin(colT * Math.PI * 3 + time * 1.5 - rowT * 4) * 0.25;
      const beatWave = Math.sin(colT * Math.PI * 2 + time * 3) * beatPulse * 0.2;
      
      // Height calculation - scale down for far rows
      const heightMultiplier = 60 * perspectiveScale;
      const terrainHeight = Math.max(0, (melValue + waveOffset + beatWave)) * heightMultiplier;
      const finalY = y - terrainHeight;
      
      rowPoints.push({
        x,
        y: finalY,
        baseY: y,
        melValue,
        chromaIdx,
        chromaValue,
        perspectiveScale
      });
    }
    points.push(rowPoints);
  }
  
  // Draw terrain from back to front (far rows first)
  for (let row = 0; row < numRows - 1; row++) {
    const rowT = row / numRows;
    
    for (let col = 0; col < numCols - 1; col++) {
      const p1 = points[row][col];
      const p2 = points[row][col + 1];
      const p3 = points[row + 1][col + 1];
      const p4 = points[row + 1][col];
      
      // Average values for this quad
      const avgMel = (p1.melValue + p2.melValue + p3.melValue + p4.melValue) / 4;
      const avgChromaValue = (p1.chromaValue + p2.chromaValue + p3.chromaValue + p4.chromaValue) / 4;
      const hue = CHROMA_HUES[p1.chromaIdx] || 0;
      
      // Calculate brightness based on height
      const avgHeight = (p1.y + p2.y + p3.y + p4.y) / 4;
      const normalizedHeight = 1 - (avgHeight - horizonY) / (groundY - horizonY);
      
      // Color based on height and chroma
      const lightness = 25 + avgMel * 35 + normalizedHeight * 20;
      const saturation = 60 + avgChromaValue * 30;
      const alpha = 0.6 + avgChromaValue * 0.3 + rowT * 0.1;
      
      // Fill quad
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      
      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.fill();
      
      // Grid lines for wireframe effect on active notes
      if (avgChromaValue > 0.4) {
        ctx.strokeStyle = `hsla(${hue}, ${saturation + 20}%, ${lightness + 25}%, ${alpha * 0.6})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }
  
  // Reflection bars under sun
  for (let i = 0; i < 6; i++) {
    const reflectY = horizonY + 10 + i * 6;
    const reflectAlpha = 0.4 - i * 0.06;
    const reflectWidth = 60 - i * 8;
    ctx.fillStyle = `hsla(${dominantHue}, 60%, 80%, ${reflectAlpha})`;
    ctx.fillRect(sunX - reflectWidth / 2, reflectY, reflectWidth, 2);
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
