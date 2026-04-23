import { useEffect } from 'react';
import useUIStore from '../store/useUIStore';

/**
 * Generic modal overlay.
 * Children (manager panels) are rendered as the modal content.
 */
export default function Modal({ children }) {
  const { openModal, closeModal } = useUIStore();

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.code === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeModal]);

  if (!openModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div
        className="glass-card w-[480px] max-h-[78vh] overflow-y-auto custom-scroll p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Shared header for all manager panels.
 */
export function ManagerHeader({ title, icon }) {
  const closeModal = useUIStore((s) => s.closeModal);
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h2 className="text-base font-bold text-slate-100">{title}</h2>
      </div>
      <button
        onClick={closeModal}
        className="w-7 h-7 rounded-full text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors"
        style={{ background: 'rgba(30,41,59,0.8)' }}
      >
        ✕
      </button>
    </div>
  );
}
