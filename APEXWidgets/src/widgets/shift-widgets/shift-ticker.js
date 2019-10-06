/* global AlphaPoint */
import React from 'react';

let undefined;

class ShiftTicker extends React.Component {
  constructor(props) {
    super(props);
    this.instrumentMap = new Map();
    this.tickMap = new Map();
    this.state = { 
      filterIndices: [], 
      filter: '',
      currentPair: AlphaPoint.prodPair.value
    };
    this.onFilterChange = this.onFilterChange.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.changeInstrument = this.changeInstrument.bind(this);
  }

  componentDidMount() {
    this.instrumentsSub = AlphaPoint.instruments.subscribe(instruments => {
      this.instrumentMap.clear();
      this.tickMap.clear();
      const indices = [];
      instruments.forEach(ins => {
        this.instrumentMap.set(ins.InstrumentId, ins);
        indices.push(ins.InstrumentId);
        AlphaPoint.subscribeLvl1(ins.InstrumentId);
      });
      this.setState({filterIndices: indices});
    });

    this.tickerSub = AlphaPoint.tickerBook.subscribe(ticker => {
      this.tickMap.set(ticker.InstrumentId, ticker);
      if (this.state.filterIndices.indexOf(ticker.InstrumentId)) {
        this.forceUpdate(); // If instrument is currently shown, force a re-render
      }
    });

    this.pairUpdate = AlphaPoint.prodPair.subscribe(currentPair => {
      this.setState({ currentPair })
    });
    this.changeInstrument(1)
  }

  componentWillUnmount() {
    //TODO: call AlphaPoint.unsubscribeLvl1 for all except currently selected?
    this.instrumentsSub.dispose();
    this.tickerSub.dispose();
    this.pairUpdate.dispose();
  }

  onFilterChange(e) {
    let filter = e.target.value;
    let filterIndices = [];
    if (filter) {
      filter = filter.toUpperCase();
      this.instrumentMap.forEach((value, key) => {
        if (value.Symbol && value.Symbol.indexOf(filter) !== -1) {
          filterIndices.push(key);
        }
      });
    } else {
      // Deactivate filter and show all instruments:
      filterIndices = [ ...this.instrumentMap.keys()];
      filter = '';
    }
    this.setState({ filterIndices, filter });
  }

  onKeyUp(e) {
    if (e.keyCode !== 13) {
      return;
    }
    let filter = e.target.value;
    if (!filter) {
      return;
    }
    filter = filter.toUpperCase();
    const filterIndicies = [];
    this.instrumentMap.forEach((value, key) => {
      if (value.Symbol && value.Symbol.indexOf(filter) !== -1) {
        filterIndicies.push(key);
      }
    });
    if (filterIndicies.length === 1) {
      // Only trigger change if current filter matches exactly one instrument:
      this.changeInstrument(filterIndicies[0]);
    }
  }

  changeInstrument(instrumentId) {
    const instrument = this.instrumentMap.get(instrumentId);
    if (!instrument || !instrument.Symbol) {
      // console.log('Unable to find instrument');
      return;
    }
    const prev = AlphaPoint.instrumentChange.value;
    localStorage.setItem('SessionInstrumentId', instrumentId);
    document.APAPI.Session.SelectedInstrumentId = instrumentId;
    localStorage.setItem('SessionPair', instrument.Symbol);
    AlphaPoint.setProductPair(instrument.Symbol);
    AlphaPoint.instrumentChange.onNext(instrumentId);

    if (prev) {
      AlphaPoint.unsubscribeTradesCall(prev);
      AlphaPoint.unsubscribeLvl2(prev);
    }

    AlphaPoint.subscribeTrades(instrumentId, 100);
    AlphaPoint.subscribeLvl2(instrumentId);
  }

  render() {
    const tickers = [];
    if(!this.state.filterIndices.length) {
      AlphaPoint.getInstruments();
    }
    
    this.state.filterIndices.forEach(idx => {
      const ins = this.instrumentMap.get(idx);
      if (ins === undefined) {
        return;
      }
      const symbol = ins.Symbol;
      if (symbol === undefined || symbol === '' || symbol !== 'ETHBTC') {
        return;
      }
      const tick = this.tickMap.get(idx);
      let ticker;
      if (tick === undefined) {
        ticker = <div key={idx} className={`ticker-row ${symbol === this.state.currentPair ? 'selected' : ''}`} onClick={() => this.changeInstrument(ins.InstrumentId)}>{symbol}</div>;
      } else {
        let pxChange = tick.Rolling24HrPxChange;
        const priceDecimals = symbol.slice(-3) === 'USD' ? 2 : 8;
        const pxClass = pxChange === 0 ? '' : pxChange > 0 ? 'up' : 'down';
        if (pxChange < 0) { pxChange = Math.abs(pxChange) };
        ticker = (
          <div key={idx} className={`ticker-row ${symbol === this.state.currentPair ? 'selected' : ''}`} onClick={() => this.changeInstrument(tick.InstrumentId)}>
            <span className='ticker-symbol'>{`${symbol}`}</span>
            <span className='ticker-price'>{`${tick.BestBid.toFixed(priceDecimals)}`}</span>
            <span className={`ticker-percent ${pxClass}`}>{`${pxChange.toFixed(2)}%`}</span>
          </div>
        );
      }
      tickers.push(ticker);
    });

    return (
      <div className='selectable-ticker'>
        <div className='ticker-input'>
          <p><i className='material-icons'>search</i> {AlphaPoint.translation('TICKER.SEARCH') || 'Search'}</p>
          <input onChange={this.onFilterChange} onKeyUp={this.onKeyUp} placeholder={AlphaPoint.translation('TICKER.SEARCH_PAIRS') || 'Search Pairs'} value={this.state.filter} />
        </div>
        <div className='ticker-instruments'>
          {tickers}
        </div>
      </div>
    );
  }
}

export default ShiftTicker;
