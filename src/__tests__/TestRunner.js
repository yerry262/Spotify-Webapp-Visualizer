/**
 * Test Runner Page Component
 * Standalone page for testing MP3 decoding and visualization
 * Route: /dev/test
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { runAllTests } from './audioAnalysisService.test';
import { testVisualizationPipeline, animateVisualization } from './visualizationRenderer.test';
import { analyzeAudio, loadEssentia } from '../audioAnalysisService';
import './TestRunner.css';

const TestRunner = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('Ready to run tests');
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const canvasRef = useRef(null);
  const animationControlRef = useRef(null);

  // Run analysis tests
  const runAnalysisTests = async () => {
    setIsRunning(true);
    setStatus('Running audio analysis tests...');
    setTestResults([]);

    try {
      const results = await runAllTests();
      setTestResults(results.results.map((r, i) => ({
        id: i,
        name: `Test ${i + 1}`,
        passed: r.passed,
        message: r.message
      })));
      setStatus(`Completed: ${results.passed}/${results.total} tests passed`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Run visualization tests
  const runVisualizationTests = async () => {
    if (!canvasRef.current) return;

    setIsRunning(true);
    setStatus('Running visualization tests...');

    try {
      const result = await testVisualizationPipeline(
        canvasRef.current,
        (progress) => setStatus(progress)
      );

      if (result.passed && result.data?.analysisData) {
        setAnalysisData(result.data.analysisData);
      }

      setTestResults(prev => [...prev, {
        id: prev.length,
        name: 'Visualization Pipeline',
        passed: result.passed,
        message: result.message
      }]);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Analyze custom MP3
  const analyzeCustomMP3 = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp3,audio/mpeg';
    
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsRunning(true);
      setStatus(`Analyzing: ${file.name}...`);

      try {
        await loadEssentia();
        const url = URL.createObjectURL(file);
        const data = await analyzeAudio(url);
        setAnalysisData(data);
        setStatus(`Analysis complete: ${file.name}`);
        URL.revokeObjectURL(url);
      } catch (error) {
        setStatus(`Error: ${error.message}`);
      } finally {
        setIsRunning(false);
      }
    };

    input.click();
  };

  // Start/stop animation
  const toggleAnimation = useCallback(async () => {
    if (!canvasRef.current) return;

    if (isAnimating && animationControlRef.current) {
      animationControlRef.current.stop();
      animationControlRef.current = null;
      setIsAnimating(false);
      setStatus('Animation stopped');
      return;
    }

    // Need analysis data to animate
    if (!analysisData) {
      setStatus('Loading and analyzing test audio...');
      setIsRunning(true);
      try {
        await loadEssentia();
        const data = await analyzeAudio('/test-fixtures/test-audio.mp3');
        setAnalysisData(data);
      } catch (error) {
        setStatus(`Error: ${error.message}`);
        setIsRunning(false);
        return;
      }
      setIsRunning(false);
    }

    // Start animation
    setIsAnimating(true);
    setStatus('Playing visualization...');
    
    animationControlRef.current = await animateVisualization(
      canvasRef.current,
      analysisData || await analyzeAudio('/test-fixtures/test-audio.mp3'),
      {
        speed: 1,
        loop: true,
        onFrame: (frame, time) => {
          // Optional: update status with current time
        }
      }
    );
  }, [isAnimating, analysisData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationControlRef.current) {
        animationControlRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="test-runner">
      <header className="test-runner-header">
        <h1>🎵 Audio Analysis Test Runner</h1>
        <p className="subtitle">MP3 Decoding & Visualization Testing</p>
      </header>

      <div className="test-runner-content">
        {/* Controls */}
        <section className="controls-section">
          <h2>Test Controls</h2>
          <div className="button-group">
            <button 
              onClick={runAnalysisTests}
              disabled={isRunning}
              className="test-button"
            >
              🔬 Run Analysis Tests
            </button>
            <button 
              onClick={runVisualizationTests}
              disabled={isRunning}
              className="test-button"
            >
              🎨 Run Visualization Tests
            </button>
            <button 
              onClick={analyzeCustomMP3}
              disabled={isRunning}
              className="test-button secondary"
            >
              📁 Analyze Custom MP3
            </button>
            <button 
              onClick={toggleAnimation}
              disabled={isRunning}
              className={`test-button ${isAnimating ? 'active' : ''}`}
            >
              {isAnimating ? '⏹️ Stop Animation' : '▶️ Play Animation'}
            </button>
          </div>
        </section>

        {/* Status */}
        <section className="status-section">
          <div className={`status-badge ${isRunning ? 'running' : ''}`}>
            {isRunning && <span className="spinner">⟳</span>}
            {status}
          </div>
        </section>

        {/* Visualization Canvas */}
        <section className="canvas-section">
          <h2>Visualization Output</h2>
          <canvas 
            ref={canvasRef}
            width={800}
            height={400}
            className="test-canvas"
          />
        </section>

        {/* Test Results */}
        {testResults.length > 0 && (
          <section className="results-section">
            <h2>Test Results</h2>
            <div className="results-list">
              {testResults.map((result) => (
                <div 
                  key={result.id}
                  className={`result-item ${result.passed ? 'passed' : 'failed'}`}
                >
                  <span className="result-icon">
                    {result.passed ? '✅' : '❌'}
                  </span>
                  <span className="result-name">{result.name}</span>
                  <span className="result-message">{result.message}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Analysis Data */}
        {analysisData && (
          <section className="data-section">
            <h2>Analysis Data</h2>
            <div className="data-grid">
              <div className="data-item">
                <span className="data-label">Duration</span>
                <span className="data-value">{analysisData.duration?.toFixed(2)}s</span>
              </div>
              <div className="data-item">
                <span className="data-label">Sample Rate</span>
                <span className="data-value">{analysisData.sampleRate}Hz</span>
              </div>
              <div className="data-item">
                <span className="data-label">Analysis Time</span>
                <span className="data-value">{analysisData.analysisTime}s</span>
              </div>
              <div className="data-item">
                <span className="data-label">BPM</span>
                <span className="data-value">{analysisData.features?.rhythm?.bpm?.toFixed(1) || 'N/A'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Mel Frames</span>
                <span className="data-value">{analysisData.features?.melSpectrogram?.length || 0}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Chroma Frames</span>
                <span className="data-value">{analysisData.features?.hpcpChroma?.length || 0}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Pitch Frames</span>
                <span className="data-value">{analysisData.features?.pitch?.length || 0}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Beats</span>
                <span className="data-value">{analysisData.features?.rhythm?.beats?.length || 0}</span>
              </div>
            </div>
          </section>
        )}

        {/* Console Log */}
        <section className="console-section">
          <h2>Console</h2>
          <p className="console-hint">
            Open browser DevTools (F12) to see detailed test logs
          </p>
        </section>
      </div>
    </div>
  );
};

export default TestRunner;
