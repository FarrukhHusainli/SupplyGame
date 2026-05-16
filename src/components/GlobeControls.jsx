import { useState, useRef, useEffect } from 'react';
import useUIStore from '../store/useUIStore';
import { COUNTRIES, WORLD_VIEW, cameraForCountry } from '../utils/geo';

const MIN_H   = 10;   // closest zoom (10 units above map)
const MAX_H   = 250;  // farthest zoom (full world)
const DEFAULT = 220;  // initial world-view height

export default function GlobeControls() {
  const setZoomTarget  = useUIStore((s) => s.setZoomTarget);
  const setTargetCamY  = useUIStore((s) => s.setTargetCamY);
  const lightMode      = useUIStore((s) => s.lightMode);

  const [search,     setSearch]     = useState('');
  const [open,       setOpen]       = useState(false);
  const [sliderVal,  setSliderVal]  = useState(DEFAULT);

  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const filtered = search.trim().length >= 1
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  // Fly to a country and sync the slider to that zoom height
  const zoomTo = (country) => {
    const { pos, lookAt } = cameraForCountry(country.lon, country.lat, country.zoom);
    setZoomTarget(pos, lookAt);
    setSliderVal(country.zoom);
    setSearch('');
    setOpen(false);
  };

  // Fly back to full world view
  const zoomWorld = () => {
    setZoomTarget(WORLD_VIEW.pos, WORLD_VIEW.lookAt);
    setSliderVal(DEFAULT);
    setSearch('');
    setOpen(false);
  };

  // Slider change → direct y-only zoom (keeps camera x/z)
  const handleSlider = (e) => {
    const val = Number(e.target.value);
    setSliderVal(val);
    setTargetCamY(val);
  };

  // Step buttons (± 20 units)
  const step = (delta) => {
    const next = Math.min(MAX_H, Math.max(MIN_H, sliderVal + delta));
    setSliderVal(next);
    setTargetCamY(next);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const bg      = lightMode ? 'rgba(255,255,255,0.95)' : 'rgba(7,10,22,0.92)';
  const border  = lightMode ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(59,130,246,0.2)';
  const textCol = lightMode ? '#1e293b' : '#e2e8f0';
  const mutedCol = lightMode ? '#64748b' : '#64748b';

  return (
    <div
      ref={panelRef}
      className="absolute z-40"
      style={{ bottom: 72, left: 16, width: 272 }}
    >
      {/* ── Main card ── */}
      <div
        style={{
          background: bg,
          border,
          borderRadius: 14,
          padding: '10px 10px 12px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >

        {/* ── Row 1: world button + search ── */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={zoomWorld}
            title="World view"
            style={{
              flexShrink: 0,
              width: 32, height: 32,
              borderRadius: 8,
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#60a5fa',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            🌍
          </button>

          <input
            ref={inputRef}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Zoom to country…"
            style={{
              flex: 1,
              background: lightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
              border: lightMode ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '0 10px',
              height: 32,
              color: textCol,
              fontSize: 12,
              fontWeight: 500,
              outline: 'none',
            }}
          />

          {search && (
            <button
              onClick={() => { setSearch(''); setOpen(false); }}
              style={{ color: mutedCol, fontSize: 14, cursor: 'pointer', background: 'none', border: 'none', padding: '0 2px' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Row 2: zoom slider ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: mutedCol, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Zoom
            </span>
            <span style={{ fontSize: 10, color: mutedCol, fontVariantNumeric: 'tabular-nums' }}>
              {sliderVal < 30 ? 'Street' : sliderVal < 60 ? 'Country' : sliderVal < 120 ? 'Region' : sliderVal < 180 ? 'Continent' : 'World'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Zoom in */}
            <button
              onClick={() => step(-25)}
              title="Zoom in"
              style={{
                width: 26, height: 26,
                borderRadius: 6,
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: '#60a5fa',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              +
            </button>

            {/* Slider — inverted so left = close (zoom in), right = far (zoom out) */}
            <input
              type="range"
              min={MIN_H}
              max={MAX_H}
              step={1}
              value={sliderVal}
              onChange={handleSlider}
              style={{
                flex: 1,
                height: 4,
                cursor: 'pointer',
                accentColor: '#3b82f6',
              }}
            />

            {/* Zoom out */}
            <button
              onClick={() => step(+25)}
              title="Zoom out"
              style={{
                width: 26, height: 26,
                borderRadius: 6,
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: '#60a5fa',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              −
            </button>
          </div>
        </div>
      </div>

      {/* ── Country dropdown (outside card so it overlaps upward) ── */}
      {open && filtered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0, right: 0,
            marginBottom: 4,
            background: bg,
            border,
            borderRadius: 10,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          {filtered.map((c) => (
            <button
              key={c.code}
              onMouseDown={(e) => { e.preventDefault(); zoomTo(c); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 14px',
                background: 'none',
                border: 'none',
                borderBottom: lightMode ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
                color: textCol,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
