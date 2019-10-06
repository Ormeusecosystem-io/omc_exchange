import logs from './logs';

function getDepositInfo(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetDepositInfo', requestPayload, (data) => {
      const keys = data && data.DepositInfo && JSON.parse(data.DepositInfo);

      AlphaPoint.keys.onNext(keys);
      AlphaPoint.deposits.onNext(data);
    });
  });
};

export default getDepositInfo;
