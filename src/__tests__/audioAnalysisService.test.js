/**
 * Audio Analysis Service Tests
 * Tests MP3 decoding and audio analysis feature extraction
 * 
 * To run: Place a test MP3 file in src/__tests__/fixtures/test-audio.mp3
 * Then load testRunner.html in a browser
 */

import {
  loadEssentia,
  fetchAudioBuffer,
  audioBufferToMono,
  extractMelSpectrogram,
  extractHPCPChroma,
  extractPitch,
  extractRhythm,
  analyzeAudio,
  getAnalysisAtTime
} from '../audioAnalysisService';

// Test configuration
const TEST_CONFIG = {
  // Use relative path from public folder for test MP3
  testMp3Path: '/test-fixtures/test-audio.mp3',
  // Expected minimum values for validation
  expectedMinMelFrames: 10,
  expectedMinChromaFrames: 10,
  expectedMinPitchFrames: 10,
  expectedMinBeats: 4,
  expectedBpmRange: [60, 200]
};

/**
 * Test Suite: Essentia Loading
 */
export async function testEssentiaLoading() {
  console.log('═══════════════════════════════════════════════');
  console.log('TEST: Essentia.js Loading');
  console.log('═══════════════════════════════════════════════');
  
  try {
    const essentia = await loadEssentia();
    
    if (!essentia) {
      throw new Error('Essentia failed to load');
    }
    
    console.log('✅ PASS: Essentia.js loaded successfully');
    return { passed: true, message: 'Essentia loaded' };
  } catch (error) {
    console.error('❌ FAIL: Essentia loading failed:', error);
    return { passed: false, message: error.message };
  }
}

/**
 * Test Suite: MP3 Decoding
 */
export async function testMP3Decoding() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('TEST: MP3 Decoding');
  console.log('═══════════════════════════════════════════════');
  
  try {
    // Fetch and decode the test MP3
    const audioBuffer = await fetchAudioBuffer(TEST_CONFIG.testMp3Path);
    
    // Validate AudioBuffer properties
    if (!audioBuffer) {
      throw new Error('AudioBuffer is null');
    }
    
    if (audioBuffer.duration <= 0) {
      throw new Error('Invalid duration: ' + audioBuffer.duration);
    }
    
    if (audioBuffer.sampleRate !== 44100) {
      console.warn('⚠️ Sample rate is not 44100:', audioBuffer.sampleRate);
    }
    
    if (audioBuffer.numberOfChannels < 1) {
      throw new Error('No audio channels found');
    }
    
    console.log('📊 AudioBuffer Info:');
    console.log(`   Duration: ${audioBuffer.duration.toFixed(2)}s`);
    console.log(`   Sample Rate: ${audioBuffer.sampleRate}Hz`);
    console.log(`   Channels: ${audioBuffer.numberOfChannels}`);
    console.log(`   Length: ${audioBuffer.length} samples`);
    
    // Test mono conversion
    const monoSignal = audioBufferToMono(audioBuffer);
    
    if (!monoSignal || monoSignal.length === 0) {
      throw new Error('Mono conversion failed');
    }
    
    if (monoSignal.length !== audioBuffer.length) {
      throw new Error('Mono signal length mismatch');
    }
    
    console.log(`   Mono Signal: ${monoSignal.length} samples`);
    console.log('✅ PASS: MP3 decoded and converted to mono');
    
    return {
      passed: true,
      message: 'MP3 decoded successfully',
      data: { audioBuffer, monoSignal }
    };
  } catch (error) {
    console.error('❌ FAIL: MP3 decoding failed:', error);
    return { passed: false, message: error.message };
  }
}

/**
 * Test Suite: Mel Spectrogram Extraction
 */
export async function testMelSpectrogramExtraction() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('TEST: Mel Spectrogram Extraction');
  console.log('═══════════════════════════════════════════════');
  
  try {
    // First decode the audio
    const audioBuffer = await fetchAudioBuffer(TEST_CONFIG.testMp3Path);
    const monoSignal = audioBufferToMono(audioBuffer);
    
    // Extract mel spectrogram
    const melFrames = await extractMelSpectrogram(monoSignal, audioBuffer.sampleRate);
    
    if (!melFrames || melFrames.length === 0) {
      throw new Error('No mel spectrogram frames extracted');
    }
    
    if (melFrames.length < TEST_CONFIG.expectedMinMelFrames) {
      throw new Error(`Too few mel frames: ${melFrames.length}`);
    }
    
    // Validate frame structure
    const firstFrame = melFrames[0];
    if (!firstFrame.time === undefined || !firstFrame.bands) {
      throw new Error('Invalid mel frame structure');
    }
    
    if (!Array.isArray(firstFrame.bands)) {
      throw new Error('Mel bands is not an array');
    }
    
    console.log('📊 Mel Spectrogram Info:');
    console.log(`   Total Frames: ${melFrames.length}`);
    console.log(`   Bands per Frame: ${firstFrame.bands.length}`);
    console.log(`   Time Range: ${melFrames[0].time.toFixed(2)}s - ${melFrames[melFrames.length-1].time.toFixed(2)}s`);
    console.log(`   Sample Frame 0:`, firstFrame.bands.slice(0, 5).map(v => v.toFixed(2)));
    
    console.log('✅ PASS: Mel spectrogram extracted successfully');
    return {
      passed: true,
      message: 'Mel spectrogram extracted',
      data: { melFrames }
    };
  } catch (error) {
    console.error('❌ FAIL: Mel spectrogram extraction failed:', error);
    return { passed: false, message: error.message };
  }
}

/**
 * Test Suite: Chroma Extraction
 */
export async function testChromaExtraction() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('TEST: HPCP Chroma Extraction');
  console.log('═══════════════════════════════════════════════');
  
  try {
    const audioBuffer = await fetchAudioBuffer(TEST_CONFIG.testMp3Path);
    const monoSignal = audioBufferToMono(audioBuffer);
    
    const chromaFrames = await extractHPCPChroma(monoSignal, audioBuffer.sampleRate);
    
    if (!chromaFrames || chromaFrames.length === 0) {
      throw new Error('No chroma frames extracted');
    }
    
    if (chromaFrames.length < TEST_CONFIG.expectedMinChromaFrames) {
      throw new Error(`Too few chroma frames: ${chromaFrames.length}`);
    }
    
    // Validate frame structure
    const firstFrame = chromaFrames[0];
    if (firstFrame.time === undefined || !firstFrame.chroma) {
      throw new Error('Invalid chroma frame structure');
    }
    
    if (firstFrame.chroma.length !== 12) {
      throw new Error(`Expected 12 chroma values, got ${firstFrame.chroma.length}`);
    }
    
    console.log('📊 Chroma Info:');
    console.log(`   Total Frames: ${chromaFrames.length}`);
    console.log(`   Pitch Classes: 12 (C, C#, D, ..., B)`);
    console.log(`   Sample Frame 0:`, firstFrame.chroma.map(v => v.toFixed(3)));
    
    console.log('✅ PASS: Chroma extracted successfully');
    return {
      passed: true,
      message: 'Chroma extracted',
      data: { chromaFrames }
    };
  } catch (error) {
    console.error('❌ FAIL: Chroma extraction failed:', error);
    return { passed: false, message: error.message };
  }
}

/**
 * Test Suite: Pitch Extraction
 */
export async function testPitchExtraction() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('TEST: Pitch Extraction');
  console.log('═══════════════════════════════════════════════');
  
  try {
    const audioBuffer = await fetchAudioBuffer(TEST_CONFIG.testMp3Path);
    const monoSignal = audioBufferToMono(audioBuffer);
    
    const pitchFrames = await extractPitch(monoSignal, audioBuffer.sampleRate);
    
    if (!pitchFrames || pitchFrames.length === 0) {
      throw new Error('No pitch frames extracted');
    }
    
    if (pitchFrames.length < TEST_CONFIG.expectedMinPitchFrames) {
      throw new Error(`Too few pitch frames: ${pitchFrames.length}`);
    }
    
    // Validate frame structure
    const firstFrame = pitchFrames[0];
    if (firstFrame.time === undefined || firstFrame.pitch === undefined || firstFrame.confidence === undefined) {
      throw new Error('Invalid pitch frame structure');
    }
    
    // Find pitched frames (confidence > 0.5)
    const pitchedFrames = pitchFrames.filter(f => f.confidence > 0.5);
    
    console.log('📊 Pitch Info:');
    console.log(`   Total Frames: ${pitchFrames.length}`);
    console.log(`   Pitched Frames: ${pitchedFrames.length}`);
    if (pitchedFrames.length > 0) {
      const avgPitch = pitchedFrames.reduce((sum, f) => sum + f.pitch, 0) / pitchedFrames.length;
      console.log(`   Average Pitch: ${avgPitch.toFixed(2)}Hz`);
    }
    console.log(`   Sample Frame 0: ${firstFrame.pitch.toFixed(2)}Hz (conf: ${firstFrame.confidence.toFixed(2)})`);
    
    console.log('✅ PASS: Pitch extracted successfully');
    return {
      passed: true,
      message: 'Pitch extracted',
      data: { pitchFrames }
    };
  } catch (error) {
    console.error('❌ FAIL: Pitch extraction failed:', error);
    return { passed: false, message: error.message };
  }
}

/**
 * Test Suite: Rhythm Extraction
 */
export async function testRhythmExtraction() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('TEST: Rhythm/BPM Extraction');
  console.log('═══════════════════════════════════════════════');
  
  try {
    const audioBuffer = await fetchAudioBuffer(TEST_CONFIG.testMp3Path);
    const monoSignal = audioBufferToMono(audioBuffer);
    
    const rhythm = await extractRhythm(monoSignal, audioBuffer.sampleRate);
    
    if (!rhythm) {
      throw new Error('No rhythm data extracted');
    }
    
    if (!rhythm.bpm || rhythm.bpm < TEST_CONFIG.expectedBpmRange[0] || rhythm.bpm > TEST_CONFIG.expectedBpmRange[1]) {
      console.warn(`⚠️ BPM seems unusual: ${rhythm.bpm}`);
    }
    
    if (!rhythm.beats || rhythm.beats.length < TEST_CONFIG.expectedMinBeats) {
      throw new Error(`Too few beats detected: ${rhythm.beats?.length || 0}`);
    }
    
    console.log('📊 Rhythm Info:');
    console.log(`   BPM: ${rhythm.bpm.toFixed(1)}`);
    console.log(`   Confidence: ${rhythm.confidence.toFixed(2)}`);
    console.log(`   Beats Detected: ${rhythm.beats.length}`);
    console.log(`   First 5 Beats: ${rhythm.beats.slice(0, 5).map(t => t.toFixed(2) + 's').join(', ')}`);
    
    console.log('✅ PASS: Rhythm extracted successfully');
    return {
      passed: true,
      message: 'Rhythm extracted',
      data: { rhythm }
    };
  } catch (error) {
    console.error('❌ FAIL: Rhythm extraction failed:', error);
    return { passed: false, message: error.message };
  }
}

/**
 * Test Suite: Full Analysis Pipeline
 */
export async function testFullAnalysisPipeline() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('TEST: Full Analysis Pipeline');
  console.log('═══════════════════════════════════════════════');
  
  try {
    // Run full analysis
    const analysisData = await analyzeAudio(TEST_CONFIG.testMp3Path);
    
    if (!analysisData) {
      throw new Error('Analysis returned null');
    }
    
    // Validate structure
    if (!analysisData.duration || !analysisData.features) {
      throw new Error('Invalid analysis data structure');
    }
    
    const { melSpectrogram, hpcpChroma, pitch, rhythm } = analysisData.features;
    
    console.log('📊 Full Analysis Results:');
    console.log(`   Duration: ${analysisData.duration.toFixed(2)}s`);
    console.log(`   Sample Rate: ${analysisData.sampleRate}Hz`);
    console.log(`   Analysis Time: ${analysisData.analysisTime}s`);
    console.log(`   Mel Frames: ${melSpectrogram?.length || 0}`);
    console.log(`   Chroma Frames: ${hpcpChroma?.length || 0}`);
    console.log(`   Pitch Frames: ${pitch?.length || 0}`);
    console.log(`   BPM: ${rhythm?.bpm?.toFixed(1) || 'N/A'}`);
    console.log(`   Beats: ${rhythm?.beats?.length || 0}`);
    
    // Test time lookup
    const testTime = analysisData.duration / 2; // Middle of the track
    const frameAtTime = getAnalysisAtTime(analysisData, testTime);
    
    if (!frameAtTime) {
      throw new Error('Failed to get frame at time');
    }
    
    console.log(`\n📍 Frame at ${testTime.toFixed(2)}s:`);
    console.log(`   Mel Bands: ${frameAtTime.mel?.length || 0}`);
    console.log(`   Chroma Values: ${frameAtTime.chroma?.length || 0}`);
    console.log(`   Pitch: ${frameAtTime.pitch?.toFixed(2) || 'N/A'}Hz`);
    console.log(`   On Beat: ${frameAtTime.onBeat ? 'Yes' : 'No'}`);
    
    console.log('\n✅ PASS: Full analysis pipeline completed');
    return {
      passed: true,
      message: 'Full analysis successful',
      data: { analysisData, frameAtTime }
    };
  } catch (error) {
    console.error('❌ FAIL: Full analysis pipeline failed:', error);
    return { passed: false, message: error.message };
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   AUDIO ANALYSIS SERVICE TEST SUITE           ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('\n');
  
  const results = [];
  
  // Test 1: Load Essentia
  results.push(await testEssentiaLoading());
  
  // Test 2: MP3 Decoding
  results.push(await testMP3Decoding());
  
  // Test 3: Mel Spectrogram
  results.push(await testMelSpectrogramExtraction());
  
  // Test 4: Chroma
  results.push(await testChromaExtraction());
  
  // Test 5: Pitch
  results.push(await testPitchExtraction());
  
  // Test 6: Rhythm
  results.push(await testRhythmExtraction());
  
  // Test 7: Full Pipeline
  results.push(await testFullAnalysisPipeline());
  
  // Summary
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                ║');
  console.log('╚═══════════════════════════════════════════════╝');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  console.log(`\n   Total Tests: ${results.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  results.forEach((result, i) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`   ${icon} Test ${i + 1}: ${result.message}`);
  });
  
  console.log('\n');
  
  return {
    total: results.length,
    passed,
    failed,
    results
  };
}

export default {
  runAllTests,
  testEssentiaLoading,
  testMP3Decoding,
  testMelSpectrogramExtraction,
  testChromaExtraction,
  testPitchExtraction,
  testRhythmExtraction,
  testFullAnalysisPipeline
};
