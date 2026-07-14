# Spotify Webapp Visualizer - Developer Guide

## Project Overview
A React-based music visualizer that analyzes real-time audio from Spotify playback using Web Audio API and custom audio processing. Supports 56 visualization styles with multi-device coordination and intelligent caching.

## Adding a Waveform Style

Use the `add-waveform` skill (`.claude/skills/add-waveform/SKILL.md`) — it has the full recipe, data contract, and test harness. Summary:

Each waveform lives in its own file under `src/components/visualizers/waveforms/` (one file per style, private state/helpers included). Shared pieces (`CHROMA_HUES`, `PITCH_CLASSES`, `getEffectiveWaveformSettings`, `drawWaveLabels`, `WAVEFORM_DEFAULTS`) live in `src/components/visualizers/waveformCore.js`. A new style needs four wirings:
1. New file `waveforms/<name>.js` exporting `draw<Name>Wave(ctx, width, height, chroma, mel, beatPulse, time)`, importing what it needs from `../waveformCore`
2. Register it in `waveforms/index.js` (`WAVEFORM_RENDERERS` map, style-id → draw fn)
3. Entry in `WAVEFORM_DEFAULTS` in `waveformCore.js` (basePosition/maxAmplitude + fullscreen variants, particles, centerElements)
4. Entry in `WAVEFORM_STYLES` in `VisualizerAudio.js` (menu + auto-rotate)

Conventions: get position/size from `getEffectiveWaveformSettings(styleId)`, colors from `CHROMA_HUES`, normalize mel dB with `(mel[i] + 10) / 10`, end with `drawWaveLabels(ctx, width, height, chroma)`. Prefer stateless animation derived from `time` (stays synced to playback); if you keep module state, clamp time deltas to survive seeks. Reset shared ctx state (strokeStyle, shadowBlur, globalAlpha, composite op) after use — leaked state bleeds into the next draw call.

## Architecture

### Frontend (React + Vite)
- **App.jsx**: Main component managing playback polling, track changes, analysis pipeline
- **youtubeService.js**: YouTube search, MP3 download coordination with multi-device locking
- **audioAnalysisService.js**: Audio analysis pipeline (mel, chroma, pitch, rhythm extraction)
- **analysisCache.js**: Server-side analysis caching (structural normalization only — values stay raw)
- **lyricsService.js**: Time-synced lyrics from lrclib.net (client→lrclib direct; 20s timeout, cleaned-title retry, search fallback)
- **Components**: AudioVisualizer, TrackInfo, PlaybackControls, SideMenu, etc.

### Backend (Node.js + Express)
- **server.js**: YouTube search + MP3 conversion, analysis caching, multi-device coordination
  - `/search-youtube`: yt-dlp `ytsearch8` + candidate scoring vs Spotify artist/title/duration (`server/searchScoring.js`); returns no_results over a wrong song. Legacy query-only requests fall back to top-1.
  - `/get-mp3`: Download from YouTube with locking
  - `/check-status`: Check if analysis/MP3 is cached or in progress
  - `/notify-analyzing`: Acquire analysis lock
  - `/save-analysis`: Cache analysis results
  - `/check-analysis-cache`: Check for cached analysis

### Data Flow
```
Spotify Playback 
  ↓
Check analysis cache (server)
  ↓
Check MP3 cache (server)
  ↓
Search YouTube → Download MP3
  ↓
Analyze audio (mel, chroma, pitch, rhythm)
  ↓
Cache analysis results
  ↓
Sync visualization with playback
```

## Recent Optimizations & Fixes (July 2026)

### Latest Deploy (2026-07-05)
- ✅ Fixed npm dependency sync (express-rate-limit@7.5.0)
- ✅ Resolved all npm audit vulnerabilities (0 vulnerabilities)
- ✅ Auto-mode waveform interval: 1000ms → 30000ms (30x reduction)
- ✅ Removed callback accumulation in polling loop
- ✅ Device ID security: enhanced uniqueness
- ✅ Version info timeout: 5s max (prevents blocking)
- ✅ Consistent filename sanitization client/server
- ✅ Added CLAUDE.md documentation

### 1. Auto-mode Waveform Interval
- Changed from 1000ms to 30000ms update frequency
- Reduces unnecessary React re-renders by 30x
- Now matches the actual 30-second auto-rotate cycle

### 2. Callback Accumulation Fix
- Replaced `setTimeout(..., 0)` in polling loop with direct calls
- Added `analysisData` check before prefetch
- Eliminates memory leak in prefetch triggering

### 3. Device ID Uniqueness
- Enhanced from `Date.now() + 9-digit random` to `timestamp + 13-digit random + fingerprint`
- Virtually eliminates collision risk in multi-device scenarios

### 4. Version Info Timeout
- Added 5-second timeout to version.json fetch
- App no longer blocks if endpoint is slow/unreachable
- Graceful degradation with default values

### 5. Filename Sanitization
- Unified client-server sanitization logic
- Both now use: trim → remove special chars → collapse underscores
- Fixed cache key mismatches in multi-device coordination

## Key Design Patterns

### Multi-Device Coordination
- **Lock Key**: Sanitized "artist-song" pairs used as coordination keys
- **Timeouts**: Download (15s), Analysis (90s) - prevent stale locks
- **Polling**: Devices poll status endpoint and wait for others to finish
- **Caching Strategy**: Check server cache → Check lock status → Download/analyze → Cache result
- **Client wait budget must exceed the server lock it's waiting on** (`youtubeService.js`
  `WAIT_TIMEOUTS_MS`: `download: 20000` vs the 15s download lock,
  `analysis: 95000` vs the 90s analysis lock). Analysis routinely takes ~30s
  in production (confirmed via Railway logs); a flat 20s wait cap used to
  make a waiting device give up before the real work finished, fall through
  to `getMP3ForTrack`'s "not found" branch, and duplicate the analysis
  itself — two devices calling `/release-analysis-lock` microseconds apart
  for the same track, one success and one failure. If you touch
  `waitForReady()`, keep its per-`kind` timeout comfortably above the
  matching server lock timeout, or this comes back.
- Search itself is **not** locked — two devices can both hit `/search-youtube`
  for the same "not found" track at once (wasted yt-dlp calls, rate-limited
  by `expensiveLimiter`). Only download and analysis are deduped, via the
  server-side `Map`-based locks in `server.js`. This is intentional (search
  is cheap and free); don't add search locking without a reason.

### Pipeline UI State Machine (top-half visualizer)
`AudioVisualizer.jsx` picks ONE state per frame, in this priority order:
`waitingFor` (another device is working) → `isSearching` → `isDownloading` →
`isAnalyzing` (this device is working) → has `analysisData` (real
visualization) → idle/stalled fallback.
- `waitingFor` (`'download'|'analysis'|null`, set in `App.jsx`) is distinct
  from `isAnalyzing` — it means "polling `waitForReady()` because someone
  else already has the lock", not "this device is doing the work". Shows
  `VisualizerWaiting.js` with copy that names the other device, not this one.
- The idle animation (`VisualizerIdle.js`) also carries a `stalled` flag: if
  the pipeline exhausts retries on a track that's still actively playing
  (`pipelineStalled` in `App.jsx`, set in every terminal failure branch of
  the debounced processing block), it shows "Couldn't load visuals for this
  track" instead of "Waiting for music..." — the old code showed the latter
  even while music was audibly playing, which is what actually prompted this
  fix (confirmed live via Railway logs + user report, 2026-07-14).
- Before marking a track `pipelineStalled`, the analysis-failure path
  re-checks the server analysis cache once (`getCachedAnalysis`) in case the
  other device that raced us already saved it — cheap defense against the
  residual version of the race above.
- **MP3 retention** (`/clear-mp3s`): MP3s and analysis JSON are BOTH durable
  artifacts, stored on a Railway volume (`DATA_DIR=/app/data`) that survives
  deploys. `.part` files → deleted after 10min. MP3s are retained until the
  cache exceeds `MP3_CACHE_MAX_MB` (default 4000), then oldest analyzed MP3s
  are evicted first (their JSON survives), then oldest unanalyzed.
  Cache keys: `artist-song.mp3` ↔ `artist-song.json` (same sanitized basename).

### Analysis Data (raw v2 format)
- Analysis JSONs store **RAW** feature values (`rawFeatures: true`): mel bands
  are raw spectrum energy sums (no log scaling) and chroma is raw accumulated
  energy (no per-frame normalization — the old `c / maxChroma` made every
  frame peak at 1.0, flattening chord dynamics).
- All shaping happens at render time in `getAnalysisAtTime`
  (audioAnalysisService.js), scaled against **track-global** maxima so
  loud/quiet dynamics survive: chroma → `raw / trackMax`; mel →
  `sqrt(raw / trackMax)` mapped onto the legacy dB-ish range so the waveform
  convention `(mel + 10) / 10` still works.
- Waveforms that want truly raw values get `melRaw` / `chromaRaw` alongside
  `mel` / `chroma` in the per-frame data.
- Legacy (v1) cached JSONs (no `rawFeatures` flag) pass through unchanged —
  don't add normalization back into the extractors or the saved JSON.

### Prefetch Logic
- Triggered at 50% track progress
- Only prefetches if current track analysis is ready
- Skips if another device already prefetching
- Non-blocking (doesn't wait, just returns null if in progress)

### Error Handling
- Analysis failures fall back to default (zeros) for each feature type
- Download failures release locks to prevent deadlocks
- Network timeouts gracefully continue without blocking

## Performance Considerations

### Memory
- AudioContext properly closed after decoding (prevents leaks)
- Float32Arrays transferred to workers (not copied)
- Refs used for polling to avoid dependency issues

### Network
- 7-day TTL on YouTube URL cache (localStorage)
- MP3 files cached by artist-song (re-used across devices)
- Analysis JSON cached on server (shared across all users)

### CPU
- Mel/Chroma use downsampled FFT (256 bins, not full)
- Pitch/Rhythm processing in Web Workers (non-blocking)
- Analysis caching eliminates re-processing

## Testing Recommendations

0. **Live backend smoke test** (fastest way to verify the pipeline end-to-end):
   ```bash
   curl -X POST https://spotify-webapp-visualizer-production.up.railway.app/search-youtube \
     -H "Content-Type: application/json" -d '{"query":"artist song official audio"}'
   curl -X POST https://spotify-webapp-visualizer-production.up.railway.app/get-mp3 \
     -H "Content-Type: application/json" \
     -d '{"url":"<youtube-url>","artist":"X","song":"Y","deviceId":"test"}'  # full download ~30-60s
   ```
1. **Multi-Device**: Run on two browsers, start same song on both
2. **Auto-Mode**: Enable waveform auto-rotate, verify 30s intervals
3. **Slow Network**: DevTools → Network → Slow 3G, verify timeout works
4. **Cache Hits**: Check browser console for "cached" messages
5. **Prefetch**: Play track to 50%, check next track prefetch starts

## Build & Deploy

### Deploy Mechanics (important)
- Default branch is `main` (PRs merge here), but the Railway service still deploys from `master` — after merging, sync it: `git push origin main:master`. Without that push the backend never redeploys.
- `dist/` is gitignored — frontend ships via `npm run deploy` (gh-pages), not via commits
- Railway auto-deploys on EVERY push to master; each redeploy restarts the container,
  kills in-flight downloads, and wipes ephemeral `/app/mp3files` + `/app/analysis` caches.
  Batch commits before pushing while users may be listening.
- Frontend-only changes still trigger a Railway rebuild (harmless but restarts backend)

### Development
```bash
npm install
npm run dev  # Frontend at http://localhost:3000
cd server && npm install
node server.js  # Backend at http://localhost:3001
```

### Production
```bash
npm run build
npm run deploy  # GitHub Pages
# Backend deployed separately (Railway, Vercel, etc.)
```

## Deployment Status

- **Platform**: Railway
- **Frontend**: GitHub Pages (`yerry262.github.io/Spotify-Webapp-Visualizer`)
- **Backend**: Railway (`spotify-webapp-visualizer-production.up.railway.app`)
- **Last Deploy**: 2026-07-14 (multi-device wait-timeout fix, waiting/stalled UI states, CORS + admin-gate + token-refresh hardening) ✅ SUCCESS
- **Build Status**: All CI/CD passing
- **Dependencies**: All packages up-to-date, 0 vulnerabilities

## Railway Configuration

```env
# Backend environment variables (set in Railway)
PORT=3001
NODE_ENV=production
DATA_DIR=/app/data        # Railway volume mount — persists mp3files/ + analysis/ across deploys
MP3_CACHE_MAX_MB=4000     # optional; MP3 cache size cap before oldest-first eviction

# Frontend environment
VITE_API_URL=https://spotify-webapp-visualizer-production.up.railway.app
VITE_SPOTIFY_CLIENT_ID=6ada4e42731d48f9ad85fab1764aca89
```

## Security Notes

- **CORS origin check must be an exact host match**, not `origin.startsWith(allowed)`
  (`server.js` `isAllowedOrigin`). A prefix check lets
  `https://yerry262.github.io.attacker.io` pass as a literal string prefix of
  an allowed origin — a real bypass given `credentials: true`. Compare
  `new URL(origin).host`/`.protocol` against the allowlist, not raw strings.
- `/mp3files/list` and `/analysis/list` are `requireAdmin`-gated like the
  other `/mp3files`/`/analysis` endpoints, even though they're read-only —
  they're unused by the web client and would otherwise dump every cached
  artist-song filename to anyone (CORS doesn't stop `curl`).
- `SpotifyAuth.refreshToken()` (`spotifyService.js`) is single-flight: concurrent
  `getValidToken()` callers (1s playback poll, queue prefetch, `getMe`) share
  one in-flight refresh promise instead of each firing their own request at
  Spotify right at token expiry, which could race Spotify's refresh-token
  rotation.

## Known Limitations

1. YouTube search is free but not 100% reliable (yt-dlp `ytsearch1` returns top result; if searches break, update yt-dlp in the Railway container)
2. Analysis accuracy depends on MP3 quality
3. Multi-device coordination requires polling (no WebSocket)
4. Fuzzy filename matching may give false positives with generic names

## Future Improvements

- [ ] WebSocket support for real-time multi-device updates
- [ ] Local analysis caching (IndexedDB) for offline support
- [ ] Visualization recording/export
- [ ] Custom colorization based on album art
- [ ] Integration with other music services (Apple Music, YouTube Music)

## Recent Changes Log

- **2026-07-14**: Fixed the multi-device wait-timeout mismatch that caused
  duplicate analysis and the misleading "Waiting for music..." message while
  a track was actively playing (root-caused via Railway logs — analysis
  takes ~30s, wait cap was 20s). Added a distinct "another device is
  downloading/analyzing" UI state (`VisualizerWaiting.js`) and a "couldn't
  load visuals" stalled state, separate from genuine idle. Also fixed a CORS
  origin-check bypass (`startsWith` → exact host match), admin-gated the two
  unauthenticated `/mp3files/list` and `/analysis/list` endpoints, and made
  Spotify token refresh single-flight to stop concurrent pollers racing
  Spotify's refresh-token rotation.

- **2026-07-06**: Added `.claude/skills/add-waveform` project skill (full recipe + smoke-test harness for new styles); CLAUDE.md refreshed (56 styles, scored search endpoint, lyricsService in architecture)

- **2026-07-06**: Rotate controls pop-out — drag the Random/Cycle rows out of the sidebar to float them as a draggable bubble (RotateBubble/RotateControls components, position persisted in localStorage)

- **2026-07-06**: Added Cycle rotate mode (sequential next-in-list) beside Random; both share 5s/15s/30s/∞ interval options — ∞ disables timed advance and the row label becomes a one-shot re-roll/next button

- **2026-07-06**: YouTube search accuracy — /search-youtube now fetches 8 candidates and scores them against Spotify artist/title/duration (server/searchScoring.js); rejects wrong songs instead of trusting ytsearch1 (fixes Łaszewo/HAPPY LANDING wrong-download bug)

- **2026-07-06**: Raw analysis v2 (mel/chroma saved unflattened, render-time track-global scaling, melRaw/chromaRaw for waveforms); MP3s retained on Railway volume (DATA_DIR) with size-cap eviction (MP3_CACHE_MAX_MB)

- **2026-07-06**: Refactored VisualizerAudio.js (8,947 lines) into per-waveform files under `visualizers/waveforms/` + shared `waveformCore.js`; dispatch switch replaced by `WAVEFORM_RENDERERS` registry

- **2026-07-06**: Minion Mayhem 2.0 — airship dropping banana-bombs, minion-piloted rockets bursting into banana fireworks, foreground minions sprinting after bananas, full explosion system (fireball/shockwave/debris)

- **2026-07-06**: Added Matrix Rain 2 waveform (layered parallax rain, glowing heads, beat bursts, glitch flicker) — 52 total

- **2026-07-05**: Replaced dead Browser-Use YouTube search with yt-dlp `ytsearch` (backend was returning 404 on every search, breaking the whole pipeline)
- **2026-07-05**: Added 6 waveform styles (Spirograph, Starfield Warp, Vinyl Record, Glitch Art 3, Maze Mystery, Minion Mayhem) — 51 total
- **2026-07-05**: Reworked 8-Bit Chase and Volcanic Magma; fixed Sacred Geometry strokeStyle leak; fixed Synthwave Horizon flicker (shake ramp, RGB strobe, grid wrap)
- **2026-07-05**: Fixed npm dependencies, optimized polling, enhanced security
- **2026-07-05**: Added CLAUDE.md documentation
- **2026-06-24**: Admin review dashboard enhancements

## Code Style

- No unnecessary comments (code should be self-documenting)
- Consistent variable naming: camelCase for JS, kebab-case for CSS
- Prefer refs over state for non-visual values
- Use AbortController for cancellable async operations

## Contributing

When making changes:
1. Keep timestamp logs consistent with `ts()` or `timestamp()` helper
2. Ensure client-server sanitization stays in sync
3. Update lock timeouts only if changing expected operation duration
4. Test multi-device coordination after any API changes
5. Check that cleanup (AbortController, clearTimeout) happens in finally blocks
