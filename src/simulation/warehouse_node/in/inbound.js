/**
 * Returns the quantity actually received (inbound) by a warehouse from one source.
 *
 * @param {number} share         - Proportional share of requirement assigned to this source.
 * @param {number} availableStock - Available stock at the source warehouse.
 * @returns {number}
 */
export function getWarehouseInboundQty(share, availableStock) {
  return Math.min(share, availableStock);
}

/**
 * Sums all in-transit goods arriving at a warehouse in the given period.
 *
 * @param {Object} wh            - Warehouse node ({ inTransit?: Array }).
 * @param {number} currentPeriod - The period to check arrivals for.
 * @returns {number}
 */
export function getWarehouseTransitArriving(wh, currentPeriod) {
  return (wh.inTransit ?? [])
    .filter((t) => t.arrivalPeriod === currentPeriod)
    .reduce((s, t) => s + t.qty, 0);
}
