---
name: add-waveform
description: Add a new waveform visualizer style to the Spotify Webapp Visualizer. Use when asked to create, add, or build a new waveform/visualizer/animation style, or to significantly rework an existing one.
---

# Add a Waveform Style

Every waveform is one file exporting one draw function, registered in a map.
Work on a feature branch; merge via PR (see repo CLAUDE.md deploy mechanics).

## The four wirings

1. **Create `src/components/visualizers/waveforms/<camelCaseName>.js`**

```js
import { CHROMA_HUES, getEffectiveWaveformSettings, drawWaveLabels } from '../waveformCore';

export function draw<Name>Wave(ctx, width, height, chroma, mel, beatPulse, time) {
  const settings = getEffectiveWaveformSettings('<style_id>');
  const baseY = height * (settings.basePosition / 100);
  const maxAmp = height * (settings.maxAmplitude / 100);
  // ...draw...
  drawWaveLabels(ctx, width, height, chroma);
}
```

2. **Register in `src/components/visualizers/waveforms/index.js`** — import the
   draw fn and add `<style_id>: draw<Name>Wave,` to `WAVEFORM_RENDERERS`.

3. **Defaults in `src/components/visualizers/waveformCore.js`** — add a
   `WAVEFORM_DEFAULTS` entry: `basePosition`/`maxAmplitude` (+ `...FullScreen`
   variants), `particles`, `centerElements`. Copy a similar style's line.

4. **Menu entry in `src/components/visualizers/VisualizerAudio.js`** — add
   `{ id: '<style_id>', name: '<Display Name>' }` to `WAVEFORM_STYLES`.
   New styles go in the "New styles" group at the TOP of the list.

## Input data contract

- `chroma`: 12 values, ~0..1, track-relative (a big chord peaks near 1, quiet
  parts stay low). Color by note: `CHROMA_HUES[i]`.
- `mel`: ~40 bands in a dB-ish range; normalize per-band with
  `Math.max(0, Math.min(1, (mel[i] + 10) / 10))`.
- `beatPulse`: 0..1, spikes on beats then decays ~0.92/frame.
- `time`: playback position in SECONDS (seek-synced — it can jump or go
  backwards on seeks and track changes).
- Analysis is stored RAW (v2, `rawFeatures: true`); the values above are
  shaped at render time in `getAnalysisAtTime`. A waveform wanting unshaped
  data can read `melRaw`/`chromaRaw` from the frame (App would need to pass
  them through — most styles should use the shaped values).
- NEVER add normalization back into the analysis extractors or saved JSON.

## Conventions (violating these causes real bugs)

- **Prefer stateless animation** derived from `time` — it stays synced to
  playback. If you keep module state (recommended pattern: `let xState = null`
  re-inited when `width` changes), clamp time deltas:
  `const dt = Math.min(Math.max(time - state.lastTime, 0), 0.1)` — otherwise
  seeks explode the simulation.
- **Cull entity pools** (drops, particles, rockets…): respawn or splice when
  off-screen/aged, and cap counts. Beat-spawned bursts must shrink back.
- **Reset shared ctx state after use** — `shadowBlur`, `globalAlpha`,
  `globalCompositeOperation`, `lineCap`, `textAlign`. Leaked state bleeds into
  the next style. Wrap transforms in `ctx.save()/ctx.restore()`.
- **Beat edges**: for one-shot triggers use a rising edge
  (`beatPulse > 0.6 && lastBeat <= 0.6`), not `beatPulse > x` (fires every frame).
- Keep per-frame draw calls sane (≤ a few thousand `fillText`/`arc` ops).

## Verify before PR (all three)

1. `npm run lint && npm run build` — must be clean (fix ALL warnings, even
   pre-existing; repo rule).
2. **Headless smoke test** — no browsers work reliably on this machine; use a
   stub-ctx harness in node. Extract your function (or esbuild-bundle the
   registry) and run ~600–1200 frames:

```js
// node harness sketch — see git history of similar PRs (#14, #17) for full versions
const grad = { addColorStop: () => {} };
const ctx = new Proxy({}, {
  get: (_, k) => k.startsWith('create') ? () => grad
    : k === 'measureText' ? () => ({ width: 10 })
    : k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) })
    : () => {},
  set: (_, k, v) => {
    if ((k === 'fillStyle' || k === 'strokeStyle') && /NaN|undefined/.test(String(v)))
      throw new Error('bad style: ' + v);
    return true;
  },
});
// loop: t += 1/60; beat = (t % 1.2) < 0.12 ? 1 : 0; draw(ctx, 1280, 720, chroma, mel, beat, t)
// then: seek back (t=2), resize (900x500) — must not throw
// assert: any entity pools stay bounded (no leaks)
```

3. Check the smoke test for: no exceptions, no NaN/undefined colors, entity
   pools bounded after beat bursts, seek-back + resize re-init cleanly.

## Finish

- Update CLAUDE.md: bump the style count in Project Overview and add a
  Recent Changes Log entry.
- Branch → PR → merge to `main` → `git push origin main:master` (Railway
  deploys from master) → `npm run deploy` (GitHub Pages). Verify the new
  bundle hash is live: `curl -s https://yerry262.github.io/Spotify-Webapp-Visualizer/ | grep -o 'index-[^"]*\.js'`.
