/* global document */
import logs from './logs';

// prettier-ignore
function cancelReplaceOrder(requestPayload = {}) {
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('CancelReplaceOrder', requestPayload, () => {});
  });
}

export default cancelReplaceOrder;
