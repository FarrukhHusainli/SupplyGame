/**
 * Calculates the available stock in a warehouse node for a given period.
 * This is the quantity that can be allocated to downstream nodes.
 *
 * Currently: available stock = stock before on hand (opening stock).
 *   - p=0 → warehouse.currentStock (actual on-hand now)
 *   - p>0 → proj.projected[p-1]   (closing stock of previous period)
 *
 * In future iterations this function will incorporate in-transit stock,
 * reservations, and other allocation logic.
 *
 * @param {Object} warehouse - The warehouse node object ({ currentStock, ... }).
 * @param {Object} results   - Projection results for this warehouse ({ projected: number[] }).
 * @param {number} p         - Period index (0 = current period).
 * @returns {number} Available stock quantity.
 */
export function getWarehouseAvailableStock(warehouse, results, p) {
  return p === 0 ? warehouse.currentStock : (results?.projected?.[p - 1] ?? 0);
}