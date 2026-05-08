/**
 * Calculates the quantity shipped out from a warehouse node.
 * Currently limited by the requested amount and the available stock.
 * 
 * @param {number} requestedQty - The quantity requested by the downstream node.
 * @param {number} availableStock - The available stock at the source warehouse.
 * @returns {number}
 */
export function getWarehouseOutboundQty(requestedQty, availableStock) {
  return Math.min(requestedQty, Math.max(0, availableStock));
}