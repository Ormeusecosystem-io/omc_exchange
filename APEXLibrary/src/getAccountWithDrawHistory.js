import logs from './logs';

function getAccountWithDrawHistory(requestPayload = {}) {
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetAccountWithDrawHistory', requestPayload, (data) => {
      // console.log('GetAccountWithdrawHistory', data);
      AlphaPoint.accountWithDrawHistory.onNext(data);
    });
  });
};

export default getAccountWithDrawHistory;
