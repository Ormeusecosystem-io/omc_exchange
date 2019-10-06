/* global AlphaPoint, document */
import logs from './logs';

function getTransfers(accountId) {
  const requestPayload = {
    OMSId: AlphaPoint.oms.value,
    OperatorId: AlphaPoint.config.OperatorId,
    AccountId: accountId
    // Status: 0,
  };

  logs.socketOpen.filter(open => open).take(1).subscribe(() => {
    document.APAPI.RPCCall('GetTransfers', requestPayload, data => {
      // AlphaPoint.sentTransfers.onNext(data);
      AlphaPoint.sentTransfers.onNext({
        ...AlphaPoint.sentTransfers.value,
        [accountId]: data
      });
    });
  });
}

export default getTransfers;
