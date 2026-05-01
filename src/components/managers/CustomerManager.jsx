import { useState } from 'react';
import { ManagerHeader } from '../Modal';
import useGameStore from '../../store/useGameStore';

function computePosition(index, total, radius = 18) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  return [Math.cos(angle) * radius, 0.5, -5 - Math.abs(Math.sin(angle) * radius)];
}

export default function CustomerManager() {
  const { customers, addCustomer, deleteCustomer, currentPeriod } = useGameStore();
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  const names = Object.keys(customers).filter(n => (customers[n].createdAtPeriod ?? 1) <= currentPeriod);

  const handleAdd = () => {
    const trimmed = name.trim().toUpperCase();
    if (!trimmed) { setErr('Name is required'); return; }
    if (customers[trimmed]) { setErr('Name already exists'); return; }
    const pos = computePosition(names.length, names.length + 1, 18);
    addCustomer(trimmed, pos);
    setName(''); setErr('');
  };

  return (
    <>
      <ManagerHeader title="Customers" icon="👥" />

      <div className="flex flex-col gap-2 mb-5">
        {names.length === 0 && (
          <p className="text-slate-500 text-xs text-center py-4">No customers yet.</p>
        )}
        {names.map((n) => (
          <div key={n} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-amber-300"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
              {n.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-200">{n}</div>
              <div className="text-xs text-slate-500">Added W{customers[n].createdAtPeriod ?? 1}</div>
            </div>
            <button
              onClick={() => {
                if (window.confirm(`Delete customer "${n}"?`)) deleteCustomer(n);
              }}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4" style={{ borderTop: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Add New Customer</div>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              className={`input ${err ? 'border-red-500' : ''}`}
              placeholder="e.g. RETAIL-PARIS"
              value={name}
              onChange={(e) => { setName(e.target.value); setErr(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            {err && <p className="text-xs text-red-400 mt-1">{err}</p>}
          </div>
          <button className="btn-primary h-9 px-4 text-sm" onClick={handleAdd}>Add</button>
        </div>
      </div>
    </>
  );
}
