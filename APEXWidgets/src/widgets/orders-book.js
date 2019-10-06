import Rx from 'rx-lite';
import React from 'react';
import WidgetBase from './base';
import OrdersBook_Orders from './orders-book-orders';

var OrdersBook = React.createClass({
  getInitialState: function() {
    return {
      data: [],
      buys: [],
      sells: [],
      // productPairs:[],
      // currentPair:''
    };
  },
  componentWillUnmount: function() {
    this.pair.dispose();
    this.productPairs.dispose();
    this.buyOrders.dispose();
    this.sellOrders.dispose();
  },
  componentDidMount: function() {

  var buyOrdersBook = Rx.Observable.combineLatest(AlphaPoint.prodPair,AlphaPoint.orderBook,AlphaPoint.instruments,function(pair,orderBook,instruments){

    var instrument =  instruments.find(function(ins){
        return ins.Symbol == pair
      }) || {}

        return (orderBook[instrument.InstrumentId] || {} ).buys || []
    })

    this.orderBuysBook = buyOrdersBook.subscribe(function(buysBook){

      buysBook.sort(function (a, b){
        if (a.Price < b.Price) { return 1; }
        if (a.Price > b.Price) { return -1; }
        return 0;
      });

      this.setState({buys:buysBook});

      }.bind(this));

    var sellOrdersBook = Rx.Observable.combineLatest(AlphaPoint.prodPair,AlphaPoint.orderBook,AlphaPoint.instruments,function(pair,orderBook,instruments){

      var instrument =  instruments.find(function(ins){
          return ins.Symbol == pair
        }) || {}

          return (orderBook[instrument.InstrumentId] || {} ).sells || []
      })

      this.orderSellsBook = sellOrdersBook.subscribe(function(sellsBook){

      // sellsBook.sort(function (a, b){
      //   if (a.Price < b.Price) { return 1; }
      //   if (a.Price > b.Price) { return -1; }
      //   return 0;
      // });

      this.setState({sells:sellsBook});

      }.bind(this));

  },

  render: function() {
    // console.log("Sells BOOK!",this.state.sells);
    // console.log("Buys BOOK!",this.state.buys);
    return (
      <div>
        <OrdersBook_Orders {...this.props} data={this.state.sells} type ="sells" />
        <OrdersBook_Orders {...this.props} data={this.state.buys} type ="buys" />
      </div>
    );
  }
});

module.exports = OrdersBook;
