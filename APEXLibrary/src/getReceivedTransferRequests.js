/* global AlphaPoint, document */
import logs from './logs';

function getReceivedTransferRequests(accountId) {
  const requestPayload = {
    OMSId: AlphaPoint.oms.value,
    OperatorId: AlphaPoint.config.OperatorId,
    PayerAccountId: accountId
    // Status: 0,
  };

  logs.socketOpen.filter(open => open).take(1).subscribe(() => {
    document.APAPI.RPCCall(
      'GetRequestTransferRequestsReceived',
      requestPayload,
      data => {
        // AlphaPoint.receivedTransferRequests.onNext([
        //   ...data.filter(req => req.PayerAccountId === requestPayload.PayerAccountId),
        // ]);
        AlphaPoint.receivedTransferRequests.onNext({
          ...AlphaPoint.receivedTransferRequests.value,
          [accountId]: data.filter(
            req => req.PayerAccountId === requestPayload.PayerAccountId
          )
        });
      }
    );
  });
}

export default getReceivedTransferRequests;
