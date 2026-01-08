import { API_BASE_URL } from './config';
import { getAnalysisInterval } from './components/visualizers/VisualizerAudio';

// Default frame interval - can be overridden by user settings
const DEFAULT_FRAME_INTERVAL = 0.2; // 5fps default

// Get current frame interval for a specific analysis type from user settings
const getFrameInterval = (type = 'mel') => {
  try {
    return getAnalysisInterval(type);
  } catch {
    return DEFAULT_FRAME_INTERVAL;
  }
};

// Server URL for analysis cache
const SERVER_URL = API_BASE_URL;

// Simple timestamp helper for this module
const timestamp = () => {
    const now = new Date();
    return `[${now.toLocaleTimeString('en-US', { hour12: false })}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
};

// ==================== SERVER-BASED ANALYSIS CACHE ====================

/**
 * Check if analysis is cached on server
 */
export async function checkServerAnalysisCache(artistName, songName) {
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
export function normalizeAnalysisData(data) {
  if (!data || !data.features) return data;
  
  const duration = data.duration || 0;
  
  // Get intervals for each analysis type
  const chromaInterval = getFrameInterval('chroma');
  const melInterval = getFrameInterval('mel');
  const pitchInterval = getFrameInterval('pitch');
  const rhythmInterval = getFrameInterval('rhythm');
  
  // Calculate frame counts for each type
  const chromaFrames = Math.ceil(duration / chromaInterval);
  const melFrames = Math.ceil(duration / melInterval);
  const pitchFrames = Math.ceil(duration / pitchInterval);
  const rhythmFrames = Math.ceil(duration / rhythmInterval);
  
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
      for (let i = 0; i < rhythmFrames; i++) {
        data.features.rhythm.beatDensity.push(defaultBeatDensityFrame(i * rhythmInterval));
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
    for (let i = 0; i < rhythmFrames; i++) {
      data.features.rhythm.beatDensity.push(defaultBeatDensityFrame(i * rhythmInterval));
    }
  }
  
  // Normalize hpcpChroma - ensure 12 values per frame
  if (data.features.hpcpChroma && data.features.hpcpChroma.length > 0) {
    data.features.hpcpChroma = data.features.hpcpChroma.map((frame, idx) => {
      if (!frame.chroma || frame.chroma.length !== 12) {
        return defaultChromaFrame(frame.time ?? idx * chromaInterval);
      }
      return frame;
    });
  } else {
    // Create default chroma frames
    data.features.hpcpChroma = [];
    for (let i = 0; i < chromaFrames; i++) {
      data.features.hpcpChroma.push(defaultChromaFrame(i * chromaInterval));
    }
  }
  
  // Normalize melSpectrogram - ensure 40 bands per frame
  if (data.features.melSpectrogram && data.features.melSpectrogram.length > 0) {
    data.features.melSpectrogram = data.features.melSpectrogram.map((frame, idx) => {
      if (!frame.bands || frame.bands.length !== 40) {
        return defaultMelFrame(frame.time ?? idx * melInterval);
      }
      return frame;
    });
  } else {
    // Create default mel frames
    data.features.melSpectrogram = [];
    for (let i = 0; i < melFrames; i++) {
      data.features.melSpectrogram.push(defaultMelFrame(i * melInterval));
    }
  }
  
  // Normalize pitch - ensure proper structure
  if (data.features.pitch && data.features.pitch.length > 0) {
    data.features.pitch = data.features.pitch.map((frame, idx) => {
      if (frame.pitch === undefined) {
        return defaultPitchFrame(frame.time ?? idx * pitchInterval);
      }
      return {
        time: frame.time ?? idx * pitchInterval,
        pitch: frame.pitch ?? 0,
        confidence: frame.confidence ?? 0
      };
    });
  } else {
    // Create default pitch frames
    data.features.pitch = [];
    for (let i = 0; i < pitchFrames; i++) {
      data.features.pitch.push(defaultPitchFrame(i * pitchInterval));
    }
  }
  
  return data;
}

/**
 * Load analysis from server cache
 */
export async function loadServerAnalysis(artistName, songName) {
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
export function prepareAnalysisForSave(data) {
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
export async function saveServerAnalysis(artistName, songName, analysisData) {
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

// Aliases for compatibility
export const isAnalysisCached = checkServerAnalysisCache;
export const getCachedAnalysis = loadServerAnalysis;
