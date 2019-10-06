/* global document, AlphaPoint, localStorage */
import logs from './logs';

function WebAuthenticate(requestPayload = {}, callback = () => { }) {
  logs.socketOpen
    // prettier-ignore
    .filter(open => open)
    .take(1)
    .subscribe(open => {
      document.APAPI.RPCCall('WebAuthenticateUser', requestPayload, data => {
        AlphaPoint.webAuthenticateSubject.onNext(data);
        logs.session.onNext(data);
        logs.userData.onNext(data);

        // Getting a SessionToken
        logs.session.subscribe(data =>{
          if (data.SessionToken) {
            localStorage.setItem('SessionToken', data.SessionToken)
            localStorage.removeItem('loginFailedTimes');
            localStorage.removeItem('loginDisabledTime');
          }
        });

        // To handle User Id
        logs.userData.subscribe(data =>
          localStorage.setItem('UserId', data.UserId)
        );

        if (data.Authenticated) callback();
      });
    });
}

export default WebAuthenticate;
