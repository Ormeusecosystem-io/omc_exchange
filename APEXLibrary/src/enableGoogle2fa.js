import logs from './logs';

function enableGoogle2FA(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('EnableGoogle2FA', requestPayload, (data) => {
      AlphaPoint.EnableGoogle2FA.onNext(data);
    });
  });
};

export default enableGoogle2FA;
