/* global document, AlphaPoint, APConfig, window */
import logs from './logs';

function getInstruments() {
  const requestPayload = { OMSId: AlphaPoint.oms.value };

  // prettier-ignore
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe(() => {
    document.APAPI.RPCCall('GetInstruments', requestPayload, (raw) => {
      const excluded = APConfig.excludedInstruments || [];
      const data = raw.filter(ins => !excluded.includes(ins.Symbol)) || raw;
      AlphaPoint.instruments.onNext(data);
      data.forEach((ins) => {
        const orderBook = AlphaPoint.orderBook.value;
        let tickerBook = AlphaPoint.tickerBook.value;

        if (!orderBook[ins.InstrumentId]) orderBook[ins.InstrumentId] = {};
        orderBook[ins.InstrumentId].Symbol = ins.Symbol;
        orderBook[ins.InstrumentId].InstrumentId = ins.InstrumentId;
        AlphaPoint.orderBook.onNext(orderBook);

        if (!tickerBook) tickerBook= [];
        AlphaPoint.tickerBook.onNext(tickerBook);

      });
    });
  });
}

export default getInstruments;
