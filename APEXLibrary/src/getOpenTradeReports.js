import logs from './logs';

function getOpenTradeReports(payload = {}) {
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetOpenTradeReports', payload, (data) => {
      const update = {
        ...AlphaPoint.tradeReports.value,
        [payload.AccountId]: data,
      };
      
      AlphaPoint.tradeReports.onNext(update);
    });
  });
};

export default getOpenTradeReports;
