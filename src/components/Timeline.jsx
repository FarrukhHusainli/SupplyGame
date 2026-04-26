import { useEffect, useRef } from 'react';
import useGameStore from '../store/useGameStore';

const WEEK_DURATION_MS = 250; // 0.25 seconds per week

export default function Timeline() {
  const { currentWeek, isPaused, setIsPaused, setLastWeekTime, lastWeekTime, advanceWeek, goBackWeek } =
    useGameStore();

  const rafRef = useRef(null);
  const progressRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    let startTime = lastWeekTime || performance.now();

    const tick = (now) => {
      if (!isPaused) {
        const elapsed = now - startTime;
        const ratio = Math.min(elapsed / WEEK_DURATION_MS, 1);

        if (progressRef.current) {
          progressRef.current.style.setProperty('--progress', `${ratio * 100}%`);
        }

        if (circleRef.current) {
          const r = circleRef.current.r.baseVal.value;
          const circumference = 2 * Math.PI * r;
          circleRef.current.style.strokeDasharray = `${circumference}`;
          circleRef.current.style.strokeDashoffset = `${ratio * circumference}`;
        }

        if (elapsed >= WEEK_DURATION_MS) {
          if (currentWeek >= 100) {
            setIsPaused(true);
            // Reset visuals to start state
            if (progressRef.current) progressRef.current.style.setProperty('--progress', '0%');
            if (circleRef.current) circleRef.current.style.strokeDashoffset = '0';
            
            // Return to Period 1
            for (let i = 0; i < currentWeek - 1; i++) goBackWeek();
            setLastWeekTime(0);
          } else {
            startTime = now;
            setLastWeekTime(now);
            advanceWeek();
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPaused, currentWeek, advanceWeek, goBackWeek, setIsPaused, setLastWeekTime]);

  const handleScrub = (e) => {
    const target = parseInt(e.target.value, 10);
    const steps = Math.abs(target - currentWeek);
    const isForward = target > currentWeek;
    const wasPaused = isPaused;
    setIsPaused(true);
    for (let i = 0; i < steps; i++) {
      if (isForward) advanceWeek();
      else goBackWeek();
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
      {/* Step Back Button */}
      <button
        onClick={goBackWeek}
        disabled={currentWeek <= 1}
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-blue-500/20 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(30,41,59,0.5)',
          color: '#60a5fa',
          border: '1px solid rgba(59,130,246,0.2)',
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}
        title="Previous Week"
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
          W {currentWeek}
        </div>

        {/* SVG ring */}
        <svg
          className="absolute inset-0"
          width="44" height="44"
          style={{ transform: 'rotate(-90deg)', pointerEvents: 'none' }}
        >
          <circle cx="22" cy="22" r="19" stroke="rgba(59,130,246,0.15)" strokeWidth="2" fill="none" />
          <circle
            ref={circleRef}
            cx="22" cy="22" r="19"
            stroke={isPaused ? 'rgba(59,130,246,0.3)' : '#3b82f6'}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

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
        onClick={advanceWeek}
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-blue-500/20 active:scale-90"
        style={{
          background: 'rgba(30,41,59,0.5)',
          color: '#60a5fa',
          border: '1px solid rgba(59,130,246,0.2)',
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}
        title="Next Week"
      >
        ⏭
      </button>

      {/* Timeline slider */}
      <div className="flex-1 flex flex-col justify-center relative pt-1" ref={progressRef}>
        <input
          type="range"
          min={1}
          max={100}
          value={currentWeek}
          onChange={handleScrub}
          className="w-full"
          style={{
            appearance: 'none',
            height: 2,
            background: `linear-gradient(to right, #3b82f6 ${((currentWeek - 1) / 99) * 100}%, rgba(99,102,241,0.2) ${((currentWeek - 1) / 99) * 100}%)`,
            borderRadius: 2,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
        {/* Period number grid markers */}
        <div className="flex justify-between mt-1 px-1 pointer-events-none">
          {[1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((num) => (
            <div key={num} className="flex flex-col items-center">
              <div className="w-px h-1 bg-blue-500/20" />
              <span className="text-[0.55rem] text-slate-500 font-mono mt-0.5">{num}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
