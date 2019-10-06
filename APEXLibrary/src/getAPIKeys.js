import logs from './logs';

function getAPIKey(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetUserAPIKeys', requestPayload, (data) => {
      AlphaPoint.myApiKeys.onNext(data);
    });
  });
};

export default getAPIKey;
