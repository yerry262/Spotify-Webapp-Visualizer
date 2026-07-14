/**
 * VisualizerWaiting.js
 * Displays while ANOTHER device is downloading or analyzing this track —
 * distinct from Searching/Downloading/Loading, which all mean "this device
 * is doing the work". Themed consistently with the other pipeline states.
 */

/**
 * Draw the waiting animation - shown while polling for another device
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} time - Current time in seconds
 * @param {'download'|'analysis'} kind - what the other device is doing
 */
export function drawWaitingAnimation(ctx, width, height, time, kind) {
  const centerX = width / 2;
  const centerY = height / 2;

  // Subtle pulsing background glow (calmer than the active states)
  const pulseAlpha = 0.03 + Math.sin(time * 1.2) * 0.015;
  const bgGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.5);
  bgGlow.addColorStop(0, `rgba(29, 185, 84, ${pulseAlpha})`);
  bgGlow.addColorStop(1, 'rgba(10, 10, 15, 0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, width, height);

  // Two orbiting nodes representing "another device" handing off to "you"
  const orbitRadius = 55;
  const orbitSpeed = 0.8;
  for (let i = 0; i < 2; i++) {
    const angle = time * orbitSpeed + i * Math.PI;
    const x = centerX + Math.cos(angle) * orbitRadius;
    const y = centerY + Math.sin(angle) * orbitRadius * 0.5;
    const pulse = 0.6 + Math.sin(time * 2 + i * Math.PI) * 0.3;

    const glow = ctx.createRadialGradient(x, y, 0, x, y, 18);
    glow.addColorStop(0, `rgba(29, 185, 84, ${0.7 * pulse})`);
    glow.addColorStop(1, 'rgba(29, 185, 84, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(29, 185, 84, ${0.8 * pulse})`;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Connecting arc between the two nodes, slowly rotating
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(time * orbitSpeed * 0.3);
  ctx.beginPath();
  ctx.ellipse(0, 0, orbitRadius, orbitRadius * 0.5, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(29, 185, 84, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Central hourglass-ish pulse
  const breathe = Math.sin(time * 1.5) * 0.25 + 0.6;
  const centralSize = 22 * breathe;
  const centralGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, centralSize * 2);
  centralGradient.addColorStop(0, `rgba(29, 185, 84, ${0.3 * breathe})`);
  centralGradient.addColorStop(1, 'rgba(29, 185, 84, 0)');
  ctx.fillStyle = centralGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, centralSize * 2, 0, Math.PI * 2);
  ctx.fill();

  // Honest status text - names the OTHER device, not this one
  const label = kind === 'analysis'
    ? 'Another device is analyzing this track'
    : 'Another device is downloading this track';
  const dots = '.'.repeat(Math.floor(time * 2) % 4);

  ctx.fillStyle = '#1DB954';
  ctx.font = '16px "Orbitron", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${label}${dots}`, centerX, height - 50);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '12px "Orbitron", monospace';
  ctx.fillText('Waiting to sync — no need to do this twice', centerX, height - 30);
}
