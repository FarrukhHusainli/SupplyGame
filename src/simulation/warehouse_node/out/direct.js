import { getCustomerDemand } from '../../customer_node/in/demand';

/**
 * Calculates the direct demand for a warehouse node.
 * Direct demand is the total demand from customers directly connected to this warehouse.
 * Each connected customer contributes a fixed 100 units per period.
 *
 * @param {string} name - Warehouse name.
 * @param {Object} customers - Map of customer nodes.
 * @param {Array}  pipes - Array of pipe connections.
 * @param {number} p - Period index (unused — demand is constant).
 * @returns {number} Total direct demand from all connected customers.
 */
export function getWarehouseDirectDemand(name, customers, pipes, p) {
  let total = 0;
  pipes.forEach((conn) => {
    if (conn.from === name && customers[conn.to]) {
      total += getCustomerDemand();
    }
  });
  return total;
}