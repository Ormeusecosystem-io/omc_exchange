/* global document, AlphaPoint */
import logs from './logs';

// prettier-ignore
function disable2FA(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe(() => {
    document.APAPI.RPCCall('Disable2FA', requestPayload, (data) => {
      AlphaPoint.Disable2FA.onNext(data);
    });
  });
}

export default disable2FA;
