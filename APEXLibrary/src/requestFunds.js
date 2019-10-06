import logs from './logs';

function requestFunds(data = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('RequestTransferFunds', data, (data) => {
      AlphaPoint.requestfunds.onNext(data);
    });
  });
};

export default requestFunds;
