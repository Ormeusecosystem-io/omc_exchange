/* global document, AlphaPoint */
import logs from './logs';

function unsubscribeTradesCall(instrumentId, callback) {
  let InstrumentId;

  if (!instrumentId) {
    AlphaPoint.instruments.subscribe(data => {
      InstrumentId = data.length && data[0].InstrumentId;
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

      marketDataWS.RPCCall('UnsubscribeTrades', requestPayload, callback);
    });
}

export default unsubscribeTradesCall;
