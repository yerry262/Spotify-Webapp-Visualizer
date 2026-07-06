import React, { useEffect, useRef, useState } from 'react';
import RotateControls from './RotateControls';
import './RotateBubble.css';

const BUBBLE_WIDTH = 290;
const EDGE_PAD = 8;

const clampPos = (x, y, el) => {
  const w = el?.offsetWidth || BUBBLE_WIDTH;
  const h = el?.offsetHeight || 120;
  return {
    x: Math.max(EDGE_PAD, Math.min(window.innerWidth - w - EDGE_PAD, x)),
    y: Math.max(EDGE_PAD, Math.min(window.innerHeight - h - EDGE_PAD, y)),
  };
};

/**
 * Floating, draggable bubble holding the Random/Cycle rotate controls.
 * Spawned by dragging the rows out of the sidebar (grabActive=true makes it
 * follow the pointer immediately, mid-gesture) or restored from a saved
 * position. Drag anywhere on the header to move; ✕ closes it.
 */
const RotateBubble = ({ position, grabActive, onMove, onClose, ...controlProps }) => {
  const ref = useRef(null);
  const dragRef = useRef(null); // { dx, dy } grab offset while dragging
  const [pos, setPos] = useState(position);
  const posRef = useRef(pos);
  posRef.current = pos;

  // Spawned mid-drag from the sidebar: grab it by the header immediately
  useEffect(() => {
    if (grabActive) {
      dragRef.current = { dx: BUBBLE_WIDTH / 2, dy: 16 };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPointerMove = (e) => {
      if (!dragRef.current) return;
      e.preventDefault();
      setPos(clampPos(e.clientX - dragRef.current.dx, e.clientY - dragRef.current.dy, ref.current));
    };
    const onPointerUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        onMove(posRef.current);
      }
    };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  }, [onMove]);

  // Keep the bubble on-screen when the window resizes
  useEffect(() => {
    const onResize = () => setPos(p => clampPos(p.x, p.y, ref.current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const startHeaderDrag = (e) => {
    if (e.target.closest('.rotate-bubble-close')) return;
    const rect = ref.current.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
  };

  return (
    <div
      ref={ref}
      className="rotate-bubble"
      style={{ left: pos.x, top: pos.y, width: BUBBLE_WIDTH }}
    >
      <div className="rotate-bubble-header" onPointerDown={startHeaderDrag}>
        <span className="rotate-bubble-grip" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="7" r="1.6"/><circle cx="16" cy="7" r="1.6"/>
            <circle cx="8" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/>
            <circle cx="8" cy="17" r="1.6"/><circle cx="16" cy="17" r="1.6"/>
          </svg>
        </span>
        <span className="rotate-bubble-title">Waveform Rotate</span>
        <button className="rotate-bubble-close" onClick={onClose} aria-label="Close rotate controls">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="rotate-bubble-body">
        <RotateControls {...controlProps} />
      </div>
    </div>
  );
};

export default RotateBubble;
