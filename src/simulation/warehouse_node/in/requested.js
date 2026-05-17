/**
 * Calculates the requested inbound quantity for a warehouse node.
 * This is typically based on gross demand, safety stock, and opening inventory.
 * 
 * @param {number} grossDemand - The calculated gross demand for the period.
 * @param {number} safetyStock - The calculated safety stock for the period.
 * @param {number} openingStock - The opening inventory for the period.
 * @returns {number} The quantity requested by the warehouse.
 */
export function getWarehouseRequestedQty(grossDemand, safetyStock, openingStock) {
  // The warehouse requests enough to cover gross demand and safety stock,
  // minus what it already has in opening inventory.
  return Math.max(0, grossDemand + safetyStock - openingStock);
}