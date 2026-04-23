import { sortWarehousesTopological } from './topology';
import { refreshProjections } from './projections';

function randomDemand() {
  return { original: 100, supplied: 0 };
}

/**
 * Advance one week: execute physical flows, record history, shift demands.
 * Returns a partial state patch { warehouses, customers, currentWeek }.
 */
export function advanceWeekLogic({ warehouses, customers, pipes, currentWeek }) {
  // Deep clone so we don't mutate Zustand state directly
  const whs = JSON.parse(JSON.stringify(warehouses));
  const custs = JSON.parse(JSON.stringify(customers));

  const whNames = Object.keys(whs);
  const projections = refreshProjections(whs, custs, pipes, currentWeek);
  const sorted = sortWarehousesTopological(whNames, pipes);

  // Snapshot metrics before execution
  const metrics = {};
  whNames.forEach((name) => {
    const proj = projections[name];
    metrics[name] = {
      week:     currentWeek,
      opening:  whs[name].currentStock,
      req:      proj.required[0],
      recv:     proj.inbound[0],
      safety:   proj.safety[0],
      direct:   proj.directD[0],
      indirect: proj.indirectD[0],
      outbound: 0,
    };
  });

  const custMetrics = {};
  Object.keys(custs).forEach((name) => {
    custMetrics[name] = { week: currentWeek, demand: { ...custs[name].demand[0] } };
  });

  // Physical execution (top-down)
  sorted.forEach((name) => {
    const from = whs[name];
    pipes.forEach((conn) => {
      if (conn.from !== name) return;

      if (custs[conn.to]) {
        // Fulfill customer demand
        const demandObj = custs[conn.to].demand[0];
        if (demandObj) {
          const consumption = demandObj.original;
          from.currentStock -= consumption;
          if (metrics[name]) metrics[name].outbound += consumption;
          demandObj.supplied = consumption;
          if (custMetrics[conn.to]) custMetrics[conn.to].demand.supplied = consumption;
        }
      } else if (whs[conn.to]) {
        // Transfer to downstream warehouse
        const inboundNeeded = projections[conn.to]?.inbound[0] ?? 0;
        const sources = pipes.filter((c) => c.to === conn.to && whs[c.from]);
        const share = inboundNeeded / (sources.length || 1);
        const available = Math.max(0, from.currentStock);
        const shipped = Math.min(share, available);
        from.currentStock -= shipped;
        whs[conn.to].currentStock += shipped;
        if (metrics[name]) metrics[name].outbound += shipped;
      }
    });
  });

  // Finalize: record history, shift demand
  whNames.forEach((name) => {
    const m = metrics[name];
    if (m) {
      m.endBal = whs[name].currentStock;
      if (!whs[name].history) whs[name].history = [];
      whs[name].history.push(m);
      if (whs[name].history.length > 20) whs[name].history.shift();
    }
  });

  Object.keys(custs).forEach((name) => {
    const m = custMetrics[name];
    if (m) {
      if (!custs[name].history) custs[name].history = [];
      custs[name].history.push(m);
      if (custs[name].history.length > 20) custs[name].history.shift();
    }
    // Shift demand window
    custs[name].demand.shift();
    custs[name].demand.push(randomDemand());
  });

  return { warehouses: whs, customers: custs, currentWeek: currentWeek + 1 };
}

/**
 * Rewind one week by restoring from history.
 * Returns a partial state patch.
 */
export function goBackWeekLogic({ warehouses, customers, currentWeek }) {
  if (currentWeek <= 1) return { warehouses, customers, currentWeek };

  const whs = JSON.parse(JSON.stringify(warehouses));
  const custs = JSON.parse(JSON.stringify(customers));

  Object.keys(whs).forEach((name) => {
    const hist = whs[name].history;
    if (!hist || hist.length === 0) return;
    const h = hist.pop();
    whs[name].currentStock = h.opening;
  });

  Object.keys(custs).forEach((name) => {
    const hist = custs[name].history;
    if (!hist || hist.length === 0) return;
    const h = hist.pop();
    custs[name].demand.unshift(h.demand);
    custs[name].demand.pop();
  });

  return { warehouses: whs, customers: custs, currentWeek: currentWeek - 1 };
}
