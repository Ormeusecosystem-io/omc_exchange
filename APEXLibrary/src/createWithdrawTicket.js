/* global document, AlphaPoint */
import logs from './logs';

// prettier-ignore
function createWithdrawTicket(payload) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe(() => {
    document.APAPI.RPCCall('createWithdrawTicket', payload, (data) => {
      AlphaPoint.createWithdrawTicket.onNext(data);
    });
  });
}

export default createWithdrawTicket;
