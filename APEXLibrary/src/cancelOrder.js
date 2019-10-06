/* global document, AlphaPoint */
import logs from './logs';

// prettier-ignore
function cancelOrder(requestPayload = {}) {
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('CancelOrder', requestPayload, (data) => {
      AlphaPoint.cancel.onNext(data);
    });
  });
}

export default cancelOrder;
