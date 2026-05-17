import { sortWarehousesTopological } from './topology';
import { getWarehouseDirectDemand } from './warehouse_node/out/direct';
import { getWarehouseIndirectDemand, getWarehouseSourceCount } from './warehouse_node/out/indirect';
import { getWarehouseGrossDemand } from './warehouse_node/out/gross';
import { getWarehouseRequestedQty } from './warehouse_node/in/requested';
import { getWarehouseTransitArriving } from './warehouse_node/in/inbound';
import { getWarehouseOpeningStock } from './warehouse_node/stock/before_on_hand';
import { getWarehouseClosingStock } from './warehouse_node/stock/end_on_hand';
import { getWarehouseSafetyStock } from './warehouse_node/stock/safety_stock';

/**
 * Compute 10-period rolling projection for all warehouses.
 *
 * Within each period the projection mirrors the period-advance logic:
 *   - Inbound for p=0: actual in-transit arrivals for currentPeriod.
 *   - Inbound for p>0: what upstream warehouses actually computed as shipped
 *     (propagated in topological order). Source warehouses with no upstream
 *     receive 0 — they can only draw down existing stock.
 *   - Available stock = opening + inbound.
 *   - Direct demand (customers) is served first, then indirect (downstream
 *     warehouses), both constrained by available stock.
 *   - Closing stock is clamped to 0 (no negative inventory).
 *
 * Returns a map: { [warehouseName]: { projected, safety, inbound, required,
 *                                     directD, indirectD, grossD,
 *                                     directServed, indirectServed } }
 *
 * @param {Object} warehouses    - { [name]: { currentStock, inTransit?, ... } }
 * @param {Object} customers     - { [name]: { ... } }
 * @param {Array}  pipes         - [{ from, to, leadTime }]
 * @param {number} currentPeriod - current period number (for p=0 transit lookup)
 */
export function refreshProjections(warehouses, customers, pipes, currentPeriod) {
  const whNames = Object.keys(warehouses);
  const results = {};

  whNames.forEach((name) => {
    results[name] = {
      projected:      Array(10).fill(0),
      safety:         Array(10).fill(0),
      inbound:        Array(10).fill(0),
      required:       Array(10).fill(0),
      directD:        Array(10).fill(0),
      indirectD:      Array(10).fill(0),
      grossD:         Array(10).fill(0),
      directServed:   Array(10).fill(0),
      indirectServed: Array(10).fill(0),
    };
  });

  const sortedWhs    = sortWarehousesTopological(whNames, pipes);
  const revSortedWhs = [...sortedWhs].reverse();

  for (let p = 0; p < 10; p++) {
    // ── PASS 1: Bottom-up — demand & requirements ────────────────────────
    revSortedWhs.forEach((name) => {
      const wh = warehouses[name];

      const dd = getWarehouseDirectDemand(name, customers, pipes, p);
      results[name].directD[p] = dd;

      const id = getWarehouseIndirectDemand(name, warehouses, pipes, results, p);
      results[name].indirectD[p] = id;

      results[name].grossD[p] = getWarehouseGrossDemand(dd, id);

      const ss = getWarehouseSafetyStock(name, customers, pipes, p, 10);
      results[name].safety[p] = ss;

      // For p=0 count in-transit arrivals in effective opening to avoid over-ordering
      const opening         = getWarehouseOpeningStock(wh, results[name], p);
      const transitArriving = p === 0 ? getWarehouseTransitArriving(wh, currentPeriod) : 0;
      results[name].required[p] = getWarehouseRequestedQty(
        results[name].grossD[p],
        ss,
        opening + transitArriving,
      );
    });

    // ── PASS 2: Top-down — constrained fulfillment ────────────────────────
    // shippedToDuring tracks how much each upstream warehouse ships to each
    // downstream warehouse this period so downstream can read it as their inbound.
    const shippedToDuring = {};

    sortedWhs.forEach((name) => {
      const wh      = warehouses[name];
      const opening = getWarehouseOpeningStock(wh, results[name], p);

      // p=0: actual in-transit arrivals; p>0: what upstream recorded as shipped
      const inbound = p === 0
        ? getWarehouseTransitArriving(wh, currentPeriod)
        : (shippedToDuring[name] ?? 0);
      results[name].inbound[p] = inbound;

      let available = opening + inbound;

      // Direct demand served first (priority 1)
      const directServed = Math.min(results[name].directD[p], Math.max(0, available));
      available -= directServed;
      results[name].directServed[p] = directServed;

      // Indirect demand served second (priority 2), distributed proportionally
      const downstreamPipes = pipes.filter((c) => c.from === name && warehouses[c.to]);
      let indirectServed = 0;

      if (downstreamPipes.length > 0 && results[name].indirectD[p] > 0) {
        const capacity = Math.min(results[name].indirectD[p], Math.max(0, available));
        downstreamPipes.forEach((conn) => {
          const share      = results[conn.to].grossD[p] / getWarehouseSourceCount(conn.to, pipes, warehouses);
          const proportion = share / results[name].indirectD[p];
          shippedToDuring[conn.to] = (shippedToDuring[conn.to] ?? 0) + capacity * proportion;
        });
        indirectServed = capacity;
      } else {
        indirectServed = Math.min(results[name].indirectD[p], Math.max(0, available));
      }

      results[name].indirectServed[p] = indirectServed;
      results[name].projected[p] = getWarehouseClosingStock(opening, inbound, directServed + indirectServed);
    });
  }

  return results;
}

/**
 * Get projection data for a single warehouse.
 */
export function computeWarehouseStock(warehouseName, warehouses, customers, pipes, currentPeriod) {
  const cache = refreshProjections(warehouses, customers, pipes, currentPeriod);
  return (
    cache[warehouseName] || {
      projected:      Array(10).fill(0),
      safety:         Array(10).fill(0),
      inbound:        Array(10).fill(0),
      required:       Array(10).fill(0),
      directD:        Array(10).fill(0),
      indirectD:      Array(10).fill(0),
      grossD:         Array(10).fill(0),
      directServed:   Array(10).fill(0),
      indirectServed: Array(10).fill(0),
    }
  );
}
