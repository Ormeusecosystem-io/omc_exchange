/* global AlphaPoint, document */
import React from 'react';
import WidgetBase from './base';

var TickerVolume = React.createClass({
  getDefaultProps: function() {
    return {
      narrow: true
    }
  },
  getInitialState: function() {
    return {
      data: [],
      currentPair:[],
      instrument: '',
      pairs:[],
      sorted: false
    };
  },
  componentWillUnmount: function() {
    this.bookTickers.dispose();
  },
  componentDidMount: function() {
    var list = []
    this.instrumentCheck = AlphaPoint.instrumentChange.subscribe(function (instrumentId) {
      this.setState({instrument: instrumentId})
    }.bind(this))

    this.productPair = AlphaPoint.prodPair.subscribe( function(data) {
      this.setState({
        currentPair: data
      });
    }.bind(this));

    this.productPairs = AlphaPoint.instruments.subscribe(function(data) {
      this.setState({pairs: data}); //these are all the possible pairs
    }.bind(this));

    this.bookTickers = AlphaPoint.tickerBook.subscribe(function (data) {
      let tmp = []
      this.loadedSession = AlphaPoint.sessionLoaded.subscribe(function (session) {
        if (session) {
          // var obj =  document.APAPI.Session.Instruments
          var obj =  document.APAPI.Session.Instruments[this.state.instrument].L1Data || {}
          this.setState({data: obj});
        }
      }.bind(this))
    }.bind(this))

  },

  changePair: function(pair) {

    AlphaPoint.setProductPair(pair);
    localStorage.setItem("SessionPair",pair);
},
changePairId: function(e) {
  doSelectIns(e);
  },

  render: function() {

    const pairData = (this.state.pairs.filter(function(pair) {
        return pair.Symbol == this.state.currentPair; // return the pair that is equal to the current pair on the site
    }.bind(this))[0] || {});

    const options = this.state.pairs.map(function(pair) {
      return <option value={pair.Symbol} key={pair.Symbol}>{pair.Symbol}</option>;
    });

    const pair = this.state.data;
        let tickers = (
        <div className="row">
          <div className ='col-xs-12 col-md-4'>
            <p className="day-stat">{(pair.CurrentDayVolume && pair.CurrentDayVolume.toFixed(2)) || '-'}</p>
            <p className="tick-title">24 Hour Volume</p>
          </div>
          <div className ='col-xs-12 col-md-4'>
            <p className="day-stat">{(pair.Rolling24HrVolume && pair.Rolling24HrVolume.toFixed(2)) || '-'}</p>
            <p className="tick-title">Rolling 24hr Volume</p>
          </div>
          <div className ='col-xs-12 col-md-4'>
            <p className="day-stat">{(pair.SessionHigh && pair.SessionHigh.toFixed(2)) || '-' }</p>
            <p className="tick-title">24 Hour High</p>
          </div>
        </div>
      )

    return (
      <WidgetBase  {...this.props} headerTitle={AlphaPoint.translation('TICKERS.TITLE_TEXT')||'Tickers'}  >
        {tickers}
      </WidgetBase>
    );
  }
});



module.exports = TickerVolume;
