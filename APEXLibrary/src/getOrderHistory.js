/* global document, AlphaPoint */
import logs from './logs';

function getOrderHistory(accountId) {
  const requestPayload = {
    AccountId: accountId,
    OMSId: AlphaPoint.oms.value,
    Depth: 1000
  };

  // prettier-ignore
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetOrderHistory', requestPayload, (data) => {
      AlphaPoint.orderHistory.onNext(AlphaPoint.orderHistory.value.concat(data));
    });
  });
}

export default getOrderHistory;
