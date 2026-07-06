import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

let lightningState = {
  sChroma: new Float32Array(12).fill(0),
  sMel: null,
  sBeat: 0,
  bolts: []
};

/**
 * Lightning Storm - Electric bolts that branch based on mel energy
 * Chroma controls bolt colors, mel controls branching intensity
 */
export function drawLightningWave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('lightning');
  const centerX = width / 2;
  const centerY = height * (settings.basePosition / 100);
  const maxTravel = height * (settings.maxAmplitude / 100);
  
  // Initialize state
  if (!lightningState.sMel || (mel && lightningState.sMel.length !== mel.length)) {
    lightningState.sMel = new Float32Array(mel ? mel.length : 1).fill(0);
  }

  // Smooth values
  const lerp = 0.12;
  lightningState.sBeat += (beatPulse - lightningState.sBeat) * lerp;
  for (let i = 0; i < 12; i++) {
    lightningState.sChroma[i] += (chroma[i] - lightningState.sChroma[i]) * lerp;
  }
  if (mel) {
    for (let i = 0; i < mel.length; i++) {
      lightningState.sMel[i] += (mel[i] - lightningState.sMel[i]) * lerp;
    }
  }

  const sChroma = lightningState.sChroma;
  const sBeat = lightningState.sBeat;
  const sMel = lightningState.sMel;

  // Manage persistent bolts
  const totalEnergy = sChroma.reduce((a, b) => a + b, 0) / 12;
  
  // Bolts strike OUT to the chroma node ring: beats fire mega-bolts at the
  // loudest notes, and any individually hot note draws its own arc
  const nodeAngle = (i) => (i / 12) * Math.PI * 2 - Math.PI / 2;
  if (sBeat > 0.6 && Math.random() < 0.3 + totalEnergy * 0.4 && lightningState.bolts.length < 18) {
    let idx = 0;
    for (let i = 1; i < 12; i++) if (sChroma[i] > sChroma[idx]) idx = i;
    lightningState.bolts.push({
      id: Math.random(),
      startTime: time,
      duration: 0.12 + Math.random() * 0.2,
      chromaIdx: idx,
      angle: nodeAngle(idx),
      startX: (Math.random() - 0.5) * 30,
      startY: (Math.random() - 0.5) * 30,
      mega: true,
      complexity: 3 + Math.floor(sChroma[idx] * 5)
    });
  }
  for (let i = 0; i < 12; i++) {
    if (sChroma[i] > 0.55 && Math.random() < sChroma[i] * 0.12 && lightningState.bolts.length < 18) {
      lightningState.bolts.push({
        id: Math.random(),
        startTime: time,
        duration: 0.08 + Math.random() * 0.15,
        chromaIdx: i,
        angle: nodeAngle(i) + (Math.random() - 0.5) * 0.2,
        startX: (Math.random() - 0.5) * 40,
        startY: (Math.random() - 0.5) * 40,
        mega: false,
        complexity: 2 + Math.floor(sChroma[i] * 4)
      });
    }
  }
  // Chain arcs: when two notes are hot at once, lightning jumps between
  // their nodes around the ring
  if (lightningState.bolts.length < 18 && Math.random() < 0.15 + sBeat * 0.2) {
    const hot = [];
    for (let i = 0; i < 12; i++) if (sChroma[i] > 0.45) hot.push(i);
    if (hot.length >= 2) {
      const a = hot[Math.floor(Math.random() * hot.length)];
      let b = hot[Math.floor(Math.random() * hot.length)];
      if (a !== b) {
        lightningState.bolts.push({
          id: Math.random(),
          startTime: time,
          duration: 0.1 + Math.random() * 0.12,
          chromaIdx: a,
          chainTo: b,
          mega: false,
          complexity: 3
        });
      }
    }
  }

  // Filter out dead bolts
  lightningState.bolts = lightningState.bolts.filter(b => time - b.startTime < b.duration);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.globalCompositeOperation = 'lighter';
  
  // Ambient radial flash on beats
  if (sBeat > 0.7) {
    const flashGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxTravel);
    flashGrad.addColorStop(0, `hsla(0, 0%, 100%, ${sBeat * 0.15})`);
    flashGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(0, 0, maxTravel, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chroma node ring: 12 storm nodes, one per note, glowing with intensity —
  // these are the strike targets, so the bolts read as connected to the music
  const ringR = maxTravel * 0.85;
  for (let i = 0; i < 12; i++) {
    const nx = Math.cos(nodeAngle(i)) * ringR;
    const ny = Math.sin(nodeAngle(i)) * ringR;
    const v = sChroma[i];
    const nodeR = 3 + v * 9 + sBeat * 3;
    ctx.shadowColor = `hsla(${CHROMA_HUES[i]}, 100%, 65%, 0.9)`;
    ctx.shadowBlur = 6 + v * 20;
    ctx.fillStyle = `hsla(${CHROMA_HUES[i]}, 90%, ${55 + v * 25}%, ${0.25 + v * 0.7})`;
    ctx.beginPath();
    ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Draw each active bolt
  lightningState.bolts.forEach(bolt => {
    const age = (time - bolt.startTime) / bolt.duration;
    const chromaValue = sChroma[bolt.chromaIdx];
    const hue = CHROMA_HUES[bolt.chromaIdx];

    let sx, sy, endX, endY;
    if (bolt.chainTo !== undefined) {
      // Chain arc: node-to-node along the ring
      sx = Math.cos(nodeAngle(bolt.chromaIdx)) * ringR;
      sy = Math.sin(nodeAngle(bolt.chromaIdx)) * ringR;
      endX = Math.cos(nodeAngle(bolt.chainTo)) * ringR;
      endY = Math.sin(nodeAngle(bolt.chainTo)) * ringR;
    } else {
      // Center strike out to the note's node; mega bolts hit the ring dead-on
      const mVal = (sMel[bolt.chromaIdx % sMel.length] + 15) / 15;
      const travel = bolt.mega ? ringR : ringR * mVal * (0.6 + Math.random() * 0.4);
      sx = bolt.startX; sy = bolt.startY;
      endX = Math.cos(bolt.angle) * travel;
      endY = Math.sin(bolt.angle) * travel;
    }

    drawBolt(ctx, sx, sy, endX, endY, hue, chromaValue + (bolt.mega ? 0.4 : 0), age, 0, bolt.mega ? 4 : 3);
  });

  ctx.restore();
  drawWaveLabels(ctx, width, height, chroma);

  // Recursive bolt drawing logic
  function drawBolt(ctx, x1, y1, x2, y2, hue, chromaValue, age, depth, maxDepth) {
    if (depth > maxDepth) return;
    
    const segments = 4 + Math.floor(chromaValue * 6);
    const points = [{ x: x1, y: y1 }];
    
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const bx = x1 + (x2 - x1) * t;
      const by = y1 + (y2 - y1) * t;
      
      // Jitter based on bolt age and depth
      const jitter = (1 - age) * 50 * (1 / (depth + 1));
      points.push({
        x: bx + (Math.random() - 0.5) * jitter,
        y: by + (Math.random() - 0.5) * jitter
      });
    }

    const alpha = (1 - age) * (0.9 - depth * 0.2);
    const lineWidth = (3 - depth * 0.7) * (0.6 + chromaValue);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Outer Glow
    ctx.shadowBlur = 12 * (1 - age);
    ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.9)`;
    ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${alpha})`;
    ctx.lineWidth = lineWidth;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // High-energy Core
    ctx.strokeStyle = `hsla(${hue}, 50%, 100%, ${alpha})`;
    ctx.lineWidth = lineWidth * 0.4;
    ctx.stroke();

    // Branching logic
    if (depth < maxDepth && Math.random() < 0.4 * (1 - depth * 0.2)) {
      const bAge = age + 0.05; 
      if (bAge < 1) {
        const branchAngle = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * 1.5;
        const branchLen = 40 + Math.random() * 60;
        const bx2 = points[points.length-1].x + Math.cos(branchAngle) * branchLen;
        const by2 = points[points.length-1].y + Math.sin(branchAngle) * branchLen;
        drawBolt(ctx, points[points.length-1].x, points[points.length-1].y, bx2, by2, 
                 (hue + 30) % 360, chromaValue, bAge, depth + 1, maxDepth);
      }
    }
  }
}
