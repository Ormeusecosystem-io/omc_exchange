import logs from './logs';

function getAccountDepositHistory(requestPayload = {}) {
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetAccountDepositHistory', requestPayload, (data) => {
      AlphaPoint.accountDepositHistory.onNext(data);
    });
  });
};

export default getAccountDepositHistory;
