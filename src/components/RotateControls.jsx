import React from 'react';

// The 2×5 Random/Cycle control grid (mode label + 5s/15s/30s/∞ per row).
// Rendered both inside the SideMenu waveform dropdown and inside the
// floating RotateBubble — all state lives in App so the two stay in sync.

export const ROTATE_INTERVAL_OPTIONS = [
  { value: 5, label: '5s' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: Infinity, label: '∞' },
];

const ROW_DEFS = [
  { mode: 'random', label: 'Random', title: 'Random style (auto-advances unless ∞; click again to re-roll)' },
  { mode: 'cycle', label: 'Cycle', title: 'Next style in order (auto-advances unless ∞; click again to skip)' },
];

const RotateControls = ({
  rotateMode,
  autoInterval,
  isWaveformAuto,
  onModeClick,
  onIntervalChange,
  onRowPointerDown,
}) => (
  <>
    {ROW_DEFS.map(({ mode, label, title }) => (
      <div
        key={mode}
        className={`dropdown-item auto-row ${isWaveformAuto && rotateMode === mode ? 'active' : ''}`}
        onPointerDown={onRowPointerDown}
      >
        <div
          className="auto-label-area"
          onClick={() => onModeClick(mode)}
          title={title}
        >
          <span className="item-dot"></span>
          <span>{label}</span>
        </div>
        <div className="interval-buttons">
          {ROTATE_INTERVAL_OPTIONS.map(opt => (
            <button
              key={opt.label}
              className={`interval-btn ${autoInterval === opt.value ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onIntervalChange(mode, opt.value);
              }}
            >{opt.label}</button>
          ))}
        </div>
      </div>
    ))}
  </>
);

export default RotateControls;
