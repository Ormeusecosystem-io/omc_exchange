/* global window, localStorage */
const Rx = require('rx-lite');

const events = require('./setup');
const config = require('../config');
const fromWebsocket = require('./fromWebsocket');
const getSessionInfo = require('../getSessionInfo');
const getUserInfo = require('../getUserInfo');

let sessionRenewTimeout;

// getSessionInfo({sessionToken: localStorage && localStorage.sessionToken});

events.session.subscribe(sessionData => {
  if (sessionData && sessionData.sessionToken) {
    getUserInfo({ sessionToken: sessionData.sessionToken });

    localStorage.setItem('sessionToken', sessionData.sessionToken);

    window.clearTimeout(sessionRenewTimeout);
    sessionRenewTimeout = setTimeout(
      getSessionInfo,
      (sessionData.expiryTimeMinutes - 20) * 60 * 1000
    );

    Rx.Observable
      .combineLatest(
        fromWebsocket(config.ws.GetAccountInfo, {
          sessionToken: sessionData.sessionToken
        }).map(data => JSON.parse(data.data)),
        // ajaxObserver({url: config.http.GetProducts}),

        (accountInfo, products) => {
          accountInfo.currencies.forEach(currency => {
            for (let x = 0; x < products.products.length; x++) {
              if (products.products[x].name === currency.name) {
                for (const field in products.products[x]) {
                  currency[field] = products.products[x][field];
                }
                break;
              }
            }
          });

          return accountInfo;
        }
      )
      .subscribe(data => {
        events.accountInformation.onNext(data);
      });
  } else if (localStorage) localStorage.sessionToken = undefined;
});
