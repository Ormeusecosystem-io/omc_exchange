import logs from './logs';

function sendOrder(payload = {}) {
  logs.socketOpen
  .filter((open) => open)
  .take(1)
  .subscribe(() => {
    document.APAPI.RPCCall(
      'SendOrder',
      payload,
      (data) => AlphaPoint.sendorder.onNext(data)
    );
  });
};

export default sendOrder;
