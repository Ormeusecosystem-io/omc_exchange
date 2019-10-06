/* global document, AlphaPoint, window, APConfig, $, localStorage */
import {
  Event
} from './helper';

// AlphaPoint Javascript API Client
// Native JS, no jquery

// Contains all the alphapoint objects for a session
// Uses the Event pattern in helper.js

// User Info
// Account Info
// Balances
// My Open Orders
// My Recent Trades
// My Account Actions
// My Positions

// CLASS API (AlphaPoint API)

// document.API.Session
// document.API.Session.Products[0].Info,Name/Increment/ETC
// document.API.Session.Instruments[0].OpenOrders
// document.API.Session.Instruments[0].OrderEvent
// document.API.Session.Instruments[0].RecentTrades
// document.API.Session.Instruments[0].NewTradesEvent
// document.API.Session.Instruments[0].Info
// can loop through document.API.Instruments

// document.API.Session.Accounts[0].Balances
// document.API.Session.Accounts[0].OpenOrders
// document.API.Session.Accounts[0].RecentAccountTransactions
// document.API.Session.Accounts[0].AccountTransactionsEvent
// document.API.Session.Accounts[0].Info

// This does the logic and state holding for the connection (application level)
// public class Session()

function SessionClass(api) {
  const par = this;
  const apiRef = api;
  const userMenu = document.getElementById('userMenu');
  const accountIndicator = document.getElementById('currentSelectedAccount');

  this.SelectedInstrumentId = null; // this is used on the dashboard for what instrument all the UI widgets are on
  // public Dictionary[InstrumentId] = Instrument;
  this.Instruments = {};
  // public Dictionary[ProductId] = prod;
  this.OmsId = 1;
  this.Products = {};
  this.selectedAccount = null; // this is used on the dashboard for what account all the UI widgets will use
  this.userAccounts = [];

  this.Init = completedCallback => {
    let completedSegments = 0;
    apiRef.RPCCall(
      'GetOMSs', {
        OperatorId: APConfig.OperatorId
      },
      data => {
        par.OmsId = data[0].OMSId || data[0].Id;
        AlphaPoint.oms.onNext(data[0].OMSId || data[0].Id);

        // lets fetch the products
        apiRef.RPCCall('GetProducts', {
          OMSId: par.OmsId
        }, raw => {
          const excluded = APConfig.excludedProducts || [];
          const rv = raw.filter(prod => !excluded.includes(prod.Product)) || raw;
          AlphaPoint.products.onNext(rv);
          // lets populate the products list;
          rv.forEach(product => {
            par.Products[product.ProductId] = product;
          });
          sectionDoneInternal();
        });
        apiRef.RPCCall('GetInstruments', {
          OMSId: par.OmsId
        }, raw => {
          const excluded = APConfig.excludedInstruments || [];
          const rv = raw.filter(ins => !excluded.includes(ins.Symbol)) || raw;
          AlphaPoint.instruments.onNext(rv);
          rv.forEach(ins => {
            const orderBook = AlphaPoint.orderBook.value;
            let tickerBook = AlphaPoint.tickerBook.value;

            if (!orderBook[ins.InstrumentId]) orderBook[ins.InstrumentId] = {};
            orderBook[ins.InstrumentId].Symbol = ins.Symbol;
            orderBook[ins.InstrumentId].InstrumentId = ins.InstrumentId;
            AlphaPoint.orderBook.onNext(orderBook);

            if (!tickerBook) tickerBook = [];
            AlphaPoint.tickerBook.onNext(tickerBook);

            // lets populate the products list;
            const newIns = new InstrumentClass(apiRef);
            newIns.Info = ins;
            par.Instruments[ins.InstrumentId] = newIns;
          });

          sectionDoneInternal();
        });

        // document.APAPI.RPCCall('GetUserAccounts', { AccountId: 1, OMSId: par.OmsId }, processUserAccounts);
      }
    );

    function sectionDoneInternal() {
      completedSegments++;
      if (completedSegments === 2) completedCallback();
    }
  };

  this.UserObj = null;
  this.Accounts = [];

  this.IsAuthenticated = false;
  this.IsAuthenticatedEvent = new Event(this);

  // apiRef.SubscribeToEvent('AuthenticateUser', rv => {
  //   if (par.IsAuthenticated === true) return;
  //   if (rv.Authenticated === true) {
  //     par.IsAuthenticated = true;
  //     par.UserObj = rv.User;

  //     apiRef.RPCCall(
  //       'GetUserAccounts',
  //       { OMSId: par.OmsId },
  //       processUserAccounts
  //     );
  //   } else if (errorCallback) errorCallback(rv);
  // });

  apiRef.SubscribeToEvent('WebAuthenticateUser', rv => {
    if (par.IsAuthenticated === true) return;
    if (rv.Authenticated === true) {
      if (rv.Requires2FA === true) return;
      par.IsAuthenticated = true;
      AlphaPoint.session.onNext(rv);
      AlphaPoint.getUserPermissions(rv.UserId);
      if (!par.OmsId) {
        // If no public API
        par.Init(() => apiRef.IsConnectedEvent.notify(true));
      }
      apiRef.RPCCall('GetUserInfo', {
        UserId: rv.UserId
      }, usrRV => {
        par.UserObj = usrRV;
        apiRef.RPCCall(
          'GetUserAccounts', {
            OMSId: par.OmsId
          },
          processUserAccounts
        );
      });
    } else {
      window.localStorage.setItem('SessionToken', 'undefined');
    }
  });

  this.changeCurrentAccount = function (accountId) {
    const currentAccount = par.Accounts.find(
      account => account.AccountId === +accountId
    );

    AlphaPoint.selectedAccount.onNext(+accountId);
    par.selectedAccount = +accountId;
    $('#userMenu li:not(#logoutLinkContainer)').remove();
    accountIndicator.innerHTML =
      currentAccount.AccountInfo.AccountName || accountId;

    par.userAccounts
      .filter(account => account != par.selectedAccount)
      .forEach(accountId => {
        const otherAccount = par.Accounts.find(
          account => account.AccountId === accountId
        );
        const listEl = document.createElement('li');

        listEl.innerHTML = `<a data-id="${accountId}">Account ${otherAccount
          .AccountInfo.AccountName || accountId}'`;
        if (document.getElementById('logoutLinkContainer')) {
          userMenu.insertBefore(
            listEl,
            document.getElementById('logoutLinkContainer')
          );
        } else {
          userMenu.appendChild(listEl);
        }
      });
  };

  function processUserAccounts(data) {
    // This is a list of account numbers
    let accountsLength = data.length;
    const selectedAccount = data.includes(+localStorage.accountId)
      ? +localStorage.accountId
      : data[0];

    function completedLoadingAcc() {
      accountsLength--;
      if (accountsLength === 0) {
        par.IsAuthenticatedEvent.notify(par.UserObj);
        par.selectedAccount = selectedAccount;
        AlphaPoint.selectedAccount.onNext(selectedAccount);
        par.changeCurrentAccount(selectedAccount);
      }
    }
    data.forEach(accountId => {
      const newAcc = new AccountClass(apiRef, accountId);

      AlphaPoint.getAccountTransactions(accountId);

      AlphaPoint.getWithdrawTickets({
        OMSId: par.OmsId,
        AccountId: accountId
      });
      AlphaPoint.getAccountsInfo({
        AccountId: accountId,
        OMSId: par.OmsId
      });
      AlphaPoint.getRequestTransfers(accountId);
      AlphaPoint.getReceivedTransferRequests(accountId);
      AlphaPoint.getSentTransferRequests(accountId);
      AlphaPoint.getTransfers(accountId);
      AlphaPoint.getTransfersReceived(accountId);
      par.Accounts.push(newAcc);
      newAcc.Init(() => completedLoadingAcc()); // account initiated
    });

    AlphaPoint.getAccountInfo({
      AccountId: selectedAccount,
      OMSId: par.OmsId
    });

    if (AlphaPoint.config.loyaltyToken) {
      AlphaPoint.getOperatorLoyaltyFeeConfigsForOms({
        OMSId: par.OmsId
      });
    }

    if (AlphaPoint.userPermissions.value.includes('getuserapikeys') ||
      AlphaPoint.userPermissions.value.includes('superuser')) {
      AlphaPoint.getAPIKey({
        UserId: AlphaPoint.userData.value.UserId
      });
    }
    AlphaPoint.getUserCon({
      UserId: AlphaPoint.userData.value.UserId
    });

    if (accountsLength) {
      par.userAccounts = data;
      AlphaPoint.userAccounts.onNext(data);
      AlphaPoint.selectedAccount.onNext(selectedAccount);
      if (accountsLength === 1) {
        document
          .querySelector('.user-menu-container')
          .classList.add('single-account');
      }
    }

    if (AlphaPoint.userAccounts.value) AlphaPoint.synched.onNext(true);
  }

  window.processUserAccounts = processUserAccounts
  // Account list, populated with accounts for the authed user
  // get the accounts by using GetUserAccounts
}

function AccountClass(apiRef, accountId) {
  // all account stuff for one account
  // we automatically subscribe to accounts
  const par = this;

  this.IsSubscribed = false;

  this.Init = function (completedCallback) {
    // lets subscribe tot he account stuff.
    // open orders
    // balances
    // etc

    // GetOpenOrders
    // GetAccountPositions

    // GetOrderHistory
    // GetAccountTransactions
    // GetAccountTrades

    // SubscribeAccountEvents

    // SendOrder
    // ModifyOrder
    // CancelReplaceOrder
    // CancelOrder
    // CancelAllOrders

    let taskCount = 0;

    function taskCompleted() {
      taskCount++;
      if (taskCount === 7) {
        if (completedCallback) completedCallback();
      }
    }

    apiRef.RPCCall(
      'GetAccountInfo', {
        OMSId: document.APAPI.Session.OmsId,
        AccountId: accountId
      },
      rv => {
        par.AccountInfo = rv;
        taskCompleted();
      }
    );

    apiRef.RPCCall(
      'GetOpenOrders', {
        OMSId: document.APAPI.Session.OmsId,
        AccountId: accountId
      },
      rv => {
        const orders = rv.filter(order => !order.IsQuote);

        AlphaPoint.openorders.onNext(
          orders.length !== AlphaPoint.openorders.value.length 
          ? AlphaPoint.openorders.value.concat(orders)
          : orders
        );

        // This is a list of open order
        rv.forEach(order => {
          par.OpenOrders[order.OrderId] = order;
        });

        taskCompleted();
      }
    );
    if (AlphaPoint.userPermissions.value.includes('getopentradereports') ||
      AlphaPoint.userPermissions.value.includes('superuser')) {
      apiRef.RPCCall(
        'GetOpenTradeReports', {
          OMSID: AlphaPoint.oms.value,
          AccountId: accountId
        },
        rv => {
          const update = {
            ...AlphaPoint.tradeReports.value,
            [accountId]: rv,
          };
          AlphaPoint.tradeReports.onNext(update);

          // This is a list of open trade reports
          rv.forEach(order => {
            par.OpenTradeReports[order.OrderId] = order;
          });
          taskCompleted();
        }
      );
    }

    if (AlphaPoint.userPermissions.value.includes('getopenquotes') ||
      AlphaPoint.userPermissions.value.includes('superuser')) {
      apiRef.RPCCall(
        'GetOpenQuotes', {
          OMSId: document.APAPI.Session.OmsId,
          AccountId: accountId,
          InstrumentId: +document.APAPI.Session.SelectedInstrumentId
        },
        rv => {
          if (rv.result) {
            const orders = Object.keys(rv)
              .map(side => rv[side])
              .filter(order => order !== null);

            AlphaPoint.openquotes.onNext([].concat(orders));
            AlphaPoint.openorders.onNext(
              AlphaPoint.openorders.value.concat(orders)
            );
            // This is an object with latest open bid quote and open ask quote
            par.OpenQuotes = rv;
            AlphaPoint.config.debug && console.log('GetOpenQuotes complete');
          }
        }
      );
    }

    apiRef.RPCCall(
      'GetAccountPositions', {
        OMSId: document.APAPI.Session.OmsId,
        AccountId: accountId
      },
      raw => {
        const excluded = APConfig.excludedProducts || [];
        const rv = raw.filter(prod => !excluded.includes(prod.ProductSymbol)) || raw;
        AlphaPoint.accountPositions.onNext(
          rv.length !== AlphaPoint.accountPositions.value.length ? 
          AlphaPoint.accountPositions.value.concat(rv)
          : rv
        );
        rv.forEach(balance => {
          par.AccountPositions[balance.ProductId] = balance;
        });

        AlphaPoint.config.debug && console.log('GetAccountPositions complete');
        taskCompleted();
      }
    );

    apiRef.RPCCall(
      'GetOrderHistory', {
        OMSId: document.APAPI.Session.OmsId,
        AccountId: accountId,
        Depth: 1000
      },
      rv => {
        AlphaPoint.orderHistory.onNext(
          rv.length !== AlphaPoint.orderHistory.value.length 
          ? AlphaPoint.orderHistory.value.concat(rv)
          : rv
        );
        rv.forEach(order => {
          if (order.OrderState !== 'Working') {
            par.InactiveOrders.push(order);
            if (par.InactiveOrders.length > par.InactiveOrdersCacheLength)
              par.InactiveOrders.pop();
          }
        });

        AlphaPoint.config.debug && console.log('GetOrderHistory complete');
        taskCompleted();
      }
    );

    apiRef.RPCCall(
      'GetAccountTrades', {
        OMSId: document.APAPI.Session.OmsId,
        AccountId: accountId
      },
      rv => {
        AlphaPoint.accountTrades.onNext(
          rv.length !== AlphaPoint.accountTrades.value.length 
          ? AlphaPoint.accountTrades.value.concat(rv)
          : rv
        );
        rv.forEach(trade => {
          par.Trades.push(trade);
        });

        AlphaPoint.config.debug && console.log('GetAccountTrades complete');
        taskCompleted();
      }
    );

    apiRef.RPCCall(
      'SubscribeAccountEvents', {
        OMSId: document.APAPI.Session.OmsId,
        AccountId: accountId
      },
      rv => {
        AlphaPoint.accountEvents.onNext(rv); // Not sure if we need this

        if (rv.Subscribed === true) par.IsSubscribed = true;
        AlphaPoint.config.debug && console.log('SubscribeAccountEvents complete');
        taskCompleted();
      }
    );
  };

  this.AccountId = accountId;
  // Region: Trades
  this.Trades = [];
  this.NewTradesUpdateEvent = new Event(this);
  apiRef.SubscribeToEvent('OrderTradeEvent', orderTradeEvent_HandlerFcn);

  function orderTradeEvent_HandlerFcn(obj) {
    par.Trades.push(obj);
    par.NewTradesUpdateEvent.notify(obj);
  }
  // End Region: Trades

  // Region: Open orders and Inactive Orders
  apiRef.SubscribeToEvent('OrderStateEvent', orderStateEvent_HandlerFcn);

  function orderStateEvent_HandlerFcn(order) {
    // check if cur dictionary contains it
    const containsKey = par.OpenOrders[order.OrderId] !== undefined;

    if (order.OrderState !== 'Working') {
      par.InactiveOrders.push(order);
      if (par.InactiveOrders.length > par.InactiveOrdersCacheLength) {
        par.InactiveOrders.pop();
      }
      par.InactiveOrdersUpdateEvent.notify(order);
      if (!containsKey) return; // we don't have it and it's not working, it's not an open order and we don't want it
    }

    const eventArgs = new OpenOrdersUpdateEvent_EventArgs();

    eventArgs.NewOrderState = order;
    if (containsKey) {
      eventArgs.OldOrderState = par.OpenOrders[order.OrderId];
    } else {
      eventArgs.OldOrderState = null;
    }

    if (order.OrderState !== 'Working') {
      delete par.OpenOrders[order.OrderId];
    } else {
      par.OpenOrders[order.OrderId] = order;
    }

    par.OpenOrdersUpdateEvent.notify(eventArgs);
  }

  // public Dictionary[OrderId] = OrderObj
  this.OpenOrders = {};
  this.OpenTradeReports = {};
  this.OpenOrdersUpdateEvent = new Event(this); // sends a OpenOrdersUpdateEvent_EventArgs object with old and new state
  this.InactiveOrdersCacheLength = 100;
  this.InactiveOrders = [];
  this.InactiveOrdersUpdateEvent = new Event(this); // sends a new inactive order added to the list
  // End Region: Open orders and Inactive Orders

  // Region: AccountPosition
  apiRef.SubscribeToEvent(
    'AccountPositionEvent',
    accountPositionEvent_HandlerFcn
  );

  function accountPositionEvent_HandlerFcn(obj) {
    const eventArgs = new AccountPositionsUpdateEvent_EventArgs();
    eventArgs.NewAccountPosition = obj;
    const containsKey = par.AccountPositions[obj.ProductId] !== undefined;

    if (containsKey) {
      eventArgs.OldAccountPosition = par.AccountPositions[obj.ProductId];
    } else eventArgs.OldAccountPosition = null;

    par.AccountPositions[obj.ProductId] = obj;
    par.AccountPositionsUpdateEvent.notify(eventArgs);
  }

  // public Dictionary[ProductId] = AccPositionObj
  this.AccountPositions = {};
  this.AccountPositionsUpdateEvent = new Event(this);
  // End Region: AccountPosition

  this.SendOrder = function (orderSendData) {
    // console.log(orderSendData);
    apiRef.RPCCall('SendOrder', orderSendData, rv => {
      // console.log(rv);
    });
  };

  this.CancelOrder = function (orderId) {
    apiRef.RPCCall(
      'CancelOrder', {
        OmsId: document.APAPI.Session.OmsId,
        OrderId: orderId
      },
      rv => { }
    );
  };

  // {
  // "AccountId": 4, //Your Account Id [Integer]
  // "OMSId": 1,  //OMS Id [Integer] Always 1
  // "InstrumentId": 1 //Instrument Id [Integer]
  // }

  this.CancelAllOrders = function (instrumentId) {
    apiRef.RPCCall(
      'CancelAllOrders', {
        OmsId: document.APAPI.Session.OmsId,
        InstrumentId: instrumentId,
        AccountId: par.AccountId
      },
      rv => { }
    );
  };
}

// {
//    "AccountId": 5, //Your Account Id [Integer]
//    "ClientOrderId": 99, //Set this to your own id if you wish to use one. It will be useful for recognizing future order states related to this call. [64 bit Integer]
//    "Quantity": 1, //Quantity of the Order [Decimal]
//    "DisplayQuantity": 0, //Quantity to Display on the Market. If your order is for 1000, and you only want to show 100 at a time in market data, set this to 100. Set to 0 to display all. [Decimal]
//    "LimitPrice": 95, //The limit price for this order. [Decimal]
//    "OrderIdOCO": 0, //If you would like to have this order cancel another on execution, set this field to the other order's server order id. Omit or set to 0 if no OCO is required. [64 Bit Integer]
//    "OrderType": "Limit", //The type of order. [String] Values are "Market", "Limit", "StopMarket", "StopLimit", "TrailingStopMarket", "TrailingStopLimit"
//    "PegPriceType": "Last", //When entering a Stop/Trailing order, set this to the type of price you would like to peg the Stop to. [String] Values are "Last", "Bid", "Ask", "Midpoint"
//    "InstrumentId": 1, //The Instrument Id [Integer]
//    "RefPrice": 0, //When entering a Trailing order, set this to the current price of the market. This ensures the trailing offset is the amount intended in a fast moving market. [Decimal]
//    "Side": "Buy", //"Buy" or "Sell"
//    "StopPrice": "96", //The Stop Price for this order, if it is a stop order. Otherwise you may omit this field. [Decimal]
//    "TimeInForce": "1", //"GTC" (Good Till' Canceled), "IOC" (Immediate or Cancel), "FOK" (Fill or Kill)
//    "OMSId": "1" // OMS Id [Integer] Always 1.
// }

// https://yap.cx/APIDOC.html#SendOrder
// function OrderSendDataClass() {
//   this.AccountId = 0;
//   this.ClientOrderId = 0;
//   this.Quantity = 0;
//   this.DisplayQuantity = 0;
//   this.LimitPrice = 0;
//   this.OrderIdOCO = 0;
//   this.OrderType = document.AlphaPoint.OrderHelpers.OrderType.Unknown;
//   this.PegPriceType = document.AlphaPoint.OrderHelpers.PegPriceType.Unknown;
//   this.InstrumentId = 0;
//   this.RefPrice = 0;
//   this.Side = document.AlphaPoint.OrderHelpers.Side.Unknown;
//   this.StopPrice = 0;
//   this.TimeInForce = document.AlphaPoint.OrderHelpers.TimeInForce.GTC;
//   this.OMSId = document.APAPI.Session.OmsId;
//   this.Distance = 0;
//   // this.SubAccount = "Exchange";
// }

// function initOrderHelpers() {
// / Market Order - 1
// document.AlphaPoint.OrderHelpers.CreateMarketOrderSendData = function(
//   insId,
//   accId,
//   side,
//   qty
// ) {
//   const osd = new OrderSendDataClass();

//   osd.AccountId = accId;
//   osd.ClientOrderId = 0;
//   osd.DisplayQuantity = 0; // display all
//   osd.Quantity = qty;
//   osd.OrderType = document.AlphaPoint.OrderHelpers.OrderType.Market;
//   osd.InstrumentId = insId;
//   osd.Side = side;
//   osd.OMSId = document.APAPI.Session.OmsId;
//   osd.TimeInForce = 'GTC'; // document.AlphaPoint.OrderHelpers.TimeInForce.GTC;
//   return osd;
// };

// / Limit Order - 2
// document.AlphaPoint.OrderHelpers.CreateLimitOrderSendData = function(
//   insId,
//   accId,
//   side,
//   qty,
//   px
// ) {
//   const osd = new OrderSendDataClass();

//   osd.AccountId = accId;
//   osd.ClientOrderId = 0;
//   osd.DisplayQuantity = 0; // display all
//   osd.Quantity = qty;
//   osd.LimitPrice = px;
//   osd.OrderType = document.AlphaPoint.OrderHelpers.OrderType.Limit;
//   osd.InstrumentId = insId;
//   osd.Side = side;
//   osd.OMSId = document.APAPI.Session.OmsId;
//   osd.TimeInForce = document.AlphaPoint.OrderHelpers.TimeInForce.GTC;
//   return osd;
// };

// / Stop Market - 3
// document.AlphaPoint.OrderHelpers.CreateStopMarketOrderSendData = function(
//   insId,
//   accId,
//   side,
//   qty,
//   stopPx,
//   pegType
// ) {
//   const osd = new OrderSendDataClass();

//   osd.AccountId = accId;
//   osd.ClientOrderId = 0;
//   osd.DisplayQuantity = 0; // display all
//   osd.Quantity = qty;
//   osd.OrderType = document.AlphaPoint.OrderHelpers.OrderType.Market;
//   osd.InstrumentId = insId;
//   osd.Side = side;
//   osd.OMSId = document.APAPI.Session.OmsId;
//   osd.TimeInForce = 'GTC'; // document.AlphaPoint.OrderHelpers.TimeInForce.GTC;
//   osd.StopPrice = stopPx;
//   osd.PegPriceType = pegType;
//   return osd;
// };

// / Stop Limit - 4
// document.AlphaPoint.OrderHelpers.CreateStopLimitOrderSendData = function(
//   insId,
//   accId,
//   side,
//   qty,
//   px,
//   stopPx,
//   pegType
// ) {
//   const osd = new OrderSendDataClass();

//   osd.AccountId = accId;
//   osd.ClientOrderId = 0;
//   osd.DisplayQuantity = 0; // display all
//   osd.Quantity = qty;
//   osd.LimitPrice = px;
//   osd.OrderType = document.AlphaPoint.OrderHelpers.OrderType.Limit;
//   osd.InstrumentId = insId;
//   osd.Side = side;
//   osd.OMSId = document.APAPI.Session.OmsId;
//   osd.TimeInForce = document.AlphaPoint.OrderHelpers.TimeInForce.GTC;
//   osd.StopPrice = stopPx;
//   osd.PegPriceType = pegType;
//   return osd;
// };

// / Trailing Stop Market - 5
// document.AlphaPoint.OrderHelpers.CreateTrailingStopMarketOrderSendData = function(
//   insId,
//   accId,
//   side,
//   qty,
//   dist,
//   refPx,
//   pegType
// ) {
//   const osd = new OrderSendDataClass();

//   osd.AccountId = accId;
//   osd.ClientOrderId = 0;
//   osd.DisplayQuantity = 0; // display all
//   osd.Quantity = qty;
//   osd.OrderType = document.AlphaPoint.OrderHelpers.OrderType.Market;
//   osd.InstrumentId = insId;
//   osd.Side = side;
//   osd.OMSId = document.APAPI.Session.OmsId;
//   osd.TimeInForce = 'GTC'; // document.AlphaPoint.OrderHelpers.TimeInForce.GTC;
//   osd.Distance = dist;
//   osd.RefPrice = refPx;
//   osd.PegPriceType = pegType;
//   return osd;
// };

// / Trailing Stop Limit - 6
// document.AlphaPoint.OrderHelpers.CreateTrailingStopLimitOrderSendData = function(
//   insId,
//   accId,
//   side,
//   qty,
//   px,
//   dist,
//   refPx,
//   pegType
// ) {
//   const osd = new OrderSendDataClass();

//   osd.AccountId = accId;
//   osd.ClientOrderId = 0;
//   osd.DisplayQuantity = 0; // display all
//   osd.Quantity = qty;
//   osd.LimitPrice = px;
//   osd.OrderType = document.AlphaPoint.OrderHelpers.OrderType.Limit;
//   osd.InstrumentId = insId;
//   osd.Side = side;
//   osd.OMSId = document.APAPI.Session.OmsId;
//   osd.TimeInForce = document.AlphaPoint.OrderHelpers.TimeInForce.GTC;
//   return osd;
// };

//   document.AlphaPoint.OrderHelpers.OrderType = {
//     Unknown: 0,
//     Market: 1,
//     Limit: 2,
//     StopMarket: 3,
//     StopLimit: 4,
//     TrailingStopMarket: 5,
//     TrailingStopLimit: 6
//   };

//   document.AlphaPoint.OrderHelpers.Side = {
//     Unknown: 3,
//     Buy: 0,
//     Sell: 1,
//     Short: 2
//   };

//   document.AlphaPoint.OrderHelpers.TimeInForce = {
//     Unknown: 0,
//     GTC: 1,
//     IOC: 2,
//     FOK: 3
//   };

//   document.AlphaPoint.OrderHelpers.PegPriceType = {
//     Unknown: 0,
//     Last: 1,
//     Bid: 2,
//     Ask: 3
//   };
// }

// public class OpenOrdersUpdateEvent_EventArgs(). OldOrderState will be null if there is none
function OpenOrdersUpdateEvent_EventArgs() {
  this.OldOrderState = null;
  this.NewOrderState = null;
}

// public class AccountPositionsUpdateEvent_EventArgs(), OldAccountPosition will be null if there is none
function AccountPositionsUpdateEvent_EventArgs() {
  this.OldAccountPosition = null;
  this.NewAccountPosition = null;
}

// public class Instrument()
function InstrumentClass(api) {
  const apiRef = api;
  const par = this;

  apiRef.SubscribeToEvent('Level2UpdateEvent', Level2UpdateEvent_HandlerFcn);
  apiRef.SubscribeToEvent('Level1UpdateEvent', Level1UpdateEvent_HandlerFcn);
  apiRef.SubscribeToEvent('TradeDataUpdateEvent', TradesUpdateEvent_HandlerFcn);

  // Info
  this.Info = null;
  // LEVEL 2, Subscription, Event, and Data Objects

  function getBestSellPrice() {
    let minAskPrice = Number.MAX_VALUE;

    if (!Object.keys(par.L2Sells).length) {
      minAskPrice = 0;
    } else {
      for (let key in par.L2Sells) {
        if (par.L2Sells[key].Price < minAskPrice) {
          minAskPrice = par.L2Sells[key].Price;
        }
      }
    }

    return minAskPrice;
  }

  function getBestBuyPrice() {
    let maxBidPrice = 0;
    for (let key in par.L2Buys) {
      if (par.L2Buys[key].Price > maxBidPrice) {
        maxBidPrice = par.L2Buys[key].Price;
      }
    }
    return maxBidPrice;
  }

  this.IsLevel2Subscribed = false;
  this.L2CacheLength = 300;
  this.L2Buys = {}; // L2Buys[Price] = new L2Item();
  this.L2Sells = {}; // L2Sells[Price] = new L2Item();
  this.L2BestBuyPrice = null;
  this.L2BestSellPrice = null;
  this.SubscribeLevel2 = function (bSubscribe, completeCallback) {
    if (bSubscribe) {
      if (par.IsLevel2Subscribed) return; // Already subscribed
      par.IsLevel2Subscribed = true;

      const req = {
        OMSId: AlphaPoint.oms.value, // OMS Identifier [Integer] Always 1
        InstrumentId: par.Info.InstrumentId, // Instrument's Identifer [Integer]
        Depth: par.L2CacheLength // The Depth of the book to subscribe to updates for. In this example, you would receive 10 price levels on each side of the market. [Integer]
      };
      // lets subscribe
      apiRef.RPCCall('SubscribeLevel2', req, rv => {
        Level2UpdateEvent_HandlerFcn(rv); // first update, maybe just populate the book
        if (completeCallback) completeCallback();
      });
    } else {
      // unsibscribe
      if (!par.IsLevel2Subscribed) return; // Already unsubscribed
      par.IsLevel2Subscribed = false;
      const req = {
        OMSId: AlphaPoint.oms.value, // OMS Identifier [Integer] Always 1
        InstrumentId: par.Info.InstrumentId // Instrument's Identifer [Integer]
      };

      apiRef.RPCCall('UnsubscribeLevel2', req, rv => {
        par.L2Buys = {};
        par.L2Sells = {};
        if (completeCallback) completeCallback();
      });
    }
  };

  function Level2UpdateEvent_HandlerFcn(d) {
    // check if it's for me?
    if (!par.IsLevel2Subscribed) return;
    if (d.length === 0) return;
    if (!d[0]) return;
    if (d[0][7] !== par.Info.InstrumentId) return; // if the first element is not for this instrument class exit

    const Level2DataClass_ArrayObj = [];

    d.forEach((el, index) => {
      const l2Data = new Level2DataClass(el);

      Level2DataClass_ArrayObj.push(l2Data);

      AlphaPoint.lvl2Update.onNext(l2Data);

      if (l2Data.Side === 0) {
        // buy
        if (l2Data.ActionType === 0 || l2Data.ActionType === 1) {
          // new or update
          par.L2Buys[l2Data.Price] = l2Data;
        } else if (l2Data.ActionType === 2) {
          // delete
          delete par.L2Buys[l2Data.Price];
        }
      } else if (l2Data.Side === 1) {
        // sell
        if (l2Data.ActionType === 0 || l2Data.ActionType === 1) {
          // new or update
          par.L2Sells[l2Data.Price] = l2Data;
        } else if (l2Data.ActionType === 2) {
          // delete
          delete par.L2Sells[l2Data.Price];
        }
      }
    });

    par.L2BestBuyPrice = getBestBuyPrice();
    par.L2BestSellPrice = getBestSellPrice();
    $('#L1Bid').html(par.L2BestBuyPrice.toFixed(2));
    $('#L1Ask').html(par.L2BestSellPrice.toFixed(2));
    par.L2ChangedEvent.notify(Level2DataClass_ArrayObj);
  }
  this.L2ChangedEvent = new Event(this); // Array of Level2DataClass

  // LEVEL 1, Subscription, Event, and Data Objects
  this.IsLevel1Subscribed = false;
  this.L1Data = null;
  this.L1ChangedEvent = new Event(this); // Level1DataClass

  this.SubscribeLevel1 = function (bSubscribe, completeCallback) {
    if (bSubscribe) {
      if (par.IsLevel1Subscribed) return; // Already subscribed
      par.IsLevel1Subscribed = true;
      par.L1ChangedEvent.attach(updateTickerData);
      const req = {
        OMSId: AlphaPoint.oms.value, // OMS Identifier [Integer] Always 1
        InstrumentId: par.Info.InstrumentId // Instrument's Identifer [Integer]
      };
      // lets subscribe
      apiRef.RPCCall('SubscribeLevel1', req, rv => {
        Level1UpdateEvent_HandlerFcn(rv); // first update, maybe just populate the book
        if (completeCallback) completeCallback();
      });
    } else {
      // unsibscribe
      if (!par.IsLevel1Subscribed) return; // Already unsubscribed
      par.IsLevel1Subscribed = false;
      const req = {
        OMSId: AlphaPoint.oms.value, // OMS Identifier [Integer] Always 1
        InstrumentId: par.Info.InstrumentId // Instrument's Identifer [Integer]
      };

      apiRef.RPCCall('UnsubscribeLevel1', req, rv => {
        par.L1Data = null;
        if (completeCallback) completeCallback();
      });
    }
  };

  function Level1UpdateEvent_HandlerFcn(data) {
    if (par.IsLevel1Subscribed === false) return; // check if it's for me?
    par.L1Data = data;
    par.L1ChangedEvent.notify(data);
    AlphaPoint.Level1.onNext({
      ...AlphaPoint.Level1.value,
      [data.InstrumentId]: data
    });
  }

  function updateTickerData(sender, data) {
    const l1Data = data;
    // update the L1 data
    if (l1Data) {
      $('#L1LastPrice').html(l1Data.LastTradedPx.toFixed(2));
      $('#L124HRChange').html(`${l1Data.Rolling24HrPxChange.toFixed(2)}%`);
      // $("#L1Bid").html(l1Data.BestBid.toFixed(2));
      // $("#L1Ask").html(l1Data.BestOffer.toFixed(2));
      $('#L124HRVolume').html(
        `${l1Data.Rolling24HrVolume.toFixed(2)} ${document.APAPI.Session
          .Instruments[l1Data.InstrumentId].Info.Product1Symbol}`
      );
      $('#L124HRLow').html(l1Data.SessionLow.toFixed(2));
      $('#L124HRHigh').html(l1Data.SessionHigh.toFixed(2));
    }
  }

  // TRADES, Recent and New trades
  this.RecentTradesCacheLength = 100;
  this.IsTradesSubscribed = false;
  this.RecentTrades = []; // array of recent trades
  this.TradesChangedEvent = new Event(this); // Param contains new trades
  this.SubscribeTrades = function (bSubscribe, completeCallback) {
    if (bSubscribe) {
      if (par.IsTradesSubscribed) return; // Already subscribed
      par.IsTradesSubscribed = true;
      const req = {
        OMSId: AlphaPoint.oms.value, // OMS Identifier [Integer] Always 1
        InstrumentId: par.Info.InstrumentId, // Instrument's Identifer [Integer]
        IncludeLastCount: par.RecentTradesCacheLength
      };
      // lets subscribe
      apiRef.RPCCall('SubscribeTrades', req, rv => {
        TradesUpdateEvent_HandlerFcn(rv); // first update, maybe just populate the book
        if (completeCallback) completeCallback();
      });
    } else {
      // unsibscribe
      if (!par.IsTradesSubscribed) return; // Already unsubscribed
      par.IsTradesSubscribed = false;
      const req = {
        OMSId: AlphaPoint.oms.value, // OMS Identifier [Integer] Always 1
        InstrumentId: par.Info.InstrumentId // Instrument's Identifer [Integer]
      };

      apiRef.RPCCall('UnsubscribeTrades', req, rv => {
        par.RecentTrades = [];
        if (completeCallback) completeCallback();
      });
    }
  };

  function TradesUpdateEvent_HandlerFcn(d) {
    // check if it's for me?
    if (par.IsTradesSubscribed === false) return;
    if (d.length === 0) return;
    if (!d[0]) return;
    if (d[0][1] !== par.Info.InstrumentId) return; // if the first element is not for this instrument class exit

    const NewTradesDataClass_ArrayObj = new Array(d.length);
    for (const i in d) {

      // if (d[7] != par.Info.InstrumentId) // its its not for me, skip
      //    continue;
      const tradeData = new TradesDataClass(d[i]);
      NewTradesDataClass_ArrayObj.push(tradeData);
      par.RecentTrades.push(tradeData);
      if (par.RecentTrades.length > par.RecentTradesCacheLength) {
        par.RecentTrades.pop();
      }
    }

    par.TradesChangedEvent.notify(NewTradesDataClass_ArrayObj);
  }
}

// Return from server
function TradesDataClass(obj) {
  this.TradeId = obj[0];
  this.InstrumentId = obj[1];
  this.Quantity = obj[2];
  this.Price = obj[3];
  this.Order1Id = obj[4];
  this.Order2Id = obj[5];
  this.Timestamp = obj[6];
  this.Direction = obj[7];
  this.TakerSide = obj[8];
}
// Return from server
function Level2DataClass(obj) {
  this.UpdateId = obj[0];
  this.NumberOfAccounts = obj[1];
  this.UpdateDateTime = obj[2]; // Timestamp [64 bit Integer] .NET UTC Ticks. See code snippets for examples on converting this to other formats.
  this.ActionType = obj[3]; // Change Type [Integer] 0=New, 1=Update, 2=Delete
  this.LastTradePrice = obj[4];
  this.NumberOfOrders = obj[5];
  this.Price = obj[6];
  this.ProductPairCode = obj[7];
  this.Quantity = obj[8];
  this.Side = obj[9];
}

export default {
  SessionClass,
  // initOrderHelpers
};
