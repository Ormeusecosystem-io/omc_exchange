import logs from './logs';

function getOpenOrders(accountId) {
  if (!AlphaPoint.oms.value || !AlphaPoint.userAccounts.value) return;
  const requestPayload = {
    AccountId: accountId,
    OMSId: AlphaPoint.oms.value,
  };

  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetOpenOrders', requestPayload, (data) => {
      AlphaPoint.openorders.onNext(AlphaPoint.openorders.value.concat(data));
    });
  });
};

export default getOpenOrders;
