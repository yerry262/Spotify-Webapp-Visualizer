/**
 * VisualizerDownloading.js
 * Displays while downloading MP3 - data transfer animation
 * Themed consistently with Idle and Loading visualizers
 */

/**
 * Draw the downloading animation - shown while downloading MP3
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} time - Current time in seconds
 */
export function drawDownloadingAnimation(ctx, width, height, time) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Subtle pulsing background glow
  const pulseAlpha = 0.04 + Math.sin(time * 1.8) * 0.02;
  const bgGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.5);
  bgGlow.addColorStop(0, `rgba(29, 185, 84, ${pulseAlpha})`);
  bgGlow.addColorStop(1, 'rgba(10, 10, 15, 0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, width, height);
  
  // Data stream particles - flowing downward
  const numStreams = 8;
  for (let s = 0; s < numStreams; s++) {
    const angle = (s / numStreams) * Math.PI * 2;
    const baseX = centerX + Math.cos(angle) * 100;
    const baseY = centerY + Math.sin(angle) * 60;
    
    // Multiple particles per stream
    for (let p = 0; p < 5; p++) {
      const particleOffset = (time * 150 + p * 40) % 200;
      const x = baseX + Math.cos(angle) * particleOffset;
      const y = baseY + Math.sin(angle) * particleOffset;
      const size = 3 + Math.sin(time * 4 + s + p) * 1;
      const alpha = Math.max(0, 1 - particleOffset / 200);
      
      // Particle glow
      const particleGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      particleGlow.addColorStop(0, `rgba(29, 185, 84, ${alpha * 0.8})`);
      particleGlow.addColorStop(1, `rgba(29, 185, 84, 0)`);
      ctx.fillStyle = particleGlow;
      ctx.beginPath();
      ctx.arc(x, y, size * 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Particle core
      ctx.fillStyle = `rgba(29, 185, 84, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Central receiver - pulsing circle with rings
  const receivePulse = Math.sin(time * 4) * 0.2 + 0.8;
  const receiveRadius = 30 * receivePulse;
  
  // Outer glow
  const receiveGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, receiveRadius * 2);
  receiveGradient.addColorStop(0, `rgba(29, 185, 84, ${0.6 * receivePulse})`);
  receiveGradient.addColorStop(0.5, `rgba(29, 185, 84, ${0.3 * receivePulse})`);
  receiveGradient.addColorStop(1, 'rgba(29, 185, 84, 0)');
  ctx.fillStyle = receiveGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, receiveRadius * 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Core circle
  ctx.fillStyle = `rgba(29, 185, 84, ${0.8 + receivePulse * 0.2})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, receiveRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Download arrow icon in center
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.strokeStyle = `rgba(10, 10, 15, ${0.8 + Math.sin(time * 3) * 0.2})`;
  ctx.fillStyle = `rgba(10, 10, 15, ${0.8 + Math.sin(time * 3) * 0.2})`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Arrow shaft
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, 8);
  ctx.stroke();
  
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(-6, 2);
  ctx.lineTo(0, 8);
  ctx.lineTo(6, 2);
  ctx.fill();
  
  // Base line
  ctx.beginPath();
  ctx.moveTo(-10, 12);
  ctx.lineTo(10, 12);
  ctx.stroke();
  
  ctx.restore();
  
  // Spinning orbital rings
  const numRings = 3;
  for (let r = 0; r < numRings; r++) {
    const ringRadius = receiveRadius + 20 + r * 25;
    const spinSpeed = (r % 2 === 0 ? 1 : -1) * (1 + r * 0.3);
    const startAngle = time * spinSpeed;
    const arcLength = Math.PI * 0.4;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, startAngle, startAngle + arcLength);
    ctx.strokeStyle = `rgba(29, 185, 84, ${0.4 - r * 0.1})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Animated text with dots
  const dots = '.'.repeat(Math.floor(time * 2) % 4);
  ctx.fillStyle = '#1DB954';
  ctx.font = '16px "Orbitron", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Downloading MP3${dots}`, centerX, height - 50);
  
  // Progress bar
  const progressWidth = width * 0.4;
  const progressHeight = 6;
  const progressY = height - 30;
  const progressX = centerX - progressWidth / 2;
  
  // Background track
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
  
  // Animated fill (simulated progress)
  const fillProgress = (Math.sin(time * 0.8) * 0.5 + 0.5) * 0.7 + 0.2;
  const fillWidth = fillProgress * progressWidth;
  
  const fillGradient = ctx.createLinearGradient(progressX, 0, progressX + fillWidth, 0);
  fillGradient.addColorStop(0, 'rgba(29, 185, 84, 0.5)');
  fillGradient.addColorStop(0.5, 'rgba(29, 185, 84, 1)');
  fillGradient.addColorStop(1, 'rgba(29, 185, 84, 0.7)');
  ctx.fillStyle = fillGradient;
  ctx.fillRect(progressX, progressY, fillWidth, progressHeight);
  
  // Progress glow on leading edge
  const glowGradient = ctx.createRadialGradient(progressX + fillWidth, progressY + progressHeight / 2, 0, progressX + fillWidth, progressY + progressHeight / 2, 15);
  glowGradient.addColorStop(0, 'rgba(29, 185, 84, 0.8)');
  glowGradient.addColorStop(1, 'rgba(29, 185, 84, 0)');
  ctx.fillStyle = glowGradient;
  ctx.fillRect(progressX + fillWidth - 15, progressY - 10, 30, progressHeight + 20);
}
