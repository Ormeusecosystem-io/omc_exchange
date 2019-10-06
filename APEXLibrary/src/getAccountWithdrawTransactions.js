import logs from './logs';

function getAccountWithdrawTransactions(requestPayload = {}) {
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetAccountWithdrawTransactions', requestPayload, (data) => {
      const update = {
        ...AlphaPoint.accountWithdrawTransactions.value,
        [requestPayload.AccountId]: data,
      };

      AlphaPoint.accountWithdrawTransactions.onNext(update);
    });
  });
};

export default getAccountWithdrawTransactions;
