import logs from './logs';

function getAccountTransactions(accountId) {
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
    document.APAPI.RPCCall('GetAccountTransactions', requestPayload, (data) => {
      const update = {
        ...AlphaPoint.accountTransactions.value,
        [accountId]: data,
      };

      AlphaPoint.accountTransactions.onNext(update);
    });
  });
};

export default getAccountTransactions;
