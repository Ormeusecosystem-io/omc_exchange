import logs from './logs';

function getWithdrawTemplate(data) {
  const requestPayload = {
    OMSId: AlphaPoint.oms.value,
    AccountId: data.accountId,
    ProductId: data.productId,
    templateType: data.templateType,
  };

  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetWithdrawTemplate', requestPayload, (data) => {
      AlphaPoint.withdrawTemplate.onNext(data);
    });
  });
};

export default getWithdrawTemplate;
