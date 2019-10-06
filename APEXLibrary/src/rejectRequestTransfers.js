/* global document, AlphaPoint */
import logs from './logs';

function rejectRequestTransfers(requestPayload = {}) {
  // prettier-ignore
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('RejectRequestTransferFunds', requestPayload, (data) => {
      // console.log('RejectRequestTransferFunds', data);
      AlphaPoint.rejectrequests.onNext(data);
    });
  });
}

export default rejectRequestTransfers;
