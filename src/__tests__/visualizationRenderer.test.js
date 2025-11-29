/**
 * Audio Visualizer Rendering Tests
 * Tests visualization rendering with decoded audio analysis data
 */

import { analyzeAudio, getAnalysisAtTime, loadEssentia } from '../audioAnalysisService';

// Test configuration
const TEST_CONFIG = {
  testMp3Path: '/test-fixtures/test-audio.mp3',
  canvasWidth: 800,
  canvasHeight: 400
};

// Color schemes (matching AudioVisualizer.js)
const COLORS = {
  spotify: '#1DB954',
  accent: '#1ed760',
  bass: '#ff6b6b',
  mid: '#4ecdc4',
  high: '#45b7d1',
  chroma: [
    '#ff6b6b', '#ff8e72', '#ffa94d', '#ffd43b', '#a9e34b', '#69db7c',
    '#38d9a9', '#3bc9db', '#4dabf7', '#748ffc', '#9775fa', '#da77f2'
  ]
};

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Test: Render Mel Spectrogram
 */
export function renderMelSpectrogram(ctx, width, height, melBands, beatStrength = 0) {
  if (!melBands || melBands.length === 0) {
    console.warn('No mel bands to render');
    return false;
  }

  const numBands = melBands.length;
  const barWidth = width / numBands;
  const maxHeight = height * 0.8;
  const centerY = height / 2;

  // Clear background
  ctx.fillStyle = 'rgba(10, 10, 15, 1)';
  ctx.fillRect(0, 0, width, height);

  melBands.forEach((value, i) => {
    const normalizedValue = Math.max(0, Math.min(1, (value + 10) / 10));
    const barHeight = normalizedValue * maxHeight;

    const x = i * barWidth;
    const topY = centerY - barHeight / 2;

    const hue = (i / numBands) * 60 + 180;
    const saturation = 70 + normalizedValue * 30;
    const lightness = 30 + normalizedValue * 40 + beatStrength * 20;

    const gradient = ctx.createLinearGradient(x, topY, x, topY + barHeight);
    gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    gradient.addColorStop(0.5, `hsl(${hue + 20}, ${saturation}%, ${lightness + 15}%)`);
    gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness}%)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x + 1, topY, barWidth - 2, barHeight, 2);
    ctx.fill();
  });

  return true;
}

/**
 * Test: Render Chroma Visualization
 */
export function renderChromaVisualization(ctx, width, height, chroma, beatStrength = 0) {
  if (!chroma || chroma.length !== 12) {
    console.warn('Invalid chroma data');
    return false;
  }

  const barWidth = width / 12;
  const maxHeight = height * 0.7;
  const centerY = height / 2;

  // Clear background
  ctx.fillStyle = 'rgba(10, 10, 15, 1)';
  ctx.fillRect(0, 0, width, height);

  chroma.forEach((value, i) => {
    const barHeight = value * maxHeight;
    const x = i * barWidth;
    const topY = centerY - barHeight / 2;

    const color = COLORS.chroma[i];

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7 + beatStrength * 0.3;
    ctx.beginPath();
    ctx.roundRect(x + 4, topY, barWidth - 8, barHeight, 6);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw pitch class label
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + value * 0.5})`;
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(PITCH_CLASSES[i], x + barWidth / 2, height - 20);
  });

  return true;
}

/**
 * Test: Render Pitch Visualization
 */
export function renderPitchVisualization(ctx, width, height, pitch, confidence, beatStrength = 0) {
  // Clear background
  ctx.fillStyle = 'rgba(10, 10, 15, 1)';
  ctx.fillRect(0, 0, width, height);

  // Draw frequency guide lines
  const frequencies = [100, 200, 440, 880, 1760];
  frequencies.forEach(freq => {
    const normalizedPitch = Math.log(freq / 80) / Math.log(2000 / 80);
    const y = height - (normalizedPitch * height * 0.8) - height * 0.1;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${freq}Hz`, 10, y - 5);
  });

  // Draw pitch indicator
  if (pitch > 0 && confidence > 0.3) {
    const minPitch = 80;
    const maxPitch = 2000;
    const normalizedPitch = Math.log(pitch / minPitch) / Math.log(maxPitch / minPitch);
    const y = height - (normalizedPitch * height * 0.8) - height * 0.1;

    const circleSize = 20 + confidence * 30 + beatStrength * 20;

    // Draw glow
    const gradient = ctx.createRadialGradient(width / 2, y, 0, width / 2, y, circleSize * 2);
    gradient.addColorStop(0, `rgba(29, 185, 84, ${confidence * 0.8})`);
    gradient.addColorStop(0.5, `rgba(29, 185, 84, ${confidence * 0.3})`);
    gradient.addColorStop(1, 'rgba(29, 185, 84, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(width / 2, y, circleSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw pitch circle
    ctx.fillStyle = COLORS.spotify;
    ctx.beginPath();
    ctx.arc(width / 2, y, circleSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw pitch value
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(pitch)} Hz`, width / 2, y + 5);
  }

  return true;
}

/**
 * Test: Full Visualization Pipeline
 * Loads MP3, analyzes it, and renders visualization frames
 */
export async function testVisualizationPipeline(canvas, onProgress) {
  console.log('═══════════════════════════════════════════════');
  console.log('TEST: Full Visualization Pipeline');
  console.log('═══════════════════════════════════════════════');

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  try {
    // Step 1: Load Essentia
    onProgress?.('Loading Essentia.js...');
    await loadEssentia();
    console.log('✅ Essentia loaded');

    // Step 2: Analyze audio
    onProgress?.('Analyzing audio...');
    const analysisData = await analyzeAudio(TEST_CONFIG.testMp3Path);
    console.log('✅ Audio analyzed:', analysisData);

    // Step 3: Render sample frames
    const frameTimes = [0, 1, 2, 5, 10, analysisData.duration / 2];
    
    for (const time of frameTimes) {
      if (time >= analysisData.duration) continue;
      
      onProgress?.(`Rendering frame at ${time.toFixed(1)}s...`);
      const frame = getAnalysisAtTime(analysisData, time);
      
      if (frame) {
        // Clear canvas
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        // Draw combined visualization
        const beatStrength = frame.beatStrength || 0;

        // Draw mel spectrogram in top half
        if (frame.mel) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, width, height / 2);
          ctx.clip();
          renderMelSpectrogram(ctx, width, height / 2, frame.mel, beatStrength);
          ctx.restore();
        }

        // Draw chroma in bottom half
        if (frame.chroma) {
          ctx.save();
          ctx.translate(0, height / 2);
          renderChromaVisualization(ctx, width, height / 2, frame.chroma, beatStrength);
          ctx.restore();
        }

        // Add time label
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(`Time: ${time.toFixed(2)}s`, 10, 20);
        ctx.fillText(`BPM: ${frame.bpm?.toFixed(1) || 'N/A'}`, 10, 40);
        ctx.fillText(`Beat: ${frame.onBeat ? 'YES' : 'no'}`, 10, 60);
        
        // Small delay to see each frame
        await new Promise(r => setTimeout(r, 500));
      }
    }

    onProgress?.('Test complete!');
    console.log('✅ PASS: Visualization pipeline test completed');
    
    return {
      passed: true,
      message: 'Visualization rendered successfully',
      data: { analysisData }
    };

  } catch (error) {
    console.error('❌ FAIL: Visualization pipeline failed:', error);
    onProgress?.(`Error: ${error.message}`);
    return {
      passed: false,
      message: error.message
    };
  }
}

/**
 * Animate visualization in real-time
 */
export async function animateVisualization(canvas, analysisData, options = {}) {
  const { speed = 1, loop = true, onFrame } = options;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  let currentTime = 0;
  let isRunning = true;
  let lastTimestamp = null;

  const animate = (timestamp) => {
    if (!isRunning) return;
    
    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
    }
    
    const deltaTime = (timestamp - lastTimestamp) / 1000 * speed;
    lastTimestamp = timestamp;
    currentTime += deltaTime;
    
    if (currentTime >= analysisData.duration) {
      if (loop) {
        currentTime = 0;
      } else {
        isRunning = false;
        return;
      }
    }
    
    // Get frame data
    const frame = getAnalysisAtTime(analysisData, currentTime);
    
    if (frame) {
      // Clear canvas
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
      ctx.fillRect(0, 0, width, height);
      
      const beatStrength = frame.beatStrength || 0;
      
      // Beat flash
      if (frame.onBeat && beatStrength > 0.5) {
        ctx.fillStyle = `rgba(29, 185, 84, ${beatStrength * 0.2})`;
        ctx.fillRect(0, 0, width, height);
      }
      
      // Draw mel spectrogram
      if (frame.mel && frame.mel.length > 0) {
        const numBands = frame.mel.length;
        const barWidth = width / numBands;
        const maxHeight = height * 0.8;
        const centerY = height / 2;
        
        frame.mel.forEach((value, i) => {
          const normalizedValue = Math.max(0, Math.min(1, (value + 10) / 10));
          const barHeight = normalizedValue * maxHeight;
          const x = i * barWidth;
          const topY = centerY - barHeight / 2;
          
          const hue = (i / numBands) * 60 + 180;
          ctx.fillStyle = `hsla(${hue}, 80%, ${40 + normalizedValue * 40}%, 0.9)`;
          ctx.fillRect(x, topY, barWidth - 1, barHeight);
        });
      }
      
      // Info overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(5, 5, 150, 70);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(`Time: ${currentTime.toFixed(2)}s`, 10, 22);
      ctx.fillText(`BPM: ${frame.bpm?.toFixed(1) || 'N/A'}`, 10, 40);
      ctx.fillText(`Pitch: ${frame.pitch?.toFixed(0) || 0}Hz`, 10, 58);
      
      onFrame?.(frame, currentTime);
    }
    
    requestAnimationFrame(animate);
  };
  
  requestAnimationFrame(animate);
  
  return {
    stop: () => { isRunning = false; },
    setSpeed: (s) => { speed = s; }
  };
}

export default {
  renderMelSpectrogram,
  renderChromaVisualization,
  renderPitchVisualization,
  testVisualizationPipeline,
  animateVisualization
};
