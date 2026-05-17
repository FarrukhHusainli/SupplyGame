/**
 * Counts the number of upstream warehouse sources for a given downstream warehouse.
 * Used to split required inbound equally across sources.
 *
 * @param {string} toName     - Name of the receiving warehouse.
 * @param {Array}  pipes      - All pipe connections.
 * @param {Object} warehouses - Map of warehouse nodes.
 * @returns {number} Number of upstream sources (minimum 1 to avoid division by zero).
 */
export function getWarehouseSourceCount(toName, pipes, warehouses) {
  return pipes.filter((c) => c.to === toName && warehouses[c.from]).length || 1;
}

/**
 * Calculates the indirect demand for a warehouse node.
 * This is the proportional share of downstream warehouse gross demand.
 *
 * @param {string} name       - Warehouse name.
 * @param {Object} warehouses - Map of warehouse nodes.
 * @param {Array}  pipes      - Array of pipe connections.
 * @param {Object} results    - Accumulator containing calculated metrics for all nodes.
 * @param {number} p          - Period index.
 * @returns {number}
 */
export function getWarehouseIndirectDemand(name, warehouses, pipes, results, p) {
  let id = 0;
  pipes.forEach((c) => {
    if (c.from === name && warehouses[c.to]) {
      id += results[c.to].grossD[p] / getWarehouseSourceCount(c.to, pipes, warehouses);
    }
  });
  return id;
}
