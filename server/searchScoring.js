// Scoring for YouTube search candidates.
// The old search took ytsearch1's first result on faith, which regularly
// downloaded the WRONG SONG for smaller artists (e.g. "Łaszewo - 3am" fetched
// "Til U Hate Me"). Now we fetch several candidates and score them against
// the Spotify track's title, artist, and duration.

// Lowercase, strip diacritics and punctuation, collapse whitespace
function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Strip Spotify-style title decorations ("(feat. X)", "- 2011 Remaster", …)
function cleanSongTitle(song) {
  return (song || '')
    .replace(/\s*[([][^)\]]*\b(feat\.?|ft\.?|with)\b[^)\]]*[)\]]/gi, '')
    .replace(/\s+-\s+[^-]*\b(remaster(ed)?|version|edit|mix|remix|live|mono|stereo|deluxe|single|bonus|acoustic|demo)\b.*$/i, '')
    .trim();
}

// Title red flags: a different rendition than the studio track the analysis
// will be synced against. Only penalized when the requested title doesn't
// contain the word itself (searching for a song called "Remix" is fine).
const BAD_WORDS = [
  'live', 'cover', 'remix', 'reaction', 'sped up', 'slowed', 'reverb',
  '8d audio', 'karaoke', 'instrumental', 'tutorial', 'lesson', 'loop',
  '1 hour', 'extended', 'mashup', 'parody', 'nightcore', 'acoustic',
  'behind the scenes', 'teaser', 'trailer', 'shorts',
];

function hasWord(normText, word) {
  return new RegExp(`(^| )${word}( |$)`).test(normText);
}

/**
 * Score one candidate {title, channel, duration} against the target
 * {artist, song, durationSec}. Higher is better.
 */
function scoreCandidate(candidate, target) {
  const title = normalize(candidate.title);
  const channel = normalize(candidate.channel);
  const song = normalize(cleanSongTitle(target.song));
  const artist = normalize(target.artist);
  let score = 0;

  // --- Song title must actually appear ---
  if (song && title.includes(song)) {
    score += 4;
  } else if (song) {
    const tokens = song.split(' ').filter(t => t.length > 1);
    const hit = tokens.filter(t => hasWord(title, t)).length;
    const coverage = tokens.length ? hit / tokens.length : 0;
    score += coverage * 3;
    if (coverage < 0.5) score -= 6; // wrong song — the Łaszewo failure mode
  }

  // --- Artist in title or channel ---
  if (artist) {
    const inTitle = title.includes(artist);
    const inChannel = channel.includes(artist);
    if (inTitle || inChannel) score += 2;
    if (inChannel && channel.endsWith(' topic')) score += 1; // auto-generated "Artist - Topic" = studio audio
    if (inChannel && channel.includes('vevo')) score += 1;
  }

  // --- Duration vs the Spotify track ---
  if (target.durationSec && candidate.duration) {
    const diff = Math.abs(candidate.duration - target.durationSec);
    if (diff <= 2) score += 3;
    else if (diff <= 7) score += 2.5;
    else if (diff <= 15) score += 1.5;
    else if (diff <= 30) score += 0;
    else if (diff <= 60) score -= 2;
    else score -= 6;
  }

  // --- Rendition red flags (unless the song itself is named that) ---
  for (const word of BAD_WORDS) {
    if (hasWord(title, word) && !(song && hasWord(song, word))) score -= 2;
  }

  // --- Mild preference for canonical uploads ---
  if (title.includes('official audio')) score += 1.5;
  else if (title.includes('official music video') || title.includes('official video')) score += 1;
  else if (hasWord(title, 'audio') || title.includes('lyric') || hasWord(title, 'visualizer')) score += 0.5;

  return score;
}

/**
 * Pick the best candidate, or null if nothing scores above the threshold
 * (better to report no_results than download the wrong song).
 */
function pickBestCandidate(candidates, target, threshold = 3) {
  let best = null;
  let bestScore = -Infinity;
  for (const c of candidates) {
    if (!c || !c.id) continue;
    // Never grab something wildly longer than the track (compilations, mixes)
    if (target.durationSec && c.duration && c.duration > target.durationSec * 2 + 120) continue;
    if (!target.durationSec && c.duration && c.duration > 15 * 60) continue;
    const score = scoreCandidate(c, target);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  if (!best || bestScore < threshold) return null;
  return { candidate: best, score: bestScore };
}

module.exports = { normalize, cleanSongTitle, scoreCandidate, pickBestCandidate };
