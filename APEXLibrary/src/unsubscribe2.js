/* global document, AlphaPoint */
import logs from './logs';

function unsubscribeLvl2(id, callback = () => {}) {
  const requestPayload = { OMSId: AlphaPoint.oms.value, InstrumentId: id };

  logs.socketOpen
    // prettier-ignore
    .filter(open => open)
    .take(1)
    .subscribe(open => {
      const marketDataWS = document.MarketDataWS || document.APAPI;

      marketDataWS.RPCCall('UnsubscribeLevel2', requestPayload, callback);
    });
}

export default unsubscribeLvl2;
