// Audio Analysis Service using Essentia.js
// Extracts Melspectrogram, HPCP Chroma, and Pitch data from MP3 files
// For educational research purposes - Spotify & Google Research Project

import { getAnalysisInterval } from './components/visualizers/VisualizerAudio';
// Re-export cache functions for external use
export { 
  checkServerAnalysisCache, 
  loadServerAnalysis, 
  saveServerAnalysis, 
  isAnalysisCached,
  getCachedAnalysis
} from './analysisCache';

import {
  loadServerAnalysis,
  saveServerAnalysis,
  isAnalysisCached,
  getCachedAnalysis
} from './analysisCache';
import { 
  SAMPLE_RATE, 
  timestamp, 
  shouldContinueAnalysis, 
  audioBufferToMono, 
  computeSpectrumFast, 
  fetchAudioBuffer 
} from './analysisUtils';

// ==================== ANALYSIS CANCELLATION ====================
// AbortController for cancelling ongoing analysis when track changes
let currentAnalysisController = null;

/**
 * Cancel any ongoing audio analysis
 * Call this when the track changes to prevent wasted processing
 */
export function cancelAnalysis() {
  if (currentAnalysisController) {
    console.log(`${timestamp()} 🛑 Cancelling ongoing audio analysis...`);
    currentAnalysisController.abort();
    currentAnalysisController = null;
  }
}

// Constants for audio analysis
const FRAME_SIZE = 2048;
// Default frame interval - can be overridden by user settings
const DEFAULT_FRAME_INTERVAL = 0.2; // 5fps default

// Get current frame interval for a specific analysis type from user settings
export const getFrameInterval = (type = 'mel') => {
  try {
    return getAnalysisInterval(type);
  } catch {
    return DEFAULT_FRAME_INTERVAL;
  }
};

/**
 * Extract Mel Spectrogram from audio signal using pure JavaScript
 * Uses configurable intervals for consistent frame timing
 * Returns: Array of frames, each containing mel band energies
 */
export async function extractMelSpectrogram(audioSignal, sampleRate = SAMPLE_RATE) {
  const frameInterval = getFrameInterval('mel');
  const fps = Math.round(1 / frameInterval);
  console.log(`${timestamp()} 🎼 Extracting Mel Spectrogram (${fps}fps)...`);
  
  const frames = [];
  const numBands = 40;
  const totalDuration = audioSignal.length / sampleRate;
  const numFrames = Math.floor(totalDuration / frameInterval);
  
  console.log(`${timestamp()}    Processing ${numFrames} frames at ${fps}fps from ${totalDuration.toFixed(1)}s audio...`);
  
  try {
    for (let i = 0; i < numFrames; i++) {
      const frameTime = i * frameInterval;
      const startSample = Math.round(frameTime * sampleRate);
      const frameData = audioSignal.slice(startSample, startSample + FRAME_SIZE);
      
      if (frameData.length < FRAME_SIZE) break;
      
      // Use fast spectrum computation
      const spectrum = computeSpectrumFast(frameData, numBands * 2);
      
      // Group into mel-like bands — store RAW energy sums. No log scaling or
      // normalization here: the saved analysis keeps true dynamics and any
      // perceptual shaping happens at render time (getAnalysisAtTime).
      const bands = [];
      const binsPerBand = 2;
      for (let b = 0; b < numBands; b++) {
        let sum = 0;
        for (let j = 0; j < binsPerBand; j++) {
          sum += spectrum[b * binsPerBand + j] || 0;
        }
        bands.push(sum);
      }
      
      frames.push({
        time: frameTime,
        bands: bands
      });
    }
  } catch (error) {
    console.warn('⚠️ Mel extraction error:', error.message);
    return [];
  }
  
  console.log(`${timestamp()} ✅ Extracted ${frames.length} mel spectrogram frames (${fps}fps)`);
  return frames;
}

/**
 * Extract HPCP (Harmonic Pitch Class Profile) Chroma from audio signal
 * Uses pure JavaScript and configurable intervals
 * Returns: Array of frames, each containing 12 chroma values (C, C#, D, ... B)
 */
export async function extractHPCPChroma(audioSignal, sampleRate = SAMPLE_RATE) {
  const chromaInterval = getFrameInterval('chroma');
  const fps = Math.round(1 / chromaInterval);
  console.log(`${timestamp()} 🎼 Extracting HPCP Chroma (${fps}fps)...`);
  
  const frames = [];
  const totalDuration = audioSignal.length / sampleRate;
  const numFrames = Math.floor(totalDuration / chromaInterval);
  
  console.log(`${timestamp()}    Processing ${numFrames} chroma frames at ${fps}fps...`);
  
  try {
    for (let i = 0; i < numFrames; i++) {
      const frameTime = i * chromaInterval;
      const startSample = Math.round(frameTime * sampleRate);
      const frameData = audioSignal.slice(startSample, startSample + FRAME_SIZE);
      
      if (frameData.length < FRAME_SIZE) break;
      
      // Compute spectrum with enough resolution for chroma
      const spectrum = computeSpectrumFast(frameData, 256);
      
      // Map to 12 pitch classes
      const chroma = new Array(12).fill(0);
      const nyquist = sampleRate / 2;
      const numBins = spectrum.length;
      
      for (let bin = 1; bin < numBins; bin++) {
        const freq = (bin / numBins) * nyquist;
        if (freq > 60 && freq < 4000) {
          // Convert frequency to pitch class (0-11)
          const midiNote = 12 * Math.log2(freq / 440) + 69;
          const pitchClass = Math.round(midiNote) % 12;
          if (pitchClass >= 0 && pitchClass < 12) {
            chroma[pitchClass] += spectrum[bin];
          }
        }
      }
      
      // Store RAW accumulated energies. The old per-frame max-normalization
      // (c / maxChroma) made every frame peak at 1.0, flattening the
      // difference between a slamming chord and near-silence. Track-relative
      // scaling now happens at render time (getAnalysisAtTime).
      frames.push({
        time: frameTime,
        chroma
      });
    }
  } catch (error) {
    console.warn('⚠️ Chroma extraction error:', error.message);
    return [];
  }
  
  console.log(`${timestamp()} ✅ Extracted ${frames.length} HPCP chroma frames (${fps}fps)`);
  return frames;
}

/**
 * Extract Pitch (fundamental frequency) using Web Worker for non-blocking processing
 * Uses PitchMelodia algorithm with configurable frame intervals
 * Returns: Array of pitch values over time
 */
export async function extractPitch(audioSignal, sampleRate = SAMPLE_RATE) {
  const pitchInterval = getFrameInterval('pitch');
  const fps = Math.round(1 / pitchInterval);
  console.log(`${timestamp()} 🎼 Extracting Pitch (${fps}fps, Web Worker)...`);
  
  return new Promise((resolve, reject) => {
    // Create worker from dedicated file in public folder
    const worker = new Worker(`${import.meta.env.BASE_URL}pitch-worker.js`);
    
    worker.onmessage = (e) => {
      const { type, frames, message } = e.data;
      
      if (type === 'progress') {
        console.log(`${timestamp()}    ${message}`);
      } else if (type === 'result') {
        console.log(`${timestamp()} ✅ Extracted ${frames.length} pitch frames`);
        worker.terminate();
        resolve(frames);
      } else if (type === 'error') {
        console.error(`❌ Pitch worker error: ${message}`);
        worker.terminate();
        reject(new Error(message));
      }
    };
    
    worker.onerror = (error) => {
      console.error(`❌ Worker error: ${error.message}`);
      worker.terminate();
      reject(new Error(error.message || 'Worker failed'));
    };
    
    // Copy audio data and send to worker with frame interval
    const audioArray = new Float32Array(audioSignal);
    worker.postMessage(
      { audioSignal: audioArray, sampleRate, frameSize: FRAME_SIZE, frameInterval: pitchInterval },
      [audioArray.buffer]  // Transfer ownership for performance
    );
  });
}

/**
 * Extract BPM and beat positions
 * Returns beat density in 0.1s intervals along with raw beat timestamps
 */
export async function extractRhythm(audioSignal, sampleRate = SAMPLE_RATE, duration = null) {
  const frameInterval = getFrameInterval('rhythm');
  console.log(`${timestamp()} 🎼 Extracting Rhythm (BPM & Beats, Web Worker)...`);
  
  return new Promise((resolve, reject) => {
    // Create worker
    const worker = new Worker(`${import.meta.env.BASE_URL}rhythm-worker.js`);
    
    worker.onmessage = (e) => {
      const { type, bpm, beats, beatDensity, confidence, message } = e.data;
      
      if (type === 'progress') {
        console.log(`${timestamp()}    ${message}`);
      } else if (type === 'result') {
        console.log(`${timestamp()} ✅ ${message}`);
        worker.terminate();
        resolve({
          bpm,
          beats,
          beatDensity,
          confidence
        });
      } else if (type === 'error') {
        console.error(`❌ Rhythm worker error: ${message}`);
        worker.terminate();
        reject(new Error(message));
      }
    };
    
    worker.onerror = (error) => {
        console.error(`❌ Worker error: ${error.message}`);
        worker.terminate();
        reject(new Error(error.message || 'Worker failed'));
    };
    
    const audioArray = new Float32Array(audioSignal);
    worker.postMessage(
      { 
          audioSignal: audioArray, 
          sampleRate, 
          duration, 
          frameInterval 
      },
      [audioArray.buffer] // Transfer ownership
    );
  });
}

/**
 * Full audio analysis - extracts all features
 * Each extractor is wrapped in try-catch to prevent total failure
 * 
 * @param {string} audioUrl - URL to the audio file
 * @param {string} artistName - Optional artist name for caching
 * @param {string} songName - Optional song name for caching
 * @param {number} spotifyDurationMs - Optional Spotify track duration in milliseconds for comparison logging
 */
export async function analyzeAudio(audioUrl, artistName = null, songName = null, spotifyDurationMs = null) {
  // Cancel any previous ongoing analysis
  cancelAnalysis();
  
  // Create new AbortController for this analysis
  currentAnalysisController = new AbortController();
  const signal = currentAnalysisController.signal;
  
  try {
    // Check for cached analysis on server first (if artist/song provided)
    if (artistName && songName) {
      const cachedAnalysis = await loadServerAnalysis(artistName, songName);
      if (cachedAnalysis) {
        console.log(`${timestamp()} ═══════════════════════════════════════════════`);
        console.log(`${timestamp()} 📦 Using CACHED Analysis Data (from server)`);
        console.log(`${timestamp()} ═══════════════════════════════════════════════`);
        console.log(`${timestamp()}    Duration: ${cachedAnalysis.duration?.toFixed(2)}s`);
        console.log(`${timestamp()}    Mel frames: ${cachedAnalysis.features?.melSpectrogram?.length || 0}`);
        console.log(`${timestamp()}    Chroma frames: ${cachedAnalysis.features?.hpcpChroma?.length || 0}`);
        console.log(`${timestamp()}    Pitch frames: ${cachedAnalysis.features?.pitch?.length || 0}`);
        console.log(`${timestamp()}    BPM: ${cachedAnalysis.features?.rhythm?.bpm?.toFixed(1) || 'N/A'}`);
        console.log(`${timestamp()} ═══════════════════════════════════════════════`);
        currentAnalysisController = null; // Clear controller on success
        return cachedAnalysis;
      }
    }

    console.log(`${timestamp()} ═══════════════════════════════════════════════`);
    console.log(`${timestamp()} 🎵 Starting Full Audio Analysis`);
    console.log(`${timestamp()} ═══════════════════════════════════════════════`);
    
    const startTime = Date.now();
    
    // Check for cancellation before each major step
    shouldContinueAnalysis(signal);
    
    // Fetch and decode audio - pass signal for cancellation
    const audioBuffer = await fetchAudioBuffer(audioUrl, signal);
    const monoSignal = audioBufferToMono(audioBuffer);
    
    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    
    console.log(`${timestamp()} 📊 Audio: ${duration.toFixed(2)}s @ ${sampleRate}Hz`);
    
    // Check for cancellation before feature extraction
    shouldContinueAnalysis(signal);
    
    // Extract features with error handling for each
    let melSpectrogram = [];
    let hpcpChroma = [];
    let pitch = [];
    let rhythm = { bpm: 120, beats: [], beatDensity: [], confidence: 0 };
    
    // Extract rhythm first (most reliable) - pass duration for beat density calculation
    try {
      shouldContinueAnalysis(signal);
      rhythm = await extractRhythm(monoSignal, sampleRate, duration);
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      console.warn('⚠️ Rhythm extraction failed:', error.message);
    }
    
    // Extract pitch (reliable)
    try {
      shouldContinueAnalysis(signal);
      pitch = await extractPitch(monoSignal, sampleRate);
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      console.warn('⚠️ Pitch extraction failed:', error.message);
    }
    
    // Extract mel spectrogram (now uses pure JS, no WASM crashes)
    try {
      shouldContinueAnalysis(signal);
      melSpectrogram = await extractMelSpectrogram(monoSignal, sampleRate);
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      console.warn('⚠️ Mel spectrogram extraction failed:', error.message);
    }
    
    // Extract chroma (now uses pure JS, no WASM crashes)
    try {
      shouldContinueAnalysis(signal);
      hpcpChroma = await extractHPCPChroma(monoSignal, sampleRate);
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      console.warn('⚠️ Chroma extraction failed:', error.message);
    }
    
    const analysisTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Get intervals for each analysis type for generating default frames
  const melInterval = getFrameInterval('mel');
  const chromaInterval = getFrameInterval('chroma');
  const pitchInterval = getFrameInterval('pitch');
  const rhythmInterval = getFrameInterval('rhythm');
  
  // Calculate expected number of frames for each type
  const melFrameCount = Math.ceil(duration / melInterval);
  const chromaFrameCount = Math.ceil(duration / chromaInterval);
  const pitchFrameCount = Math.ceil(duration / pitchInterval);
  const rhythmFrameCount = Math.ceil(duration / rhythmInterval);
  
  // Fill in default frames for any failed extractions to ensure visualization works
  if (!melSpectrogram || melSpectrogram.length === 0) {
    console.log(`${timestamp()}    ⚠️ Generating default mel frames (extraction failed)`);
    melSpectrogram = [];
    for (let i = 0; i < melFrameCount; i++) {
      melSpectrogram.push({ time: i * melInterval, bands: new Array(40).fill(0) });
    }
  }
  
  if (!hpcpChroma || hpcpChroma.length === 0) {
    console.log(`${timestamp()}    ⚠️ Generating default chroma frames (extraction failed)`);
    hpcpChroma = [];
    for (let i = 0; i < chromaFrameCount; i++) {
      hpcpChroma.push({ time: i * chromaInterval, chroma: new Array(12).fill(0) });
    }
  }
  
  if (!pitch || pitch.length === 0) {
    console.log(`${timestamp()}    ⚠️ Generating default pitch frames (extraction failed)`);
    pitch = [];
    for (let i = 0; i < pitchFrameCount; i++) {
      pitch.push({ time: i * pitchInterval, pitch: 0, confidence: 0 });
    }
  }
  
  // Ensure rhythm has all required fields
  if (!rhythm.beats) rhythm.beats = [];
  if (!rhythm.beatDensity || rhythm.beatDensity.length === 0) {
    rhythm.beatDensity = [];
    for (let i = 0; i < rhythmFrameCount; i++) {
      rhythm.beatDensity.push({ time: i * rhythmInterval, beats: 0 });
    }
  }
  if (!rhythm.bpm) rhythm.bpm = 120;
  if (!rhythm.confidence) rhythm.confidence = 0;
  
  console.log(`${timestamp()} ═══════════════════════════════════════════════`);
  console.log(`${timestamp()} ✅ Analysis complete in ${analysisTime}s`);
  console.log(`${timestamp()}    Mel frames: ${melSpectrogram.length}`);
  console.log(`${timestamp()}    Chroma frames: ${hpcpChroma.length}`);
  console.log(`${timestamp()}    Pitch frames: ${pitch.length}`);
  console.log(`${timestamp()}    Beats: ${rhythm.beats?.length || 0}`);
  console.log(`${timestamp()}    BPM: ${rhythm.bpm?.toFixed(1) || 'N/A'}`);
  
  // Log duration comparison between Spotify and MP3
  if (spotifyDurationMs) {
    const spotifyDurationSec = Math.round(spotifyDurationMs / 1000);
    const mp3DurationSec = Math.round(duration);
    console.log(`${timestamp()}    Spotify song length: ${spotifyDurationSec}s`);
    console.log(`${timestamp()}    MP3 song length: ${mp3DurationSec}s`);
  }
  console.log(`${timestamp()} ═══════════════════════════════════════════════`);
  
  const analysisResult = {
    duration,
    sampleRate,
    analysisTime: parseFloat(analysisTime),
    // v2: mel/chroma are stored RAW (no log scaling, no per-frame
    // normalization). Render-time scaling lives in getAnalysisAtTime.
    rawFeatures: true,
    features: {
      melSpectrogram,
      hpcpChroma,
      pitch,
      rhythm
    }
  };

  // Cache the analysis on server (if artist/song provided)
  if (artistName && songName) {
    await saveServerAnalysis(artistName, songName, analysisResult);
  }

  // Clear controller on success
  currentAnalysisController = null;
  
  return analysisResult;
  } catch (error) {
    // Handle cancellation gracefully
    if (error.name === 'AbortError') {
      console.log(`${timestamp()} 🛑 Audio analysis was cancelled`);
      return null;
    }
    // Re-throw other errors
    throw error;
  } finally {
    // Ensure controller is cleared
    if (currentAnalysisController?.signal.aborted) {
      currentAnalysisController = null;
    }
  }
}

/**
 * Get analysis data at a specific time position with interpolation
 * Used to sync visualization with Spotify playback
 * Now interpolates between frames for smoother, more precise visualization
 */
/**
 * Compute track-global scale factors for raw (v2) analysis data, cached on
 * the analysisData object. Scaling against the TRACK max (not per-frame max)
 * preserves the dynamics between loud and quiet moments.
 */
function getRawScale(analysisData) {
  if (analysisData._rawScale) return analysisData._rawScale;
  let chromaMax = 0;
  let melMax = 0;
  for (const frame of analysisData.features.hpcpChroma || []) {
    for (const v of frame.chroma || []) if (v > chromaMax) chromaMax = v;
  }
  for (const frame of analysisData.features.melSpectrogram || []) {
    for (const v of frame.bands || []) if (v > melMax) melMax = v;
  }
  analysisData._rawScale = {
    chromaMax: chromaMax || 1,
    melMax: melMax || 1,
  };
  return analysisData._rawScale;
}

export function getAnalysisAtTime(analysisData, timeInSeconds) {
  if (!analysisData || !analysisData.features) return null;

  const { melSpectrogram, hpcpChroma, pitch, rhythm } = analysisData.features;
  
  // Find surrounding frames and interpolation factor for smooth transitions
  const findFramesWithInterpolation = (frames, time) => {
    if (!frames || frames.length === 0) return { frame: null, nextFrame: null, t: 0 };
    
    // Binary search for the frame just before or at the target time
    let left = 0;
    let right = frames.length - 1;
    
    while (left < right) {
      const mid = Math.floor((left + right + 1) / 2);
      if (frames[mid].time <= time) {
        left = mid;
      } else {
        right = mid - 1;
      }
    }
    
    const frame = frames[left];
    const nextFrame = left + 1 < frames.length ? frames[left + 1] : null;
    
    // Calculate interpolation factor (0-1 between frames)
    let t = 0;
    if (nextFrame && frame) {
      const frameDuration = nextFrame.time - frame.time;
      if (frameDuration > 0) {
        t = (time - frame.time) / frameDuration;
        t = Math.max(0, Math.min(1, t)); // Clamp to 0-1
      }
    }
    
    return { frame, nextFrame, t };
  };
  
  // Interpolate array values (for mel bands or chroma)
  const interpolateArray = (arr1, arr2, t) => {
    if (!arr1) return arr2 || null;
    if (!arr2) return arr1;
    return arr1.map((v, i) => v + (arr2[i] - v) * t);
  };
  
  // Interpolate single values
  const interpolateValue = (v1, v2, t) => {
    if (v1 === undefined || v1 === null) return v2 || 0;
    if (v2 === undefined || v2 === null) return v1;
    return v1 + (v2 - v1) * t;
  };
  
  // Check if we're on a beat - with more precision
  const isOnBeat = (time, beats, tolerance = 0.05) => {
    if (!beats) return { onBeat: false, beatStrength: 0 };
    
    // Handle both array and object formats (for backwards compatibility with cached data)
    let beatsArray = beats;
    if (!Array.isArray(beats)) {
      // Convert object {0: val, 1: val, ...} to array
      const keys = Object.keys(beats).filter(k => !isNaN(k)).sort((a, b) => Number(a) - Number(b));
      beatsArray = keys.map(k => beats[k]);
    }
    
    if (beatsArray.length === 0) return { onBeat: false, beatStrength: 0 };
    
    for (let i = 0; i < beatsArray.length; i++) {
      const beatTime = beatsArray[i];
      const diff = Math.abs(time - beatTime);
      if (diff < tolerance) {
        // Calculate beat strength based on proximity - smoother falloff
        const strength = 1 - (diff / tolerance);
        const isDownbeat = i % 4 === 0; // Every 4th beat is stronger
        return {
          onBeat: true,
          beatStrength: strength * (isDownbeat ? 1.5 : 1),
          beatIndex: i
        };
      }
    }
    return { onBeat: false, beatStrength: 0 };
  };
  
  // Get interpolated mel spectrogram (with fallback to default zeros)
  const melResult = findFramesWithInterpolation(melSpectrogram, timeInSeconds);
  const interpolatedMel = melResult.frame ? 
    interpolateArray(melResult.frame.bands, melResult.nextFrame?.bands, melResult.t) : 
    new Array(40).fill(0); // Default 40 zero bands if no data
  
  // Get interpolated chroma (higher resolution, but still interpolate, with fallback)
  const chromaResult = findFramesWithInterpolation(hpcpChroma, timeInSeconds);
  const interpolatedChroma = chromaResult.frame ?
    interpolateArray(chromaResult.frame.chroma, chromaResult.nextFrame?.chroma, chromaResult.t) :
    new Array(12).fill(0); // Default 12 zero chroma values if no data
  
  // Get interpolated pitch
  const pitchResult = findFramesWithInterpolation(pitch, timeInSeconds);
  const interpolatedPitch = interpolateValue(
    pitchResult.frame?.pitch, 
    pitchResult.nextFrame?.pitch, 
    pitchResult.t
  );
  const interpolatedConfidence = interpolateValue(
    pitchResult.frame?.confidence,
    pitchResult.nextFrame?.confidence,
    pitchResult.t
  );
  
  const beatInfo = isOnBeat(timeInSeconds, rhythm?.beats);

  // v2 raw data: scale against TRACK-GLOBAL maxima so dynamics survive.
  // - chroma: raw / track max — a big chord peaks near 1, quiet parts stay low
  //   (the old per-frame normalization forced every frame's peak to 1.0)
  // - mel: sqrt(raw / track max) mapped onto the legacy dB-ish range so the
  //   waveform convention (mel + 10) / 10 keeps working unchanged. sqrt is a
  //   gentle perceptual default; waveforms wanting true raw get melRaw/chromaRaw.
  // Legacy (v1) cached JSONs pass through exactly as before.
  let outMel = interpolatedMel;
  let outChroma = interpolatedChroma;
  let melRaw = null;
  let chromaRaw = null;
  if (analysisData.rawFeatures) {
    const scale = getRawScale(analysisData);
    melRaw = interpolatedMel;
    chromaRaw = interpolatedChroma;
    outChroma = interpolatedChroma.map(v => v / scale.chromaMax);
    outMel = interpolatedMel.map(v => Math.sqrt(Math.max(0, v) / scale.melMax) * 10 - 10);
  }

  return {
    time: timeInSeconds,
    mel: outMel,
    chroma: outChroma,
    melRaw,
    chromaRaw,
    pitch: interpolatedPitch,
    pitchConfidence: interpolatedConfidence,
    bpm: rhythm?.bpm || 120,
    ...beatInfo
  };
}

/**
 * Create a time-indexed lookup for faster access during visualization
 */
export function createTimeLookup(analysisData, resolution = 0.02) {
  if (!analysisData) return null;
  
  const duration = analysisData.duration;
  const lookup = [];
  
  for (let t = 0; t < duration; t += resolution) {
    lookup.push(getAnalysisAtTime(analysisData, t));
  }
  
  return {
    data: lookup,
    resolution,
    duration
  };
}

/**
 * @deprecated loadEssentia is no longer used in the main thread.
 * Essentia is loaded within workers (rhythm-worker.js, pitch-worker.js).
 * Kept for basic backward compatibility if needed, but returns null.
 */
export async function loadEssentia() {
    console.warn('loadEssentia() called but it is deprecated. Workers process audio now.');
    return null;
}

export default {
  loadEssentia,
  analyzeAudio,
  getAnalysisAtTime,
  createTimeLookup,
  extractMelSpectrogram,
  extractHPCPChroma,
  extractPitch,
  extractRhythm,
  isAnalysisCached,
  getCachedAnalysis
};
