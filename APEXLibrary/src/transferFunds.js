/* global document, AlphaPoint */
import logs from './logs';

function transferFunds(requestPayload = {}) {
  logs.socketOpen
    // prettier-ignore
    .filter(open => open)
    .take(1)
    .subscribe(() => {
      document.APAPI.RPCCall('TransferFunds', requestPayload, data => {
        if (data.result) {
          AlphaPoint.getTransfers(requestPayload.SenderAccountId);
          AlphaPoint.getTransfersReceived(requestPayload.SenderAccountId);
        }
        AlphaPoint.transfunds.onNext(data);
      });
    });
}

export default transferFunds;
