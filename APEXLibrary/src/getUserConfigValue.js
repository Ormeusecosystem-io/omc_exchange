import logs from './logs';

function getUserConfigValue(requestPayload = {}) {
  logs.session
  .filter((open) => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetUserConfigValue', requestPayload, (data) => {
      AlphaPoint.getUserConfigVal.onNext(data);
    });
  });
};

export default getUserConfigValue;
