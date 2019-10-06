import logs from './logs';

function subscribeLvl1(payload, callback = () => {}) {
  const InstrumentId = payload;
  const requestPayload = { OMSId: AlphaPoint.oms.value, InstrumentId: InstrumentId };

  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    const marketDataWS = document.MarketDataWS || document.APAPI;

    marketDataWS.RPCCall('SubscribeLevel1', requestPayload, (data) => {
      if (data.InstrumentId) {
        AlphaPoint.Level1.onNext({ ...AlphaPoint.Level1.value, [data.InstrumentId]: data });
        callback();
      }

      const level1Trades = [];
      let tickerBook = AlphaPoint.tickerBook.value;

      level1Trades.push(data);
      AlphaPoint.subscribe1.onNext(level1Trades);
      if (!tickerBook) tickerBook = [];
      tickerBook.push(data)
      AlphaPoint.tickerBook.onNext(tickerBook);
    });
  });
};

export default subscribeLvl1;
