/**
 * Returns the closing stock for a warehouse period.
 * Clamped to 0 — physical stock cannot go negative.
 *
 * @param {number} openingStock   - Stock at the start of the period (after inbounds).
 * @param {number} inbound        - Goods received this period.
 * @param {number} actualOutbound - Goods actually shipped out (constrained by availability).
 * @returns {number}
 */
export function getWarehouseClosingStock(openingStock, inbound, actualOutbound) {
  return Math.max(0, openingStock + inbound - actualOutbound);
}
