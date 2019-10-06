/* global document, AlphaPoint */
import logs from './logs';

// prettier-ignore
function createAPIKey(requestPayload = {}) {
  // console.log('AlphaPoint.userID', AlphaPoint.userData);
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('AddUserAPIKey', requestPayload, (data) => AlphaPoint.addApiKey.onNext(data));
  });
}

export default createAPIKey;
