/* global document, AlphaPoint */
import logs from './logs';

// prettier-ignore
function Authenticate(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('AuthenticateUser', requestPayload, (data) => {
      AlphaPoint.authenticateSubject.onNext(data);
    });
  });
}

export default Authenticate;
