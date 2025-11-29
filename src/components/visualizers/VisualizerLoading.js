/**
 * VisualizerLoading.js
 * Displays while audio is being analyzed - spinning rings animation
 * MATCHES test-runner.html drawLoadingVisualization exactly
 */

/**
 * Draw the loading animation - shown while analyzing audio
 * EXACT MATCH TO TEST-RUNNER
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} time - Current time in seconds
 */
export function drawLoadingAnimation(ctx, width, height, time) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Subtle pulsing background glow - EXACT MATCH TO TEST-RUNNER
  const pulseAlpha = 0.03 + Math.sin(time * 2) * 0.02;
  const bgGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.5);
  bgGlow.addColorStop(0, `rgba(29, 185, 84, ${pulseAlpha})`);
  bgGlow.addColorStop(1, 'rgba(10, 10, 15, 0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, width, height);
  
  // Multiple spinning rings - EXACT MATCH TO TEST-RUNNER
  const numRings = 4;
  for (let r = 0; r < numRings; r++) {
    const radius = 50 + r * 35;
    const speed = (r % 2 === 0 ? 1 : -1) * (1.5 - r * 0.2);
    const startAngle = time * speed;
    const arcLength = Math.PI * (0.6 + r * 0.15);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + arcLength);
    
    const hue = 140 + r * 15;
    const alpha = 0.7 - r * 0.1;
    ctx.strokeStyle = `hsla(${hue}, 80%, 55%, ${alpha})`;
    ctx.lineWidth = 4 - r * 0.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';
    
    // Ring glow
    ctx.shadowColor = `hsla(${hue}, 80%, 55%, 0.5)`;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  // Central spinning dot cluster - EXACT MATCH TO TEST-RUNNER
  const numDots = 8;
  for (let i = 0; i < numDots; i++) {
    const angle = (i / numDots) * Math.PI * 2 + time * 3;
    const dotRadius = 30;
    const x = centerX + Math.cos(angle) * dotRadius;
    const y = centerY + Math.sin(angle) * dotRadius;
    const dotSize = 4 + Math.sin(time * 4 + i) * 2;
    
    ctx.fillStyle = `rgba(29, 185, 84, ${0.6 + Math.sin(time * 3 + i) * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Animated dots text - EXACT MATCH TO TEST-RUNNER
  const dots = '.'.repeat(Math.floor(time * 2) % 4);
  ctx.fillStyle = '#1DB954';
  ctx.font = '16px "Orbitron", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Analyzing Audio${dots}`, centerX, height - 50);
  
  // Progress bar style indicator - EXACT MATCH TO TEST-RUNNER
  const progressWidth = width * 0.4;
  const progressHeight = 4;
  const progressY = height - 30;
  const progressX = centerX - progressWidth / 2;
  
  // Background track
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
  
  // Animated fill
  const fillWidth = (Math.sin(time * 1.5) * 0.5 + 0.5) * progressWidth;
  const gradient = ctx.createLinearGradient(progressX, 0, progressX + progressWidth, 0);
  gradient.addColorStop(0, 'rgba(29, 185, 84, 0.3)');
  gradient.addColorStop(0.5, 'rgba(29, 185, 84, 0.8)');
  gradient.addColorStop(1, 'rgba(29, 185, 84, 0.3)');
  ctx.fillStyle = gradient;
  ctx.fillRect(progressX, progressY, fillWidth, progressHeight);
}
