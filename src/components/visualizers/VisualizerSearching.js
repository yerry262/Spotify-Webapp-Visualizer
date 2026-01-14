/**
 * VisualizerSearching.js
 * Displays while searching YouTube for MP3 - radar scanning animation
 * Themed consistently with Idle and Loading visualizers
 */

/**
 * Draw the searching animation - shown while searching YouTube
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} time - Current time in seconds
 */
export function drawSearchingAnimation(ctx, width, height, time) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Subtle pulsing background glow
  const pulseAlpha = 0.04 + Math.sin(time * 1.5) * 0.02;
  const bgGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.5);
  bgGlow.addColorStop(0, `rgba(29, 185, 84, ${pulseAlpha})`);
  bgGlow.addColorStop(1, 'rgba(10, 10, 15, 0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, width, height);
  
  // Concentric radar rings
  const numRings = 5;
  for (let r = 0; r < numRings; r++) {
    const radius = 40 + r * 40 + (time * 30) % 40;
    const alpha = Math.max(0, 0.5 - r * 0.1 - ((time * 30) % 40) / 60);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(29, 185, 84, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Rotating radar sweep
  const sweepAngle = time * 2;
  const sweepLength = 180;
  
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, sweepLength);
  gradient.addColorStop(0, 'rgba(29, 185, 84, 0.6)');
  gradient.addColorStop(0.7, 'rgba(29, 185, 84, 0.2)');
  gradient.addColorStop(1, 'rgba(29, 185, 84, 0)');
  
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(sweepAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(sweepLength, 0);
  ctx.arc(0, 0, sweepLength, 0, Math.PI / 3);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
  
  // Search "blips" - moving dots on the radar
  const numBlips = 8;
  for (let i = 0; i < numBlips; i++) {
    const blipAngle = (i / numBlips) * Math.PI * 2 + time * 0.5;
    const blipDist = 60 + Math.sin(time * 1.2 + i) * 80;
    const x = centerX + Math.cos(blipAngle) * blipDist;
    const y = centerY + Math.sin(blipAngle) * blipDist;
    const blipSize = 3 + Math.sin(time * 3 + i) * 1;
    
    // Blip glow
    const blipGlow = ctx.createRadialGradient(x, y, 0, x, y, blipSize * 4);
    blipGlow.addColorStop(0, 'rgba(29, 185, 84, 0.8)');
    blipGlow.addColorStop(1, 'rgba(29, 185, 84, 0)');
    ctx.fillStyle = blipGlow;
    ctx.beginPath();
    ctx.arc(x, y, blipSize * 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Blip core
    ctx.fillStyle = 'rgba(29, 185, 84, 1)';
    ctx.beginPath();
    ctx.arc(x, y, blipSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Central pulse
  const pulse = Math.sin(time * 3) * 0.3 + 0.7;
  const centralRadius = 15 * pulse;
  
  const centralGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, centralRadius * 2);
  centralGradient.addColorStop(0, `rgba(29, 185, 84, ${0.9 * pulse})`);
  centralGradient.addColorStop(0.5, `rgba(29, 185, 84, ${0.4 * pulse})`);
  centralGradient.addColorStop(1, 'rgba(29, 185, 84, 0)');
  ctx.fillStyle = centralGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, centralRadius * 2, 0, Math.PI * 2);
  ctx.fill();
  
  // YouTube icon hint (stylized play button)
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + Math.sin(time * 2) * 0.2})`;
  ctx.beginPath();
  ctx.moveTo(-5, -8);
  ctx.lineTo(-5, 8);
  ctx.lineTo(8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  
  // Animated text with dots
  const dots = '.'.repeat(Math.floor(time * 2) % 4);
  ctx.fillStyle = '#1DB954';
  ctx.font = '16px "Orbitron", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Searching YouTube${dots}`, centerX, height - 50);
  
  // Subtle progress indicator
  const progressWidth = width * 0.3;
  const progressY = height - 30;
  const progressX = centerX - progressWidth / 2;
  
  // Animated scanning line
  const scanPos = (time * 0.5) % 1;
  const scanX = progressX + scanPos * progressWidth;
  
  ctx.fillStyle = 'rgba(29, 185, 84, 0.3)';
  ctx.fillRect(progressX, progressY, progressWidth, 2);
  
  const scanGradient = ctx.createRadialGradient(scanX, progressY, 0, scanX, progressY, 20);
  scanGradient.addColorStop(0, 'rgba(29, 185, 84, 1)');
  scanGradient.addColorStop(1, 'rgba(29, 185, 84, 0)');
  ctx.fillStyle = scanGradient;
  ctx.fillRect(scanX - 20, progressY - 5, 40, 12);
}
