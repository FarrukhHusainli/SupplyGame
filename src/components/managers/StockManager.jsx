import { useState } from 'react';
import { ManagerHeader } from '../Modal';
import useGameStore from '../../store/useGameStore';

export default function StockManager() {
  const { warehouses, updateStockLevel } = useGameStore();
  const [editing, setEditing] = useState(null); // { name, value }

  const handleSave = () => {
    if (!editing) return;
    const val = parseInt(editing.value, 10);
    if (isNaN(val) || val < 0) return;
    updateStockLevel(editing.name, val);
    setEditing(null);
  };

  return (
    <>
      <ManagerHeader title="Stock Levels" icon="📦" />
      <p className="text-xs text-slate-500 mb-4">
        Edit initial stock for each warehouse. Changes take effect immediately.
      </p>

      <div className="flex flex-col gap-2">
        {Object.entries(warehouses).map(([name, wh]) => (
          <div key={name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-blue-300"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
              {name.slice(0, 2)}
            </div>
            <div className="flex-1 text-sm font-semibold text-slate-200">{name}</div>

            {editing?.name === name ? (
              <div className="flex gap-1 items-center">
                <input
                  type="number"
                  className="input w-24 text-right h-8"
                  value={editing.value}
                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(null); }}
                  autoFocus
                />
                <button onClick={handleSave} className="text-xs text-emerald-400 hover:text-emerald-300 font-bold px-2 py-1 rounded">✓</button>
                <button onClick={() => setEditing(null)} className="text-xs text-slate-500 hover:text-slate-300 px-1 py-1 rounded">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-mono font-bold text-sm">{wh.currentStock.toLocaleString()}</span>
                <button
                  onClick={() => setEditing({ name, value: String(wh.currentStock) })}
                  className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(30,41,59,0.8)' }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
        {Object.keys(warehouses).length === 0 && (
          <p className="text-slate-500 text-xs text-center py-4">No warehouses to configure.</p>
        )}
      </div>
    </>
  );
}
