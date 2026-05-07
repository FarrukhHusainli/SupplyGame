import { getWarehouseDirectDemand } from '../out/direct';

/**
 * Calculates the safety stock for a warehouse node.
 * Currently implemented as a 2-period lookahead on direct demand.
 * 
 * @param {string} name - Warehouse name.
 * @param {Object} customers - Map of customer nodes.
 * @param {Array} pipes - Array of pipe connections.
 * @param {number} p - Current period index.
 * @param {number} horizon - Total projection horizon.
 * @returns {number}
 */
export function getWarehouseSafetyStock(name, customers, pipes, p, horizon = 10) {
  let ss = 0;
  for (let i = 1; i <= 2; i++) {
    if (p + i < horizon) {
      ss += getWarehouseDirectDemand(name, customers, pipes, p + i);
    }
  }
  return ss;
}