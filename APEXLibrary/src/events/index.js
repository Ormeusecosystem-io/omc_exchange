const events = require('./setup');
const prodPair = require('./prodPair');
const realTime = require('./realTime');

require('./session');
require('./openOrders');

// var events.getL2AndTradesSubject = new Rx.Subject();
//
// var getRealTimeSubject = events.fromWebsocket(events.config.charting_url);
//
// var ajaxObserver = Rx.Observable.fromCallback( require('../ajax') );
//
// var tickers = [];

export default {
  realTime,
  userInformation: events.userInformation,
  accountInformation: events.accountInformation,
  session: events.session,
  prodPair: events.prodPair,
  getL2AndTrades: events.getL2AndTrades,
  getL2AndTradesSubject: events.getL2AndTradesSubject,
  realTimeData: events.realTimeData,
  productPairs: prodPair.productPairs,
  accountActions: events.accountActions,
  openOrders: events.openOrders,
  language: events.language
};
