import { useEffect, useRef } from 'react';
import useGameStore from '../store/useGameStore';

const PERIOD_DURATION_MS = 100; // 0.1 seconds per period
const BUCKETS = ['Day', 'Week', 'Month', 'Quarter', 'Year'];
const BUCKET_PREFIX = {
  Day: 'D',
  Week: 'W',
  Month: 'M',
  Quarter: 'Q',
  Year: 'Y',
};

export default function Timeline() {
  const {
    currentPeriod,
    timeBucket,
    setTimeBucket,
    timelineLength,
    setTimelineLength,
    isPaused,
    setIsPaused,
    setLastPeriodTime,
    lastPeriodTime,
    advancePeriod,
    goBackPeriod,
  } = useGameStore();

  const rafRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    let startTime = lastPeriodTime || performance.now();

    const tick = (now) => {
      if (!isPaused) {
        const elapsed = now - startTime;
        const ratio = Math.min(elapsed / PERIOD_DURATION_MS, 1);

        if (progressRef.current) {
          progressRef.current.style.setProperty('--progress', `${ratio * 100}%`);
        }

        if (elapsed >= PERIOD_DURATION_MS) {
          if (currentPeriod >= timelineLength) {
            setIsPaused(true);
            // Reset visuals to start state
            if (progressRef.current) progressRef.current.style.setProperty('--progress', '0%');
            
            // Return to Start
            for (let i = 0; i < currentPeriod - 1; i++) goBackPeriod();
            setLastPeriodTime(0);
          } else {
            startTime = now;
            setLastPeriodTime(now);
            advancePeriod();
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPaused, currentPeriod, timelineLength, advancePeriod, goBackPeriod, setIsPaused, setLastPeriodTime]);

  const handleScrub = (e) => {
    const target = parseInt(e.target.value, 10);
    const steps = Math.abs(target - currentPeriod);
    const isForward = target > currentPeriod;
    const wasPaused = isPaused;
    setIsPaused(true);
    for (let i = 0; i < steps; i++) {
      if (isForward) advancePeriod();
      else goBackPeriod();
    }
    setIsPaused(wasPaused);
  };

  return (
    <div
      className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-3 z-40"
      style={{
        background: 'rgba(7,10,22,0.82)',
        backdropFilter: 'blur(16px)',
        borderRadius: 40,
        border: '1px solid rgba(59,130,246,0.18)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        minWidth: 680,
        maxWidth: '85vw',
      }}
    >
      {/* Global CSS injection to hide native number input arrows */}
      <style>
        {`
          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] { -moz-appearance: textfield; }
        `}
      </style>

      {/* Step Back Button */}
      <button
        onClick={goBackPeriod}
        disabled={currentPeriod <= 1}
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-blue-500/20 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(30,41,59,0.5)',
          color: '#60a5fa',
          border: '1px solid rgba(59,130,246,0.2)',
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}
        title="Previous Period"
      >
        ⏮
      </button>

      {/* Play/Pause button with ring */}
      <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
        {/* Week label above */}
        <div
          className="absolute left-1/2 font-mono font-black text-accent"
          style={{ top: -18, transform: 'translateX(-50%)', fontSize: '0.6rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
        >
          {BUCKET_PREFIX[timeBucket]} {currentPeriod}
        </div>

        {/* Button */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="absolute inset-1 rounded-full flex items-center justify-center text-sm transition-all"
          style={{
            background: isPaused ? 'rgba(30,41,59,0.9)' : 'rgba(59,130,246,0.2)',
            color: isPaused ? '#94a3b8' : '#60a5fa',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {isPaused ? '▶' : '⏸'}
        </button>

        {/* Status */}
        <div
          className="absolute left-1/2 font-black tracking-widest uppercase"
          style={{
            bottom: -15,
            transform: 'translateX(-50%)',
            fontSize: '0.45rem',
            letterSpacing: '0.12em',
            color: isPaused ? '#475569' : '#3b82f6',
            whiteSpace: 'nowrap',
            transition: 'color 0.3s',
          }}
        >
          {isPaused ? 'PAUSED' : 'LIVE'}
        </div>
      </div>

      {/* Step Forward Button */}
      <button
        onClick={advancePeriod}
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-blue-500/20 active:scale-90"
        style={{
          background: 'rgba(30,41,59,0.5)',
          color: '#60a5fa',
          border: '1px solid rgba(59,130,246,0.2)',
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}
        title="Next Period"
      >
        ⏭
      </button>

      {/* Timeline slider */}
      <div className="flex-1 flex flex-col justify-center relative pt-1" ref={progressRef}>
        <input
          type="range"
          min={1}
          max={timelineLength}
          value={currentPeriod}
          onChange={handleScrub}
          className="w-full"
          style={{
            appearance: 'none',
            height: 2,
            background: `linear-gradient(to right, #3b82f6 ${((currentPeriod - 1) / (timelineLength - 1 || 1)) * 100}%, rgba(99,102,241,0.2) ${((currentPeriod - 1) / (timelineLength - 1 || 1)) * 100}%)`,
            borderRadius: 2,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        {/* Period number grid markers */}
        <div className="flex justify-between mt-1 px-1 pointer-events-none">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const num = Math.max(1, Math.round(ratio * timelineLength));
            return (
              <div key={ratio} className="flex flex-col items-center">
                <div className="w-px h-1 bg-blue-500/20" />
                <span className="text-[0.55rem] text-slate-500 font-mono mt-0.5">{num}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline Length Adjustment */}
      <div className="flex flex-col items-center gap-1 border-l border-white/10 pl-4 ml-2 min-w-[90px]">
        <span className="text-[0.5rem] font-bold text-slate-500 uppercase tracking-tighter">Bucket</span>
        <select
          value={timeBucket}
          onChange={(e) => setTimeBucket(e.target.value)}
          className="w-full bg-slate-900/50 border border-blue-500/30 rounded text-center text-[0.65rem] font-mono text-blue-400 focus:outline-none focus:border-blue-500 py-0.5"
        >
          {BUCKETS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col items-center gap-1 border-l border-white/10 pl-4 ml-2">
        <span className="text-[0.5rem] font-bold text-slate-500 uppercase tracking-tighter">Max {timeBucket}s</span>
        <div className="flex items-center">
          <button
            onClick={() => setTimelineLength(Math.max(1, timelineLength - 1))}
            className="w-5 h-5 flex items-center justify-center bg-slate-900/50 border border-blue-500/30 rounded-l text-[0.6rem] text-blue-400 hover:bg-blue-500/20 transition-colors active:scale-95"
          >
            —
          </button>
          <input
            type="number"
            min="1"
            max="999"
            value={timelineLength}
            onChange={(e) => setTimelineLength(e.target.value)}
            className="w-10 h-5 bg-slate-900/80 border-y border-blue-500/30 text-center text-[0.7rem] font-mono text-blue-400 focus:outline-none"
          />
          <button
            onClick={() => setTimelineLength(Math.min(999, timelineLength + 1))}
            className="w-5 h-5 flex items-center justify-center bg-slate-900/50 border border-blue-500/30 rounded-r text-[0.6rem] text-blue-400 hover:bg-blue-500/20 transition-colors active:scale-95"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
