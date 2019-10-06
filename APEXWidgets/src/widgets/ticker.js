/* global AlphaPoint */
import React from 'react';

class Ticker extends React.Component {
  constructor() {
    super();

    this.state = {
      data: {},
      bookLast: {}
    };
  };

  componentDidMount() {
    // Getting ticker data to display in ticker
    this.tickerData = AlphaPoint.tickerBook
      .filter(data => Object.keys(data).length)
      .subscribe(data => {
        if (data.InstrumentId === +localStorage.getItem('SessionInstrumentId')) {
          this.setState({ data })
        }
        const bookLast = { ...this.state.bookLast };
        bookLast[data.InstrumentId] = data;
        this.setState({ bookLast })
      });

    this.instrumentChangeSub = AlphaPoint.instrumentChange.subscribe(ins => {
      if (this.state.bookLast[ins]) {
        const newData = { ...this.state.bookLast[ins] };
        this.setState ({ data: newData });
      }
    });
  };

  componentWillUnmount() {
    this.tickerData.dispose();
    this.instrumentChangeSub.dispose();
  };

  render() {
    const {
      LastTradedPx = 0,
      Rolling24HrPxChange = 0,
      BestBid = 0,
      BestOffer = 0,
      Rolling24HrVolume = 0,
      SessionHigh = 0,
      SessionLow = 0,
    } = this.state.data;

    return (
      <div className="ticker-wrapper">
        <div className="last-price">
          {AlphaPoint.translation('TICKERS.LAST_PRICE') || 'Last Price'}
          <span>{LastTradedPx.toFixed(AlphaPoint.config.advancedUITickerDecimalPlaces || 2)}</span>
        </div>
        <div className="last-price">
          {AlphaPoint.translation('TICKERS.T24_HOUR_CHANGE') || '24 Hour Change'}
          <span>{Rolling24HrPxChange.toFixed(2)}%</span>
        </div>
        <div className="last-price">
          {AlphaPoint.translation('TICKERS.BID') || 'Bid'}
          <span>{BestBid.toFixed(AlphaPoint.config.advancedUITickerDecimalPlaces || 2)}</span>
        </div>
        <div className="last-price">
          {AlphaPoint.translation('TICKERS.ASK') || 'Ask'}
          <span>{BestOffer.toFixed(AlphaPoint.config.advancedUITickerDecimalPlaces || 2)}</span>
        </div>
        <div className="day-stat">
          {AlphaPoint.translation('TICKERS.T24_HOUR_VOLUME') || '24 Hour Volume'}
          <span>{Rolling24HrVolume.toFixed(2)}</span>
        </div>
        <div className="day-stat">
          {AlphaPoint.translation('TICKERS.T24_HOUR_LOW') || '24 Hour Low'}
          <span>{SessionLow.toFixed(AlphaPoint.config.advancedUITickerDecimalPlaces || 2)}</span>
        </div>
        <div className="day-stat">
          {AlphaPoint.translation('TICKERS.T24_HOUR_HIGH') || '24 Hour High'}
          <span>{SessionHigh.toFixed(AlphaPoint.config.advancedUITickerDecimalPlaces || 2)}</span>
        </div>
      </div>
    );
  }
}

export default Ticker;
