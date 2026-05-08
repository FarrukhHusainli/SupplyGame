/**
 * Calculates the closing stock (end on hand) for a warehouse node for a given period.
 * This is typically calculated as opening stock + inbound - gross demand.
 * 
 * @param {number} openingStock - The opening inventory for the period.
 * @param {number} inboundTotal - The total inbound quantity for the period.
 * @param {number} grossDemand - The gross demand for the period.
 * @returns {number} The closing stock quantity.
 */
export function getWarehouseClosingStock(openingStock, inboundTotal, grossDemand) {
  // Closing stock is opening stock plus inbound minus gross demand.
  return openingStock + inboundTotal - grossDemand;
}