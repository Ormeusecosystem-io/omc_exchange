import logs from './logs';

function setUserInfo(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('SetUserInfo', requestPayload, (data) => {
      AlphaPoint.setUser.onNext(data);
      AlphaPoint.getUser.onNext({ ...AlphaPoint.getUser.value, ...data});
    });
  });
};

export default setUserInfo;
