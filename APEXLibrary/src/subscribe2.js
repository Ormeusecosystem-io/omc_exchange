/* global document, AlphaPoint */
import logs from './logs';
import format from './formatOrders';

function subscribeLvl2(InstrumentId, callback = () => {}) {
  const requestPayload = {
    OMSId: AlphaPoint.oms.value,
    InstrumentId,
    Depth: 250,
  };

  logs.socketOpen
    // prettier-ignore
    .filter(open => open)
    .take(1)
    .subscribe(open => {
      const marketDataWS = document.MarketDataWS || document.APAPI;

      marketDataWS.RPCCall('SubscribeLevel2', requestPayload, data => {
        const orders = format.orders(data);
        const orderBook = AlphaPoint.orderBook.value;
        const buys = orders.filter(order => order.Side === 0);
        const sells = orders.filter(order => order.Side === 1);

        buys.sort((a, b) => {
          if (a.Price < b.Price) return 1;
          if (a.Price > b.Price) return -1;
          return 0;
        });

        sells.sort((a, b) => {
          if (a.Price > b.Price) return 1;
          if (a.Price < b.Price) return -1;
          return 0;
        });

        if (orders.length > 0) {
          if (!orderBook[orders[0].ProductPairCode]) {
            orderBook[orders[0].ProductPairCode] = {};
          }
          orderBook[orders[0].ProductPairCode].buys = buys;
        }

        if (orders.length) {
          orderBook[orders[0].ProductPairCode].sells = sells;
        }
        AlphaPoint.orderBook.onNext(orderBook);
        callback();
        // AlphaPoint.Level2.onNext(data);
      });
    });
}

export default subscribeLvl2;
