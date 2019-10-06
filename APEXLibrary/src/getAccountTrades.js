import logs from './logs';

function getAccountTrades(accountId) {
  const requestPayload = {
    AccountId: accountId,
    OMSId: AlphaPoint.oms.value,
    StartIndex: 0,
    Count: 100,
  };

  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetAccountTrades', requestPayload, (data) => {
      AlphaPoint.accountTrades.onNext(AlphaPoint.accountTrades.value.concat(data));
    });
  });
};

export default getAccountTrades;
