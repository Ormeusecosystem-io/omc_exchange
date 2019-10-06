AlphaPoint.accountPositions.subscribe(function (data) {
  if (data[0] && document.APAPI.Session) {
    var instrumentId = document.APAPI.Session.SelectedInstrumentId;
    if (document.APAPI.Session.Instruments[instrumentId]) {
      var product1Id = document.APAPI.Session.Instruments[instrumentId].Info.Product1 - 1;
      var product2Id = document.APAPI.Session.Instruments[instrumentId].Info.Product2 - 1;
      var product1Balance = data[product1Id].Amount;
      var product2Balance = data[product2Id].Amount;

      $("#balanceProd1").html(product1Balance.toFixed(2));
      $("#balanceProd2").html(product2Balance.toFixed(2));
    }
  }
});

AlphaPoint.synched.subscribe(function(data) {
  if (data) {
    /*$.bootstrapGrowl("logged in",{ type: 'success',allow_dismiss:true,
      delay:10000, width: 250, align: 'left',
    });*/
  }
}.bind(this));

function ok() {
  var payload = {
    AccountId: document.APAPI.Session.selectedAccount,
    ClientOrderId: 0,
    Side: this.state.buy ? 0 : 1,
    Quantity: this.refs.amount.value(),
    DisplayQuantity: this.refs.display_quantity.value(),
    LimitPrice: (this.state.OrderType % 2 === 0 && this.refs.value.value()),
    OrderIdOCO: 0,
    OrderType: 2,
    InstrumentId: pair.InstrumentId,
    TimeInForce: 0,
    OMSId: AlphaPoint.oms.value
  }

  AlphaPoint.sendOrder(payload)
}

function sendLimitOrder(orderSide,orderQuantity,limitPrice) {
  var payload = {
    AccountId: document.APAPI.Session.selectedAccount,
    ClientOrderId: 0,
    Side: (orderSide == "Buy") ? 0 : 1,
    Quantity: orderQuantity,
    DisplayQuantity: orderQuantity,
    LimitPrice: limitPrice,
    OrderIdOCO: 0,
    OrderType: 2,
    InstrumentId: document.APAPI.Session.SelectedInstrumentId,
    TimeInForce: 0,
    OMSId: AlphaPoint.oms.value
  }

  AlphaPoint.sendOrder(payload)
}

function cancelOrder(orderId, accountId) {
  var payload = {
    OMSId: AlphaPoint.oms.value,
    OrderId: orderId,
    AccountId: accountId
  }

  AlphaPoint.cancelOrder(payload);
}

function cancelAllOrders() {
  var payload = {
    OMSId: AlphaPoint.oms.value,
    AccountId: document.APAPI.Session.selectedAccount,
    InstrumentId: document.APAPI.Session.SelectedInstrumentId
  }

  AlphaPoint.cancelAllOrders(payload);
}
