/**
 * Returns the opening stock for a warehouse for period p.
 * p=0 → actual currentStock; p>0 → closing stock of the previous period.
 *
 * @param {Object} warehouse - The warehouse node object.
 * @param {Object} results   - Accumulated projection results for this warehouse.
 * @param {number} p         - Period index (0 = current period).
 * @returns {number}
 */
export function getWarehouseOpeningStock(warehouse, results, p) {
  return p === 0 ? warehouse.currentStock : (results?.projected?.[p - 1] ?? 0);
}
