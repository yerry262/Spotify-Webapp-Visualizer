// Audio Analysis Service using Essentia.js
// Extracts Melspectrogram, HPCP Chroma, and Pitch data from MP3 files
// For educational research purposes - Spotify & Google Research Project

// Constants for audio analysis
const SAMPLE_RATE = 44100;
const FRAME_SIZE = 2048;
const HOP_SIZE = 1024;

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
      console.log('🎵 Loading Essentia.js WASM module...');
      
      // Load essentia-wasm from CDN
      const wasmScript = document.createElement('script');
      wasmScript.src = 'https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia-wasm.web.js';
      document.head.appendChild(wasmScript);
      
      await new Promise((res) => {
        wasmScript.onload = res;
        wasmScript.onerror = () => reject(new Error('Failed to load essentia-wasm'));
      });
      
      // Load essentia.js core
      const coreScript = document.createElement('script');
      coreScript.src = 'https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia.js-core.js';
      document.head.appendChild(coreScript);
      
      await new Promise((res) => {
        coreScript.onload = res;
        coreScript.onerror = () => reject(new Error('Failed to load essentia.js-core'));
      });
      
      // Initialize Essentia WASM module
      essentiaWASM = await window.EssentiaWASM();
      essentia = new window.Essentia(essentiaWASM);
      
      isEssentiaLoaded = true;
      console.log('✅ Essentia.js loaded successfully!');
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
  console.log('📥 Fetching audio from:', audioUrl);
  
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: SAMPLE_RATE
  });
  
  try {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    console.log('✅ Audio decoded:', {
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
 * Extract Mel Spectrogram from audio signal
 * Uses simple FFT-based approach to avoid Essentia.js WASM crashes
 * Returns: Array of frames, each containing mel band energies
 */
export async function extractMelSpectrogram(audioSignal, sampleRate = SAMPLE_RATE) {
  if (!essentia) await loadEssentia();
  
  console.log('🎼 Extracting Mel Spectrogram (simplified)...');
  
  const frames = [];
  const numFrames = Math.floor((audioSignal.length - FRAME_SIZE) / HOP_SIZE) + 1;
  const numBands = 40; // Reduced number of bands for stability
  
  // Process every 4th frame to reduce memory pressure and speed up
  const frameStep = 4;
  
  try {
    for (let i = 0; i < numFrames; i += frameStep) {
      const startSample = i * HOP_SIZE;
      const frameData = audioSignal.slice(startSample, startSample + FRAME_SIZE);
      
      if (frameData.length < FRAME_SIZE) break;
      
      const frameVector = essentia.arrayToVector(frameData);
      
      // Apply windowing
      const windowed = essentia.Windowing(frameVector, true, FRAME_SIZE, 'hann', true, true);
      
      // Compute spectrum
      const spectrum = essentia.Spectrum(windowed.frame, FRAME_SIZE);
      const spectrumArray = essentia.vectorToArray(spectrum.spectrum);
      
      // Simple mel-like bands by averaging spectrum bins
      const bands = [];
      const binsPerBand = Math.floor(spectrumArray.length / numBands);
      for (let b = 0; b < numBands; b++) {
        let sum = 0;
        const startBin = b * binsPerBand;
        for (let j = 0; j < binsPerBand; j++) {
          sum += spectrumArray[startBin + j] || 0;
        }
        // Log scale for better visualization
        bands.push(Math.log10(1 + sum / binsPerBand) * 20);
      }
      
      frames.push({
        time: startSample / sampleRate,
        bands: bands
      });
      
      // Clean up vectors
      frameVector.delete();
      windowed.frame.delete();
      spectrum.spectrum.delete();
    }
  } catch (error) {
    console.warn('⚠️ Mel extraction error, using fallback:', error.message);
    // Return empty frames, will use fallback visualization
    return [];
  }
  
  console.log(`✅ Extracted ${frames.length} mel spectrogram frames`);
  return frames;
}

/**
 * Extract HPCP (Harmonic Pitch Class Profile) Chroma from audio signal
 * Simplified version to avoid WASM crashes
 * Returns: Array of frames, each containing 12 chroma values (C, C#, D, ... B)
 */
export async function extractHPCPChroma(audioSignal, sampleRate = SAMPLE_RATE) {
  if (!essentia) await loadEssentia();
  
  console.log('🎼 Extracting HPCP Chroma (simplified)...');
  
  const frames = [];
  const numFrames = Math.floor((audioSignal.length - FRAME_SIZE) / HOP_SIZE) + 1;
  
  // Process every 4th frame to reduce memory pressure
  const frameStep = 4;
  
  try {
    for (let i = 0; i < numFrames; i += frameStep) {
      const startSample = i * HOP_SIZE;
      const frameData = audioSignal.slice(startSample, startSample + FRAME_SIZE);
      
      if (frameData.length < FRAME_SIZE) break;
      
      const frameVector = essentia.arrayToVector(frameData);
      
      // Apply windowing
      const windowed = essentia.Windowing(frameVector, true, FRAME_SIZE, 'hann', true, true);
      
      // Compute spectrum
      const spectrum = essentia.Spectrum(windowed.frame, FRAME_SIZE);
      const spectrumArray = essentia.vectorToArray(spectrum.spectrum);
      
      // Simple chroma approximation from spectrum
      // Map spectrum bins to 12 pitch classes
      const chroma = new Array(12).fill(0);
      const nyquist = sampleRate / 2;
      
      for (let bin = 1; bin < spectrumArray.length; bin++) {
        const freq = (bin / spectrumArray.length) * nyquist;
        if (freq > 20 && freq < 5000) {
          // Convert frequency to pitch class (0-11)
          const midiNote = 12 * Math.log2(freq / 440) + 69;
          const pitchClass = Math.round(midiNote) % 12;
          if (pitchClass >= 0 && pitchClass < 12) {
            chroma[pitchClass] += spectrumArray[bin];
          }
        }
      }
      
      // Normalize
      const maxChroma = Math.max(...chroma, 0.001);
      const normalizedChroma = chroma.map(c => c / maxChroma);
      
      frames.push({
        time: startSample / sampleRate,
        chroma: normalizedChroma
      });
      
      // Clean up
      frameVector.delete();
      windowed.frame.delete();
      spectrum.spectrum.delete();
    }
  } catch (error) {
    console.warn('⚠️ Chroma extraction error, using fallback:', error.message);
    return [];
  }
  
  console.log(`✅ Extracted ${frames.length} HPCP chroma frames`);
  return frames;
}

/**
 * Extract Pitch (fundamental frequency) using PitchMelodia algorithm
 * Returns: Array of pitch values over time
 */
export async function extractPitch(audioSignal, sampleRate = SAMPLE_RATE) {
  if (!essentia) await loadEssentia();
  
  console.log('🎼 Extracting Pitch (Melodia)...');
  
  const signalVector = essentia.arrayToVector(audioSignal);
  
  // Use PitchMelodia for robust pitch extraction
  const pitchResult = essentia.PitchMelodia(
    signalVector,
    10,      // binResolution (cents)
    3,       // filterIterations
    FRAME_SIZE, // frameSize
    false,   // guessUnvoiced
    0.8,     // harmonicWeight
    128,     // hopSize for pitch
    1,       // magnitudeCompression
    40,      // magnitudeThreshold
    20000,   // maxFrequency
    100,     // minDuration
    80,      // minFrequency
    20,      // numberHarmonics
    0.9,     // peakDistributionThreshold
    0.9,     // peakFrameThreshold
    27.5625, // pitchContinuity
    55,      // referenceFrequency
    sampleRate, // sampleRate
    100      // timeContinuity
  );
  
  const pitchArray = essentia.vectorToArray(pitchResult.pitch);
  const confidenceArray = essentia.vectorToArray(pitchResult.pitchConfidence);
  
  // Create timestamped pitch data
  const pitchHopSize = 128;
  const frames = pitchArray.map((pitch, i) => ({
    time: (i * pitchHopSize) / sampleRate,
    pitch: pitch,
    confidence: confidenceArray[i]
  }));
  
  signalVector.delete();
  pitchResult.pitch.delete();
  pitchResult.pitchConfidence.delete();
  
  console.log(`✅ Extracted ${frames.length} pitch frames`);
  return frames;
}

/**
 * Extract BPM and beat positions
 */
export async function extractRhythm(audioSignal, sampleRate = SAMPLE_RATE) {
  if (!essentia) await loadEssentia();
  
  console.log('🎼 Extracting Rhythm (BPM & Beats)...');
  
  const signalVector = essentia.arrayToVector(audioSignal);
  
  const rhythmResult = essentia.RhythmExtractor2013(
    signalVector,
    208,     // maxTempo
    'degara', // method
    40       // minTempo
  );
  
  const result = {
    bpm: rhythmResult.bpm,
    beats: essentia.vectorToArray(rhythmResult.ticks),
    confidence: rhythmResult.confidence
  };
  
  signalVector.delete();
  rhythmResult.ticks.delete();
  
  console.log(`✅ Extracted BPM: ${result.bpm.toFixed(1)}, ${result.beats.length} beats`);
  return result;
}

/**
 * Full audio analysis - extracts all features
 * Each extractor is wrapped in try-catch to prevent total failure
 */
export async function analyzeAudio(audioUrl) {
  console.log('═══════════════════════════════════════════════');
  console.log('🎵 Starting Full Audio Analysis');
  console.log('═══════════════════════════════════════════════');
  
  const startTime = Date.now();
  
  // Load essentia if not loaded
  await loadEssentia();
  
  // Fetch and decode audio
  const audioBuffer = await fetchAudioBuffer(audioUrl);
  const monoSignal = audioBufferToMono(audioBuffer);
  
  const duration = audioBuffer.duration;
  const sampleRate = audioBuffer.sampleRate;
  
  console.log(`📊 Audio: ${duration.toFixed(2)}s @ ${sampleRate}Hz`);
  
  // Extract features with error handling for each
  let melSpectrogram = [];
  let hpcpChroma = [];
  let pitch = [];
  let rhythm = { bpm: 120, beats: [], confidence: 0 };
  
  // Extract rhythm first (most reliable)
  try {
    rhythm = await extractRhythm(monoSignal, sampleRate);
  } catch (error) {
    console.warn('⚠️ Rhythm extraction failed:', error.message);
  }
  
  // Extract pitch (reliable)
  try {
    pitch = await extractPitch(monoSignal, sampleRate);
  } catch (error) {
    console.warn('⚠️ Pitch extraction failed:', error.message);
  }
  
  // Extract mel spectrogram (may fail with WASM)
  try {
    melSpectrogram = await extractMelSpectrogram(monoSignal, sampleRate);
  } catch (error) {
    console.warn('⚠️ Mel spectrogram extraction failed:', error.message);
  }
  
  // Extract chroma (may fail with WASM)
  try {
    hpcpChroma = await extractHPCPChroma(monoSignal, sampleRate);
  } catch (error) {
    console.warn('⚠️ Chroma extraction failed:', error.message);
  }
  
  const analysisTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('═══════════════════════════════════════════════');
  console.log(`✅ Analysis complete in ${analysisTime}s`);
  console.log(`   Mel frames: ${melSpectrogram.length}`);
  console.log(`   Chroma frames: ${hpcpChroma.length}`);
  console.log(`   Pitch frames: ${pitch.length}`);
  console.log(`   BPM: ${rhythm.bpm?.toFixed(1) || 'N/A'}`);
  console.log('═══════════════════════════════════════════════');
  
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
