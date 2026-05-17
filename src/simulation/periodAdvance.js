import { sortWarehousesTopological } from './topology';
import { refreshProjections } from './projections';
import { getCustomerRequestedQty } from './customer_node/in/requested';
import { getCustomerSuppliedQty } from './customer_node/in/inbound';
import { getWarehouseAvailableStock } from './warehouse_node/stock/available_stock';


function filterByPeriod(warehouses, customers, pipes, period) {
  const activeWhs   = Object.fromEntries(Object.entries(warehouses).filter(([, wh]) => (wh.createdAtPeriod ?? 1) <= period));
  const activeCusts = Object.fromEntries(Object.entries(customers).filter(([, c])  => (c.createdAtPeriod  ?? 1) <= period));
  const activePipes = pipes.filter(p => (p.createdAtPeriod ?? 1) <= period);
  return { activeWhs, activeCusts, activePipes };
}

/**
 * Advance one period: execute physical flows, record history, shift demands.
 * Only processes entities that exist at currentPeriod (createdAtPeriod <= currentPeriod).
 */
export function advancePeriodLogic({ warehouses, customers, pipes, currentPeriod }) {
  const whs  = JSON.parse(JSON.stringify(warehouses));
  const custs = JSON.parse(JSON.stringify(customers));

  const { activeWhs, activeCusts, activePipes } = filterByPeriod(whs, custs, pipes, currentPeriod);

  const whNames    = Object.keys(activeWhs);
  const projections = refreshProjections(activeWhs, activeCusts, activePipes, currentPeriod);
  const sorted      = sortWarehousesTopological(whNames, activePipes);

  const metrics = {};
  whNames.forEach((name) => {
    const proj = projections[name];
    metrics[name] = {
      period:   currentPeriod,
      opening:  activeWhs[name].currentStock,
      req:      proj.required[0],
      recv:     proj.inbound[0],
      safety:   proj.safety[0],
      direct:   proj.directD[0],
      indirect: proj.indirectD[0],
      gross:    proj.grossD[0],
      outbound: 0,
    };
  });

  const custMetrics = {};
  Object.keys(activeCusts).forEach((name) => {
    custMetrics[name] = { period: currentPeriod, demand: 100, supplied: 0 };
  });

  sorted.forEach((name) => {
    const from = activeWhs[name];
    activePipes.forEach((conn) => {
      if (conn.from !== name) return;

      if (activeCusts[conn.to]) {
        const customer = activeCusts[conn.to];
        if (customer) {
          const requested = getCustomerRequestedQty();
          const available = getWarehouseAvailableStock(from, null, 0);
          const consumption = getCustomerSuppliedQty(requested, available);
          from.currentStock -= consumption;
          if (metrics[name]) metrics[name].outbound += consumption;
          if (custMetrics[conn.to]) custMetrics[conn.to].supplied = consumption;
        }
      } else if (activeWhs[conn.to]) {
        const inboundNeeded = projections[conn.to]?.inbound[0] ?? 0;
        const sources = activePipes.filter((c) => c.to === conn.to && activeWhs[c.from]);
        const share   = inboundNeeded / (sources.length || 1);
        const shipped   = share; // Supply everything regardless of stock
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
  });

  return { warehouses: whs, customers: custs, currentPeriod: currentPeriod + 1 };
}

/**
 * Rewind one period by restoring from history.
 * Skips entities added after prevPeriod (they aren't visible there anyway).
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
  });

  Object.keys(custs).forEach((name) => {
    if ((custs[name].createdAtPeriod ?? 1) > prevPeriod) return;
    const hist = custs[name].history;
    if (!hist || hist.length === 0) return;
    hist.pop(); // no demand state to restore — demand is constant 100/period
  });

  return { warehouses: whs, customers: custs, currentPeriod: prevPeriod };
}
