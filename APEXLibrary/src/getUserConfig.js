import logs from './logs';

function getUserCon(requestPayload = {}) {
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetUserConfig', requestPayload, (data) => {
      AlphaPoint.getUserConfig.onNext(data);
    });
  });
};

export default getUserCon;
