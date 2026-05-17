import { getWarehouseOpeningStock } from './before_on_hand';

/**
 * Returns the available stock for a warehouse for period p.
 * Delegates to getWarehouseOpeningStock — conceptually distinct (available stock
 * may diverge once reservations or in-transit offsets are introduced).
 *
 * @param {Object} warehouse - The warehouse node object.
 * @param {Object} results   - Projection results for this warehouse.
 * @param {number} p         - Period index (0 = current period).
 * @returns {number}
 */
export function getWarehouseAvailableStock(warehouse, results, p) {
  return getWarehouseOpeningStock(warehouse, results, p);
}
