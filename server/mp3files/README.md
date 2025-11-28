# MP3 Files Directory

This directory stores downloaded MP3 files for audio analysis.

> ⚠️ **Note**: MP3 files (*.mp3) are excluded from git to save space.

Files are automatically downloaded when the visualizer needs to analyze a new track.

## Clearing Files

To clear downloaded files:
- **Via API**: `DELETE http://localhost:3001/mp3files/clear`
- **Manually**: Delete all `.mp3` files in this folder

## File Naming

Files are named: `{YouTube Video Title}_{timestamp}.mp3`

The timestamp ensures unique filenames even if the same song is downloaded multiple times.
