import config from './config';
import logs from './logs';

function getOMS() {
  const requestPayload = { OperatorId: config.OperatorId };
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetOMSs', requestPayload, (data) => {
      AlphaPoint.oms.onNext(data[0].OMSId);
      AlphaPoint.getInstruments();
      AlphaPoint.getProducts();
      AlphaPoint.getUserAccounts(1);
    });
  });
};

export default getOMS;
