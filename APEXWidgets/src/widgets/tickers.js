/* global AlphaPoint */
import React from 'react';

import WidgetBase from './base';

class Tickers extends React.Component {
  constructor() {
    super();

    this.state = {
      data: [],
      currentPair: [],
      pairs: [],
    };
  }

  componentDidMount() {
    this.productPair = AlphaPoint.prodPair.subscribe(currentPair => this.setState({ currentPair }));
    this.productPairs = AlphaPoint.instruments.subscribe(pairs => this.setState({ pairs }));
    this.bookTickers = AlphaPoint.tickerBook.subscribe(data => this.setState({ data }));
  }

  componentWillUnmount() {
    this.ticker.dispose();
    this.update.dispose();
    this.productPair.dispose();
    this.productPairs.dispose();
    this.bookTickers.dispose();
  }

  changePair = (pair) => AlphaPoint.setProductPair(pair);

  render() {
    const tickers = this.state.data.map(pair => {
      const pairName = this.state.pairs.find(inst => inst.InstrumentId === pair.InstrumentId) || {};

      return (
        <tr key={pair.TimeStamp} className="ap-widget_ticker" data-help={pair.prodPair} >
          <td className="pair"><a onClick={() => this.changePair(pairName.Symbol)}>{pairName.Symbol}</a></td>
          <td className="bid">{pair.BestBid}</td>
          <td className="ask">{pair.BestOffer}</td>
          <td className="high">{pair.SessionHigh}</td>
          <td className="low">{pair.SessionLow}</td>
          <td className="last">{pair.SessionClose}</td>
          <td className="volume">{pair.Volume}</td>
          <td className="change">{pair.Rolling24HrPxChange}</td>
        </tr>
      );
    });

    return (
      <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('TICKERS.TITLE_TEXT') || 'Tickers'}>
        <table className="table table-responsive">
          <thead>
            <tr>
              <td>{AlphaPoint.translation('TICKERS.PAIR') || 'Pair'}</td>
              <td>{AlphaPoint.translation('TICKERS.BID') || 'Bid'}</td>
              <td>{AlphaPoint.translation('TICKERS.ASK') || 'Ask'}</td>
              <td>{AlphaPoint.translation('TICKERS.HIGH') || 'High'}</td>
              <td>{AlphaPoint.translation('TICKERS.LOW') || 'Low'}</td>
              <td>{AlphaPoint.translation('TICKERS.LAST') || 'Last'}</td>
              <td>{AlphaPoint.translation('TICKERS.VOLUME') || 'Volume'}</td>
              <td>{AlphaPoint.translation('TICKERS.24_HOUR_CHANGE') || '% Change'}</td>
            </tr>
          </thead>
          <tbody>
            {tickers}
          </tbody>
        </table>
      </WidgetBase>
    );
  }
}

export default Tickers;
