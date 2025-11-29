# Analysis Data Directory

This directory stores pre-computed audio analysis data as JSON files.

## File Format

Files are named: `{artist}-{song}.json`

For example: `illenium-forever.json`

## Contents

Each JSON file contains:
- `duration` - Audio duration in seconds
- `sampleRate` - Audio sample rate (typically 44100Hz)
- `analysisTime` - How long analysis took
- `features` - The extracted audio features:
  - `melSpectrogram` - Mel-frequency spectrogram frames
  - `hpcpChroma` - Harmonic pitch class profile (chroma) frames
  - `pitch` - Pitch/frequency estimation frames
  - `rhythm` - BPM, beat timestamps, and beat density

## Benefits

- **No size limits** - Unlike localStorage, files can be any size
- **Persistent** - Survives browser clears and restarts
- **Shareable** - Works across devices and browsers
- **Git-trackable** - Can be committed to the repo (or gitignored)

## Clearing Data

- **Single file**: `DELETE http://localhost:3001/analysis/{filename}`
- **Manually**: Delete `.json` files from this folder
