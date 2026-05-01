import { useState } from 'react';
import { ManagerHeader } from '../Modal';
import useGameStore from '../../store/useGameStore';

export default function SupplyManager() {
  const { warehouses, customers, pipes, addPipe, deletePipe, currentPeriod } = useGameStore();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [lt, setLt] = useState('0');
  const [err, setErr] = useState('');

  const visWarehouses = Object.keys(warehouses).filter(n => (warehouses[n].createdAtPeriod ?? 1) <= currentPeriod);
  const visCustomers  = Object.keys(customers).filter(n => (customers[n].createdAtPeriod  ?? 1) <= currentPeriod);
  const visPipes      = pipes.filter(p => (p.createdAtPeriod ?? 1) <= currentPeriod);

  const allNodes = [
    ...visWarehouses.map((n) => ({ name: n, type: 'warehouse' })),
    ...visCustomers.map((n) => ({ name: n, type: 'customer' })),
  ];

  const handleAdd = () => {
    if (!from || !to) { setErr('Select both FROM and TO'); return; }
    if (from === to) { setErr('FROM and TO must be different'); return; }
    const leadTime = parseFloat(lt);
    if (isNaN(leadTime) || leadTime < 0) { setErr('Invalid lead time'); return; }
    addPipe(from, to, leadTime);
    setFrom(''); setTo(''); setLt('0'); setErr('');
  };

  return (
    <>
      <ManagerHeader title="Supply Connections" icon="🔗" />

      <div className="flex flex-col gap-2 mb-5">
        {visPipes.length === 0 && (
          <p className="text-slate-500 text-xs text-center py-4">No connections yet.</p>
        )}
        {visPipes.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <span className="text-blue-400">{p.from}</span>
                <span className="text-slate-500">➔</span>
                <span className="text-amber-400">{p.to}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Lead time: {p.leadTime} week{p.leadTime !== 1 ? 's' : ''}</div>
            </div>
            <button
              onClick={() => { if (window.confirm('Delete this connection?')) deletePipe(p.id); }}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4" style={{ borderTop: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Add Connection</div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1 block">From</label>
            <select className="input" value={from} onChange={(e) => { setFrom(e.target.value); setErr(''); }}>
              <option value="">-- select --</option>
              {visWarehouses.map((n) => (
                <option key={n} value={n}>{n} (WH)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1 block">To</label>
            <select className="input" value={to} onChange={(e) => { setTo(e.target.value); setErr(''); }}>
              <option value="">-- select --</option>
              {allNodes.filter((n) => n.name !== from).map((n) => (
                <option key={n.name} value={n.name}>{n.name} ({n.type === 'warehouse' ? 'WH' : 'CU'})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-slate-500 font-semibold mb-1 block">Lead Time (weeks)</label>
            <input type="number" min="0" step="0.5" className="input" value={lt}
              onChange={(e) => setLt(e.target.value)} />
          </div>
          <button className="btn-primary h-9 px-4 text-sm" onClick={handleAdd}>Add</button>
        </div>
        {err && <p className="text-xs text-red-400 mt-2">{err}</p>}
      </div>
    </>
  );
}
