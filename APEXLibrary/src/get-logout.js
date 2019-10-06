import config from './config';
import logs from './logs';

function getLogout() {
  
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('Logout', {});
    logs.session.onNext({});
    document.location = AlphaPoint.config.logoutRedirect;
    localStorage.clear();
  });
};

export default getLogout;
