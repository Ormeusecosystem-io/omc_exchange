/* global document, AlphaPoint */
import logs from './logs';

function unsubscribeLvl1(instrumentId, callback = () => {}) {
  let InstrumentId;

  if (!instrumentId) {
    const prodPair = AlphaPoint.prodPair.value;

    AlphaPoint.instruments.subscribe(data => {
      if (prodPair === 'BTCUSD')
        InstrumentId = data.length && data[0].InstrumentId;
      if (prodPair === 'LTCUSD')
        InstrumentId = data.length && data[1].InstrumentId;
    });
  } else {
    InstrumentId = instrumentId;
  }

  const requestPayload = { OMSId: AlphaPoint.oms.value, InstrumentId };

  logs.socketOpen
    // prettier-ignore
    .filter(open => open)
    .take(1)
    .subscribe(open => {
      const marketDataWS = document.MarketDataWS || document.APAPI;

      marketDataWS.RPCCall('UnsubscribeLevel1', requestPayload, callback);
    });
}

export default unsubscribeLvl1;
