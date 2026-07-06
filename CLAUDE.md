# Spotify Webapp Visualizer - Developer Guide

## Project Overview
A React-based music visualizer that analyzes real-time audio from Spotify playback using Web Audio API and custom audio processing. Supports 52 visualization styles with multi-device coordination and intelligent caching.

## Adding a Waveform Style

All waveform styles live in `src/components/visualizers/VisualizerAudio.js`. A new style needs four wirings in that file:
1. Entry in `WAVEFORM_DEFAULTS` (basePosition/maxAmplitude + fullscreen variants, particles, centerElements)
2. Entry in `WAVEFORM_STYLES` (menu + auto-rotate)
3. Case in the `drawChromaSoundWaves` dispatch switch
4. A `draw<Name>Wave(ctx, width, height, chroma, mel, beatPulse, time)` function

Conventions: get position/size from `getEffectiveWaveformSettings(styleId)`, colors from `CHROMA_HUES`, normalize mel dB with `(mel[i] + 10) / 10`, end with `drawWaveLabels(ctx, width, height, chroma)`. Prefer stateless animation derived from `time` (stays synced to playback); if you keep module state, clamp time deltas to survive seeks. Reset shared ctx state (strokeStyle, shadowBlur, globalAlpha, composite op) after use — leaked state bleeds into the next draw call.

## Architecture

### Frontend (React + Vite)
- **App.jsx**: Main component managing playback polling, track changes, analysis pipeline
- **youtubeService.js**: YouTube search, MP3 download coordination with multi-device locking
- **audioAnalysisService.js**: Audio analysis pipeline (mel, chroma, pitch, rhythm extraction)
- **analysisCache.js**: Server-side analysis caching with normalization
- **Components**: AudioVisualizer, TrackInfo, PlaybackControls, SideMenu, etc.

### Backend (Node.js + Express)
- **server.js**: YouTube search + MP3 conversion, analysis caching, multi-device coordination
  - `/search-youtube`: Search YouTube via `yt-dlp "ytsearch1:<query>"` (replaced the dead Browser-Use API, July 2026)
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
- **MP3 retention** (`/clear-mp3s`): analysis JSON is the durable artifact.
  MP3 with saved analysis → purged after 3min; MP3 without analysis → kept 60min
  (so a skipped song's completed download survives to be analyzed); `.part` → 10min.
  Cache keys: `artist-song.mp3` ↔ `artist-song.json` (same sanitized basename).

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
- **Last Deploy**: 2026-07-05 (backend: yt-dlp search fix on Railway; frontend: GitHub Pages) ✅ SUCCESS
- **Build Status**: All CI/CD passing
- **Dependencies**: All packages up-to-date, 0 vulnerabilities

## Railway Configuration

```env
# Backend environment variables (set in Railway)
PORT=3001
NODE_ENV=production

# Frontend environment
VITE_API_URL=https://spotify-webapp-visualizer-production.up.railway.app
VITE_SPOTIFY_CLIENT_ID=6ada4e42731d48f9ad85fab1764aca89
```

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
