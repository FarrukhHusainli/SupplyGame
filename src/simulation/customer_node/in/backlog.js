/**
 * Returns the customer's current backlog (unmet demand carried from prior periods).
 * Returns 0 when the customer has no simulation history — this prevents stale
 * persisted values from inflating demand at the start of a new run.
 *
 * @param {Object} customer - Customer node object.
 * @returns {number}
 */
export function getCustomerBacklog(customer) {
  if ((customer?.history?.length ?? 0) === 0) return 0;
  return customer?.backorder ?? 0;
}
