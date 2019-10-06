/* global document, AlphaPoint */
import logs from './logs';

function createDepositTicket(data) {
  const requestPayload = {
    OMSId: AlphaPoint.oms.value,
    accountId: data.accountId,
    assetId: data.productId,
    assetName: data.currencyCode,
    amount: data.amount,
    RequestUser: data.accountId,
    OperatorId: AlphaPoint.config.OperatorId,
    Status: data.status,
    DepositInfo: data.depositInfo
  };

  // prettier-ignore
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe(() => {
    document.APAPI.RPCCall('createDepositTicket', requestPayload, (data) => {
      AlphaPoint.createDeposit.onNext(data);
    });
  });
}

export default createDepositTicket;
