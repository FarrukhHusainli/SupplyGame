import { useState } from 'react';
import { ManagerHeader } from '../Modal';
import useGameStore from '../../store/useGameStore';

export default function SupplyManager() {
  const { warehouses, customers, vendors, pipes, addPipe, deletePipe, updatePipeLeadTime, currentPeriod } = useGameStore();

  // Customer connection form (WH → Customer/WH)
  const [cuFrom, setCuFrom] = useState('');
  const [cuTo,   setCuTo]   = useState('');
  const [cuLt,   setCuLt]   = useState('0');
  const [cuErr,  setCuErr]  = useState('');

  // Vendor connection form (Vendor → WH)
  const [vnFrom, setVnFrom] = useState('');
  const [vnTo,   setVnTo]   = useState('');
  const [vnLt,   setVnLt]   = useState('0');
  const [vnErr,  setVnErr]  = useState('');

  const [editing, setEditing] = useState(null); // { id, leadTime }

  const visWarehouses = Object.keys(warehouses).filter(n => (warehouses[n].createdAtPeriod ?? 1) <= currentPeriod);
  const visCustomers  = Object.keys(customers).filter(n  => (customers[n].createdAtPeriod  ?? 1) <= currentPeriod);
  const visVendors    = Object.keys(vendors).filter(n    => (vendors[n].createdAtPeriod    ?? 1) <= currentPeriod);
  const visPipes      = pipes.filter(p => (p.createdAtPeriod ?? 1) <= currentPeriod);

  const whAndCuNodes = [
    ...visWarehouses.map((n) => ({ name: n, type: 'warehouse' })),
    ...visCustomers.map((n)  => ({ name: n, type: 'customer'  })),
  ];

  // Helper: determine node type label for display
  const nodeTypeLabel = (name) => {
    if (warehouses[name]) return 'WH';
    if (customers[name])  return 'CU';
    if (vendors[name])    return 'VN';
    return '?';
  };

  const handleAddCustomer = () => {
    if (!cuFrom || !cuTo) { setCuErr('Select both FROM and TO'); return; }
    if (cuFrom === cuTo)  { setCuErr('FROM and TO must be different'); return; }
    const leadTime = parseFloat(cuLt);
    if (isNaN(leadTime) || leadTime < 0) { setCuErr('Invalid lead time'); return; }
    addPipe(cuFrom, cuTo, leadTime);
    setCuFrom(''); setCuTo(''); setCuLt('0'); setCuErr('');
  };

  const handleAddVendor = () => {
    if (!vnFrom || !vnTo) { setVnErr('Select both FROM and TO'); return; }
    const leadTime = parseFloat(vnLt);
    if (isNaN(leadTime) || leadTime < 0) { setVnErr('Invalid lead time'); return; }
    addPipe(vnFrom, vnTo, leadTime);
    setVnFrom(''); setVnTo(''); setVnLt('0'); setVnErr('');
  };

  const handleSaveLeadTime = () => {
    if (!editing) return;
    const leadTime = Math.max(0, parseFloat(editing.leadTime) || 0);
    updatePipeLeadTime(editing.id, leadTime);
    setEditing(null);
  };

  return (
    <>
      <ManagerHeader title="Supply Connections" icon="🔗" />

      <div className="flex flex-col gap-2 mb-5">
        {visPipes.length === 0 && (
          <p className="text-slate-500 text-xs text-center py-4">No connections yet.</p>
        )}
        {visPipes.map((p) => {
          const isEditing = editing?.id === p.id;
          const isVendorPipe = !!vendors[p.from];
          return (
            <div key={p.id} className="flex flex-col gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(30,41,59,0.7)', border: `1px solid ${isEditing ? 'rgba(59,130,246,0.4)' : isVendorPipe ? 'rgba(168,85,247,0.2)' : 'rgba(99,102,241,0.15)'}` }}>

              {isEditing ? (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className={isVendorPipe ? 'text-purple-400' : 'text-blue-400'}>{p.from}</span>
                    <span className="text-slate-500 text-[0.6rem] font-bold uppercase">({nodeTypeLabel(p.from)})</span>
                    <span className="text-slate-500">➔</span>
                    <span className="text-amber-400">{p.to}</span>
                    <span className="text-slate-500 text-[0.6rem] font-bold uppercase">({nodeTypeLabel(p.to)})</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-wider">Lead Time (weeks)</label>
                    <input
                      className="input h-8 w-20 text-right text-sm"
                      type="number" min="0" step="0.5"
                      value={editing.leadTime}
                      onChange={(e) => setEditing({ ...editing, leadTime: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLeadTime(); if (e.key === 'Escape') setEditing(null); }}
                      autoFocus
                    />
                    <button onClick={handleSaveLeadTime}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold px-3 py-1 rounded-lg"
                      style={{ background: 'rgba(16,185,129,0.1)' }}>✓ Save</button>
                    <button onClick={() => setEditing(null)}
                      className="text-xs text-slate-500 hover:text-slate-300 px-3 py-1 rounded-lg"
                      style={{ background: 'rgba(30,41,59,0.8)' }}>✕</button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                      <span className={isVendorPipe ? 'text-purple-400' : 'text-blue-400'}>{p.from}</span>
                      <span className="text-slate-500 text-[0.6rem] font-bold uppercase">({nodeTypeLabel(p.from)})</span>
                      <span className="text-slate-500">➔</span>
                      <span className="text-amber-400">{p.to}</span>
                      <span className="text-slate-500 text-[0.6rem] font-bold uppercase">({nodeTypeLabel(p.to)})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Lead time: {p.leadTime} week{p.leadTime !== 1 ? 's' : ''}</div>
                  </div>
                  <button onClick={() => setEditing({ id: p.id, leadTime: String(p.leadTime) })}
                    className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg flex-shrink-0 transition-colors"
                    style={{ background: 'rgba(59,130,246,0.1)' }}>
                    Edit
                  </button>
                  <button onClick={() => { if (window.confirm('Delete this connection?')) deletePipe(p.id); }}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.1)' }}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Customer Connection ── */}
      <div className="pt-4" style={{ borderTop: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Customer Connection <span className="text-blue-500 normal-case font-normal">(WH → Customer / WH)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1 block">From (WH)</label>
            <select className="input" value={cuFrom} onChange={(e) => { setCuFrom(e.target.value); setCuErr(''); }}>
              <option value="">-- select --</option>
              {visWarehouses.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1 block">To (WH / CU)</label>
            <select className="input" value={cuTo} onChange={(e) => { setCuTo(e.target.value); setCuErr(''); }}>
              <option value="">-- select --</option>
              {whAndCuNodes.filter((n) => n.name !== cuFrom).map((n) => (
                <option key={n.name} value={n.name}>{n.name} ({n.type === 'warehouse' ? 'WH' : 'CU'})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-slate-500 font-semibold mb-1 block">Lead Time (weeks)</label>
            <input type="number" min="0" step="0.5" className="input" value={cuLt} onChange={(e) => setCuLt(e.target.value)} />
          </div>
          <button className="btn-primary h-9 px-4 text-sm" onClick={handleAddCustomer}>Add</button>
        </div>
        {cuErr && <p className="text-xs text-red-400 mt-2">{cuErr}</p>}
      </div>

      {/* ── Vendor Connection ── */}
      <div className="pt-4 mt-3" style={{ borderTop: '1px solid rgba(168,85,247,0.15)' }}>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Vendor Connection <span className="text-purple-400 normal-case font-normal">(Vendor → WH)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1 block">From (Vendor)</label>
            <select className="input" value={vnFrom} onChange={(e) => { setVnFrom(e.target.value); setVnErr(''); }}>
              <option value="">-- select --</option>
              {visVendors.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1 block">To (WH)</label>
            <select className="input" value={vnTo} onChange={(e) => { setVnTo(e.target.value); setVnErr(''); }}>
              <option value="">-- select --</option>
              {visWarehouses.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-slate-500 font-semibold mb-1 block">Lead Time (weeks)</label>
            <input type="number" min="0" step="0.5" className="input" value={vnLt} onChange={(e) => setVnLt(e.target.value)} />
          </div>
          <button className="h-9 px-4 text-sm rounded-lg font-semibold text-purple-300"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}
            onClick={handleAddVendor}>Add</button>
        </div>
        {vnErr && <p className="text-xs text-red-400 mt-2">{vnErr}</p>}
      </div>
    </>
  );
}
