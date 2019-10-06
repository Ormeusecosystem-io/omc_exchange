/* global document, $, window, AlphaPoint, localStorage */
import AP_API from './SocketAPI';
import APObjects from './APObjects';
import initSubscriptions from './socketReceive';
import library from './library';

import CCXA_API from './SocketIO-API';
import {ExchangeApiConfig, Library_v2} from './library_v2';

window.ExchangeApi = Library_v2;
window.ExchangeApiConfig = ExchangeApiConfig;

window.setElementHtml = require('./helper').setElementHtml;

window.AP_API = AP_API;
window.AlphaPoint = library;
window.disconnected = false;
// window.connectionRetries = 0;
// window.newConnectionRetries = 0;

function connect() {
  document.APAPI = null;
  document.APAPI = new AP_API();


  function fetchExchangeAndMarketData(api) {
    const accountId = localStorage.getItem('AccountId');
    const instrumentId = localStorage.getItem('SessionInstrumentId');

    //TODO: Check such an instrumentId exists?
    
    const apiRef = api;

    initSubscriptions();
    apiRef.Session = new APObjects.SessionClass(apiRef);
    apiRef.Session.selectedAccount = Number(accountId);
    AlphaPoint.instrumentChange.onNext(+instrumentId);
    AlphaPoint.selectedAccount.onNext(+accountId);

    apiRef.Session.Init(() => {
      apiRef.IsConnectedEvent.notify(true);
      AlphaPoint.sessionLoaded.onNext(true);

      // If we successfuly connected, we'll reset the connectionRetries count
      // and the global disconnected variable
      localStorage.setItem('connectionRetries', 0);
      window.disconnected = false;
    });
  }

  document.APAPI.addOnOpenCallback(() => {
    // If we are retrying to connect, let's increment update the connectionRetries
    if (window.disconnected) {
      let connectionRetries = +localStorage.getItem('connectionRetries');

      localStorage.setItem('connectionRetries', ++connectionRetries);
    }
    const apiRef = document.APAPI;
    const sessionToken = localStorage.getItem('SessionToken');

    library.socketOpen.onNext(true);

    if (sessionToken && sessionToken !== 'undefined') {
      const token = { SessionToken: sessionToken };

      if (AlphaPoint.config.sendOmsIdInLogin) {
        return AlphaPoint.oms
          .filter(id => id)
          .subscribe(OMSId => AlphaPoint.WebAuthenticate({ ...token, OMSId }));
      }

      return AlphaPoint.WebAuthenticate(token, () => {
        fetchExchangeAndMarketData(apiRef);
      });
    }

    if (!AlphaPoint.config.authenticatedMarketData) {
      fetchExchangeAndMarketData(apiRef);
    }

    return false;
  });

  document.APAPI.addOnCloseCallback(() => {
    const sessionToken = localStorage.getItem('SessionToken');

    document.APAPI.IsConnectedEvent.notify(false);
    library.socketOpen.onNext(false);

    if (AlphaPoint.config.useServerSelect) return false;

    document.APAPI = null;

    if (sessionToken && sessionToken !== 'undefined') {
      const connectionRetries = +localStorage.getItem('connectionRetries');

      // If connectionRetries does not exist in localStorage, we'll create it
      if (!connectionRetries) localStorage.setItem('connectionRetries', 0);
      // We set global disconnected variable to true so that we know we are in a reconnecting state
      window.disconnected = true;

      // If reconnection failed more than 3 times, we stop trying, clear the localStorage and redirect to index
      if (connectionRetries > 3) {
        window.disconnected = false;
        document.location = AlphaPoint.config.logoutRedirect;
        return localStorage.clear();
      }

      // SHOW WARNING NOTIFICATION
      // $.bootstrapGrowl('Connection was lost, trying to reconnect...', {
      //   ...AlphaPoint.config.growlerDefaultOptions,
      //   type: 'danger',
      //   delay: 3000
      // });
      window.location = '/';
    }
    //Should re connect even on login screen
    // connect();
  });
  document.wsConnection = document.APAPI.Connect(
    localStorage.getItem('tradingServer') || library.config.API_V2_URL
  );
  if (library.config.MarketDataWS) {
    document.MarketDataWS = new AP_API();
    document.MDWSConnection = document.MarketDataWS.Connect(
      library.config.MarketDataWS
    );
  }
  window.fetchExchangeAndMarketData =  fetchExchangeAndMarketData;
}

async function connect_ccxa_api() {
  
  window.CCXA_API = null;
  window.CCXA_API = CCXA_API;
  window.ExchangeLibrary = ExchangeApiConfig;

  let socket ;
  socket = await window.CCXA_API.Connect()
  
  if(socket) {    
    console.log('isSocket')
  }

}

connect();
connect_ccxa_api();