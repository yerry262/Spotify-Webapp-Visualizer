import { CHROMA_HUES, drawWaveLabels } from '../waveformCore';

/**
 * Matrix Rain 2 - Layered digital rain with parallax depth, glowing white
 * heads, beat-driven drop bursts, and glitch flickers on hard hits.
 * Keeps per-drop state; time deltas are clamped so seeks don't explode it.
 */
const MATRIX2_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンΞΣΦΨΩ∆<>/\\{}[]=+*#';

const MATRIX2_LAYERS = [
  { fontSize: 11, speed: 0.55, alpha: 0.35, colStride: 22 },
  { fontSize: 15, speed: 0.85, alpha: 0.65, colStride: 30 },
  { fontSize: 21, speed: 1.25, alpha: 1.0,  colStride: 42 },
];

let matrix2State = null;

function matrix2NewDrop(rng, numCols, above) {
  return {
    col: Math.floor(rng() * numCols),
    y: above ? -rng() * 1.2 : rng() * 1.2 - 0.2,
    speed: 0.35 + rng() * 0.65,
    len: 8 + Math.floor(rng() * 16),
    seed: rng() * 1000,
  };
}

export function drawMatrixRain2Wave(ctx, width, height, chroma, mel, beatPulse, time) {
  const rng = Math.random;
  if (!matrix2State || matrix2State.width !== width) {
    matrix2State = {
      width,
      lastTime: time,
      lastBeat: 0,
      layers: MATRIX2_LAYERS.map(cfg => {
        const numCols = Math.max(4, Math.floor(width / cfg.colStride));
        const count = Math.floor(numCols * 1.4);
        return { numCols, drops: Array.from({ length: count }, () => matrix2NewDrop(rng, numCols, false)) };
      }),
    };
  }
  const state = matrix2State;
  const dt = Math.min(Math.max(time - state.lastTime, 0), 0.1);
  state.lastTime = time;

  // Rising beat edge spawns a burst of fast drops on the near layer
  const beatEdge = beatPulse > 0.6 && state.lastBeat <= 0.6;
  state.lastBeat = beatPulse;
  if (beatEdge) {
    const near = state.layers[2];
    for (let i = 0; i < 6; i++) {
      const d = matrix2NewDrop(rng, near.numCols, true);
      d.speed = 0.9 + rng() * 0.5;
      near.drops.push(d);
    }
  }

  // Average mel energy drives global rain speed
  let energy = 0.5;
  if (mel && mel.length > 0) {
    let sum = 0;
    for (let i = 0; i < mel.length; i++) sum += Math.max(0.1, Math.min(1, (mel[i] + 10) / 10));
    energy = sum / mel.length;
  }
  const globalSpeed = 0.25 + energy * 0.55 + beatPulse * 0.35;
  const glitch = beatPulse > 0.85;

  ctx.textAlign = 'center';
  for (let l = 0; l < state.layers.length; l++) {
    const cfg = MATRIX2_LAYERS[l];
    const layer = state.layers[l];
    const colWidth = width / layer.numCols;
    const rowStep = cfg.fontSize * 1.05;
    ctx.font = `bold ${cfg.fontSize}px monospace`;

    for (let di = layer.drops.length - 1; di >= 0; di--) {
      const drop = layer.drops[di];
      drop.y += drop.speed * cfg.speed * globalSpeed * dt * 1.6;
      if ((drop.y - drop.len * rowStep / height) > 1.05) {
        if (layer.drops.length > Math.floor(layer.numCols * 1.4)) { layer.drops.splice(di, 1); continue; }
        Object.assign(drop, matrix2NewDrop(rng, layer.numCols, true));
      }

      const t = drop.col / layer.numCols;
      const chromaIdx = Math.floor(t * 12) % 12;
      const chromaValue = chroma[chromaIdx] || 0.3;
      const hue = CHROMA_HUES[chromaIdx];
      let x = drop.col * colWidth + colWidth / 2;
      if (glitch && l === 2 && ((drop.seed * 7919) % 1) < 0.3) {
        x += (((time * 60 + drop.seed) % 1) - 0.5) * 14;
      }

      const headY = drop.y * height;
      for (let c = 0; c < drop.len; c++) {
        const y = headY - c * rowStep;
        if (y < -rowStep || y > height + rowStep) continue;
        const fade = 1 - c / drop.len;
        const charIdx = Math.floor(drop.seed * 31 + c * 13 + Math.floor(time * (c === 0 ? 12 : 2) + drop.seed)) % MATRIX2_CHARS.length;
        const ch = MATRIX2_CHARS[charIdx];

        if (c === 0) {
          ctx.shadowColor = `hsla(${hue}, 100%, 75%, 0.95)`;
          ctx.shadowBlur = 8 + beatPulse * 10;
          ctx.fillStyle = `hsla(${hue}, 30%, ${88 + beatPulse * 10}%, ${cfg.alpha})`;
        } else {
          ctx.shadowBlur = 0;
          const alpha = fade * fade * cfg.alpha * (0.45 + chromaValue * 0.55);
          ctx.fillStyle = `hsla(${hue}, 95%, ${35 + fade * 30}%, ${alpha})`;
        }
        ctx.fillText(ch, x, y);
      }
      ctx.shadowBlur = 0;
    }
  }

  drawWaveLabels(ctx, width, height, chroma);
}
