import logs from './logs';

function getOrderFee(requestPayload = {}) {
  logs.socketOpen
  .filter((open) => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetOrderFee', requestPayload, (data) => {
      AlphaPoint.orderfee.onNext(data);
    });
  });
};

export default getOrderFee;
