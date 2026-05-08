/**
 * Calculates the closing stock relative to the safety stock level.
 * 
 * @param {number} endOnHand - End of period stock level.
 * @param {number} safetyStock - Required safety stock level.
 * @returns {number} The difference (positive means buffer is intact, negative means buffer is penetrated).
 */
export function getWarehouseClosingStockMinusSafety(endOnHand, safetyStock) {
  return endOnHand - safetyStock;
}