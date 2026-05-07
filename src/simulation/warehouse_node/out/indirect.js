/**
 * Calculates the indirect demand for a warehouse node.
 * This is the proportional share of downstream warehouse gross demand.
 * 
 * @param {string} name - Warehouse name.
 * @param {Object} warehouses - Map of warehouse nodes.
 * @param {Array} pipes - Array of pipe connections.
 * @param {Object} results - Accumulator containing calculated metrics for all nodes.
 * @param {number} p - Period index.
 */
export function getWarehouseIndirectDemand(name, warehouses, pipes, results, p) {
  let id = 0;
  pipes.forEach((c) => {
    if (c.from === name && warehouses[c.to]) {
      const receiverSources = pipes.filter((conn) => conn.to === c.to).length;
      id += results[c.to].grossD[p] / (receiverSources || 1);
    }
  });
  return id;
}