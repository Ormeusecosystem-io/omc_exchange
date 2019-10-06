const events = require('./setup');
const config = require('../config');
const fromWebsocket = require('./fromWebsocket');

events.session
  // .filter(function(session) { return session && session.sessionToken; })
  .subscribe(session => {
    let subscription;

    // console.log(session);
    if (session && session.sessionToken && !subscription) {
      var accountActions = fromWebsocket(config.ws.GetAccountActions, {
        messageType: 'logon',
        sessionToken: session.sessionToken
      });

      subscription = accountActions
        .map(e => {
          return JSON.parse(e.data);
        })
        .where(e => {
          return e.messageType !== 'OrderRejected';
        })
        .map(data => {
          var openOrders = events.openOrders.value || [];

          // console.log(data, openOrders);
          switch (data.messageType) {
            case 'AllOpenOrders':
              openOrders = data.orders;
              break;
            case 'OrderAdded':
              openOrders.push({
                productPair: data.productPair,
                side: data.side,
                qtyTotal: data.qtyTotal,
                qtyRemaining: data.qtyRemaining,
                price: data.price,
                receiveTime: data.receiveTime,
                serverOrderId: data.serverOrderId
              });
              break;
            case 'OrderChanged':
              for (var x = 0; x < openOrders.length; x++) {
                if (openOrders[x].serverOrderId === data.serverOrderId) {
                  openOrders[x].productPair = data.productPair;
                  openOrders[x].side = data.side;
                  openOrders[x].qtyTotal = data.qtyTotal;
                  openOrders[x].qtyRemaining = data.qtyRemaining;
                  openOrders[x].price = data.price;
                  openOrders[x].receiveTime = data.receiveTime;
                  break;
                }
              }
              break;
            // case 'OrderRejected':
            //   break;
            case 'OrderRemoved':
              for (var i = 0; i < openOrders.length; i++) {
                if (openOrders[i].serverOrderId === data.serverOrderId) {
                  openOrders.splice(i, 1);
                  break;
                }
              }
              break;
          }
          // }

          return openOrders;
        })
        .subscribe(events.openOrders);
      accountActions.onNext({ messageType: 'GetAllOpenOrders' });
      // accountActions.onNext({messageType: "GetAllAccountActions"});
    } else {
      if (subscription) subscription.dispose();
      subscription = undefined;
    }
  });

// export default accountActions;
