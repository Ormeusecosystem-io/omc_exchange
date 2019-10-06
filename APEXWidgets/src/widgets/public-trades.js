import React from 'react';
import WidgetBase from './base';

import common from '../common';

var Public_Trades = React.createClass({
  getInitialState: function() {
    return {
      page: 0,
      data: [],
      pairs:[]
    };
  },
  componentWillUnmount: function() {
    this.pairs.dispose();
    this.publicTrades.dispose();
  },
  componentDidMount: function() {

    this.pairs = AlphaPoint.instruments.subscribe(function(data) {
      this.setState({pairs: data});
    }.bind(this));

    var publicTrades = Rx.Observable.combineLatest(AlphaPoint.prodPair,AlphaPoint.orderBook,AlphaPoint.instruments,function(pair,orderBook,instruments){

      var instrument =  _.find(instruments, function(ins){
          return ins.Symbol == pair
        }) || {}

          return (orderBook[instrument.InstrumentId] || {} ).trades || []
      }.bind(this))

      this.publicTrades = publicTrades.subscribe(function(trades){
        // console.log("VALUE OF TRADES",trades);
        this.setState({data:trades});

        }.bind(this));

    // this.getTrades = AlphaPoint.getTrades({
    //   ins:"BTCUSD",
    //   startIndex: -1,
    //   count: 10
    // }, function(res) {
    //   console.log(res);
    // })
  },
  gotoPage: function(num) {
    this.setState({page: num});
  },
  render: function() {
    var maxLines = 10;
    var totalPages = Math.ceil(this.state.data.length / maxLines);
    var rows = this.state.data.slice(maxLines*this.state.page, maxLines*(this.state.page+1))
    .map(function(row) {

      var pairName = (this.state.pairs.filter(function(pair) {
          return pair.InstrumentId == row.ProductPairCode
      }.bind(this))[0] || {});

      if(row.Direction == 0) {var direction = AlphaPoint.translation('PUBLIC_TRADES.NO_CHANGE')||'No Change'}
      if(row.Direction == 1) {var direction = AlphaPoint.translation('PUBLIC_TRADES.UP_TICK')|| 'Up Tick'}
      if(row.Direction == 2) {var direction = AlphaPoint.translation('PUBLIC_TRADES.DOWN_TICK')||'Down Tick'}

      return (
          <tr key={row.TradeId+'-'+row.Price+'-'+row.Quantity}>
          <td>{row.TradeId}</td>
          <td>{pairName.Symbol}</td>
          <td>{row.Price.toFixed(AlphaPoint.config.decimalPlaces)}</td>
          <td>{row.Quantity}</td>
          <td>{(row.Price * row.Quantity).toFixed(AlphaPoint.config.decimalPlaces)}</td>
          <td>{ common.getTimeFormatEpoch(row.TradeTime) }</td>
          <td>{direction}</td>
          <td >
            {row.Side === 0 ? (AlphaPoint.translation('PUBLIC_TRADES.BUY')||'Buy') : (AlphaPoint.translation('PUBLIC_TRADES.SELL')||'Sell')}
          </td>

        </tr>
      );
    }.bind(this));
    var emptyRows = [];
    for (var i=0;i<maxLines-rows.length;i++){
      emptyRows.push(<tr key={i}><td colSpan='8'>&nbsp;</td></tr>);
    }

    var start = (this.state.page - 2) > 0 ? this.state.page - 2 : 0 ;
    var end = (this.state.page + 3) <= totalPages ? this.state.page + 3 : totalPages ;
    var pages = [];
    for ( var x=start; x < end; x++ ) {
      var numButton = (
        <li key={x} className={this.state.page === x ? 'active':null}>
          <a onClick={this.gotoPage.bind(this, x)}>{x+1}</a>
        </li>
      );
      pages.push( numButton );
    }

    return (
      <WidgetBase {...this.props} headerTitle='Trades'>
        <table className="table table-hover">
          <thead>
            <tr>
              <th className="header">{AlphaPoint.translation('PUBLIC_TRADES.ID_TEXT') || 'ID'}</th>
              <th className="header">{AlphaPoint.translation('PUBLIC_TRADES.INSTRUMENT_TEXT') || 'Instrument'}</th>
              <th className="header">{AlphaPoint.translation('PUBLIC_TRADES.PRICE_TEXT') || 'Price'}</th>
              <th className="header">{AlphaPoint.translation('PUBLIC_TRADES.QUANTITY_TEXT') || 'Quantity'}</th>
              <th className="header">{AlphaPoint.translation('PUBLIC_TRADES.TOTAL_TEXT') || 'Total'}</th>
              <th className="header">{AlphaPoint.translation('PUBLIC_TRADES.TIME_TEXT') || 'Time'}</th>
              <th className="header">{AlphaPoint.translation('PUBLIC_TRADES.DIRECTION') || 'Direction'}</th>
              <th className="header">{AlphaPoint.translation('PUBLIC_TRADES.TAKER_SIDE')|| 'Taker Side'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.reverse()}
            {emptyRows}
          </tbody>
        </table>

        <div className='pad'>
          <div className='pull-right'>
            <ul className='pagination'>
              <li><a onClick={this.gotoPage.bind(this,0)}>&laquo;</a></li>
              {pages}
              <li onClick={this.gotoPage.bind(this, totalPages-1)} ><a>&raquo;</a></li>
            </ul>
          </div>
        </div>

      </WidgetBase>
    );
  }
});

module.exports = Public_Trades;
