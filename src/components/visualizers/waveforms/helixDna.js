import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

/**
 * DNA Helix - Double helix with chroma-colored strands that twist and pulse
 */
export function drawHelixDNAWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('helix_dna');
  const centerY = height * (settings.basePosition / 200);
  const maxAmplitude = height * (settings.maxAmplitude / 100) * 0.6;
  const numPoints = 80;
  const rotationSpeed = 2;
  const twistFrequency = 3;
  
  // Calculate total chroma energy for glow intensity
  const totalEnergy = chroma.reduce((a, b) => a + b, 0) / 12;
  
  // Draw connecting rungs first (behind strands)
  for (let i = 0; i < numPoints; i++) {
    const t = i / numPoints;
    const x = t * width;
    const phase = t * Math.PI * twistFrequency * 2 + time * rotationSpeed;
    
    // Get mel for local variation
    let melInfluence = 0.5;
    if (mel && mel.length > 0) {
      const melIdx = Math.floor(t * mel.length);
      melInfluence = Math.max(0.3, Math.min(1, (mel[melIdx] + 10) / 10));
    }
    
    const amplitude = maxAmplitude * (0.7 + melInfluence * 0.3) * (1 + beatPulse * 0.3);
    const y1 = centerY + Math.sin(phase) * amplitude;
    const y2 = centerY + Math.sin(phase + Math.PI) * amplitude;
    
    // Draw rung between strands at intervals
    if (i % 4 === 0) {
      const chromaIdx = Math.floor(t * 12);
      const chromaValue = chroma[chromaIdx] || 0.3;
      const hue = CHROMA_HUES[chromaIdx];

      // Replication pulse: a bright wave sweeps down the helix, supercharged
      // by beats — rungs flash sequencer-style as it passes them
      const pulsePos = (time * 0.35) % 1.3;
      const pulseProximity = Math.max(0, 1 - Math.abs(t - pulsePos) * 6);
      const pulseBoost = pulseProximity * (0.5 + beatPulse);

      const alpha = 0.3 + chromaValue * 0.4 + pulseBoost * 0.5;
      ctx.strokeStyle = `hsla(${hue}, ${70 + pulseBoost * 30}%, ${50 + pulseBoost * 35}%, ${Math.min(1, alpha)})`;
      ctx.lineWidth = 2 + chromaValue * 2 + pulseBoost * 3;
      if (pulseBoost > 0.3) {
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.9)`;
        ctx.shadowBlur = pulseBoost * 18;
      }
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  
  // Draw two DNA strands
  for (let strand = 0; strand < 2; strand++) {
    const strandPhase = strand * Math.PI;
    
    // Sort and draw 12 chroma layers for each strand
    const sortedIndices = [...Array(12).keys()].sort((a, b) => chroma[a] - chroma[b]);
    
    for (const chromaIdx of sortedIndices) {
      const chromaValue = chroma[chromaIdx] || 0;
      if (chromaValue < 0.1) continue;
      
      const hue = CHROMA_HUES[chromaIdx];
      const layerOffset = (chromaIdx / 12) * 0.3;
      
      ctx.beginPath();
      ctx.lineWidth = 2 + chromaValue * 3;
      
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const x = t * width;
        const phase = t * Math.PI * twistFrequency * 2 + time * rotationSpeed + strandPhase + layerOffset;
        
        let melInfluence = 0.5;
        if (mel && mel.length > 0) {
          const melIdx = Math.floor(t * mel.length);
          melInfluence = Math.max(0.3, Math.min(1, (mel[melIdx] + 10) / 10));
        }
        
        const amplitude = maxAmplitude * (0.5 + chromaValue * 0.5) * (0.7 + melInfluence * 0.3) * (1 + beatPulse * 0.3);
        const y = centerY + Math.sin(phase) * amplitude;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      const alpha = 0.4 + chromaValue * 0.5;
      ctx.strokeStyle = `hsla(${hue}, 85%, ${50 + chromaValue * 20}%, ${alpha})`;
      
      if (chromaValue > 0.4) {
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.7)`;
        // Glow intensity scales with total chroma energy: quiet passages
        // glow softly, full-band moments blaze
        ctx.shadowBlur = (6 + totalEnergy * 14) * chromaValue;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  // Nucleotide orbs: strong notes materialize as glowing beads riding the
  // strands, popping bigger on the beat
  const pulsePos = (time * 0.35) % 1.3;
  for (let i = 0; i < numPoints; i += 5) {
    const t = i / numPoints;
    const chromaIdx = Math.floor(t * 12);
    const chromaValue = chroma[chromaIdx] || 0;
    if (chromaValue < 0.5) continue;

    const x = t * width;
    for (let strand = 0; strand < 2; strand++) {
      const phase = t * Math.PI * twistFrequency * 2 + time * rotationSpeed + strand * Math.PI;
      const amplitude = maxAmplitude * (0.7 + 0.3) * (1 + beatPulse * 0.3);
      const y = centerY + Math.sin(phase) * amplitude;
      const hue = CHROMA_HUES[chromaIdx];
      const nearPulse = Math.max(0, 1 - Math.abs(t - pulsePos) * 6);
      const orbR = (2 + chromaValue * 4) * (1 + beatPulse * 0.5 + nearPulse * 0.8);

      ctx.shadowColor = `hsla(${hue}, 100%, 65%, 0.9)`;
      ctx.shadowBlur = 8 + chromaValue * 12;
      ctx.fillStyle = `hsla(${hue}, 95%, ${65 + nearPulse * 20}%, ${0.5 + chromaValue * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, orbR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;

  drawWaveLabels(ctx, width, height, chroma);
}
