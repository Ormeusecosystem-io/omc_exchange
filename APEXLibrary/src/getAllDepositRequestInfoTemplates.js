import logs from './logs';

function GetAllDepositRequestInfoTemplates(requestPayload) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetAllDepositRequestInfoTemplates', requestPayload, (data) => {
      AlphaPoint.depositTemplate.onNext(data.Templates || {});
    });
  });
};

export default GetAllDepositRequestInfoTemplates;
