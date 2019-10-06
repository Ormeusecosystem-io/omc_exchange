/* global AlphaPoint, document */
import logs from './logs';

function getAccountsInfo(payload = {}) {
  logs.session.filter(open => open.SessionToken).subscribe(() => {
    document.APAPI.RPCCall('GetAccountInfo', payload, data => {
      AlphaPoint.config.debug && console.log('GetAccountInfo', data); // eslint-disable-line
      AlphaPoint.userAccountsInfo.onNext([
        ...AlphaPoint.userAccountsInfo.value,
        data
      ]);
    });
  });
}

export default getAccountsInfo;
