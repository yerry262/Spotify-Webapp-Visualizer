# Test Fixtures

This folder contains test files for development and testing purposes.

## Usage

Place your test MP3 files here:
- `test-audio.mp3` - The default test file used by the test suite

## Important

- Files in this folder are **NOT** for production use
- They are served at `/test-fixtures/` when running the dev server
- Do not commit large audio files to version control

## Recommended Test Files

For best results, use an MP3 file that:
- Is 10-60 seconds long (shorter = faster tests)
- Has clear musical content (rhythm, melody)
- Is properly encoded at 44.1kHz sample rate
