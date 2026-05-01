import { sortWarehousesTopological } from './topology';
import { refreshProjections } from './projections';

function randomDemand() {
  return { original: 100, supplied: 0 };
}

function filterByPeriod(warehouses, customers, pipes, period) {
  const activeWhs   = Object.fromEntries(Object.entries(warehouses).filter(([, wh]) => (wh.createdAtPeriod ?? 1) <= period));
  const activeCusts = Object.fromEntries(Object.entries(customers).filter(([, c])  => (c.createdAtPeriod  ?? 1) <= period));
  const activePipes = pipes.filter(p => (p.createdAtPeriod ?? 1) <= period);
  return { activeWhs, activeCusts, activePipes };
}

/**
 * Advance one week: execute physical flows, record history, shift demands.
 * Only processes entities that exist at currentWeek (createdAtPeriod <= currentWeek).
 */
export function advanceWeekLogic({ warehouses, customers, pipes, currentWeek }) {
  const whs  = JSON.parse(JSON.stringify(warehouses));
  const custs = JSON.parse(JSON.stringify(customers));

  const { activeWhs, activeCusts, activePipes } = filterByPeriod(whs, custs, pipes, currentWeek);

  const whNames    = Object.keys(activeWhs);
  const projections = refreshProjections(activeWhs, activeCusts, activePipes, currentWeek);
  const sorted      = sortWarehousesTopological(whNames, activePipes);

  const metrics = {};
  whNames.forEach((name) => {
    const proj = projections[name];
    metrics[name] = {
      week:     currentWeek,
      opening:  activeWhs[name].currentStock,
      req:      proj.required[0],
      recv:     proj.inbound[0],
      safety:   proj.safety[0],
      direct:   proj.directD[0],
      indirect: proj.indirectD[0],
      outbound: 0,
    };
  });

  const custMetrics = {};
  Object.keys(activeCusts).forEach((name) => {
    custMetrics[name] = { week: currentWeek, demand: { ...activeCusts[name].demand[0] } };
  });

  sorted.forEach((name) => {
    const from = activeWhs[name];
    activePipes.forEach((conn) => {
      if (conn.from !== name) return;

      if (activeCusts[conn.to]) {
        const demandObj = activeCusts[conn.to].demand[0];
        if (demandObj) {
          const consumption = demandObj.original;
          from.currentStock -= consumption;
          if (metrics[name]) metrics[name].outbound += consumption;
          demandObj.supplied = consumption;
          if (custMetrics[conn.to]) custMetrics[conn.to].demand.supplied = consumption;
        }
      } else if (activeWhs[conn.to]) {
        const inboundNeeded = projections[conn.to]?.inbound[0] ?? 0;
        const sources = activePipes.filter((c) => c.to === conn.to && activeWhs[c.from]);
        const share   = inboundNeeded / (sources.length || 1);
        const available = Math.max(0, from.currentStock);
        const shipped   = Math.min(share, available);
        from.currentStock -= shipped;
        activeWhs[conn.to].currentStock += shipped;
        if (metrics[name]) metrics[name].outbound += shipped;
      }
    });
  });

  whNames.forEach((name) => {
    const m = metrics[name];
    if (m) {
      m.endBal = activeWhs[name].currentStock;
      if (!activeWhs[name].history) activeWhs[name].history = [];
      activeWhs[name].history.push(m);
      if (activeWhs[name].history.length > 20) activeWhs[name].history.shift();
    }
  });

  Object.keys(activeCusts).forEach((name) => {
    const m = custMetrics[name];
    if (m) {
      if (!activeCusts[name].history) activeCusts[name].history = [];
      activeCusts[name].history.push(m);
      if (activeCusts[name].history.length > 20) activeCusts[name].history.shift();
    }
    activeCusts[name].demand.shift();
    activeCusts[name].demand.push(randomDemand());
  });

  return { warehouses: whs, customers: custs, currentWeek: currentWeek + 1 };
}

/**
 * Rewind one week by restoring from history.
 * Skips entities added after prevPeriod (they aren't visible there anyway).
 */
export function goBackWeekLogic({ warehouses, customers, currentWeek }) {
  if (currentWeek <= 1) return { warehouses, customers, currentWeek };

  const prevPeriod = currentWeek - 1;
  const whs  = JSON.parse(JSON.stringify(warehouses));
  const custs = JSON.parse(JSON.stringify(customers));

  Object.keys(whs).forEach((name) => {
    if ((whs[name].createdAtPeriod ?? 1) > prevPeriod) return;
    const hist = whs[name].history;
    if (!hist || hist.length === 0) return;
    const h = hist.pop();
    whs[name].currentStock = h.opening;
  });

  Object.keys(custs).forEach((name) => {
    if ((custs[name].createdAtPeriod ?? 1) > prevPeriod) return;
    const hist = custs[name].history;
    if (!hist || hist.length === 0) return;
    const h = hist.pop();
    custs[name].demand.unshift(h.demand);
    custs[name].demand.pop();
  });

  return { warehouses: whs, customers: custs, currentWeek: prevPeriod };
}
