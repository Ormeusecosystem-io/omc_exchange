/* global document */
import logs from './logs';

// prettier-ignore
function registerNewUser(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => document.APAPI.RPCCall('RegisterNewUser', requestPayload));
}

export default registerNewUser;
