// Audio Analysis Utils
// Math and AudioBuffer helpers

// Constants for audio analysis
export const SAMPLE_RATE = 44100;

// Timestamp helper for console logs
export const timestamp = () => {
  const now = new Date();
  return `[${now.toLocaleTimeString('en-US', { hour12: false })}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
};

/**
 * Check if analysis should continue (not aborted)
 */
export function shouldContinueAnalysis(signal) {
    if (signal?.aborted) {
      throw new DOMException('Analysis cancelled - track changed', 'AbortError');
    }
    return true;
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
 * Fast spectrum computation with configurable output bins
 * More efficient for real-time visualization
 */
export function computeSpectrumFast(frameData, outputBins = 128) {
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
 * Fetch and decode audio from URL to AudioBuffer
 * Properly closes AudioContext after decoding to prevent memory leaks
 * @param {string} audioUrl - URL to fetch audio from
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 */
export async function fetchAudioBuffer(audioUrl, signal = null) {
  console.log(`${timestamp()} 📥 Fetching audio from:`, audioUrl);
  
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: SAMPLE_RATE
  });
  
  try {
    // Pass abort signal to fetch for cancellation
    const response = await fetch(audioUrl, { signal });
    
    // Check if aborted after fetch
    shouldContinueAnalysis(signal);
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Check if aborted after getting array buffer
    shouldContinueAnalysis(signal);
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    console.log(`${timestamp()} ✅ Audio decoded:`, {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels
    });
    
    return audioBuffer;
  } catch (error) {
    // Re-throw AbortError as-is
    if (error.name === 'AbortError') {
      console.log(`${timestamp()} 🛑 Audio fetch cancelled`);
      throw error;
    }
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
