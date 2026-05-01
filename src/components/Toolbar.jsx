import useUIStore from '../store/useUIStore';
import useGameStore from '../store/useGameStore';

export default function Toolbar() {
  const setModal = useUIStore((s) => s.setModal);
  const lightMode = useUIStore((s) => s.lightMode);
  const toggleLightMode = useUIStore((s) => s.toggleLightMode);
  const resetGame = useGameStore((s) => s.resetGame);

  const buttons = [
    { label: 'Warehouses',   icon: '🏭', modal: 'warehouses' },
    { label: 'Customers',    icon: '👥', modal: 'customers'  },
    { label: 'Supply Chain', icon: '🔗', modal: 'supply'     },
    { label: 'Stock DB',     icon: '📦', modal: 'stock'      },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 h-14 flex items-center px-5 gap-3 z-50"
      style={{
        background: lightMode ? 'rgba(255,255,255,0.95)' : 'rgba(7, 10, 22, 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: lightMode ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(59, 130, 246, 0.15)',
        boxShadow: lightMode ? '0 2px 20px rgba(0,0,0,0.08)' : '0 2px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          ⛓
        </div>
        <span className="text-sm font-bold tracking-widest uppercase"
          style={{ color: lightMode ? '#1e293b' : '#e2e8f0' }}>
          SupplyGame
        </span>
      </div>

      {/* Nav buttons */}
      {buttons.map(({ label, icon, modal }) => (
        <button
          key={modal}
          className="btn-toolbar"
          onClick={() => setModal(modal)}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}

      <div className="flex-1" />

      {/* Light/Dark toggle */}
      <button
        className="btn-toolbar"
        onClick={toggleLightMode}
        title={lightMode ? 'Passer en mode sombre' : 'Passer en mode clair'}
      >
        <span>{lightMode ? '🌙' : '☀️'}</span>
        <span>{lightMode ? 'Dark' : 'Light'}</span>
      </button>

      {/* Reset */}
      <button
        className="btn-toolbar"
        style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }}
        onClick={resetGame}
      >
        <span>⚠</span>
        <span>Reset Game</span>
      </button>
    </header>
  );
}
