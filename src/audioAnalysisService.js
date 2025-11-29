// Audio Analysis Service using Essentia.js
// Extracts Melspectrogram, HPCP Chroma, and Pitch data from MP3 files
// For educational research purposes - Spotify & Google Research Project

// Constants for audio analysis
const SAMPLE_RATE = 44100;
const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;
const FRAME_INTERVAL = 0.1; // 10fps (0.1s intervals) - sufficient for smooth visualization

// Timestamp helper for console logs
const timestamp = () => {
  const now = new Date();
  return `[${now.toLocaleTimeString('en-US', { hour12: false })}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
};

// Essentia.js WASM modules will be loaded dynamically
let essentia = null;
let essentiaWASM = null;
let isEssentiaLoaded = false;
let loadingPromise = null;

/**
 * Load Essentia.js WASM module
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
      console.log(`${timestamp()} 🎵 Loading Essentia.js WASM module...`);
      
      // Load essentia-wasm (local file in public folder)
      const wasmScript = document.createElement('script');
      wasmScript.src = '/essentia-wasm.web.js';
      document.head.appendChild(wasmScript);
      
      await new Promise((res) => {
        wasmScript.onload = res;
        wasmScript.onerror = () => reject(new Error('Failed to load essentia-wasm'));
      });
      
      // Load essentia.js core (local file in public folder)
      const coreScript = document.createElement('script');
      coreScript.src = '/essentia.js-core.js';
      document.head.appendChild(coreScript);
      
      await new Promise((res) => {
        coreScript.onload = res;
        coreScript.onerror = () => reject(new Error('Failed to load essentia.js-core'));
      });
      
      // Initialize Essentia WASM module
      essentiaWASM = await window.EssentiaWASM();
      essentia = new window.Essentia(essentiaWASM);
      
      isEssentiaLoaded = true;
      console.log(`${timestamp()} ✅ Essentia.js loaded successfully!`);
      resolve(essentia);
    } catch (error) {
      console.error('❌ Failed to load Essentia.js:', error);
      reject(error);
    }
  });
  
  return loadingPromise;
}

/**
 * Fetch and decode audio from URL to AudioBuffer
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
  console.log(`${timestamp()} 🎼 Extracting HPCP Chroma (30fps)...`);
  
  const CHROMA_INTERVAL = 0.0333; // 30fps for chroma (lighter computation)
  const frames = [];
  const totalDuration = audioSignal.length / sampleRate;
  const numFrames = Math.floor(totalDuration / CHROMA_INTERVAL);
  
  console.log(`${timestamp()}    Processing ${numFrames} chroma frames at 30fps...`);
  
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
    const worker = new Worker('/pitch-worker.js');
    
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
 */
export async function analyzeAudio(audioUrl) {
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
  
  console.log(`${timestamp()} ═══════════════════════════════════════════════`);
  console.log(`${timestamp()} ✅ Analysis complete in ${analysisTime}s`);
  console.log(`${timestamp()}    Mel frames: ${melSpectrogram.length}`);
  console.log(`${timestamp()}    Chroma frames: ${hpcpChroma.length}`);
  console.log(`${timestamp()}    Pitch frames: ${pitch.length}`);
  console.log(`${timestamp()}    BPM: ${rhythm.bpm?.toFixed(1) || 'N/A'}`);
  console.log(`${timestamp()} ═══════════════════════════════════════════════`);
  
  return {
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
}

/**
 * Get analysis data at a specific time position
 * Used to sync visualization with Spotify playback
 */
export function getAnalysisAtTime(analysisData, timeInSeconds) {
  if (!analysisData || !analysisData.features) return null;
  
  const { melSpectrogram, hpcpChroma, pitch, rhythm } = analysisData.features;
  
  // Find the frame closest to the given time
  const findClosestFrame = (frames, time) => {
    if (!frames || frames.length === 0) return null;
    
    let left = 0;
    let right = frames.length - 1;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (frames[mid].time < time) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    // Return closest frame
    if (left > 0 && Math.abs(frames[left - 1].time - time) < Math.abs(frames[left].time - time)) {
      return frames[left - 1];
    }
    return frames[left];
  };
  
  // Check if we're on a beat
  const isOnBeat = (time, beats, tolerance = 0.05) => {
    if (!beats) return { onBeat: false, beatStrength: 0 };
    
    for (let i = 0; i < beats.length; i++) {
      const beatTime = beats[i];
      const diff = Math.abs(time - beatTime);
      if (diff < tolerance) {
        // Calculate beat strength based on proximity
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
  
  const melFrame = findClosestFrame(melSpectrogram, timeInSeconds);
  const chromaFrame = findClosestFrame(hpcpChroma, timeInSeconds);
  const pitchFrame = findClosestFrame(pitch, timeInSeconds);
  const beatInfo = isOnBeat(timeInSeconds, rhythm?.beats);
  
  return {
    time: timeInSeconds,
    mel: melFrame?.bands || null,
    chroma: chromaFrame?.chroma || null,
    pitch: pitchFrame?.pitch || 0,
    pitchConfidence: pitchFrame?.confidence || 0,
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
  extractRhythm
};
