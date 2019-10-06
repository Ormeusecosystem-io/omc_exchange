/* global AlphaPoint */
import React from 'react';
import WidgetBase from './base';

class TickerBook extends React.Component {
  constructor() {
    super();

    this.state = {
      data: {},
      pairs: [],
      productPairs: [],
    };
  };

  componentDidMount() {
    this.productPairs = AlphaPoint.instruments.subscribe(pairs => this.setState({ pairs }));
    this.bookTickers = AlphaPoint.instruments.subscribe(productPairs => {
        productPairs.forEach(pair => AlphaPoint.subscribeLvl1(pair.InstrumentId));
    });

    this.level1 = AlphaPoint.Level1.subscribe(data => {
        this.setState({ data });
    });
    
  };

  componentWillUnmount() {
    this.productPairs.dispose();
    this.bookTickers.dispose();
  };

  render() {
    const { data } = this.state;
    
    const tickerBook = Object.keys(data).map(key=>{
      const pairName = this.state.pairs.find(inst => inst.InstrumentId === data[key].InstrumentId).Symbol || '';
      return(<tr>
        <th>{pairName}</th>
        <th>{data[key].LastTradedPx.toFixed(AlphaPoint.config.advancedUITickerDecimalPlaces || 2)}</th>
        <th>{data[key].Rolling24HrPxChange.toFixed(2)}%</th>
        <th>{data[key].BestBid.toFixed(AlphaPoint.config.advancedUITickerDecimalPlaces || 2)}</th>
        <th>{data[key].BestOffer.toFixed(AlphaPoint.config.advancedUITickerDecimalPlaces || 2)}</th>
        <th>{data[key].Rolling24HrVolume.toFixed(2)}</th>
        <th>{data[key].SessionLow.toFixed(AlphaPoint.config.advancedUITickerDecimalPlaces || 2)}</th>
        <th>{data[key].SessionHigh.toFixed(AlphaPoint.config.advancedUITickerDecimalPlaces || 2)}</th>
      </tr>)
    })

    return (
      <WidgetBase
        {...this.props}
        headerTitle={AlphaPoint.translation('HEADER_TICKER.TITLE_TEXT') || 'Tickers'}
      >
        <table className="ticker-wrapper">
          <thead>
            <tr>
              <th className="last-price">
                {AlphaPoint.translation('PRODUCTS.TITLE_TEXT') || 'Products'}
              </th>
              <th className="last-price">
                {AlphaPoint.translation('TICKERS.LAST_PRICE') || 'Last Price'}
              </th>
              <th className="last-price">
                {AlphaPoint.translation('TICKERS.T24_HOUR_CHANGE') || '24 Hour Change'}
              </th>
              <th className="last-price">
                {AlphaPoint.translation('TICKERS.BID') || 'Bid'}
              </th>
              <th className="last-price">
                {AlphaPoint.translation('TICKERS.ASK') || 'Ask'}
              </th>
              <th className="day-stat">
                {AlphaPoint.translation('TICKERS.T24_HOUR_VOLUME') || '24 Hour Volume'}
              </th>
              <th className="day-stat">
                {AlphaPoint.translation('TICKERS.T24_HOUR_LOW') || '24 Hour Low'}
              </th>
              <th className="day-stat">
                {AlphaPoint.translation('TICKERS.T24_HOUR_HIGH') || '24 Hour High'}
              </th>
            </tr>
            { tickerBook }
          </thead>
        </table>
      </WidgetBase>
    );
  }
}

export default TickerBook;
