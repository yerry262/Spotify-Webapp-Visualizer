import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';
import { getLyricsState, getLyricAt } from '../../../lyricsService';

// --- LYRIC FLOW STATE ---
// Remembers word reveal times per line so words pop once and stay (survives
// seeks: state resets whenever the active line index changes)
let lyricFlowState = { lineIndex: -1, wordRevealed: [] };

function wrapLyricWords(ctx, words, maxWidth) {
  const rows = [];
  let row = [];
  let rowWidth = 0;
  const spaceWidth = ctx.measureText(' ').width;

  for (const word of words) {
    const w = ctx.measureText(word).width;
    if (row.length > 0 && rowWidth + spaceWidth + w > maxWidth) {
      rows.push(row);
      row = [];
      rowWidth = 0;
    }
    row.push(word);
    rowWidth += (row.length > 1 ? spaceWidth : 0) + w;
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

export function drawLyricMelPulse(ctx, width, height, chroma, mel, beatPulse) {
  // Slim reactive mel strip along the bottom so the style still reads as a
  // visualizer during instrumental gaps
  const settings = getEffectiveWaveformSettings('lyric_flow');
  const baseY = height * (settings.basePosition / 100);
  const maxAmp = height * 0.5 * (settings.maxAmplitude / 100) * 0.4;
  const bins = mel ? mel.length : 0;
  if (!bins) return;

  const step = Math.max(1, Math.floor(bins / 64));
  const barWidth = width / Math.ceil(bins / step);
  for (let i = 0, x = 0; i < bins; i += step, x += barWidth) {
    const energy = Math.max(0, Math.min(1, (mel[i] + 10) / 10));
    const hue = CHROMA_HUES[Math.floor((i / bins) * 12) % 12];
    const barHeight = energy * maxAmp * (1 + beatPulse * 0.5);
    ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.15 + energy * 0.35})`;
    ctx.fillRect(x, baseY - barHeight, barWidth - 1, barHeight);
  }
}

export function drawLyricFlowWave(ctx, width, height, chroma, mel, beatPulse, time) {
  drawLyricMelPulse(ctx, width, height, chroma, mel, beatPulse);

  // Dominant note drives the lyric color
  let domIdx = 0;
  for (let i = 1; i < 12; i++) if (chroma[i] > chroma[domIdx]) domIdx = i;
  const hue = CHROMA_HUES[domIdx];

  const lyrics = getLyricsState();
  const active = getLyricAt(time);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (lyrics.status !== 'synced' || !active || !active.line.text) {
    // No line to show right now: breathe with the beat
    const message =
      lyrics.status === 'synced' ? '♪' :
      lyrics.status === 'loading' ? '♪ finding lyrics… ♪' :
      lyrics.status === 'plain' ? '♪ lyrics not time-synced for this track ♪' :
      '♪ instrumental vibes ♪';
    const pulse = 1 + beatPulse * 0.25 + Math.sin(time * 2) * 0.05;
    ctx.font = `${Math.round(Math.min(width, height) * 0.05 * pulse)}px "Orbitron", monospace`;
    ctx.fillStyle = `hsla(${hue}, 70%, 65%, 0.5)`;
    ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.6)`;
    ctx.shadowBlur = 20 * (0.5 + beatPulse);
    ctx.fillText(message, width / 2, height * 0.45);
  } else {
    // Reset word reveal tracking when the line changes (also handles seeks)
    if (lyricFlowState.lineIndex !== active.index) {
      lyricFlowState = { lineIndex: active.index, wordRevealed: [] };
    }

    const words = active.line.text.split(/\s+/).filter(Boolean);
    const lineDuration = Math.max(0.8, active.end - active.start);
    // Words are timed evenly across the sung portion of the line (LRC is
    // line-level, so per-word timing is estimated)
    const singSpan = lineDuration * 0.85;
    const elapsed = time - active.start;
    const currentWordIdx = Math.min(
      words.length - 1,
      Math.floor((elapsed / singSpan) * words.length)
    );

    const baseSize = Math.max(18, Math.min(width, height) * 0.075);
    ctx.font = `bold ${Math.round(baseSize)}px "Orbitron", monospace`;
    const rows = wrapLyricWords(ctx, words, width * 0.82);
    const lineHeight = baseSize * 1.35;
    const blockTop = height * 0.48 - ((rows.length - 1) * lineHeight) / 2;

    // KARAOKE RENDER: sung words solid, CURRENT word blazing red, upcoming dim
    let wordIdx = 0;
    for (let r = 0; r < rows.length; r++) {
      const rowWords = rows[r];
      const spaceWidth = ctx.measureText(' ').width;
      const rowWidth = rowWords.reduce((sum, w) => sum + ctx.measureText(w).width, 0) +
        spaceWidth * (rowWords.length - 1);
      let x = width / 2 - rowWidth / 2;
      const y = blockTop + r * lineHeight;

      for (const word of rowWords) {
        const wordWidth = ctx.measureText(word).width;

        if (wordIdx === currentWordIdx) {
          // The word being sung RIGHT NOW: hot red, beat-pumped, glowing
          if (lyricFlowState.wordRevealed[wordIdx] === undefined) {
            lyricFlowState.wordRevealed[wordIdx] = time;
          }
          const sinceReveal = Math.min(0.2, Math.max(0, time - lyricFlowState.wordRevealed[wordIdx]));
          const popProgress = sinceReveal / 0.2;
          const scale = 1 + Math.sin(popProgress * Math.PI) * 0.22 + beatPulse * 0.12;

          ctx.save();
          ctx.translate(x + wordWidth / 2, y);
          ctx.scale(scale, scale);
          ctx.shadowColor = 'hsla(0, 100%, 55%, 1)';
          ctx.shadowBlur = 22 + beatPulse * 28;
          ctx.fillStyle = `hsl(0, 95%, ${58 + beatPulse * 14}%)`;
          ctx.fillText(word, 0, 0);
          ctx.restore();
        } else if (wordIdx < currentWordIdx) {
          // Already sung: solid warm white with a whisper of the chroma hue
          ctx.shadowColor = `hsla(${hue}, 70%, 60%, 0.4)`;
          ctx.shadowBlur = 6;
          ctx.fillStyle = 'hsla(40, 30%, 92%, 0.95)';
          ctx.fillText(word, x + wordWidth / 2, y);
        } else {
          // Not sung yet: dim outline waiting its turn
          ctx.shadowBlur = 0;
          ctx.fillStyle = `hsla(${hue}, 25%, 55%, 0.28)`;
          ctx.fillText(word, x + wordWidth / 2, y);
        }
        x += wordWidth + spaceWidth;
        wordIdx++;
      }
    }

    // TRAILING LINES: the last sentence or two drift upward and fade,
    // fully sung so they render as solid ghosted text
    const allLines = lyrics.lines;
    ctx.shadowBlur = 0;
    for (let back = 1; back <= 2; back++) {
      const prevLine = allLines[active.index - back];
      if (!prevLine || !prevLine.text) continue;
      const size = baseSize * (back === 1 ? 0.55 : 0.42);
      ctx.font = `${Math.round(size)}px "Orbitron", monospace`;
      const drift = Math.min(1, elapsed / 1.5) * baseSize * 0.2; // eases upward as new line lands
      ctx.fillStyle = `hsla(${hue}, 35%, 75%, ${back === 1 ? 0.4 : 0.2})`;
      ctx.fillText(prevLine.text, width / 2, blockTop - lineHeight * (0.9 + back * 0.75) - drift);
    }

    // Next line hint below, brightening as the current line finishes
    if (active.next && active.next.text) {
      const nextProgress = Math.min(1, elapsed / lineDuration);
      ctx.font = `${Math.round(baseSize * 0.45)}px "Orbitron", monospace`;
      ctx.fillStyle = `hsla(${hue}, 40%, 70%, ${0.12 + nextProgress * 0.25})`;
      ctx.fillText(active.next.text, width / 2, blockTop + (rows.length - 0.2) * lineHeight + lineHeight * 0.9);
    }
  }

  // Reset shared ctx state so it doesn't bleed into the next draw call
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';

  drawWaveLabels(ctx, width, height, chroma);
}
