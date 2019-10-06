/* global document, AlphaPoint, localStorage */
import logs from './logs';

// prettier-ignore
function authenticate2FA(requestPayload = {}) {
  logs.socketOpen
  .filter((open) => open)
  .take(1)
  .subscribe(() => {
    document.APAPI.RPCCall('Authenticate2FA', requestPayload, (data) => {
      AlphaPoint.auth2FA.onNext(data);
      logs.userData.onNext(data);

      // Getting a SessionToken
      if (data.Authenticated) {
        logs.session.onNext(data);
        logs.session.subscribe(sessionData => {
          if (sessionData.SessionToken) localStorage.setItem('SessionToken', sessionData.SessionToken);
        });
        logs.userData.subscribe(userData => localStorage.setItem('UserId', userData.UserId));
      }
    });
  });
}

export default authenticate2FA;
