/* global document, AlphaPoint */
import logs from './logs';

function getAccountHistory(requestPayload) {
  var requestPayload = {
    AccountId: AlphaPoint.userAccounts.value,
    OMSId: AlphaPoint.oms.value
  };

  // prettier-ignore
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetAccountHistory', requestPayload, (data) => {
      AlphaPoint.accountHistory.onNext(data);
    });
  });
}

export default getAccountHistory;
