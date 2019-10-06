/* global localStorage */
import Rx from 'rx-lite';
import config from './config';

const socketOpen = new Rx.BehaviorSubject(false);
const userData = new Rx.BehaviorSubject({});
const session = new Rx.BehaviorSubject({ initial: true });
const prodPair = new Rx.BehaviorSubject(localStorage.SessionPair || config.prodPair);
const orderBook = new Rx.BehaviorSubject({});
const tickerBook = new Rx.BehaviorSubject([]);
const tickerData = new Rx.BehaviorSubject({});
const prodProduct = new Rx.BehaviorSubject(1);
const language = new Rx.BehaviorSubject({});
const logoutV2 = new Rx.BehaviorSubject({});
const loginStatusRedirect = new Rx.BehaviorSubject(false);
const instrumentChange = new Rx.BehaviorSubject(1);
const synched = new Rx.BehaviorSubject(false);
const Level1 = new Rx.BehaviorSubject([]);
const Level2 = new Rx.BehaviorSubject([]);
const Level2Update = new Rx.BehaviorSubject([]);

const logs = {
  socketOpen,
  userData,
  session,
  language,
  prodPair,
  prodProduct,
  orderBook,
  tickerBook,
  tickerData,
  logoutV2,
  loginStatusRedirect,
  instrumentChange,
  synched,
  Level1,
  Level2,
  Level2Update,
};

export default logs;
