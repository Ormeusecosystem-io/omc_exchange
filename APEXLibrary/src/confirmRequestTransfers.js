/* global document, AlphaPoint */
import logs from './logs';

// prettier-ignore
function confirmRequestTransfers(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('ConfirmRequestTransferFunds', requestPayload, (data) => {
      AlphaPoint.confirmrequests.onNext(data);
    });
  });
}

export default confirmRequestTransfers;
