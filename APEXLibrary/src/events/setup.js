import Rx from 'rx-lite';
import config from '../config';

/**
*  user information event
*  @memberof AlphaPoint
*  @name userInformation
*  @see {@link https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/behaviorsubject.md Rx.BehaviorSubject}
*  @example
*  var userInformation = AlphaPoint.userInformation.subscribe(
*    function (data) {
*      //data = {
*      //  isAccepted: boolean,
*      //  UseAuthy2FA: boolean,
*      //  UseGoogle2FA: boolean,
*      //  affiliateId: string,
*      //  firstName: string,
*      //  lastName: string,
*      //  verificationLevels: number[]
*      //}
*    }
*  );
*
*  // when finished with event subscription
*  userInformation.dispose()
*/
const userInformation = new Rx.BehaviorSubject({});

/**
*  user account event
*  @memberof AlphaPoint
*  @name accountInformation
*  @see {@link https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/behaviorsubject.md Rx.BehaviorSubject}
*  @example
*  var accountInformation = AlphaPoint.accountInformation.subscribe(
*    function (data) {
*      //data = {
*      //  currencies:[{
*      //    balance: number,
*      //    hold: number,
*      //    name: string,
*      //    unconfirmed: number
*      //  }]
*      //}
*    }
*  );
*
*  // when finished with event subscription
*  accountInformation.dispose()
*/
const accountInformation = new Rx.BehaviorSubject({});

/**
*  session event
*  @memberof AlphaPoint
*  @name session
*  @see {@link https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/behaviorsubject.md Rx.BehaviorSubject}
*  @example
*  var session = AlphaPoint.session.subscribe(
*    function (data) {
*      //data = {
*      //  accountId: number,
*      //  expiryTimeMinutes: number,
*      //  isAccepted: boolean,
*      //  isFromAPIKey: boolean,
*      //  lastActivityTime: number,
*      //  sessionToken: string,
*      //  timeLoggedOn: number,
*      //  twoFaRequestType: string,
*      //  userId: string
*      //}
*    }
*  );
*
*  // when finished with event subscription
*  session.dispose()
*
*  @param {string} test
*/
const session = new Rx.BehaviorSubject({ initial: true });

/**
*  account actions event
*  @memberof AlphaPoint
*  @name accountActions
*  @see {@link https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/behaviorsubject.md Rx.BehaviorSubject}
*  @example
*  var accountActions = AlphaPoint.accountActions.subscribe(
*    function (data) {
*      //data = {
*      //
*      //}
*    }
*  );
*
*  // when finished with event subscription
*  accountActions.dispose()
*/
const accountActions = new Rx.BehaviorSubject([]);

/**
*  open orders event
*  @memberof AlphaPoint
*  @name openOrders
*  @see {@link https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/behaviorsubject.md Rx.BehaviorSubject}
*  @example
*  var openOrders = AlphaPoint.openOrders.subscribe(
*    function (data) {
*      //data = {
*      //
*      //}
*    }
*  );
*
*  // when finished with event subscription
*  openOrders.dispose()
*/
const openOrders = new Rx.BehaviorSubject([]);

/**
*  L2 And Trades event
*  @memberof AlphaPoint
*  @name getL2AndTradesSubject
*  @see {@link https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/subjects/subject.md Rx.Subject}
*  @example
*  var getL2AndTradesSubject = AlphaPoint.getL2AndTradesSubject.subscribe(
*    function (data) {
*      //data = {
*      //
*      //}
*    }
*  );
*
*  // when finished with event subscription
*  getL2AndTradesSubject.dispose()
*/
const getL2AndTradesSubject = new Rx.Subject();

const language = new Rx.BehaviorSubject({});

const getL2AndTrades = {};
const realTimeData = {};

const prodPair = new Rx.BehaviorSubject(config.prodPair);

// var fromWebsocket = require('./fromWebsocket');
// var getRealTimeSubject = fromWebsocket(config.charting_url);
const ajaxObserver = Rx.Observable.fromCallback(require('../ajax').default);

const tickers = [];

export default {
  userInformation,
  accountInformation,
  session,
  prodPair,
  getL2AndTrades,
  realTimeData,
  getL2AndTradesSubject,
  // getRealTimeSubject: getRealTimeSubject,
  tickers,
  accountActions,
  language,
  openOrders
};
