/* global document, AlphaPoint */
import logs from './logs';

function withdraw(payload = {}) {
  logs.socketOpen
    // prettier-ignore
    .filter(open => open)
    .take(1)
    .subscribe(open => {
      document.APAPI.RPCCall('CreateWithdrawTicket', payload, data => {
        AlphaPoint.submitWithdraw.onNext(data);
      });
    });
}

export default withdraw;
