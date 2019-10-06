import logs from './logs';

function getRequestTransfers(accountId) {
  const requestPayload = {
    OMSId: AlphaPoint.oms.value,
    OperatorId: AlphaPoint.config.OperatorId,
    PayerAccountId: accountId,
    Status: 0,
  };

  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetRequestTransfers', requestPayload, (data) => {
      AlphaPoint.getrequests.onNext([
        ...AlphaPoint.getrequests.value,
        ...data.filter(req => req.PayerAccountId === accountId || req.RequestorAccountId === accountId),
      ]);
    });
  });
};

export default getRequestTransfers;
