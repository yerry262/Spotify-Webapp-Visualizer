import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * Heartbeat ECG - Medical monitor style with beat-reactive spikes
 * Uses chroma for line colors and mel frequencies for ECG complexity
 */
export function drawHeartbeatWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('heartbeat');
  // basePosition controls vertical center of the ECG lines
  const centerY = height * (settings.basePosition / 100);
  // maxAmplitude controls the height of the ECG spikes
  const maxAmplitude = height * (settings.maxAmplitude / 100);
  const scrollSpeed = 100; // pixels per second
  
  // Sort chroma for layering
  const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.1) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const yOffset = (chromaIdx - 5.5) * 3;
    const phaseOffset = chromaIdx * 0.3;
    
    ctx.beginPath();
    ctx.lineWidth = 1.5 + chromaValue * 2;
    
    const numPoints = 150;
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = t * width;
      
      // Scrolling position in the ECG cycle
      const scrollPos = (time * scrollSpeed / width + t + phaseOffset) % 1;
      
      // Get mel for this position
      let melValue = 0.3;
      if (mel && mel.length > 0) {
        const melIdx = Math.floor(t * mel.length);
        melValue = Math.max(0.1, Math.min(1, (mel[melIdx] + 10) / 10));
      }
      
      // ECG waveform shape - QRS complex
      let ecgValue = 0;
      const cyclePos = (scrollPos * 4) % 1; // 4 beats per screen width
      
      if (cyclePos < 0.1) {
        // P wave (small bump)
        ecgValue = Math.sin(cyclePos / 0.1 * Math.PI) * 0.15;
      } else if (cyclePos < 0.15) {
        // Flat
        ecgValue = 0;
      } else if (cyclePos < 0.18) {
        // Q dip
        ecgValue = -0.1 * ((cyclePos - 0.15) / 0.03);
      } else if (cyclePos < 0.22) {
        // R spike (main peak)
        const rPos = (cyclePos - 0.18) / 0.04;
        ecgValue = rPos < 0.5 ? rPos * 2 : (1 - rPos) * 2;
        ecgValue *= 1 + beatPulse * 0.5; // React to actual beats
      } else if (cyclePos < 0.26) {
        // S dip
        ecgValue = -0.2 * (1 - (cyclePos - 0.22) / 0.04);
      } else if (cyclePos < 0.45) {
        // T wave (recovery bump)
        const tPos = (cyclePos - 0.26) / 0.19;
        ecgValue = Math.sin(tPos * Math.PI) * 0.25;
      }
      
      // Scale by chroma and mel
      const amplitude = maxAmplitude * (0.3 + chromaValue * 0.7) * (0.5 + melValue * 0.5);
      const y = centerY + yOffset - ecgValue * amplitude;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    const alpha = 0.5 + chromaValue * 0.4;
    ctx.strokeStyle = `hsla(${hue}, 90%, ${50 + chromaValue * 20}%, ${alpha})`;
    
    // Glow effect
    if (chromaValue > 0.3) {
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.6)`;
      ctx.shadowBlur = 8 * chromaValue;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  // Grid lines for medical monitor effect
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, height * 0.2);
    ctx.lineTo(x, height * 0.95);
    ctx.stroke();
  }
  for (let y = height * 0.2; y < height * 0.95; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
