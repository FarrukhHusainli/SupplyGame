/**
 * Calculates how much a customer node requests from its upstream source.
 * Currently, it simply returns the original demand for the given period.
 * 
 * @param {Object} customer - The customer node object.
 * @param {number} periodIndex - The index in the demand array (0 for current week).
 * @returns {number}
 */
export function getCustomerRequestedQty(customer, periodIndex = 0) {
  return customer.demand[periodIndex]?.original ?? 0;
}