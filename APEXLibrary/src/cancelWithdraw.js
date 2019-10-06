/* global document, AlphaPoint */
import logs from './logs';

// prettier-ignore
function cancelWithdraw(payload = {}) {
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe(() => {
    document.APAPI.RPCCall('CancelWithdraw', payload, (data) => {
      AlphaPoint.canceledWithdraw.onNext(data);
    });
  });
}

export default cancelWithdraw;
