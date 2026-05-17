/**
 * Calculates the quantity actually supplied to a customer node.
 * Currently, it assumes the request is always fully satisfied.
 * 
 * @param {number} requestedQty - The quantity requested by the customer.
 * @param {number} availableStock - The current stock at the supplying warehouse.
 * @returns {number}
 */
export function getCustomerSuppliedQty(requestedQty, availableStock) {
  return Math.min(requestedQty, Math.max(0, availableStock));
}