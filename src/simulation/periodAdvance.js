import { sortWarehousesTopological } from './topology';
import { refreshProjections } from './projections';
import { getCustomerRequestedQty } from './customer_node/in/requested';
import { getCustomerDemand } from './customer_node/in/demand';
import { getCustomerBacklog } from './customer_node/in/backlog';
import { getWarehouseTransitArriving } from './warehouse_node/in/inbound';
import { getWarehouseSourceCount } from './warehouse_node/out/indirect';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function filterByPeriod(warehouses, customers, pipes, period) {
  const activeWhs   = Object.fromEntries(Object.entries(warehouses).filter(([, wh]) => (wh.createdAtPeriod ?? 1) <= period));
  const activeCusts = Object.fromEntries(Object.entries(customers).filter(([, c])  => (c.createdAtPeriod  ?? 1) <= period));
  const activePipes = pipes.filter(p => (p.createdAtPeriod ?? 1) <= period);
  return { activeWhs, activeCusts, activePipes };
}

/**
 * Advance one period: execute physical flows, record history, handle backorders.
 *
 * Within each period:
 *   Phase 1 — Receive in-transit inbounds (random order per warehouse).
 *   Phase 2 — Process outbounds in topological order (source-first):
 *             direct demand (customers) first in random order, then
 *             indirect demand (downstream warehouses) in random order.
 *             Available stock is decremented after each movement.
 *             Unmet customer demand is recorded as backorder.
 *             Inter-warehouse shipments with leadTime > 0 go into inTransit.
 */
export function advancePeriodLogic({ warehouses, customers, pipes, currentPeriod }) {
  const whs  = JSON.parse(JSON.stringify(warehouses));
  const custs = JSON.parse(JSON.stringify(customers));

  const { activeWhs, activeCusts, activePipes } = filterByPeriod(whs, custs, pipes, currentPeriod);
  const whNames = Object.keys(activeWhs);
  const sorted  = sortWarehousesTopological(whNames, activePipes);

  // Projections computed before any state changes — used for required/safety metrics
  // and for computing each warehouse's replenishment share in Phase 2.
  const projections = refreshProjections(activeWhs, activeCusts, activePipes, currentPeriod);

  // ── Snapshot opening state (for history / goBack) ────────────────────────
  const metrics = {};
  whNames.forEach((name) => {
    const wh   = activeWhs[name];
    const proj = projections[name];
    metrics[name] = {
      period:            currentPeriod,
      opening:           wh.currentStock,
      inTransitSnapshot: JSON.parse(JSON.stringify(wh.inTransit ?? [])),
      inboundReceived:   0,
      outbound:          0,
      directServed:      0,
      indirectServed:    0,
      req:               proj?.required[0]  ?? 0,
      recv:              0,
      safety:            proj?.safety[0]    ?? 0,
      direct:            proj?.directD[0]   ?? 0,
      indirect:          proj?.indirectD[0] ?? 0,
      gross:             proj?.grossD[0]    ?? 0,
    };
  });

  const custMetrics = {};
  Object.keys(activeCusts).forEach((name) => {
    custMetrics[name] = {
      period:    currentPeriod,
      demand:    getCustomerDemand(),
      backorder: getCustomerBacklog(activeCusts[name]),
      supplied:  0,
      shortage:  0,
    };
  });

  // ── Phase 1: Receive in-transit inbounds (random order per warehouse) ────
  whNames.forEach((name) => {
    const wh = activeWhs[name];
    if (!wh.inTransit) wh.inTransit = [];
    const arrivals = shuffle(wh.inTransit.filter((t) => t.arrivalPeriod === currentPeriod));
    arrivals.forEach((t) => { wh.currentStock += t.qty; });
    metrics[name].inboundReceived = getWarehouseTransitArriving(
      { inTransit: arrivals }, // already filtered to this period
      currentPeriod,
    );
    wh.inTransit = wh.inTransit.filter((t) => t.arrivalPeriod !== currentPeriod);
  });

  // ── Phase 2: Process outbounds (topological order, direct before indirect) ─
  sorted.forEach((name) => {
    const wh = activeWhs[name];

    // Single pass: categorise outbound pipes into direct (→ customer) and indirect (→ warehouse)
    const direct = [], indirect = [];
    activePipes.forEach((p) => {
      if (p.from !== name) return;
      if (activeCusts[p.to])  direct.push(p);
      else if (activeWhs[p.to]) indirect.push(p);
    });
    const directPipes   = shuffle(direct);
    const indirectPipes = shuffle(indirect);

    // Direct outbounds first — backorder carries over to next period
    directPipes.forEach((conn) => {
      const cust          = activeCusts[conn.to];
      const totalDemand = getCustomerRequestedQty(cust);
      const shipped       = Math.min(totalDemand, Math.max(0, wh.currentStock));
      const shortage      = totalDemand - shipped;

      wh.currentStock            -= shipped;
      cust.backorder              = shortage;
      metrics[name].directServed += shipped;
      metrics[name].outbound     += shipped;

      if (custMetrics[conn.to]) {
        custMetrics[conn.to].supplied = Math.min(
          getCustomerDemand(),
          custMetrics[conn.to].supplied + shipped,
        );
        custMetrics[conn.to].shortage = shortage;
      }
    });

    // Indirect outbounds second — constrained by remaining available stock
    indirectPipes.forEach((conn) => {
      const needed   = projections[conn.to]?.required[0] ?? 0;
      const share    = needed / getWarehouseSourceCount(conn.to, activePipes, activeWhs);
      const shipped  = Math.min(share, Math.max(0, wh.currentStock));
      const leadTime = conn.leadTime ?? 0;

      wh.currentStock              -= shipped;
      metrics[name].indirectServed += shipped;
      metrics[name].outbound       += shipped;

      if (leadTime === 0) {
        activeWhs[conn.to].currentStock += shipped;
      } else {
        if (!activeWhs[conn.to].inTransit) activeWhs[conn.to].inTransit = [];
        activeWhs[conn.to].inTransit.push({
          arrivalPeriod: currentPeriod + leadTime,
          qty:           shipped,
          fromId:        name,
        });
      }
    });
  });

  // ── Record end balances and push to history ───────────────────────────────
  whNames.forEach((name) => {
    const m = metrics[name];
    m.recv   = m.inboundReceived;
    m.endBal = activeWhs[name].currentStock;
    if (!activeWhs[name].history) activeWhs[name].history = [];
    activeWhs[name].history.push(m);
    if (activeWhs[name].history.length > 20) activeWhs[name].history.shift();
  });

  Object.keys(activeCusts).forEach((name) => {
    const m = custMetrics[name];
    if (!activeCusts[name].history) activeCusts[name].history = [];
    activeCusts[name].history.push(m);
    if (activeCusts[name].history.length > 20) activeCusts[name].history.shift();
  });

  return { warehouses: whs, customers: custs, currentPeriod: currentPeriod + 1 };
}

/**
 * Rewind one period by restoring from history.
 * Restores: warehouse currentStock, inTransit, and customer backorders.
 */
export function goBackPeriodLogic({ warehouses, customers, currentPeriod }) {
  if (currentPeriod <= 1) return { warehouses, customers, currentPeriod };

  const prevPeriod = currentPeriod - 1;
  const whs  = JSON.parse(JSON.stringify(warehouses));
  const custs = JSON.parse(JSON.stringify(customers));

  Object.keys(whs).forEach((name) => {
    if ((whs[name].createdAtPeriod ?? 1) > prevPeriod) return;
    const hist = whs[name].history;
    if (!hist || hist.length === 0) return;
    const h = hist.pop();
    whs[name].currentStock = h.opening;
    whs[name].inTransit    = h.inTransitSnapshot ?? [];
  });

  Object.keys(custs).forEach((name) => {
    if ((custs[name].createdAtPeriod ?? 1) > prevPeriod) return;
    const hist = custs[name].history;
    if (!hist || hist.length === 0) return;
    const h = hist.pop();
    custs[name].backorder = h.backorder ?? 0;
  });

  return { warehouses: whs, customers: custs, currentPeriod: prevPeriod };
}
