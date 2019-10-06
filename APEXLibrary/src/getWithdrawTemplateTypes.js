import logs from './logs';

function getWithdrawTemplateTypes(data) {
  const requestPayload = {
    OMSId: AlphaPoint.oms.value,
    AccountId: data.accountId,
    ProductId: data.productId,
  };

  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetWithdrawTemplateTypes', requestPayload, (data) => {
      AlphaPoint.withdrawTemplateTypes.onNext(data);
    });
  });
};

export default getWithdrawTemplateTypes;
