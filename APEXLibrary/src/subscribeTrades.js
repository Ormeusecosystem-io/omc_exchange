/* global document, AlphaPoint */
import logs from './logs';
import format from './formatOrders';

function subscribeTrades(payload, IncludeLastCount = 20, callback = () => {}) {
  const InstrumentId = payload;
  const requestPayload = {
    OMSId: AlphaPoint.oms.value,
    InstrumentId,
    IncludeLastCount,
  };

  logs.socketOpen.filter(open => open).take(1).subscribe(open => {
    const marketDataWS = document.MarketDataWS || document.APAPI;

    marketDataWS.RPCCall('SubscribeTrades', requestPayload, data => {
      const trades = format.trades(data);
      const orderBook = AlphaPoint.orderBook.value;

      if (trades.length) {
        if (!orderBook[trades[0].ProductPairCode]) {
          orderBook[trades[0].ProductPairCode] = {};
        }
        orderBook[trades[0].ProductPairCode].trades = trades;
      }
      AlphaPoint.orderBook.onNext(orderBook);
      callback();
    });
  });
}

export default subscribeTrades;
