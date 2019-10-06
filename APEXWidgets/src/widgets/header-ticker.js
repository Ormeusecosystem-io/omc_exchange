/* global AlphaPoint, document, doSelectIns */
import React from 'react';
import Rx from 'rx-lite';

import WidgetBase from './base';

class HeaderTicker extends React.Component {
  constructor() {
    super();

    this.state = {
      data: [],
      // instrument: '',
      pairs: [],
      level1: [],
      sorted: false,
      currentPair: '',
      currentPairData: {}
    };
  }

  componentDidMount() {
    // this.instrumentCheck = AlphaPoint.instrumentChange.subscribe(instrument => this.setState({ instrument }));
    this.productPair = AlphaPoint.prodPair.subscribe(currentPair => this.setState({ currentPair }));

    this.productPairs = AlphaPoint.instruments.subscribe(pairs => this.setState({ pairs })); // these are all the possible pairs

    // this.level1 = AlphaPoint.Level1.subscribe(level1 => this.setState({ level1 }));
    this.updateDataOnInstrumentChange = AlphaPoint.tickerBook.subscribe(data => this.setState({ data }));

  }

  componentWillUnmount() {
    this.instrumentCheck.dispose();
    this.productPair.dispose();
    this.productPairs.dispose();
    this.updateDataOnInstrumentChange.dispose();
  }

  changePair = (e) => doSelectIns(e.target.value);

  render() {
    // console.log(this.state.level1);
    const options = this.state.pairs.map(pair => (
      <option value={pair.InstrumentId} key={pair.InstrumentId}>{pair.Symbol}</option>
    ));

    const currentPairSymbol = <div className="btcusd-price"><span>{this.state.currentPair || '-'}</span></div>
    const instrumentSelect = <select style={{ border: 'none' }} onChange={this.changePair}>{options}</select>

    let toggle = ''

    AlphaPoint.config.noInstSelectInTicker ? toggle = currentPairSymbol : toggle = instrumentSelect;

    let style = {};
    const pair = this.state.data;
    if (pair && pair.Rolling24HrPxChange < 0) {
      style = { color: AlphaPoint.config.downChangeColor };
    } else {
      style = { color: AlphaPoint.config.upChangeColor };
    }

    const tickers = (
      <div className="row ticker-container">
        {toggle}
        <div className="last-price">{AlphaPoint.translation('HEADER_TICKER.LAST_PRICE') || 'Last Price'} <span >{(pair && pair.LastTradedPx && (pair.LastTradedPx).toFixed(AlphaPoint.config.decimalPlaces)) || '-'}</span></div>
        <div className="day-stat" >{AlphaPoint.translation('HEADER_TICKER.T24_HOUR_CHANGE') || '24 Hour Change'} <span style={style}>{(pair && pair.Rolling24HrPxChange && (pair.Rolling24HrPxChange).toFixed(AlphaPoint.config.decimalPlaces)) || '-'}%</span></div>
        {AlphaPoint.config.useBidAsk && <div className="last-price">{AlphaPoint.translation('HEADER_TICKER.BID') || 'Bid'} <span >{ (pair && pair.BestBid) || '-'}</span></div>}
        {AlphaPoint.config.useBidAsk && <div className="last-price">{AlphaPoint.translation('HEADER_TICKER.ASK') || 'Ask'} <span><span >{(pair && pair.BestOffer) || '-'}</span></span></div>}
        <div className="day-stat">{AlphaPoint.translation('HEADER_TICKER.T24_HOUR_VOLUME') || '24 Hour Volume'} <span >{(pair && pair.CurrentDayVolume && (pair.CurrentDayVolume).toFixed(AlphaPoint.config.decimalPlaces)) || '-'}</span></div>
        <div className="day-stat">{AlphaPoint.translation('HEADER_TICKER.T24_HOUR_LOW') || '24 Hour Low'} <span>{ (pair && pair.SessionLow) || '-'}</span></div>
        <div className="day-stat">{AlphaPoint.translation('HEADER_TICKER.T24_HOUR_HIGH') || '24 Hour High'} <span>{(pair && pair.SessionHigh) || '-'}</span></div>
      </div>
    );

    return (
      <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('TICKERS.TITLE_TEXT') || 'Tickers'}>
        {tickers}
      </WidgetBase>
    );
  }
}

export default HeaderTicker;
