// Audio Analysis Service using Essentia.js
// Extracts Melspectrogram, HPCP Chroma, and Pitch data from MP3 files
// For educational research purposes - Spotify & Google Research Project

import { API_BASE_URL } from './config';

// Constants for audio analysis
const SAMPLE_RATE = 44100;
const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;
const FRAME_INTERVAL = 0.1; // 10fps (0.1s intervals) - sufficient for smooth visualization

// Server URL for analysis cache
const SERVER_URL = API_BASE_URL;

// Timestamp helper for console logs
const timestamp = () => {
  const now = new Date();
  return `[${now.toLocaleTimeString('en-US', { hour12: false })}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
};

// ==================== SERVER-BASED ANALYSIS CACHE ====================

/**
 * Check if analysis is cached on server
 */
async function checkServerAnalysisCache(artistName, songName) {
  try {
    const params = new URLSearchParams({ artist: artistName, song: songName });
    const response = await fetch(`${SERVER_URL}/check-analysis-cache?${params}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.cached ? data : null;
  } catch (error) {
    console.warn('Could not check server analysis cache:', error);
    return null;
  }
}

/**
 * Normalize analysis data to ensure consistent structure
 * Converts object-style arrays back to proper arrays and fills missing data with defaults
 */
function normalizeAnalysisData(data) {
  if (!data || !data.features) return data;
  
  const duration = data.duration || 0;
  const numFrames = Math.ceil(duration / FRAME_INTERVAL);
  
  // Helper: Convert object with numeric keys to array (fixes JSON serialization issue)
  const objectToArray = (obj) => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    // Convert {0: val, 1: val, ...} to [val, val, ...]
    const keys = Object.keys(obj).filter(k => !isNaN(k)).sort((a, b) => Number(a) - Number(b));
    return keys.map(k => obj[k]);
  };
  
  // Helper: Create default chroma frame (12 zeros)
  const defaultChromaFrame = (time) => ({ time, chroma: new Array(12).fill(0) });
  
  // Helper: Create default mel frame (40 zeros)
  const defaultMelFrame = (time) => ({ time, bands: new Array(40).fill(0) });
  
  // Helper: Create default pitch frame
  const defaultPitchFrame = (time) => ({ time, pitch: 0, confidence: 0 });
  
  // Helper: Create default beat density frame
  const defaultBeatDensityFrame = (time) => ({ time, beats: 0 });
  
  // Normalize rhythm.beats - convert object to array if needed
  if (data.features.rhythm) {
    data.features.rhythm.beats = objectToArray(data.features.rhythm.beats);
    data.features.rhythm.beatDensity = objectToArray(data.features.rhythm.beatDensity);
    
    // Ensure defaults
    if (!data.features.rhythm.bpm) data.features.rhythm.bpm = 120;
    if (!data.features.rhythm.confidence) data.features.rhythm.confidence = 0;
    
    // Fill beat density if empty
    if (!data.features.rhythm.beatDensity || data.features.rhythm.beatDensity.length === 0) {
      data.features.rhythm.beatDensity = [];
      for (let i = 0; i < numFrames; i++) {
        data.features.rhythm.beatDensity.push(defaultBeatDensityFrame(i * FRAME_INTERVAL));
      }
    }
  } else {
    // Create default rhythm object
    data.features.rhythm = {
      bpm: 120,
      beats: [],
      beatDensity: [],
      confidence: 0
    };
    for (let i = 0; i < numFrames; i++) {
      data.features.rhythm.beatDensity.push(defaultBeatDensityFrame(i * FRAME_INTERVAL));
    }
  }
  
  // Normalize hpcpChroma - ensure 12 values per frame
  if (data.features.hpcpChroma && data.features.hpcpChroma.length > 0) {
    data.features.hpcpChroma = data.features.hpcpChroma.map((frame, idx) => {
      if (!frame.chroma || frame.chroma.length !== 12) {
        return defaultChromaFrame(frame.time ?? idx * FRAME_INTERVAL);
      }
      return frame;
    });
  } else {
    // Create default chroma frames
    data.features.hpcpChroma = [];
    for (let i = 0; i < numFrames; i++) {
      data.features.hpcpChroma.push(defaultChromaFrame(i * FRAME_INTERVAL));
    }
  }
  
  // Normalize melSpectrogram - ensure 40 bands per frame
  if (data.features.melSpectrogram && data.features.melSpectrogram.length > 0) {
    data.features.melSpectrogram = data.features.melSpectrogram.map((frame, idx) => {
      if (!frame.bands || frame.bands.length !== 40) {
        return defaultMelFrame(frame.time ?? idx * FRAME_INTERVAL);
      }
      return frame;
    });
  } else {
    // Create default mel frames
    data.features.melSpectrogram = [];
    for (let i = 0; i < numFrames; i++) {
      data.features.melSpectrogram.push(defaultMelFrame(i * FRAME_INTERVAL));
    }
  }
  
  // Normalize pitch - ensure proper structure
  if (data.features.pitch && data.features.pitch.length > 0) {
    data.features.pitch = data.features.pitch.map((frame, idx) => {
      if (frame.pitch === undefined) {
        return defaultPitchFrame(frame.time ?? idx * FRAME_INTERVAL);
      }
      return {
        time: frame.time ?? idx * FRAME_INTERVAL,
        pitch: frame.pitch ?? 0,
        confidence: frame.confidence ?? 0
      };
    });
  } else {
    // Create default pitch frames
    data.features.pitch = [];
    for (let i = 0; i < numFrames; i++) {
      data.features.pitch.push(defaultPitchFrame(i * FRAME_INTERVAL));
    }
  }
  
  return data;
}

/**
 * Load analysis from server cache
 */
async function loadServerAnalysis(artistName, songName) {
  try {
    const params = new URLSearchParams({ artist: artistName, song: songName });
    const response = await fetch(`${SERVER_URL}/get-analysis?${params}`);
    if (!response.ok) return null;
    const data = await response.json();
    
    // Normalize the data structure to ensure consistency
    const normalizedData = normalizeAnalysisData(data);
    
    console.log(`${timestamp()} 📦 Loaded analysis from server for: ${artistName} - ${songName}`);
    console.log(`${timestamp()}    Beats array: ${normalizedData.features?.rhythm?.beats?.length || 0} items`);
    return normalizedData;
  } catch (error) {
    console.warn('Could not load server analysis:', error);
    return null;
  }
}

/**
 * Prepare analysis data for saving - ensures arrays are properly serializable
 */
function prepareAnalysisForSave(data) {
  if (!data || !data.features) return data;
  
  // Ensure beats is a proper array (not a typed array or object)
  if (data.features.rhythm && data.features.rhythm.beats) {
    // Convert to plain array to ensure JSON serialization works correctly
    data.features.rhythm.beats = Array.from(data.features.rhythm.beats);
  }
  
  // Also ensure beatDensity is properly serializable
  if (data.features.rhythm && data.features.rhythm.beatDensity) {
    data.features.rhythm.beatDensity = Array.from(data.features.rhythm.beatDensity);
  }
  
  return data;
}

/**
 * Save analysis to server cache
 */
async function saveServerAnalysis(artistName, songName, analysisData) {
  try {
    // Prepare data for serialization (ensure arrays are proper arrays)
    const preparedData = prepareAnalysisForSave(analysisData);
    
    const response = await fetch(`${SERVER_URL}/save-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist: artistName,
        song: songName,
        data: preparedData
      })
    });
    
    if (!response.ok) {
      console.warn('Failed to save analysis to server:', response.status);
      return false;
    }
    
    const result = await response.json();
    console.log(`${timestamp()} 💾 Saved analysis to server: ${result.filename} (${(result.size / 1024).toFixed(1)}KB)`);
    console.log(`${timestamp()}    Beats saved: ${preparedData.features?.rhythm?.beats?.length || 0} items`);
    return true;
  } catch (error) {
    console.warn('Could not save analysis to server:', error);
    return false;
  }
}

/**
 * Check if analysis is cached for a track (public)
 */
export async function isAnalysisCached(artistName, songName) {
  const cached = await checkServerAnalysisCache(artistName, songName);
  return cached !== null;
}

/**
 * Get cached analysis if available (public)
 */
export async function getCachedAnalysis(artistName, songName) {
  return await loadServerAnalysis(artistName, songName);
}

// Essentia.js WASM modules will be loaded dynamically
let essentia = null;
let essentiaWASM = null;
let isEssentiaLoaded = false;
let loadingPromise = null;

/**
 * Load Essentia.js WASM module (non-blocking)
 * Loads scripts in parallel and uses chunked WASM initialization to prevent UI freezing
 */
export async function loadEssentia() {
  if (isEssentiaLoaded && essentia) {
    return essentia;
  }
  
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise(async (resolve, reject) => {
    try {
      console.log(`${timestamp()} 🎵 Loading Essentia.js WASM module (non-blocking)...`);
      
      // Load BOTH scripts in parallel for faster loading
      const wasmScriptPromise = new Promise((res, rej) => {
        const wasmScript = document.createElement('script');
        wasmScript.src = `${import.meta.env.BASE_URL}essentia-wasm.web.js`;
        wasmScript.async = true;
        wasmScript.onload = res;
        wasmScript.onerror = () => rej(new Error('Failed to load essentia-wasm'));
        document.head.appendChild(wasmScript);
      });
      
      const coreScriptPromise = new Promise((res, rej) => {
        const coreScript = document.createElement('script');
        coreScript.src = `${import.meta.env.BASE_URL}essentia.js-core.js`;
        coreScript.async = true;
        coreScript.onload = res;
        coreScript.onerror = () => rej(new Error('Failed to load essentia.js-core'));
        document.head.appendChild(coreScript);
      });
      
      // Wait for both scripts to load in parallel
      await Promise.all([wasmScriptPromise, coreScriptPromise]);
      console.log(`${timestamp()} 📜 Scripts loaded, initializing WASM...`);
      
      // Use requestIdleCallback for WASM initialization to avoid blocking UI
      const initWasm = () => new Promise((res, rej) => {
        const doInit = async () => {
          try {
            console.log(`${timestamp()} 🔧 Initializing WASM module...`);
            essentiaWASM = await window.EssentiaWASM();
            essentia = new window.Essentia(essentiaWASM);
            isEssentiaLoaded = true;
            console.log(`${timestamp()} ✅ Essentia.js loaded successfully!`);
            res(essentia);
          } catch (err) {
            rej(err);
          }
        };
        
        // Schedule WASM init during idle time if available
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => doInit(), { timeout: 5000 });
        } else {
          // Fallback: use setTimeout to at least yield one frame
          setTimeout(() => doInit(), 0);
        }
      });
      
      const result = await initWasm();
      resolve(result);
    } catch (error) {
      console.error('❌ Failed to load Essentia.js:', error);
      loadingPromise = null; // Reset so it can be retried
      reject(error);
    }
  });
  
  return loadingPromise;
}

/**
 * Fetch and decode audio from URL to AudioBuffer
 * Properly closes AudioContext after decoding to prevent memory leaks
 */
export async function fetchAudioBuffer(audioUrl) {
  console.log(`${timestamp()} 📥 Fetching audio from:`, audioUrl);
  
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: SAMPLE_RATE
  });
  
  try {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    console.log(`${timestamp()} ✅ Audio decoded:`, {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels
    });
    
    return audioBuffer;
  } catch (error) {
    console.error('❌ Failed to fetch/decode audio:', error);
    throw error;
  } finally {
    // Close AudioContext to prevent memory leaks
    // The decoded AudioBuffer remains valid after closing
    if (audioContext.state !== 'closed') {
      try {
        await audioContext.close();
        console.log(`${timestamp()} 🧹 AudioContext closed`);
      } catch (closeError) {
        console.warn('Could not close AudioContext:', closeError);
      }
    }
  }
}

/**
 * Convert AudioBuffer to mono Float32Array
 */
export function audioBufferToMono(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const monoData = new Float32Array(length);
  
  if (numChannels === 1) {
    monoData.set(audioBuffer.getChannelData(0));
  } else {
    // Mix down to mono
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    for (let i = 0; i < length; i++) {
      monoData[i] = (left[i] + right[i]) / 2;
    }
  }
  
  return monoData;
}

/**
 * Pure JavaScript FFT implementation (DFT for small sizes)
 * Avoids Essentia.js WASM crashes with Windowing/Spectrum
 */
function computeSpectrum(frameData) {
  const n = frameData.length;
  const spectrum = new Float32Array(n / 2);
  
  // Apply Hann window
  const windowed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const hannValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
    windowed[i] = frameData[i] * hannValue;
  }
  
  // Compute DFT magnitude spectrum (first half)
  for (let k = 0; k < n / 2; k++) {
    let real = 0, imag = 0;
    for (let t = 0; t < n; t++) {
      const angle = -2 * Math.PI * k * t / n;
      real += windowed[t] * Math.cos(angle);
      imag += windowed[t] * Math.sin(angle);
    }
    spectrum[k] = Math.sqrt(real * real + imag * imag) / n;
  }
  
  return spectrum;
}

/**
 * Fast spectrum computation with configurable output bins
 * More efficient for real-time visualization
 */
function computeSpectrumFast(frameData, outputBins = 128) {
  const N = frameData.length;
  const spectrum = new Float32Array(outputBins);
  
  // Apply Hann window
  const windowed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
    windowed[i] = frameData[i] * windowValue;
  }
  
  // Compute only the bins we need with downsampled computation
  for (let k = 0; k < outputBins; k++) {
    let real = 0, imag = 0;
    const freq = k * (N / 2) / outputBins;
    
    // Downsample the computation for speed
    const step = Math.max(1, Math.floor(N / 256));
    for (let n = 0; n < N; n += step) {
      const angle = -2 * Math.PI * freq * n / N;
      real += windowed[n] * Math.cos(angle);
      imag += windowed[n] * Math.sin(angle);
    }
    spectrum[k] = Math.sqrt(real * real + imag * imag) / (N / step);
  }
  
  return spectrum;
}

/**
 * Extract Mel Spectrogram from audio signal using pure JavaScript
 * Uses 0.1s intervals for consistent frame timing
 * Returns: Array of frames, each containing mel band energies
 */
export async function extractMelSpectrogram(audioSignal, sampleRate = SAMPLE_RATE) {
  console.log(`${timestamp()} 🎼 Extracting Mel Spectrogram (10fps)...`);
  
  const frames = [];
  const numBands = 40;
  const totalDuration = audioSignal.length / sampleRate;
  const numFrames = Math.floor(totalDuration / FRAME_INTERVAL);
  
  console.log(`${timestamp()}    Processing ${numFrames} frames at 10fps from ${totalDuration.toFixed(1)}s audio...`);
  
  try {
    for (let i = 0; i < numFrames; i++) {
      const frameTime = i * FRAME_INTERVAL;
      const startSample = Math.round(frameTime * sampleRate);
      const frameData = audioSignal.slice(startSample, startSample + FRAME_SIZE);
      
      if (frameData.length < FRAME_SIZE) break;
      
      // Use fast spectrum computation
      const spectrum = computeSpectrumFast(frameData, numBands * 2);
      
      // Group into mel-like bands
      const bands = [];
      const binsPerBand = 2;
      for (let b = 0; b < numBands; b++) {
        let sum = 0;
        for (let j = 0; j < binsPerBand; j++) {
          sum += spectrum[b * binsPerBand + j] || 0;
        }
        // Log scale for better visualization
        bands.push(Math.log10(1 + sum * 100) * 10);
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
  
  console.log(`${timestamp()} ✅ Extracted ${frames.length} mel spectrogram frames (10fps)`);
  return frames;
}

/**
 * Extract HPCP (Harmonic Pitch Class Profile) Chroma from audio signal
 * Uses pure JavaScript and 0.1s intervals
 * Returns: Array of frames, each containing 12 chroma values (C, C#, D, ... B)
 */
export async function extractHPCPChroma(audioSignal, sampleRate = SAMPLE_RATE) {
  console.log(`${timestamp()} 🎼 Extracting HPCP Chroma (10fps)...`);
  
  const CHROMA_INTERVAL = 0.1; // 10fps for chroma (reduced from 30fps for performance)
  const frames = [];
  const totalDuration = audioSignal.length / sampleRate;
  const numFrames = Math.floor(totalDuration / CHROMA_INTERVAL);
  
  console.log(`${timestamp()}    Processing ${numFrames} chroma frames at 10fps...`);
  
  try {
    for (let i = 0; i < numFrames; i++) {
      const frameTime = i * CHROMA_INTERVAL;
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
      
      // Normalize
      const maxChroma = Math.max(...chroma, 0.001);
      const normalizedChroma = chroma.map(c => c / maxChroma);
      
      frames.push({
        time: frameTime,
        chroma: normalizedChroma
      });
    }
  } catch (error) {
    console.warn('⚠️ Chroma extraction error:', error.message);
    return [];
  }
  
  console.log(`${timestamp()} ✅ Extracted ${frames.length} HPCP chroma frames (10fps)`);
  return frames;
}

/**
 * Extract Pitch (fundamental frequency) using Web Worker for non-blocking processing
 * Uses PitchMelodia algorithm with optimized hop size for 0.1s intervals
 * Returns: Array of pitch values over time
 */
export async function extractPitch(audioSignal, sampleRate = SAMPLE_RATE) {
  console.log(`${timestamp()} 🎼 Extracting Pitch (Web Worker)...`);
  
  return new Promise((resolve, reject) => {
    // Create worker from dedicated file in public folder
    const worker = new Worker(`${import.meta.env.BASE_URL}pitch-worker.js`);
    
    worker.onmessage = (e) => {
      const { type, frames, totalFrames, message } = e.data;
      
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
    
    // Copy audio data and send to worker
    const audioArray = new Float32Array(audioSignal);
    worker.postMessage(
      { audioSignal: audioArray, sampleRate, frameSize: FRAME_SIZE },
      [audioArray.buffer]  // Transfer ownership for performance
    );
  });
}

/**
 * Extract BPM and beat positions
 * Returns beat density in 0.1s intervals along with raw beat timestamps
 */
export async function extractRhythm(audioSignal, sampleRate = SAMPLE_RATE, duration = null) {
  if (!essentia) await loadEssentia();
  
  console.log(`${timestamp()} 🎼 Extracting Rhythm (BPM & Beats)...`);
  
  const signalVector = essentia.arrayToVector(audioSignal);
  
  const rhythmResult = essentia.RhythmExtractor2013(
    signalVector,
    208,     // maxTempo
    'degara', // method
    40       // minTempo
  );
  
  const rawBeats = essentia.vectorToArray(rhythmResult.ticks);
  const bpm = rhythmResult.bpm;
  const confidence = rhythmResult.confidence;
  
  signalVector.delete();
  rhythmResult.ticks.delete();
  
  // Calculate duration from signal if not provided
  const audioDuration = duration || (audioSignal.length / sampleRate);
  
  // Filter out any beats beyond the audio duration
  const validBeats = rawBeats.filter(t => t <= audioDuration);
  
  // Create 0.1s interval beat density data
  const numFrames = Math.ceil(audioDuration / FRAME_INTERVAL);
  const beatDensity = [];
  
  for (let i = 0; i < numFrames; i++) {
    const frameStart = i * FRAME_INTERVAL;
    const frameEnd = frameStart + FRAME_INTERVAL;
    // Count beats in this frame
    const beatsInFrame = validBeats.filter(t => t >= frameStart && t < frameEnd).length;
    beatDensity.push({
      time: frameStart,
      beats: beatsInFrame
    });
  }
  
  console.log(`${timestamp()} ✅ Extracted BPM: ${bpm.toFixed(1)}, ${validBeats.length} beats, ${beatDensity.length} frames`);
  
  return {
    bpm: bpm,
    beats: validBeats,
    beatDensity: beatDensity,
    confidence: confidence
  };
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
      return cachedAnalysis;
    }
  }

  console.log(`${timestamp()} ═══════════════════════════════════════════════`);
  console.log(`${timestamp()} 🎵 Starting Full Audio Analysis`);
  console.log(`${timestamp()} ═══════════════════════════════════════════════`);
  
  const startTime = Date.now();
  
  // Load essentia if not loaded
  await loadEssentia();
  
  // Fetch and decode audio
  const audioBuffer = await fetchAudioBuffer(audioUrl);
  const monoSignal = audioBufferToMono(audioBuffer);
  
  const duration = audioBuffer.duration;
  const sampleRate = audioBuffer.sampleRate;
  
  console.log(`${timestamp()} 📊 Audio: ${duration.toFixed(2)}s @ ${sampleRate}Hz`);
  
  // Extract features with error handling for each
  let melSpectrogram = [];
  let hpcpChroma = [];
  let pitch = [];
  let rhythm = { bpm: 120, beats: [], beatDensity: [], confidence: 0 };
  
  // Extract rhythm first (most reliable) - pass duration for beat density calculation
  try {
    rhythm = await extractRhythm(monoSignal, sampleRate, duration);
  } catch (error) {
    console.warn('⚠️ Rhythm extraction failed:', error.message);
  }
  
  // Extract pitch (reliable)
  try {
    pitch = await extractPitch(monoSignal, sampleRate);
  } catch (error) {
    console.warn('⚠️ Pitch extraction failed:', error.message);
  }
  
  // Extract mel spectrogram (now uses pure JS, no WASM crashes)
  try {
    melSpectrogram = await extractMelSpectrogram(monoSignal, sampleRate);
  } catch (error) {
    console.warn('⚠️ Mel spectrogram extraction failed:', error.message);
  }
  
  // Extract chroma (now uses pure JS, no WASM crashes)
  try {
    hpcpChroma = await extractHPCPChroma(monoSignal, sampleRate);
  } catch (error) {
    console.warn('⚠️ Chroma extraction failed:', error.message);
  }
  
  const analysisTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Calculate expected number of frames
  const numFrames = Math.ceil(duration / FRAME_INTERVAL);
  
  // Fill in default frames for any failed extractions to ensure visualization works
  if (!melSpectrogram || melSpectrogram.length === 0) {
    console.log(`${timestamp()}    ⚠️ Generating default mel frames (extraction failed)`);
    melSpectrogram = [];
    for (let i = 0; i < numFrames; i++) {
      melSpectrogram.push({ time: i * FRAME_INTERVAL, bands: new Array(40).fill(0) });
    }
  }
  
  if (!hpcpChroma || hpcpChroma.length === 0) {
    console.log(`${timestamp()}    ⚠️ Generating default chroma frames (extraction failed)`);
    hpcpChroma = [];
    for (let i = 0; i < numFrames; i++) {
      hpcpChroma.push({ time: i * FRAME_INTERVAL, chroma: new Array(12).fill(0) });
    }
  }
  
  if (!pitch || pitch.length === 0) {
    console.log(`${timestamp()}    ⚠️ Generating default pitch frames (extraction failed)`);
    pitch = [];
    for (let i = 0; i < numFrames; i++) {
      pitch.push({ time: i * FRAME_INTERVAL, pitch: 0, confidence: 0 });
    }
  }
  
  // Ensure rhythm has all required fields
  if (!rhythm.beats) rhythm.beats = [];
  if (!rhythm.beatDensity || rhythm.beatDensity.length === 0) {
    rhythm.beatDensity = [];
    for (let i = 0; i < numFrames; i++) {
      rhythm.beatDensity.push({ time: i * FRAME_INTERVAL, beats: 0 });
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

  return analysisResult;
}

/**
 * Get analysis data at a specific time position with interpolation
 * Used to sync visualization with Spotify playback
 * Now interpolates between frames for smoother, more precise visualization
 */
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
  
  return {
    time: timeInSeconds,
    mel: interpolatedMel,
    chroma: interpolatedChroma,
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
