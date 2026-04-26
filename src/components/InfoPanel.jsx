import useUIStore from '../store/useUIStore';
import useGameStore from '../store/useGameStore';

const fmt = (n) => (typeof n === 'number' ? Math.floor(n).toLocaleString('fr-FR') : n ?? '—');

const BUCKET_PREFIX = {
  Day: 'D',
  Week: 'W',
  Month: 'M',
  Quarter: 'Q',
  Year: 'Y',
};

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-1 mb-1">
      <div
        className="text-slate-500 font-black uppercase tracking-widest flex items-center justify-center"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '0.48rem', letterSpacing: '0.14em', background: 'rgba(30,41,59,0.7)', borderRadius: 4, padding: '3px 2px', minWidth: 16 }}
      >
        {children}
      </div>
    </div>
  );
}

function DataRow({ period, isCurrent, isPast, cells, columns, bucket }) {
  const rowCls = isPast ? 'row-past' : isCurrent ? 'row-current' : 'row-future';
  const prefix = BUCKET_PREFIX[bucket] || 'P';
  return (
    <div
      className={`grid items-center px-2 py-1 rounded-md mb-0.5 text-xs font-mono ${rowCls}`}
      style={{ gridTemplateColumns: columns }}
    >
      <span className="font-bold text-slate-400" style={{ fontSize: '0.6rem' }}>{prefix}{period}</span>
      {cells}
    </div>
  );
}

function WarehousePanel({ name }) {
  const { warehouses, customers, pipes, currentPeriod, getProjections, timeBucket } = useGameStore();
  const wh = warehouses[name];
  if (!wh) return null;

  const proj = getProjections()[name] ?? {};
  const periods = [-3, -2, -1, 0, 1, 2];

  return (
    <div>
      {/* Inventory section */}
      <div className="flex gap-1 mb-3">
        <SectionLabel>Inventory</SectionLabel>
        <div className="flex-1">
          <div
            className="grid px-2 py-0.5 mb-1"
            style={{ gridTemplateColumns: '28px 1fr 0.8fr 1fr 1fr', fontSize: '0.55rem', color: '#64748b', fontWeight: 800 }}
          >
            <span>{BUCKET_PREFIX[timeBucket] || 'PRD'}</span><span className="text-right">OPEN</span><span className="text-right">SS</span>
            <span className="text-right">CLOSE</span><span className="text-right">CL/SS</span>
          </div>
          {periods.map((p) => {
            const w = currentPeriod + p;
            if (w <= 0) return null;
            const isPast = p < 0, isCurrent = p === 0;
            const h = isPast ? (wh.history || []).find((x) => x.period === w) : null;
            if (isPast && !h) return null;

            const opening = isPast ? h.opening : isCurrent ? wh.currentStock : (proj.projected?.[p - 1] ?? 0);
            const endBal = isPast ? h.endBal : (proj.projected?.[p] ?? 0);
            const safety = isPast ? h.safety : (proj.safety?.[p] ?? 0);
            const clss = endBal - safety;

            return (
              <DataRow key={p} period={w} isPast={isPast} isCurrent={isCurrent} bucket={timeBucket}
                columns="28px 1fr 0.8fr 1fr 1fr"
                cells={<>
                  <span className="val-neu text-right" style={{ fontWeight: 400 }}>{fmt(opening)}</span>
                  <span className="val-neu text-right" style={{ opacity: 0.7, fontWeight: 400 }}>{fmt(safety)}</span>
                  <span className={`text-right ${endBal < 0 ? 'val-neg' : 'val-pos'}`}>{fmt(endBal)}</span>
                  <span className={`text-right ${clss < 0 ? 'val-neg' : 'val-pos'}`}>{fmt(clss)}</span>
                </>}
              />
            );
          })}
        </div>
      </div>

      {/* Supply section */}
      <div className="flex gap-1 mb-3">
        <SectionLabel>Supply</SectionLabel>
        <div className="flex-1">
          <div className="grid px-2 py-0.5 mb-1"
            style={{ gridTemplateColumns: '28px 1fr 1fr', fontSize: '0.55rem', color: '#64748b', fontWeight: 800 }}>
            <span>{BUCKET_PREFIX[timeBucket] || 'PRD'}</span><span className="text-right">REQ</span><span className="text-right">RECV</span>
          </div>
          {periods.map((p) => {
            const w = currentPeriod + p;
            if (w <= 0) return null;
            const isPast = p < 0, isCurrent = p === 0;
            const h = isPast ? (wh.history || []).find((x) => x.period === w) : null;
            if (isPast && !h) return null;
            return (
              <DataRow key={p} period={w} isPast={isPast} isCurrent={isCurrent} bucket={timeBucket} columns="28px 1fr 1fr"
                cells={<>
                  <span className="val-neu text-right">{fmt(isPast ? h.req : proj.required?.[p])}</span>
                  <span className={`text-right ${
                    (isPast ? h.recv : proj.inbound?.[p]) >= (isPast ? h.req : proj.required?.[p])
                      ? 'val-pos'
                      : 'val-neg'
                  }`}>{fmt(isPast ? h.recv : proj.inbound?.[p])}</span>
                </>}
              />
            );
          })}
        </div>
      </div>

      {/* Demand section */}
      <div className="flex gap-1 mb-3">
        <SectionLabel>Demand</SectionLabel>
        <div className="flex-1">
          <div className="grid px-2 py-0.5 mb-1"
            style={{ gridTemplateColumns: '28px 0.7fr 0.7fr 0.8fr 1fr', fontSize: '0.55rem', color: '#64748b', fontWeight: 800 }}>
            <span>{BUCKET_PREFIX[timeBucket] || 'PRD'}</span><span>DIR</span><span>INDIR</span><span>TOTAL</span><span>FULL</span>
          </div>
          {periods.map((p) => {
            const w = currentPeriod + p;
            if (w <= 0) return null;
            const isPast = p < 0, isCurrent = p === 0;
            const h = isPast ? (wh.history || []).find((x) => x.period === w) : null;
            if (isPast && !h) return null;
            const d = isPast ? h.direct : (proj.directD?.[p] ?? 0);
            const i = isPast ? h.indirect : (proj.indirectD?.[p] ?? 0);
            const f = isPast ? h.outbound ?? 0 : d + i;
            return (
              <DataRow key={p} period={w} isPast={isPast} isCurrent={isCurrent} bucket={timeBucket}
                columns="28px 0.7fr 0.7fr 0.8fr 1fr"
                cells={<>
                  <span className="val-neu">{fmt(d)}</span>
                  <span className="val-neu">{fmt(i)}</span>
                  <span className="val-pos">{fmt(d + i)}</span>
                  <span className="val-recv">{fmt(f)}</span>
                </>}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CustomerPanel({ name }) {
  const { customers, currentPeriod, timeBucket } = useGameStore();
  const cust = customers[name];
  if (!cust) return null;

  const periods = [-3, -2, -1, 0, 1, 2];

  return (
    <div className="flex gap-1">
      <SectionLabel>Demand</SectionLabel>
      <div className="flex-1">
        <div className="grid px-2 py-0.5 mb-1"
          style={{ gridTemplateColumns: '28px 1fr', fontSize: '0.55rem', color: '#64748b', fontWeight: 800 }}>
          <span>{BUCKET_PREFIX[timeBucket] || 'PRD'}</span><span className="text-right">FULFILLMENT / REQ</span>
        </div>
        {periods.map((p) => {
          const w = currentPeriod + p;
          if (w <= 0) return null;
          const isPast = p < 0, isCurrent = p === 0;
          const h = isPast ? (cust.history || []).find((x) => x.period === w) : null;
          const d = isPast ? h?.demand : cust.demand[p];
          if (!d) return null;
          const val = typeof d === 'object' ? `${fmt(d.supplied)} / ${fmt(d.original)}` : fmt(d);
          return (
            <DataRow key={p} period={w} isPast={isPast} isCurrent={isCurrent} bucket={timeBucket} columns="28px 1fr"
              cells={<span className="val-neu text-right">{val}</span>}
            />
          );
        })}
      </div>
    </div>
  );
}

function PipePanel({ pipeId }) {
  const timeBucket = useGameStore((s) => s.timeBucket);
  const pipes = useGameStore((s) => s.pipes);
  const pipe = pipes.find((p) => p.id === pipeId);
  if (!pipe) return null;

  return (
    <div className="space-y-1">
      {[
        { label: 'FROM', value: pipe.from, cls: 'val-pos' },
        { label: 'TO', value: pipe.to, cls: 'val-pos' },
        { label: 'LEAD TIME', value: `${pipe.leadTime} ${timeBucket}s`, cls: 'val-recv' },
      ].map(({ label, value, cls }) => (
        <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg row-future text-xs">
          <span className="text-slate-500 font-bold tracking-wider uppercase" style={{ fontSize: '0.55rem' }}>{label}</span>
          <span className={`font-bold ${cls}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function InfoPanel() {
  const { selectedId, selectedType, clearSelection } = useUIStore();
  const deleteWarehouse = useGameStore((s) => s.deleteWarehouse);
  const deleteCustomer = useGameStore((s) => s.deleteCustomer);
  const deletePipe = useGameStore((s) => s.deletePipe);

  const visible = !!selectedId;

  const handleDelete = () => {
    if (!window.confirm(`Delete "${selectedId}"?`)) return;
    if (selectedType === 'warehouse') deleteWarehouse(selectedId);
    else if (selectedType === 'customer') deleteCustomer(selectedId);
    else if (selectedType === 'pipe') deletePipe(selectedId);
    clearSelection();
  };

  const typeLabel =
    selectedType === 'warehouse' ? '🏭 Warehouse' :
    selectedType === 'customer' ? '👥 Customer' :
    '🔗 Pipe';

  return (
    <div
      className="absolute top-16 right-4 w-80 z-40 flex flex-col gap-0 custom-scroll"
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        transition: 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
      }}
    >
      <div className="glass-card p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3"
          style={{ borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-0.5">{typeLabel}</div>
            <div className="text-sm font-bold text-slate-100">{selectedId}</div>
          </div>
          <button
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 transition-colors hover:text-red-400"
            style={{ background: 'rgba(30,41,59,0.8)' }}
            onClick={clearSelection}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {selectedType === 'warehouse' && <WarehousePanel name={selectedId} />}
        {selectedType === 'customer' && <CustomerPanel name={selectedId} />}
        {selectedType === 'pipe' && <PipePanel pipeId={selectedId} />}

        {/* Delete */}
        <button
          className="btn-danger w-full mt-3 justify-center text-xs"
          onClick={handleDelete}
        >
          Delete {selectedType}
        </button>
      </div>
    </div>
  );
}
