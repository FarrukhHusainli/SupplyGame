/**
 * The fixed demand a customer node places on its upstream source each period.
 */
export const CUSTOMER_DEMAND_PER_PERIOD = 100;

/**
 * Returns the quantity a customer requests from its upstream warehouse for a given period.
 * Demand is a constant 100 units per period regardless of period index.
 *
 * @returns {number} Always 100.
 */
export function getCustomerRequestedQty() {
  return CUSTOMER_DEMAND_PER_PERIOD;
}