/**
 * Calculates the opening stock (stock before on hand) for a warehouse node for a given period.
 * For the current period (p=0), it uses the warehouse's currentStock.
 * For future periods, it uses the projected closing stock from the previous period.
 * 
 * @param {Object} warehouse - The warehouse node object.
 * @param {Object} results - The accumulated projection results for all warehouses.
 * @param {number} p - The current period index (0 for the current period).
 * @returns {number} The opening stock quantity.
 */
export function getWarehouseOpeningStock(warehouse, results, p) {
  // For the current period (p=0), use the actual current stock.
  // For future periods, use the projected closing stock from the previous period.
  return p === 0 ? warehouse.currentStock : results.projected[p - 1];
}