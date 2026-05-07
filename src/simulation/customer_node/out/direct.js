/**
 * Returns the standard direct demand for a customer node.
 * Currently fixed at 100 units per period.
 */
export function getCustomerDirectDemand() {
  return { original: 100, supplied: 0 };
}