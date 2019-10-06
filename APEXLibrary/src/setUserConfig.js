import logs from './logs';

function setUserCon(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('SetUserConfig', requestPayload, (data) => {
      AlphaPoint.setUserConfig.onNext(data);
    });
  });
};

export default setUserCon;
