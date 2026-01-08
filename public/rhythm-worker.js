// Rhythm extraction Web Worker
// This runs in a separate thread to avoid blocking the UI

self.postMessage({ type: 'progress', message: 'Rhythm Worker script starting...' });

// Polyfill document and window for WASM loaders that expect browser globals
if (typeof document === 'undefined') {
  self.document = {
    createElement: (tag) => {
      // self.postMessage({ type: 'progress', message: `Polyfill: createElement(${tag})` });
      return { style: {}, setAttribute: () => {}, appendChild: () => {} };
    },
    body: { appendChild: () => {} },
    head: { appendChild: () => {} },
    currentScript: { src: self.location?.href || '' },
    getElementById: () => null,
    getElementsByTagName: () => [],
    querySelector: () => null,
    querySelectorAll: () => []
  };
}
if (typeof window === 'undefined') {
  self.window = self;
}
if (typeof location === 'undefined') {
  self.location = { href: '' };
}

self.postMessage({ type: 'progress', message: 'Loading Essentia scripts (local files)...' });

// Determine base path from worker location
const workerUrl = self.location.href;
const basePath = workerUrl.substring(0, workerUrl.lastIndexOf('/') + 1);

try {
  importScripts(basePath + 'essentia-wasm.web.js');
  self.postMessage({ type: 'progress', message: 'essentia-wasm.web.js loaded!' });
} catch (e) {
  self.postMessage({ type: 'error', message: 'Failed to load essentia-wasm.web.js: ' + e.message });
}

try {
  importScripts(basePath + 'essentia.js-core.js');
  self.postMessage({ type: 'progress', message: 'essentia.js-core.js loaded!' });
} catch (e) {
  self.postMessage({ type: 'error', message: 'Failed to load essentia.js-core.js: ' + e.message });
}

self.postMessage({ type: 'progress', message: 'Checking if EssentiaWASM exists: ' + (typeof EssentiaWASM) });

let essentia = null;

async function initEssentia() {
  if (essentia) return essentia;
  
  self.postMessage({ type: 'progress', message: 'Initializing Essentia WASM...' });
  
  try {
    const wasmPromise = EssentiaWASM();
    self.postMessage({ type: 'progress', message: 'EssentiaWASM() called, waiting for Promise...' });
    
    // Add a timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('EssentiaWASM() timed out after 30s')), 30000);
    });

    const essentiaWASM = await Promise.race([wasmPromise, timeoutPromise]);
    
    self.postMessage({ type: 'progress', message: 'EssentiaWASM resolved! Creating Essentia instance...' });
    essentia = new Essentia(essentiaWASM);
    
    self.postMessage({ type: 'progress', message: 'Essentia ready!' });
  } catch (error) {
    self.postMessage({ type: 'progress', message: 'Init error: ' + (error.message || error) });
    throw error;
  }
  
  return essentia;
}

self.onmessage = async function(e) {
  const { audioSignal, sampleRate, duration, frameInterval = 0.2 } = e.data;
  
  try {
    await initEssentia();
    
    self.postMessage({ type: 'progress', message: `Running RhythmExtractor2013...` });
    
    // Convert Float32Array to Essentia Vector
    const signalVector = essentia.arrayToVector(audioSignal);
    
    // Perform Rhythm Extraction
    const rhythmResult = essentia.RhythmExtractor2013(
      signalVector,
      208,     // maxTempo
      'degara', // method
      40       // minTempo
    );
    
    const rawBeats = essentia.vectorToArray(rhythmResult.ticks);
    const bpm = rhythmResult.bpm;
    const confidence = rhythmResult.confidence;
    
    // Clean up WASM memory
    signalVector.delete();
    rhythmResult.ticks.delete();
    
    // Post-processing
    // Calculate duration from signal if not provided
    const audioDuration = duration || (audioSignal.length / sampleRate);
    
    // Filter out any beats beyond the audio duration
    const validBeats = rawBeats.filter(t => t <= audioDuration);
    
    // Create interval beat density data
    const numFrames = Math.ceil(audioDuration / frameInterval);
    const beatDensity = [];
    
    for (let i = 0; i < numFrames; i++) {
      const frameStart = i * frameInterval;
      const frameEnd = frameStart + frameInterval;
      // Count beats in this frame
      const beatsInFrame = validBeats.filter(t => t >= frameStart && t < frameEnd).length;
      beatDensity.push({
        time: frameStart,
        beats: beatsInFrame
      });
    }

    self.postMessage({ 
      type: 'result', 
      bpm,
      beats: validBeats, 
      beatDensity,
      confidence,
      message: `Extracted BPM: ${bpm.toFixed(1)}, ${validBeats.length} beats, ${beatDensity.length} frames`
    });

  } catch (error) {
    self.postMessage({ type: 'error', message: error.message || error.toString() });
  }
};
