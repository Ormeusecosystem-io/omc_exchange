/* global AlphaPoint, document */
import logs from './logs';

function getSentTransferRequests(accountId) {
  const requestPayload = {
    OMSId: AlphaPoint.oms.value,
    OperatorId: AlphaPoint.config.OperatorId,
    RequestorAccountId: accountId
    // Status: 0,
  };

  logs.socketOpen.filter(open => open).take(1).subscribe(() => {
    document.APAPI.RPCCall(
      'GetRequestTransferRequestsRequested',
      requestPayload,
      data => {
        // AlphaPoint.sentTransferRequests.onNext([
        //   ...data.filter(req => req.RequestorAccountId === requestPayload.RequestorAccountId),
        // ]);
        AlphaPoint.sentTransferRequests.onNext({
          ...AlphaPoint.sentTransferRequests.value,
          [accountId]: data.filter(
            req => req.RequestorAccountId === requestPayload.RequestorAccountId
          )
        });
      }
    );
  });
}

export default getSentTransferRequests;
