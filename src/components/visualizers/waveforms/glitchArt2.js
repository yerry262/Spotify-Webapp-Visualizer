import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

let glitch2State = { sChroma: new Float32Array(12).fill(0), sBeat: 0, blocks: [], glitchActive: 0, lastScanlineShift: 0 };

/**
 * Glitched Art 2 🖥️ - The Cyber-Sequel. Deep data corruption, pixel shards, and temporal jitter.
 * Improved motion state, multi-axial displacement, and hue-cycle malfunctions.
 */
export function drawGlitchArt2Wave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;
  
  const settings = getEffectiveWaveformSettings('glitch_art_2');
  const intensity = (settings.maxAmplitude / 80) * (0.5 + beatPulse);
  
  // Update State
  const lerp = 0.15;
  glitch2State.sBeat += (beatPulse - glitch2State.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    glitch2State.sChroma[i] += (chroma[i] - glitch2State.sChroma[i]) * lerp;
  }
  
  // Dominant Mood
  let dominantIdx = 0;
  let maxV = 0;
  for (let i = 0; i < 12; i++) {
    if (glitch2State.sChroma[i] > maxV) {
      maxV = glitch2State.sChroma[i];
      dominantIdx = i;
    }
  }
  const baseHue = CHROMA_HUES[dominantIdx];

  ctx.save();
  
  // 1. Screen Shake / Temporal Jitter
  if (glitch2State.sBeat > 0.6) {
    const shakeX = (Math.random() - 0.5) * 40 * glitch2State.sBeat;
    const shakeY = (Math.random() - 0.5) * 20 * glitch2State.sBeat;
    ctx.translate(shakeX, shakeY);
    
    // RGB Split Overlay (Flash)
    if (Math.random() > 0.8) {
      ctx.fillStyle = `rgba(255, 0, 0, 0.1)`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // 2. Data Corruption Blocks (Background Layer)
  const numBlocks = 10 + Math.floor(glitch2State.sBeat * 20);
  for (let i = 0; i < numBlocks; i++) {
    const t = (time * 15 + i * 7) % 100;
    if (t < 5) { // Only manifest briefly
      const blockX = Math.random() * width;
      const blockY = Math.random() * height;
      const blockW = 20 + Math.random() * 200 * intensity;
      const blockH = 2 + Math.random() * 50 * intensity;
      
      const hue = (baseHue + Math.random() * 60 - 30 + 360) % 360;
      ctx.fillStyle = `hsla(${hue}, 90%, 50%, ${0.2 + Math.random() * 0.3})`;
      ctx.fillRect(blockX, blockY, blockW, blockH);
      
      // Horizontal "Scanline" spill from block
      if (Math.random() > 0.5) {
        ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.fillRect(0, blockY + blockH/2, width, 1);
      }
    }
  }

  // 3. Pixel Shards (Procedural Waveform)
  const numShards = 40;
  const shardWidth = width / numShards;
  
  for (let i = 0; i < numShards; i++) {
    const mIdx = Math.floor((i / numShards) * (mel?.length || 1));
    const mVal = mel ? (mel[mIdx] + 10) / 10 : 0.5;
    const cIdx = i % 12;
    const cVal = glitch2State.sChroma[cIdx];
    
    const x = i * shardWidth;
    const baseY = height * (settings.basePosition / 100);
    const h = (mVal * 150 + cVal * 100) * intensity;
    
    // Jitter shard X position
    const jitterX = Math.sin(time * 20 + i) * 10 * glitch2State.sBeat;
    
    // Draw Shard
    const hue = (CHROMA_HUES[cIdx] + time * 20) % 360;
    const grad = ctx.createLinearGradient(x, baseY - h, x, baseY + h);
    grad.addColorStop(0, `hsla(${hue}, 100%, 60%, 0)`);
    grad.addColorStop(0.5, `hsla(${hue}, 100%, 70%, ${0.6 + cVal * 0.4})`);
    grad.addColorStop(1, `hsla(${hue}, 100%, 60%, 0)`);
    
    ctx.fillStyle = grad;
    ctx.fillRect(x + jitterX, baseY - h, shardWidth - 2, h * 2);

    // Occasional "dead pixel" vertical line
    if (i % 7 === 0 && Math.random() > 0.95) {
        ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.4)`;
        ctx.fillRect(x + jitterX, 0, 1, height);
    }
  }

  // 4. Ghosting / Afterimage (Simple Simulated)
  if (glitch2State.sBeat > 0.7 && Math.random() > 0.5) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.3;
    const ghostOffset = 15;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(ghostOffset, 0, 2, height);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(-ghostOffset, 0, 2, height);
    ctx.restore();
  }

  // 5. Binary / Hex Static (Occasional Overlay)
  if (time % 2 > 1.8) {
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const hexChars = '0123456789ABCDEF';
    for(let j=0; j<10; j++) {
        const hx = Math.random() * width;
        const hy = Math.random() * height;
        const char = hexChars[Math.floor(Math.random()*hexChars.length)];
        ctx.fillText(char, hx, hy);
    }
  }

  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);
}
