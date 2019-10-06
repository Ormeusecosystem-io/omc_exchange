import logs from './logs';

function getAccountInfo(payload = {}) {
  logs.session
  .filter(open => open.SessionToken)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetAccountInfo', payload, (data) => {
      AlphaPoint.config.debug && console.log('GetAccountInfo', data);
      AlphaPoint.accountInfo.onNext(data);
    });
  });
};

export default getAccountInfo;
