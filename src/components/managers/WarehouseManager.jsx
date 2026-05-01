import { useState } from 'react';
import { ManagerHeader } from '../Modal';
import useGameStore from '../../store/useGameStore';

function computePosition(index, total, radius = 10) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  return [Math.cos(angle) * radius, 0.6, -5 - Math.abs(Math.sin(angle) * radius)];
}

export default function WarehouseManager() {
  const { warehouses, addWarehouse, deleteWarehouse, currentPeriod } = useGameStore();
  const [name, setName] = useState('');
  const [stock, setStock] = useState('1000');
  const [err, setErr] = useState('');

  const names = Object.keys(warehouses).filter(n => (warehouses[n].createdAtPeriod ?? 1) <= currentPeriod);

  const handleAdd = () => {
    const trimmed = name.trim().toUpperCase();
    if (!trimmed) { setErr('Name is required'); return; }
    if (warehouses[trimmed]) { setErr('Name already exists'); return; }
    const pos = computePosition(names.length, names.length + 1, 10);
    addWarehouse(trimmed, pos, parseInt(stock, 10) || 0);
    setName(''); setStock('1000'); setErr('');
  };

  const handleDelete = (n) => {
    if (!window.confirm(`Delete warehouse "${n}" and all its connections?`)) return;
    deleteWarehouse(n);
  };

  return (
    <>
      <ManagerHeader title="Warehouses" icon="🏭" />

      {/* List */}
      <div className="flex flex-col gap-2 mb-5">
        {names.length === 0 && (
          <p className="text-slate-500 text-xs text-center py-4">No warehouses yet. Add one below.</p>
        )}
        {names.map((n) => {
          const wh = warehouses[n];
          return (
            <div key={n} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
              style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-blue-300"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                {n.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-200">{n}</div>
                <div className="text-xs text-slate-500">{wh.currentStock.toLocaleString()} units · Added W{wh.createdAtPeriod ?? 1}</div>
              </div>
              <button
                onClick={() => handleDelete(n)}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg transition-colors"
                style={{ background: 'rgba(239,68,68,0.1)' }}
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>

      {/* Add form */}
      <div className="pt-4" style={{ borderTop: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Add New Warehouse</div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-slate-500 font-semibold mb-1 block">Code / Name</label>
            <input
              className={`input ${err ? 'border-red-500' : ''}`}
              placeholder="e.g. WH-PARIS"
              value={name}
              onChange={(e) => { setName(e.target.value); setErr(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            {err && <p className="text-xs text-red-400 mt-1">{err}</p>}
          </div>
          <div className="w-24">
            <label className="text-xs text-slate-500 font-semibold mb-1 block">Init. Stock</label>
            <input
              className="input"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
          <button className="btn-primary h-9 px-4 text-sm" onClick={handleAdd}>Add</button>
        </div>
      </div>
    </>
  );
}
