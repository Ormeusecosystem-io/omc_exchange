import logs from './logs';

function getAccountDepositTransactions(requestPayload = {}) {
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetAccountDepositTransactions', requestPayload, (data) => {
      const update = {
        ...AlphaPoint.accountDepositTransactions.value,
        [requestPayload.AccountId]: data,
      };

      AlphaPoint.accountDepositTransactions.onNext(update);
    });
  });
};

export default getAccountDepositTransactions;
