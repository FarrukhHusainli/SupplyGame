import { sortWarehousesTopological } from './topology';

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
    };
  });

  const sortedWhs = sortWarehousesTopological(whNames, pipes);
  const revSortedWhs = [...sortedWhs].reverse();

  for (let p = 0; p < 10; p++) {
    // PASS 1: Bottom-up — calculate direct/indirect demand & requirements
    revSortedWhs.forEach((name) => {
      const wh = warehouses[name];

      // Direct demand: sum of connected customer demands at period p
      let dd = 0;
      pipes.forEach((c) => {
        if (c.from === name && customers[c.to]) {
          dd += customers[c.to].demand[p]?.original ?? 0;
        }
      });
      results[name].directD[p] = dd;

      // Indirect demand: proportional share of downstream warehouse requirements
      let id = 0;
      pipes.forEach((c) => {
        if (c.from === name && warehouses[c.to]) {
          const receiverSources = pipes.filter((conn) => conn.to === c.to).length;
          id += results[c.to].required[p] / (receiverSources || 1);
        }
      });
      results[name].indirectD[p] = id;

      // Safety stock: 2-period lookahead on direct customer demand
      let ss = 0;
      for (let i = 1; i <= 2; i++) {
        if (p + i < 10) {
          pipes.forEach((c) => {
            if (c.from === name && customers[c.to]) {
              ss += customers[c.to].demand[p + i]?.original ?? 0;
            }
          });
        }
      }
      results[name].safety[p] = ss;

      const opening = p === 0 ? wh.currentStock : results[name].projected[p - 1];
      results[name].required[p] = Math.max(0, dd + id + ss - opening);
    });

    // PASS 2: Top-down — fulfillment & throughput
    const availablePool = {};
    whNames.forEach((name) => {
      availablePool[name] = p === 0 ? warehouses[name].currentStock : results[name].projected[p - 1];
    });

    sortedWhs.forEach((name) => {
      const sources = pipes.filter((c) => c.to === name && warehouses[c.from]);
      let inboundTotal = 0;

      sources.forEach((conn) => {
        const sName = conn.from;
        const sDD = results[sName].directD[p];
        const sAvail = Math.max(0, availablePool[sName] + (results[sName].inbound[p] || 0) - sDD);
        const share = results[name].required[p] / (sources.length || 1);
        const shipped = Math.min(share, sAvail);
        inboundTotal += shipped;
        availablePool[sName] -= shipped;
      });

      results[name].inbound[p] = inboundTotal;
      const opening = p === 0 ? warehouses[name].currentStock : results[name].projected[p - 1];
      results[name].projected[p] =
        opening + inboundTotal - results[name].directD[p] - results[name].indirectD[p];
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
    }
  );
}
