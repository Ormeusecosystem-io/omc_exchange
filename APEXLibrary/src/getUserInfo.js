import logs from './logs';

function getUserInfo(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetUserInfo', requestPayload, (data) => {
      AlphaPoint.getUser.onNext(data);
    });
  });
};


export default getUserInfo;
