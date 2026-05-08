import { sortWarehousesTopological } from './topology';
import { getWarehouseDirectDemand } from './warehouse_node/out/direct';
import { getWarehouseIndirectDemand } from './warehouse_node/out/indirect';
import { getWarehouseGrossDemand } from './warehouse_node/out/gross';
import { getWarehouseRequestedQty } from './warehouse_node/in/requested';
import { getWarehouseClosingStock } from './warehouse_node/stock/end_on_hand';
import { getWarehouseOpeningStock } from './warehouse_node/stock/before_on_hand';
import { getWarehouseSafetyStock } from './warehouse_node/stock/safety_stock';

/**
 * Compute 10-period rolling projection for all warehouses.
 * Returns a map: { [warehouseName]: { projected, safety, inbound, required, directD, indirectD } }
 *
 * @param {Object} warehouses  - { [name]: { currentStock, demand?, ... } }
 * @param {Object} customers   - { [name]: { demand: [{original, supplied}] } }
 * @param {Array}  pipes       - [{ from, to, leadTime }]
 * @param {number} currentWeek - current week number (used as cache key externally)
 */
export function refreshProjections(warehouses, customers, pipes, currentWeek) {
  const whNames = Object.keys(warehouses);
  const results = {};

  whNames.forEach((name) => {
    results[name] = {
      projected: Array(10).fill(0),
      safety:    Array(10).fill(0),
      inbound:   Array(10).fill(0),
      required:  Array(10).fill(0),
      directD:   Array(10).fill(0),
      indirectD: Array(10).fill(0),
      grossD:    Array(10).fill(0),
    };
  });

  const sortedWhs = sortWarehousesTopological(whNames, pipes);
  const revSortedWhs = [...sortedWhs].reverse();

  for (let p = 0; p < 10; p++) {
    // PASS 1: Bottom-up — calculate direct/indirect demand & requirements
    revSortedWhs.forEach((name) => {
      const wh = warehouses[name];

      // Direct demand for warehouse
      const dd = getWarehouseDirectDemand(name, customers, pipes, p);
      results[name].directD[p] = dd;

      // Indirect demand for warehouse
      const id = getWarehouseIndirectDemand(name, warehouses, pipes, results, p);
      results[name].indirectD[p] = id;

      // Gross demand for warehouse
      results[name].grossD[p] = getWarehouseGrossDemand(dd, id);

      // Safety stock for warehouse
      const ss = getWarehouseSafetyStock(name, customers, pipes, p, 10);
      results[name].safety[p] = ss;

      const opening = getWarehouseOpeningStock(wh, results[name], p);
      results[name].required[p] = getWarehouseRequestedQty(results[name].grossD[p], ss, opening);
    });

    // PASS 2: Top-down — fulfillment & throughput
    whNames.forEach((name) => {
      // Unconstrained supply: inbound always matches what was requested
      const inboundTotal = results[name].required[p];
      results[name].inbound[p] = inboundTotal;

      const opening = getWarehouseOpeningStock(warehouses[name], results[name], p);
      results[name].projected[p] = getWarehouseClosingStock(opening, inboundTotal, results[name].grossD[p]);
    });
  }

  return results;
}

/**
 * Get projection data for a single warehouse.
 */
export function computeWarehouseStock(warehouseName, warehouses, customers, pipes, currentWeek) {
  const cache = refreshProjections(warehouses, customers, pipes, currentWeek);
  return (
    cache[warehouseName] || {
      projected: Array(10).fill(0),
      safety:    Array(10).fill(0),
      inbound:   Array(10).fill(0),
      required:  Array(10).fill(0),
      directD:   Array(10).fill(0),
      indirectD: Array(10).fill(0),
      grossD:    Array(10).fill(0),
    }
  );
}
