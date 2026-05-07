import { getCustomerDirectDemand } from './direct';
import { getCustomerIndirectDemand } from './indirect';

/**
 * Returns the gross demand for a customer node (Direct + Indirect).
 */
export function getCustomerGrossDemand() {
  const direct = getCustomerDirectDemand();
  const indirect = getCustomerIndirectDemand();
  return { original: direct.original + indirect, supplied: 0 };
}