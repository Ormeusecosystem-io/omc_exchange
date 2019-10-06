import logs from './logs';

function deleteAPIKey(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('RemoveUserAPIKey', requestPayload, (data) => {
      // console.log('RemoveUserAPIKey', data);
      AlphaPoint.removeApiKey.onNext(data);
    });
  });
};

export default deleteAPIKey;
