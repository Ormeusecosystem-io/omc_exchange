/* global document */
import logs from './logs';

// prettier-ignore
function cancelAllOrders(payload = {}, cb = () => {}) {
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => document.APAPI.RPCCall('CancelAllOrders', payload, cb));
}

export default cancelAllOrders;
