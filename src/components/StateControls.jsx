import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import useUIStore from '../store/useUIStore';

const BTN = {
  padding: '5px 11px',
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

export default function StateControls() {
  const appMode         = useGameStore((s) => s.appMode);
  const historyLen      = useGameStore((s) => s._history.length);
  const undo            = useGameStore((s) => s.undo);
  const enterSimulation = useGameStore((s) => s.enterSimulation);
  const exitSimulation  = useGameStore((s) => s.exitSimulation);
  const saveInitialState = useGameStore((s) => s.saveInitialState);
  const resetToInitial  = useGameStore((s) => s.resetToInitial);
  const lightMode       = useUIStore((s) => s.lightMode);

  const [savingInit, setSavingInit]   = useState(false);
  const [resetting,  setResetting]    = useState(false);

  const bg      = lightMode ? 'rgba(255,255,255,0.95)' : 'rgba(7,10,22,0.92)';
  const border  = lightMode ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)';
  const panelStyle = {
    backdropFilter: 'blur(20px)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
    borderRadius: 12,
    padding: '6px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    background: bg,
    border,
  };
  const divider = (
    <div style={{ width: 1, height: 20, background: 'rgba(100,116,139,0.2)', flexShrink: 0 }} />
  );

  // ── Simulation mode — prominent amber banner (top-center) ──────────────
  if (appMode === 'simulation') {
    return (
      <div style={{
        position: 'fixed',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        ...panelStyle,
        background: 'rgba(120,80,0,0.55)',
        border: '1px solid rgba(234,179,8,0.5)',
      }}>
        <span style={{ fontSize: 15 }}>⚗️</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#fde68a', letterSpacing: '0.1em' }}>
          SIMULATION
        </span>
        <span style={{ fontSize: 11, color: '#fbbf24', marginRight: 4 }}>
          — changes not saved
        </span>

        {divider}

        {/* Undo inside simulation */}
        <button
          onClick={undo}
          disabled={historyLen === 0}
          title={`Undo (Ctrl+Z) — ${historyLen} step${historyLen !== 1 ? 's' : ''}`}
          style={{
            ...BTN,
            background: historyLen > 0 ? 'rgba(59,130,246,0.2)' : 'rgba(100,116,139,0.1)',
            border: historyLen > 0 ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(100,116,139,0.2)',
            color: historyLen > 0 ? '#93c5fd' : '#64748b',
            opacity: historyLen > 0 ? 1 : 0.5,
            cursor: historyLen > 0 ? 'pointer' : 'default',
          }}
        >
          ↩ {historyLen > 0 ? historyLen : ''}
        </button>

        {divider}

        {/* Save simulation → commit to Firebase */}
        <button
          onClick={() => exitSimulation(true)}
          style={{ ...BTN, background: '#15803d', border: '1px solid #166534', color: '#fff' }}
          title="Save simulation state to database and return to Live mode"
        >
          💾 Save
        </button>

        {/* Discard → restore last saved state */}
        <button
          onClick={() => exitSimulation(false)}
          style={{
            ...BTN,
            background: 'rgba(239,68,68,0.18)',
            border: '1px solid rgba(239,68,68,0.35)',
            color: '#f87171',
          }}
          title="Discard all simulation changes and return to last saved state"
        >
          ✕ Discard
        </button>
      </div>
    );
  }

  // ── Saved (Live) mode — compact top-right panel ────────────────────────
  return (
    <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 60, ...panelStyle }}>

      {/* Mode badge */}
      <span style={{
        fontSize: 9,
        fontWeight: 800,
        color: '#22c55e',
        background: 'rgba(34,197,94,0.15)',
        border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: 5,
        padding: '2px 7px',
        letterSpacing: '0.1em',
        flexShrink: 0,
      }}>
        ● LIVE
      </span>

      {divider}

      {/* Undo button */}
      <button
        onClick={undo}
        disabled={historyLen === 0}
        title={`Undo (Ctrl+Z) — ${historyLen} step${historyLen !== 1 ? 's' : ''} available`}
        style={{
          ...BTN,
          background: historyLen > 0 ? 'rgba(59,130,246,0.14)' : 'rgba(100,116,139,0.06)',
          border: historyLen > 0 ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(100,116,139,0.12)',
          color: historyLen > 0 ? '#60a5fa' : '#64748b',
          opacity: historyLen > 0 ? 1 : 0.45,
          cursor: historyLen > 0 ? 'pointer' : 'default',
        }}
      >
        ↩ Undo{historyLen > 0 ? ` (${historyLen})` : ''}
      </button>

      {divider}

      {/* Set Initial */}
      <button
        onClick={async () => {
          if (!window.confirm(
            'Save the current layout as the Initial state?\n\nClicking "Reset" will always return here.'
          )) return;
          setSavingInit(true);
          await saveInitialState();
          setSavingInit(false);
        }}
        disabled={savingInit}
        title="Save current state as the reset target"
        style={{
          ...BTN,
          background: 'rgba(168,85,247,0.13)',
          border: '1px solid rgba(168,85,247,0.28)',
          color: '#c084fc',
          opacity: savingInit ? 0.6 : 1,
        }}
      >
        📌 {savingInit ? 'Saving…' : 'Set Initial'}
      </button>

      {/* Reset to Initial */}
      <button
        onClick={async () => {
          if (!window.confirm(
            'Reset to Initial state?\n\nAll changes since the last "Set Initial" will be lost (you can Undo immediately after).'
          )) return;
          setResetting(true);
          const ok = await resetToInitial();
          setResetting(false);
          if (!ok) window.alert('No Initial state has been set yet.\nUse "Set Initial" to save one first.');
        }}
        disabled={resetting}
        title="Revert to the saved Initial snapshot"
        style={{
          ...BTN,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.22)',
          color: '#f87171',
          opacity: resetting ? 0.6 : 1,
        }}
      >
        🔄 {resetting ? 'Resetting…' : 'Reset'}
      </button>

      {divider}

      {/* Enter Simulation */}
      <button
        onClick={enterSimulation}
        title="Enter Simulation — changes will not auto-save until you click Save"
        style={{
          ...BTN,
          background: 'rgba(234,179,8,0.12)',
          border: '1px solid rgba(234,179,8,0.28)',
          color: '#fbbf24',
        }}
      >
        ⚗️ Simulate
      </button>
    </div>
  );
}
