/**
 * Calculates the gross demand for a warehouse node.
 * 
 * @param {number} direct - Calculated direct demand.
 * @param {number} indirect - Calculated indirect demand.
 * @returns {number}
 */
export function getWarehouseGrossDemand(direct, indirect) {
  return direct + indirect;
}