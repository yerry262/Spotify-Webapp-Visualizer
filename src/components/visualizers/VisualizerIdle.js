/**
 * VisualizerIdle.js
 * Displays when no music is playing - gentle floating orbs animation
 * MATCHES test-runner.html drawIdleVisualization exactly
 */

/**
 * Draw the idle animation - shown when waiting for music
 * EXACT MATCH TO TEST-RUNNER
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} time - Current time in seconds
 */
export function drawIdleAnimation(ctx, width, height, time) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Draw subtle gradient background
  const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.6);
  bgGradient.addColorStop(0, 'rgba(29, 185, 84, 0.05)');
  bgGradient.addColorStop(1, 'rgba(10, 10, 15, 0)');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Floating orbs - EXACT MATCH TO TEST-RUNNER
  const numOrbs = 6;
  for (let i = 0; i < numOrbs; i++) {
    const angle = (i / numOrbs) * Math.PI * 2 + time * 0.3;
    const radius = 100 + Math.sin(time * 0.5 + i * 1.2) * 40;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius * 0.6;
    const orbSize = 10 + Math.sin(time * 0.8 + i) * 5;
    
    // Orb glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, orbSize * 4);
    gradient.addColorStop(0, 'rgba(29, 185, 84, 0.5)');
    gradient.addColorStop(0.4, 'rgba(29, 185, 84, 0.15)');
    gradient.addColorStop(1, 'rgba(29, 185, 84, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, orbSize * 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Orb core
    ctx.fillStyle = `rgba(29, 185, 84, ${0.7 + Math.sin(time + i) * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, orbSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Central breathing circle - EXACT MATCH TO TEST-RUNNER
  const breathe = Math.sin(time * 0.6) * 0.3 + 0.7;
  const centralSize = 50 * breathe;
  
  const centralGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, centralSize * 2.5);
  centralGradient.addColorStop(0, `rgba(29, 185, 84, ${0.35 * breathe})`);
  centralGradient.addColorStop(0.5, `rgba(29, 185, 84, ${0.12 * breathe})`);
  centralGradient.addColorStop(1, 'rgba(29, 185, 84, 0)');
  ctx.fillStyle = centralGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, centralSize * 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Outer rings - EXACT MATCH TO TEST-RUNNER
  for (let r = 0; r < 3; r++) {
    const ringSize = centralSize * (1 + r * 0.5) + Math.sin(time * 0.8 + r) * 10;
    const ringAlpha = (0.25 - r * 0.07) * breathe;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringSize, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(29, 185, 84, ${ringAlpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // "Waiting" text - EXACT MATCH TO TEST-RUNNER
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '14px "Orbitron", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Waiting for music...', centerX, height - 40);
}
