const Rx = require('rx-lite');
const logs = require('../logs');
const events = require('./setup');
const config = require('../config');
const ajax = require('../ajax');

const ajaxObserver = Rx.Observable.fromCallback(ajax);
// var GetL2AndTrades =  require('./getL2AndTrades');

logs.prodPair.subscribe(pair => {
  // create new getL2AndTrades each time
  // product pair changes
  if (!events.getL2AndTrades[pair]) {
    events.getL2AndTrades[pair] = {
      subject: null,
      buys: [],
      sells: [],
      trades: []
    };
  }
  // GetL2AndTrades(pair, events.getL2AndTrades);

  if (!events.realTimeData[logs.prodPair.value]) {
    events.realTimeData[logs.prodPair.value] = {};
    events.realTimeData[logs.prodPair.value].stream = new Rx.Subject();
    events.realTimeData[logs.prodPair.value].history = new Rx.BehaviorSubject(
      []
    );
  }
  events.realTimeData[logs.prodPair.value].history.onNext([]);

  events.getRealTimeSubject.onNext({
    messageType: 'subscribe',
    ProductPair: pair
  });
});

const productPairs = Rx.Observable.combineLatest(
  // ajaxObserver({url: config.http.GetProductPairs}),
  logs.prodPair,
  (res, currentPair) => ({
    productPairs: res.productPairs,
    currentPair
  })
);

const pairsSubject = new Rx.BehaviorSubject({
  productPairs: [],
  currentPair: ''
});
productPairs.subscribe(pairsSubject);

productPairs.subscribe(pair => {
  if (!pair) return;
  if (!pair.productPairs) return;

  pair.productPairs.forEach(pair => {
    if (events.realTimeData[pair.name]) return;
    events.realTimeData[pair.name] = {
      history: new Rx.BehaviorSubject([]),
      stream: new Rx.Subject()
    };
  });
});

export default {
  productPairs: pairsSubject.filter(d => d.currentPair)
};
