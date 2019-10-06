/* global AlphaPoint, document, localStorage */
import React from 'react';
import Rx from 'rx-lite';

import WidgetBase from './base';

class Tickers extends React.Component {
  constructor() {
    super();
    this.state = {
      data: [],
      currentPair: [],
      instrument: '',
      pairs: [],
      sorted: false,
    };
  }

  componentDidMount() {
    this.instrumentCheck = AlphaPoint.instrumentChange.subscribe(instrument => this.setState({ instrument }));

    this.productPair = AlphaPoint.prodPair.subscribe(currentPair => this.setState({ currentPair }));

    this.productPairs = AlphaPoint.instruments.subscribe(pairs => this.setState({ pairs }));

    this.bookTickers = Rx.Observable.combineLatest(
      AlphaPoint.sessionLoaded,
      AlphaPoint.tickerBook,
      (session) => {
        if (session) return true;
        return false;
      },
    )
      .filter(session => session)
      .subscribe(() => {
        const obj = document.APAPI.Session.Instruments;
        const data = Object.keys(obj).map(inst => obj[inst].L1Data);

        this.setState({ data });
      });
  }

  componentWillUnmount() {
    this.bookTickers.dispose();
  }

  changePair = (pair) => {
    AlphaPoint.setProductPair(pair);
    localStorage.setItem('SessionPair', pair);

    if (AlphaPoint.config.siteName === 'yap.cx') {
      localStorage.setItem('SessionPair', pair);
      document.location = 'trade.html';
    }
  }

  reverseName = () => {
    const data = [].concat(this.state.data);
    const status = this.state.sorted;

    if (!status) {
      data.sort((a, b) => {
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
      });
      this.setState({ sorted: true });
    } else {
      data.sort((a, b) => {
        if (a.name < b.name) return 1;
        if (a.name > b.name) return -1;
        return 0;
      });
      this.setState({ sorted: false });
    }

    this.setState({ data });
  }

  reverseLast = () => {
    const data = [].concat(this.state.data);
    const status = this.state.sorted;

    if (!status) {
      data.sort((a, b) => {
        if (a.Rolling24HrPxChange > b.Rolling24HrPxChange) return 1;
        if (a.Rolling24HrPxChange < b.Rolling24HrPxChange) return -1;
        return 0;
      });
      this.setState({ sorted: true });
    } else {
      data.sort((a, b) => {
        if (a.Rolling24HrPxChange < b.Rolling24HrPxChange) return 1;
        if (a.Rolling24HrPxChange > b.Rolling24HrPxChange) return -1;
        return 0;
      });
      this.setState({ sorted: false });
    }

    this.setState({ data });
  }

  reverseVolume = () => {
    const data = [].concat(this.state.data);
    const status = this.state.sorted;

    if (!status) {
      data.sort((a, b) => {
        if (a.Volume > b.Volume) return 1;
        if (a.Volume < b.Volume) return -1;
        return 0;
      });
      this.setState({ sorted: true });
    } else {
      data.sort((a, b) => {
        if (a.Volume < b.Volume) return 1;
        if (a.Volume > b.Volume) return -1;
        return 0;
      });
      this.setState({ sorted: false });
    }

    this.setState({ data });
  }

  reverseChange = () => {
    const data = [].concat(this.state.data);
    const status = this.state.sorted;

    if (!status) {
      data.sort((a, b) => {
        if (a.Rolling24HrPxChange > b.Rolling24HrPxChange) return 1;
        if (a.Rolling24HrPxChange < b.Rolling24HrPxChange) return -1;
        return 0;
      });
      this.setState({ sorted: true });
    } else {
      data.sort((a, b) => {
        if (a.Rolling24HrPxChange < b.Rolling24HrPxChange) return 1;
        if (a.Rolling24HrPxChange > b.Rolling24HrPxChange) return -1;
        return 0;
      });
      this.setState({ sorted: false });
    }

    this.setState({ data });
  }

  render() {
    this.state.data.forEach(ticker => {
      const pairName = this.state.pairs.find(pair => pair.InstrumentId === ticker.InstrumentId) || {};

      ticker.name = pairName.Symbol; // eslint-disable-line no-param-reassign
    });

    const tickers = this.state.data.map(pair => (
      <tr key={pair.InstrumentId} className="ap-widget_ticker" data-help={pair.prodPair}>
        <td className="pair"><a onClick={() => this.changePair(pair.name)}>{pair.name}</a></td>
        {!this.props.narrow && <td className="bid">{pair.BestBid}</td>}
        {!this.props.narrow && <td className="ask">{pair.BestOffer}</td>}
        {!this.props.narrow && <td className="high">{pair.SessionHigh}</td>}
        {!this.props.narrow && <td className="low">{pair.SessionLow}</td>}
        <td className="last">{pair.LastTradedPx.toFixed(AlphaPoint.config.decimalPlaces)}</td>
        <td className="volume">{pair.Volume}</td>
        <td className="change">{pair.LastTradedPx > 0 ? ((pair.Rolling24HrPxChange / pair.LastTradedPx) * 100).toFixed(2) : '-'} %</td>
        {!this.props.narrow && <td className="trades">{pair.Rolling24NumTrades}</td>}
        {!this.props.narrow && <td className="volume">{pair.Rolling24HrVolume}</td>}
      </tr>
    ));

    return (
      <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('TICKERS.TITLE_TEXT') || 'Tickers'}>
        <table className="table table-responsive">
          <thead>
            <tr>
              <td><a onClick={this.reverseName}>{AlphaPoint.translation('TICKERS.PAIR') || 'Pair'}</a></td>
              {!this.props.narrow && <td>{AlphaPoint.translation('TICKERS.BID') || 'Bid'}</td>}
              {!this.props.narrow && <td>{AlphaPoint.translation('TICKERS.ASK') || 'Ask'}</td>}
              {!this.props.narrow && <td>{AlphaPoint.translation('TICKERS.HIGH') || 'High'}</td>}
              {!this.props.narrow && <td>{AlphaPoint.translation('TICKERS.LOW') || 'Low'}</td>}
              <td><a onClick={this.reverseLast}>{AlphaPoint.translation('TICKERS.LAST') || 'Last'}</a></td>
              <td><a onClick={this.reverseVolume}>{AlphaPoint.translation('TICKERS.VOLUME') || 'Volume'}</a></td>
              <td><a onClick={this.reverseChange}>{AlphaPoint.translation('TICKERS.24_HOUR_CHANGE') || 'Change'}</a></td>
              {!this.props.narrow && <td>{AlphaPoint.translation('TICKERS.TRADES') || 'Trades'}</td>}
              {!this.props.narrow && <td>{AlphaPoint.translation('TICKERS.VOLUME') || 'Volume'}</td>}
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

Tickers.defaultProps = {
  narrow: true,
};
Tickers.propTypes = {
  narrow: React.PropTypes.bool,
};

module.exports = Tickers;
