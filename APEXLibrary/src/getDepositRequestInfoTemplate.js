import logs from './logs';

function getDepositRequestInfoTemplate(requestPayload) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetDepositRequestInfoTemplate', requestPayload, (data) => {
      AlphaPoint.depositTemplate.onNext(data || {});
    });
  });
};

export default getDepositRequestInfoTemplate;
