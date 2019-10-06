/* global AlphaPoint */
import Rx from 'rx-lite';

let undefined;

class OrderBook {
  constructor() {

    const observable = new Rx.BehaviorSubject({});
    let orderMap = new Map();
    let instrument = undefined;

    let mapOrder = (order) => ({
      price: order.Price,
      volume: order.Quantity
    });

    let formatOrder = order => ({
      UpdateId: order[0],
      Account: order[1],
      TimeStamp: order[2],
      ActionType: order[3],
      LastTradePrice: order[4],
      Orders: order[5],
      Price: +order[6],
      ProductPairCode: order[7],
      Quantity: +order[8],
      Side: order[9],
    });


    const update = function () {
      const bids = [];
      const asks = [];
      let lastTradePrice = undefined;
      orderMap.forEach(value => {
        switch (value.Side) {
          case 0: // bids
            lastTradePrice = value.LastTradePrice;
            bids.push(mapOrder(value));
            break;

          case 1: // asks
            lastTradePrice = value.LastTradePrice;
            asks.push(mapOrder(value));
            break;
        }
      });

      bids.sort((a, b) => b.price - a.price);
      asks.sort((a, b) => a.price - b.price);

      const output = { bids, asks };

      if (instrument !== undefined) {
        output.baseCurrency = instrument.Product1Symbol;
        output.quoteCurrency = instrument.Product2Symbol;
      }

      if (lastTradePrice !== undefined) {
        output.lastTradePrice = lastTradePrice;
      }

      observable.onNext(output);
    }.bind(this);


    const selectedInstrument = Rx.Observable.combineLatest(
      AlphaPoint.instrumentChange,
      AlphaPoint.instruments,
      (inst, instruments) =>  instruments.length === 0
        ? instruments.find((i) => i.InstrumentId === +inst)
      : AlphaPoint.instruments.value.find((i) => i.InstrumentId === +inst))
      .filter(inst => inst)
      .subscribe(inst => {
        orderMap.clear();
        instrument = inst;
        update();
      });

    const level2Init = AlphaPoint.Level2.filter(rawLayers => rawLayers.length)
      .subscribe(layers => {
        layers.forEach(layer => {
          const layerObj = formatOrder(layer);
          const priceKey = layerObj.Side === 0 ? layerObj.Price : layerObj.Price * -1;
          orderMap.set(priceKey, layerObj);
        });
        update();
      });

    const level2Update = AlphaPoint.Level2Update.filter(rawLayers => rawLayers.length)
      .subscribe(layers => {
        layers.forEach(layer => {
          const layerObj = formatOrder(layer);
          const priceKey = layerObj.Side === 0 ? layerObj.Price : layerObj.Price * -1;
          switch (layerObj.ActionType) {
            case 0: // New layer
            case 1: // Update layer
              orderMap.set(priceKey, layerObj);
              break;

            case 2: // Delete layer
              orderMap.delete(priceKey);
              break;
          }
        });
        update();
      });

    this.subscribe = function(callback) {
      return observable.subscribe(callback);
    };

    this.cleanUp = function() {
      selectedInstrument.dispose();
      level2Init.dispose();
      level2Update.dispose();
      //TODO: dispose of observable?
    };
  }
}

export default new OrderBook();
