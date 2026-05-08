/**
 * Calculates the quantity actually supplied to a warehouse from one of its sources.
 * 
 * @param {number} share - The proportional share of the warehouse's requirement assigned to this source.
 * @param {number} availableStock - The available stock at the source warehouse.
 * @returns {number}
 */
export function getWarehouseSuppliedQty(share, availableStock) {
  // Currently uses a simple "take what is available" logic limited by the requested share.
  return Math.min(share, availableStock);
}