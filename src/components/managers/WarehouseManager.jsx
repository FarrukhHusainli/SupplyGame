import { useState } from 'react';
import { ManagerHeader } from '../Modal';
import useGameStore from '../../store/useGameStore';

function computePosition(index, total, radius = 10) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  return [Math.cos(angle) * radius, 0.6, -5 - Math.abs(Math.sin(angle) * radius)];
}

export default function WarehouseManager() {
  const { warehouses, addWarehouse, deleteWarehouse, renameWarehouse, updateStockLevel, currentPeriod } = useGameStore();
  const [name, setName]   = useState('');
  const [stock, setStock] = useState('1000');
  const [err, setErr]     = useState('');
  const [editing, setEditing] = useState(null); // { name, newName, stock }

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

  const startEdit = (n) => {
    setEditing({ name: n, newName: n, stock: String(warehouses[n].currentStock) });
  };

  const handleSave = () => {
    if (!editing) return;
    const newName = editing.newName.trim().toUpperCase();
    if (!newName) return;
    if (newName !== editing.name && warehouses[newName]) { return; } // duplicate
    const newStock = parseInt(editing.stock, 10);

    if (newName !== editing.name) renameWarehouse(editing.name, newName);
    if (!isNaN(newStock)) updateStockLevel(newName !== editing.name ? newName : editing.name, newStock);
    setEditing(null);
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
          const isEditing = editing?.name === n;

          return (
            <div key={n} className="flex flex-col gap-2 px-3 py-2.5 rounded-xl transition-colors"
              style={{ background: 'rgba(30,41,59,0.7)', border: `1px solid ${isEditing ? 'rgba(59,130,246,0.4)' : 'rgba(99,102,241,0.15)'}` }}>

              {isEditing ? (
                /* ── Edit mode ── */
                <>
                  <div className="flex gap-2 items-center">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-blue-300"
                      style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                      {n.slice(0, 2)}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1">
                        <label className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Name</label>
                        <input
                          className="input h-8 text-sm"
                          value={editing.newName}
                          onChange={(e) => setEditing({ ...editing, newName: e.target.value.toUpperCase() })}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(null); }}
                          autoFocus
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Stock</label>
                        <input
                          className="input h-8 text-sm text-right"
                          type="number" min="0"
                          value={editing.stock}
                          onChange={(e) => setEditing({ ...editing, stock: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(null); }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={handleSave} className="text-xs text-emerald-400 hover:text-emerald-300 font-bold px-3 py-1 rounded-lg"
                      style={{ background: 'rgba(16,185,129,0.1)' }}>✓ Save</button>
                    <button onClick={() => setEditing(null)} className="text-xs text-slate-500 hover:text-slate-300 px-3 py-1 rounded-lg"
                      style={{ background: 'rgba(30,41,59,0.8)' }}>✕ Cancel</button>
                  </div>
                </>
              ) : (
                /* ── Display mode ── */
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-blue-300"
                    style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    {n.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-200">{n}</div>
                    <div className="text-xs text-slate-500">{wh.currentStock.toLocaleString()} units · Added W{wh.createdAtPeriod ?? 1}</div>
                  </div>
                  <button onClick={() => startEdit(n)}
                    className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg transition-colors"
                    style={{ background: 'rgba(59,130,246,0.1)' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(n)}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg transition-colors"
                    style={{ background: 'rgba(239,68,68,0.1)' }}>
                    Delete
                  </button>
                </div>
              )}
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
            <input className={`input ${err ? 'border-red-500' : ''}`} placeholder="e.g. WH-PARIS"
              value={name} onChange={(e) => { setName(e.target.value); setErr(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            {err && <p className="text-xs text-red-400 mt-1">{err}</p>}
          </div>
          <div className="w-24">
            <label className="text-xs text-slate-500 font-semibold mb-1 block">Init. Stock</label>
            <input className="input" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
          <button className="btn-primary h-9 px-4 text-sm" onClick={handleAdd}>Add</button>
        </div>
      </div>
    </>
  );
}
