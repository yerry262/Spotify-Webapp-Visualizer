// Lyrics Service
// Fetches time-synced lyrics from lrclib.net (free, no API key, CORS-enabled)
// and exposes them to the canvas visualizer via a module-level store so the
// draw loop can read them without prop drilling through React.

const LRCLIB_API = 'https://lrclib.net/api/get';

// Module-level store read by the Lyric Flow visualizer every frame
let lyricsState = {
  status: 'none',   // 'none' | 'loading' | 'synced' | 'plain' | 'unavailable'
  trackKey: null,
  lines: [],        // [{ t: seconds, text: string }] sorted by t (synced only)
  plainText: null   // fallback when only unsynced lyrics exist
};

// Cache fetched lyrics per track for the session (avoids refetch on replay)
const lyricsCache = new Map();
const CACHE_MAX = 50;

function trackKey(artist, track) {
  return `${(artist || '').toLowerCase().trim()}|${(track || '').toLowerCase().trim()}`;
}

/**
 * Parse LRC format ("[mm:ss.xx] words") into sorted {t, text} lines.
 * Lines with empty text are kept as gaps so the visualizer can breathe
 * between verses instead of holding the last line forever.
 */
export function parseLRC(lrc) {
  const lines = [];
  const timeTag = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

  for (const raw of lrc.split('\n')) {
    const text = raw.replace(timeTag, '').trim();
    timeTag.lastIndex = 0;
    let match;
    while ((match = timeTag.exec(raw)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) / 1000 : 0;
      lines.push({ t: minutes * 60 + seconds + fraction, text });
    }
  }

  return lines.sort((a, b) => a.t - b.t);
}

export function clearLyrics() {
  lyricsState = { status: 'none', trackKey: null, lines: [], plainText: null };
}

export function getLyricsState() {
  return lyricsState;
}

/**
 * Fetch lyrics for a track and load them into the store.
 * Fire-and-forget from the track-change handler; safe to call repeatedly
 * (stale responses are dropped if the track changed mid-fetch).
 */
export async function loadLyricsForTrack(artist, track, durationSec) {
  if (!artist || !track) return;

  const key = trackKey(artist, track);
  if (lyricsState.trackKey === key && lyricsState.status !== 'none') return;

  const cached = lyricsCache.get(key);
  if (cached) {
    lyricsState = { ...cached, trackKey: key };
    return;
  }

  lyricsState = { status: 'loading', trackKey: key, lines: [], plainText: null };

  try {
    const params = new URLSearchParams({
      artist_name: artist,
      track_name: track
    });
    if (durationSec) params.set('duration', String(Math.round(durationSec)));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let response = await fetch(`${LRCLIB_API}?${params}`, { signal: controller.signal });

    // Duration mismatches make lrclib 404; retry once without it
    if (!response.ok && durationSec) {
      params.delete('duration');
      response = await fetch(`${LRCLIB_API}?${params}`, { signal: controller.signal });
    }
    clearTimeout(timer);

    if (lyricsState.trackKey !== key) return; // track changed mid-fetch

    if (!response.ok) {
      lyricsState = { status: 'unavailable', trackKey: key, lines: [], plainText: null };
      return;
    }

    const data = await response.json();
    if (lyricsState.trackKey !== key) return;

    let next;
    if (data.syncedLyrics) {
      next = { status: 'synced', lines: parseLRC(data.syncedLyrics), plainText: null };
    } else if (data.plainLyrics) {
      next = { status: 'plain', lines: [], plainText: data.plainLyrics };
    } else {
      next = { status: 'unavailable', lines: [], plainText: null };
    }

    lyricsState = { ...next, trackKey: key };
    if (lyricsCache.size >= CACHE_MAX) {
      lyricsCache.delete(lyricsCache.keys().next().value);
    }
    lyricsCache.set(key, next);
    console.log(`🎤 Lyrics ${next.status} for ${artist} - ${track}` +
      (next.status === 'synced' ? ` (${next.lines.length} lines)` : ''));
  } catch (error) {
    if (lyricsState.trackKey === key) {
      lyricsState = { status: 'unavailable', trackKey: key, lines: [], plainText: null };
    }
    console.warn('🎤 Lyrics fetch failed:', error.message);
  }
}

/**
 * Find the active synced line for a playback time.
 * Returns { index, line, start, end, prev, next } or null when before the
 * first line / no synced lyrics.
 */
export function getLyricAt(time) {
  const { status, lines } = lyricsState;
  if (status !== 'synced' || lines.length === 0) return null;

  let index = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].t <= time) index = i;
    else break;
  }
  if (index === -1) return null;

  const line = lines[index];
  const nextLine = lines[index + 1] || null;
  return {
    index,
    line,
    start: line.t,
    end: nextLine ? nextLine.t : line.t + 5,
    prev: lines[index - 1] || null,
    next: nextLine
  };
}
