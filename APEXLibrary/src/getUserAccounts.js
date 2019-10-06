import logs from './logs';

function getUserAccounts(AccountId) {
  const requestPayload = {
    AccountId,
    OMSId: AlphaPoint.oms.value,
  };

  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetUserAccounts', requestPayload, (data) => {
      const selectedAccount = document.APAPI.Session.selectedAccount;

      AlphaPoint.userAccounts.onNext(data);
      data.forEach((accountId) => {
        AlphaPoint.getOpenOrders(accountId);
        AlphaPoint.getAccountPositions(accountId);
        AlphaPoint.getAccountTrades(accountId);
        AlphaPoint.getAccountTransactions(accountId);
        AlphaPoint.subscribeAccountEvents(accountId);
        AlphaPoint.getOrderHistory(accountId);
        AlphaPoint.getRequestTransfers(accountId);
      });
      AlphaPoint.getAccountInfo({ AccountId: document.APAPI.Session.selectedAccount, OMSId: AlphaPoint.oms.value });
      AlphaPoint.getAPIKey({ UserId: AlphaPoint.userData.value.UserId });
      AlphaPoint.getUserCon({ UserId: AlphaPoint.userData.value.UserId });
      if (AlphaPoint.userAccounts.value) AlphaPoint.synched.onNext(true);
    });
  });
};

export default getUserAccounts;
