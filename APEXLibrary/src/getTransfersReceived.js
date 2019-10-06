/* global AlphaPoint, document */
import logs from './logs';

function getTransfersReceived(accountId) {
  const requestPayload = {
    OMSId: AlphaPoint.oms.value,
    OperatorId: AlphaPoint.config.OperatorId,
    AccountId: accountId
    // Status: 0,
  };

  logs.socketOpen.filter(open => open).take(1).subscribe(() => {
    document.APAPI.RPCCall('GetTransfersReceived', requestPayload, data => {
      // AlphaPoint.receivedTransfers.onNext(data);
      AlphaPoint.receivedTransfers.onNext({
        ...AlphaPoint.receivedTransfers.value,
        [accountId]: data
      });
    });
  });
}

export default getTransfersReceived;
