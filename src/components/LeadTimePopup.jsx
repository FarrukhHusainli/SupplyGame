import { useState, useEffect, useRef } from 'react';
import useUIStore from '../store/useUIStore';
import useGameStore from '../store/useGameStore';

export default function LeadTimePopup() {
  const { pendingPipe, clearPendingPipe } = useUIStore();
  const addPipe = useGameStore((s) => s.addPipe);
  const [lt, setLt] = useState('0');
  const inputRef = useRef();

  useEffect(() => {
    if (pendingPipe) {
      setLt('0');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [pendingPipe]);

  if (!pendingPipe) return null;

  const confirm = () => {
    const leadTime = Math.max(0, parseFloat(lt) || 0);
    addPipe(pendingPipe.fromId, pendingPipe.toId, leadTime);
    clearPendingPipe();
  };

  const cancel = () => clearPendingPipe();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(7,10,22,0.96)',
          border: '1px solid rgba(77,184,255,0.3)',
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          pointerEvents: 'auto',
          minWidth: 280,
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); }}
      >
        {/* Connection label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4db8ff' }}>{pendingPipe.fromId}</span>
          <span style={{ color: '#475569', fontSize: 13 }}>→</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#e8c97a' }}>{pendingPipe.toId}</span>
          <span style={{ color: '#475569', fontSize: 10, marginLeft: 4 }}>Lead time</span>
          <input
            ref={inputRef}
            type="number"
            min="0"
            step="0.5"
            value={lt}
            onChange={(e) => setLt(e.target.value)}
            style={{
              width: 52,
              background: 'rgba(15,23,42,0.9)',
              border: '1px solid rgba(77,184,255,0.4)',
              borderRadius: 6,
              color: '#e2e8f0',
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 6px',
              outline: 'none',
              textAlign: 'center',
            }}
          />
          <span style={{ color: '#475569', fontSize: 10 }}>w</span>
        </div>

        {/* Buttons */}
        <button
          onClick={confirm}
          style={{
            background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
            border: 'none',
            borderRadius: 7,
            color: 'white',
            fontSize: 11,
            fontWeight: 700,
            padding: '5px 12px',
            cursor: 'pointer',
          }}
        >
          OK
        </button>
        <button
          onClick={cancel}
          style={{
            background: 'rgba(30,41,59,0.8)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 7,
            color: '#94a3b8',
            fontSize: 11,
            fontWeight: 600,
            padding: '5px 10px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
