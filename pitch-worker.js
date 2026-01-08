// Pitch extraction Web Worker
// This runs in a separate thread to avoid blocking the UI

self.postMessage({ type: 'progress', message: 'Worker script starting...' });

// Polyfill document and window for WASM loaders that expect browser globals
if (typeof document === 'undefined') {
  self.document = {
    createElement: (tag) => {
      self.postMessage({ type: 'progress', message: `Polyfill: createElement(${tag})` });
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
    self.postMessage({ type: 'progress', message: 'Calling EssentiaWASM()...' });
    
    // Add a timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('EssentiaWASM() timed out after 30s')), 30000);
    });
    
    const wasmPromise = EssentiaWASM();
    self.postMessage({ type: 'progress', message: 'EssentiaWASM() called, waiting for Promise...' });
    
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
  const { audioSignal, sampleRate, frameSize, frameInterval = 0.2 } = e.data;
  
  try {
    await initEssentia();
    
    // Calculate optimal hop size based on frameInterval setting
    // Target: 1 frame per frameInterval seconds
    const targetHopSize = Math.round(sampleRate * frameInterval);
    const fps = Math.round(1 / frameInterval);
    
    const duration = audioSignal.length / sampleRate;
    const expectedFrames = Math.ceil(duration / frameInterval);
    
    self.postMessage({ type: 'progress', message: `Running PitchMelodia (${duration.toFixed(1)}s audio, ~${expectedFrames} frames at ${fps}fps)...` });
    
    const signalVector = essentia.arrayToVector(audioSignal);
    
    // PitchMelodia parameters - using hop size based on user settings
    // Parameters: binResolution, filterIterations, frameSize, guessUnvoiced, harmonicWeight, 
    //             hopSize, magnitudeCompression, magnitudeThreshold, maxFrequency, minDuration,
    //             minFrequency, numberHarmonics, peakDistributionThreshold, peakFrameThreshold,
    //             pitchContinuity, referenceFrequency, sampleRate, timeContinuity
    const pitchResult = essentia.PitchMelodia(
      signalVector,
      10,           // binResolution
      3,            // filterIterations  
      frameSize,    // frameSize (2048)
      false,        // guessUnvoiced
      0.8,          // harmonicWeight
      targetHopSize, // hopSize - based on frameInterval setting
      1,            // magnitudeCompression
      40,           // magnitudeThreshold
      20000,        // maxFrequency
      100,          // minDuration
      80,           // minFrequency
      20,           // numberHarmonics
      0.9,          // peakDistributionThreshold
      0.9,          // peakFrameThreshold
      27.5625,      // pitchContinuity
      55,           // referenceFrequency
      sampleRate,   // sampleRate
      100           // timeContinuity
    );
    
    const pitchArray = essentia.vectorToArray(pitchResult.pitch);
    const confidenceArray = essentia.vectorToArray(pitchResult.pitchConfidence);
    
    self.postMessage({ type: 'progress', message: `Got ${pitchArray.length} pitch frames, building output...` });
    
    const frames = [];
    
    // Build frames with correct timing based on frameInterval
    for (let i = 0; i < pitchArray.length; i++) {
      frames.push({
        time: i * frameInterval,
        pitch: pitchArray[i],
        confidence: confidenceArray[i]
      });
    }
    
    // Clean up WASM memory
    signalVector.delete();
    pitchResult.pitch.delete();
    pitchResult.pitchConfidence.delete();
    
    self.postMessage({ type: 'result', frames, totalFrames: pitchArray.length });
    
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message || error.toString() });
  }
};
