import { getCustomerDemand } from './demand';
import { getCustomerBacklog } from './backlog';

/**
 * Total quantity a customer requests this period: base demand + any backlog.
 *
 * @param {Object} customer - Customer node object.
 * @returns {number}
 */
export function getCustomerRequestedQty(customer) {
  return getCustomerDemand() + getCustomerBacklog(customer);
}
