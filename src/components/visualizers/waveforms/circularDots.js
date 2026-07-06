import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

// --- CIRCULAR DOTS STATE ---
let circularDotsState = {
  smoothedChroma: new Array(12).fill(0),
  smoothedMel: [],
  smoothedBeat: 0,
  lastTime: 0
};

export function drawCircularDotsWave(ctx, width, height, chroma, mel, beatPulse, time) {
  if (!chroma || chroma.length !== 12) return;

  if (!circularDotsState.lastTime) circularDotsState.lastTime = time;
  circularDotsState.lastTime = time;

  // Smoothing audio data
  circularDotsState.smoothedBeat += (beatPulse - circularDotsState.smoothedBeat) * 0.12;
  for (let i = 0; i < 12; i++) {
    circularDotsState.smoothedChroma[i] += ((chroma[i] || 0) - circularDotsState.smoothedChroma[i]) * 0.1;
  }
  
  if (mel && mel.length > 0) {
    if (circularDotsState.smoothedMel.length !== mel.length) {
      circularDotsState.smoothedMel = [...mel];
    } else {
      for (let i = 0; i < mel.length; i++) {
        circularDotsState.smoothedMel[i] += (mel[i] - circularDotsState.smoothedMel[i]) * 0.1;
      }
    }
  }

  const settings = getEffectiveWaveformSettings('circular_dots');
  const centerY = height * (settings.basePosition / 100);
  const maxAmplitude = height * (settings.maxAmplitude / 100);
  const numDots = 50; // Increased for smoother lines
  
  const sChroma = circularDotsState.smoothedChroma;
  const sMel = circularDotsState.smoothedMel;
  const sBeat = circularDotsState.smoothedBeat;

  // Sort chroma (draw quieter first)
  const sortedIndices = [...Array(12).keys()].sort((a, b) => sChroma[a] - sChroma[b]);
  
  for (const chromaIdx of sortedIndices) {
    const chromaValue = sChroma[chromaIdx];
    if (chromaValue < 0.05) continue;
    
    const hue = CHROMA_HUES[chromaIdx];
    const yOffset = (chromaIdx - 5.5) * (maxAmplitude * 0.05);
    const speed = 1.2 + chromaIdx * 0.08;
    const phaseOffset = chromaIdx * 0.5;
    
    for (let i = 0; i < numDots; i++) {
      const t = i / numDots;
      const x = t * width;
      
      // Get mel for local variation
      let melInfluence = 0.5;
      if (sMel && sMel.length > 0) {
        const melIdx = Math.floor(t * sMel.length);
        melInfluence = Math.max(0.3, Math.min(1, (sMel[melIdx] + 10) / 10));
      }
      
      // Wave with phase offset
      const wave = Math.sin(t * Math.PI * 3.5 + time * speed + phaseOffset);
      const y = centerY + yOffset + wave * chromaValue * maxAmplitude * 0.4 * melInfluence * (1 + sBeat * 0.4);
      
      // Size reflects audio intensity
      const size = (1.2 + chromaValue * 4 + melInfluence * 2) * settings.maxAmplitude / 50;
      const alpha = 0.3 + chromaValue * 0.6;
      const lightness = 45 + chromaValue * 25;
      
      // Gradient fill for 3D glow effect
      const dotGradient = ctx.createRadialGradient(x - size * 0.25, y - size * 0.25, 0, x, y, size);
      dotGradient.addColorStop(0, `hsla(${hue}, 90%, ${lightness + 20}%, ${alpha})`);
      dotGradient.addColorStop(0.4, `hsla(${hue}, 85%, ${lightness}%, ${alpha * 0.8})`);
      dotGradient.addColorStop(1, `hsla(${hue}, 80%, ${lightness - 15}%, 0)`);
      
      ctx.fillStyle = dotGradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Add a tiny spark in the center for high energy
      if (chromaValue > 0.6 && sBeat > 0.5) {
        ctx.fillStyle = `hsla(${hue}, 100%, 95%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  drawWaveLabels(ctx, width, height, chroma);
}
