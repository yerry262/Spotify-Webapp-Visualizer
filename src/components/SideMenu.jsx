import React, { useState } from 'react';
import { setWaveformAutoInterval, autoWaveformInterval } from './visualizers/VisualizerAudio';
import './SideMenu.css';

const SideMenu = ({ 
  isOpen, 
  onClose, 
  onLogout,
  onSwitchAccount,
  user, 
  waveformStyles, 
  waveformStyle, 
  isWaveformAuto, 
  onWaveformChange,
  waveformSettings,
  onWaveformSettingsChange,
  particleSettings,
  onParticleSettingsChange,
  centerElementSettings,
  onCenterElementSettingsChange,
  sampleRateSettings,
  onSampleRateSettingsChange
}) => {
  const [isWaveformOpen, setIsWaveformOpen] = useState(false);
  const [isParticlesOpen, setIsParticlesOpen] = useState(false);
  const [isCenterElementsOpen, setIsCenterElementsOpen] = useState(false);
  const [isSampleRateOpen, setIsSampleRateOpen] = useState(false);
  const [autoInterval, setAutoInterval] = useState(autoWaveformInterval || 30);

  const handleIntervalChange = (e, seconds) => {
    e.stopPropagation();
    setAutoInterval(seconds);
    setWaveformAutoInterval(seconds);
    if (!isWaveformAuto && onWaveformChange) {
      onWaveformChange('auto');
    }
  };

  const profileImage = user?.images?.[0]?.url;
  const displayName = user?.display_name || user?.id || 'User';

    // Determine Home URL based on environment
    let homeUrl = '/callback';
    if (typeof window !== 'undefined' && window.location.hostname === 'yerry262.github.io') {
      homeUrl = '/Spotify-Webapp-Visualizer/callback';
    }

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`side-menu-backdrop ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />
      
      {/* Side Menu Panel */}
      <div className={`side-menu ${isOpen ? 'open' : ''}`}>
        <div className="side-menu-header">
          <div className="side-menu-user">
            {profileImage ? (
              <img src={profileImage} alt={displayName} className="side-menu-pfp" />
            ) : (
              <div className="side-menu-pfp-placeholder">
                <span>{displayName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span className="side-menu-username">{displayName}</span>
          </div>
          <button className="close-btn" onClick={onClose} title="Close Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <nav className="side-menu-nav">
          <a href={homeUrl} className="menu-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Home</span>
          </a>
          
          {/* Waveform Dropdown */}
          <div className="menu-dropdown">
            <button 
              className={`menu-item dropdown-toggle ${isWaveformOpen ? 'open' : ''}`}
              onClick={() => setIsWaveformOpen(!isWaveformOpen)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h4l3-9 4 18 3-9h4"></path>
              </svg>
              <span>Waveform</span>
              <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            <div className={`dropdown-content ${isWaveformOpen ? 'open' : ''}`}>
              <div className={`dropdown-item auto-row ${isWaveformAuto ? 'active' : ''}`}>
                <div 
                  className="auto-label-area"
                  onClick={() => onWaveformChange && onWaveformChange('auto')}
                >
                  <span className="item-dot"></span>
                  <span>Random</span>
                </div>
                <div className="interval-buttons">
                  <button 
                    className={`interval-btn ${autoInterval === 5 ? 'active' : ''}`}
                    onClick={(e) => handleIntervalChange(e, 5)}
                  >5s</button>
                  <button 
                    className={`interval-btn ${autoInterval === 15 ? 'active' : ''}`}
                    onClick={(e) => handleIntervalChange(e, 15)}
                  >15s</button>
                  <button 
                    className={`interval-btn ${autoInterval === 30 ? 'active' : ''}`}
                    onClick={(e) => handleIntervalChange(e, 30)}
                  >30s</button>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              {waveformStyles && waveformStyles.map(style => (
                <button 
                  key={style.id}
                  className={`dropdown-item ${!isWaveformAuto && waveformStyle === style.id ? 'active' : ''}`}
                  onClick={() => onWaveformChange && onWaveformChange(style.id)}
                >
                  <span className="item-dot"></span>
                  {style.name}
                </button>
              ))}
              <div className="dropdown-divider"></div>
              {/* Custom Settings Toggle */}
              <div className="dropdown-setting">
                <span className="setting-label">Custom Settings</span>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={waveformSettings?.useCustomSettings ?? false}
                    onChange={(e) => onWaveformSettingsChange?.({ useCustomSettings: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              {/* Max Amplitude Slider - only enabled when custom settings is on */}
              <div className={`dropdown-setting ${!waveformSettings?.useCustomSettings ? 'disabled' : ''}`}>
                <span className="setting-label">Max Height: {waveformSettings?.maxAmplitude ?? 45}%</span>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={waveformSettings?.maxAmplitude ?? 45}
                  onChange={(e) => onWaveformSettingsChange?.({ maxAmplitude: parseInt(e.target.value) })}
                  className="setting-slider"
                  disabled={!waveformSettings?.useCustomSettings}
                />
              </div>
              {/* Base Position Slider - only enabled when custom settings is on */}
              <div className={`dropdown-setting ${!waveformSettings?.useCustomSettings ? 'disabled' : ''}`}>
                <span className="setting-label">Start Position: {waveformSettings?.basePosition ?? 60}%</span>
                <input 
                  type="range" 
                  min="25" 
                  max="200" 
                  value={waveformSettings?.basePosition ?? 60}
                  onChange={(e) => onWaveformSettingsChange?.({ basePosition: parseInt(e.target.value) })}
                  className="setting-slider"
                  disabled={!waveformSettings?.useCustomSettings}
                />
              </div>
            </div>
          </div>
          
          {/* Particles Dropdown */}
          <div className="menu-dropdown">
            <button 
              className={`menu-item dropdown-toggle ${isParticlesOpen ? 'open' : ''}`}
              onClick={() => setIsParticlesOpen(!isParticlesOpen)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="6" cy="6" r="1"></circle>
                <circle cx="18" cy="6" r="1"></circle>
                <circle cx="6" cy="18" r="1"></circle>
                <circle cx="18" cy="18" r="1"></circle>
                <circle cx="3" cy="12" r="1"></circle>
                <circle cx="21" cy="12" r="1"></circle>
              </svg>
              <span>Particles</span>
              <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            <div className={`dropdown-content ${isParticlesOpen ? 'open' : ''}`}>
              {/* Enable/Disable Toggle */}
              <div className="dropdown-setting">
                <span className="setting-label">Enabled</span>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={particleSettings?.enabled ?? true}
                    onChange={(e) => onParticleSettingsChange?.({ enabled: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="dropdown-divider"></div>
              
              {/* Count Slider */}
              <div className="dropdown-setting">
                <span className="setting-label">Count: {particleSettings?.count ?? 20}</span>
                <input 
                  type="range" 
                  min="0" 
                  max="200" 
                  value={particleSettings?.count ?? 20}
                  onChange={(e) => onParticleSettingsChange?.({ count: parseInt(e.target.value) })}
                  className="setting-slider"
                />
              </div>
              
              {/* Size Slider */}
              <div className="dropdown-setting">
                <span className="setting-label">Size: {(particleSettings?.size ?? 1).toFixed(1)}x</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="10" 
                  step="0.1"
                  value={particleSettings?.size ?? 1}
                  onChange={(e) => onParticleSettingsChange?.({ size: parseFloat(e.target.value) })}
                  className="setting-slider"
                />
              </div>
              
              {/* Speed Slider */}
              <div className="dropdown-setting">
                <span className="setting-label">Speed: {(particleSettings?.speed ?? 1).toFixed(1)}x</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="3" 
                  step="0.1"
                  value={particleSettings?.speed ?? 1}
                  onChange={(e) => onParticleSettingsChange?.({ speed: parseFloat(e.target.value) })}
                  className="setting-slider"
                />
              </div>
            </div>
          </div>
          
          {/* Center Elements Dropdown */}
          <div className="menu-dropdown">
            <button 
              className={`menu-item dropdown-toggle ${isCenterElementsOpen ? 'open' : ''}`}
              onClick={() => setIsCenterElementsOpen(!isCenterElementsOpen)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              <span>Center Elements</span>
              <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            <div className={`dropdown-content ${isCenterElementsOpen ? 'open' : ''}`}>
              {/* Chroma Wheel Toggle */}
              <div className="dropdown-setting">
                <span className="setting-label">Chroma Wheel</span>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={centerElementSettings?.chromaWheel ?? true}
                    onChange={(e) => onCenterElementSettingsChange?.({ chromaWheel: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              {/* Circular Mel Toggle */}
              <div className="dropdown-setting">
                <span className="setting-label">Circular Mel</span>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={centerElementSettings?.circularMel ?? true}
                    onChange={(e) => onCenterElementSettingsChange?.({ circularMel: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              {/* Pitch Orb Toggle */}
              <div className="dropdown-setting">
                <span className="setting-label">Pitch Orb</span>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={centerElementSettings?.pitchOrb ?? true}
                    onChange={(e) => onCenterElementSettingsChange?.({ pitchOrb: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              {/* Beat Flash Toggle */}
              <div className="dropdown-setting">
                <span className="setting-label">Beat Flash</span>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={centerElementSettings?.beatFlash ?? true}
                    onChange={(e) => onCenterElementSettingsChange?.({ beatFlash: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Sample Rate Dropdown */}
          <div className="menu-dropdown">
            <button 
              className={`menu-item dropdown-toggle ${isSampleRateOpen ? 'open' : ''}`}
              onClick={() => setIsSampleRateOpen(!isSampleRateOpen)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <span>Sample Rate</span>
              <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            <div className={`dropdown-content ${isSampleRateOpen ? 'open' : ''}`}>
              <div className="dropdown-info">
                <span className="info-text">Frames per second for each analysis type. Higher = smoother but uses more CPU.</span>
              </div>
              <div className="dropdown-divider"></div>
              
              {/* Chroma FPS Slider */}
              <div className="dropdown-setting">
                <span className="setting-label">Chroma: {sampleRateSettings?.chromaFps ?? 5} fps</span>
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  value={sampleRateSettings?.chromaFps ?? 5}
                  onChange={(e) => onSampleRateSettingsChange?.({ chromaFps: parseInt(e.target.value) })}
                  className="setting-slider"
                />
              </div>
              
              {/* Mel Spectrogram FPS Slider */}
              <div className="dropdown-setting">
                <span className="setting-label">Mel Spec: {sampleRateSettings?.melFps ?? 5} fps</span>
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  value={sampleRateSettings?.melFps ?? 5}
                  onChange={(e) => onSampleRateSettingsChange?.({ melFps: parseInt(e.target.value) })}
                  className="setting-slider"
                />
              </div>
              
              {/* Pitch FPS Slider */}
              <div className="dropdown-setting">
                <span className="setting-label">Pitch: {sampleRateSettings?.pitchFps ?? 5} fps</span>
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  value={sampleRateSettings?.pitchFps ?? 5}
                  onChange={(e) => onSampleRateSettingsChange?.({ pitchFps: parseInt(e.target.value) })}
                  className="setting-slider"
                />
              </div>
              
              {/* Rhythm FPS Slider */}
              <div className="dropdown-setting">
                <span className="setting-label">Rhythm: {sampleRateSettings?.rhythmFps ?? 5} fps</span>
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  value={sampleRateSettings?.rhythmFps ?? 5}
                  onChange={(e) => onSampleRateSettingsChange?.({ rhythmFps: parseInt(e.target.value) })}
                  className="setting-slider"
                />
              </div>
              
              <div className="dropdown-divider"></div>
              <div className="dropdown-note">
                <span className="note-text">⚠️ Changes apply to new song analyses only</span>
              </div>
            </div>
          </div>
          
          <a href={`${import.meta.env.BASE_URL}test-runner.html`} className="menu-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Settings / Test Runner</span>
          </a>
          
          <div className="menu-divider"></div>
          
          <a href="https://github.com/yerry262/Spotify-Webapp-Visualizer" target="_blank" rel="noopener noreferrer" className="menu-item">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </a>
          
          <div className="menu-divider"></div>
          
          <button className="menu-item switch-account-item" onClick={onSwitchAccount} title="Sign in with a different Spotify account">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <polyline points="17 11 19 13 23 9"></polyline>
            </svg>
            <span>Switch Account</span>
          </button>
          
          <button className="menu-item logout-item" onClick={onLogout}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            <span>Sign Out</span>
          </button>
        </nav>
        
        <div className="side-menu-footer">
          <p>Spotify Visualizer</p>
          <p className="version-text">Educational Project</p>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
