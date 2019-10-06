import logs from './logs';

function submitBlockTrade(data = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('SubmitBlockTrade', data, (data) => AlphaPoint.submitBlockTradeEvent.onNext(data));
  });
};

export default submitBlockTrade;
