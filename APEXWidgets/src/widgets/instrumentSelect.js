/* global AlphaPoint, localStorage, document */
import React from 'react';
import uuidV4 from 'uuid/v4';
import {
  formatNumberToLocale
} from './helper';

class InstrumentSelect extends React.Component {
  constructor() {
    super();

    this.state = {
      instruments: [],
      instrumentTicks: {},
      selectedInstrument: null,
    };
  }

  componentDidUpdate(prevProps, prevState){
    if(this.state.instruments.length > 0 && this.state.instruments.length !== prevState.instruments.length){
      this.setState({...this.state, selectedInstrument: this.state.instruments.find(ins => ins.Symbol == 'ETHBTC').InstrumentId || 1})
    }
  }

  componentDidMount() {
    this.instruments = AlphaPoint.instruments
      .filter(instruments => instruments.length)
      .take(1)
      .subscribe((instruments) => {
        this.setState({ instruments }, () => this.selectInstrument(instruments.find(ins => ins.Symbol == 'ETHBTC').InstrumentId || 1));
      });

    if (AlphaPoint.config.instrumentSelectTicker) {
      this.tickers = AlphaPoint.instruments.subscribe(productPairs => {
        productPairs.forEach(pair => AlphaPoint.subscribeLvl1(pair.InstrumentId));
      });

      this.level1 = AlphaPoint.Level1.subscribe(instrumentTicks => {
        this.setState({ instrumentTicks });
      });

      this.products = AlphaPoint.products.filter(data => data.length).subscribe(prods => {
        const decimalPlaces = {};
        prods.forEach(product => {
          decimalPlaces[product.Product] = product.DecimalPlaces;
        });
        this.setState({ decimalPlaces });
      });
    }
    // this.instrumentCheck = AlphaPoint.instrumentChange.subscribe(i => this.setState({ selectedInstrument: i }));
  }

  componentWillUnmount() {
    this.instruments.dispose();
    if (AlphaPoint.config.instrumentSelectTicker) {
      this.level1.dispose();
      this.tickers.dispose();
      this.products.dispose();
    }
    this.instrumentCheck.dispose();
  }

  selectInstrument = (instrumentId) => {
    const selectedInstrument = +instrumentId;
    const instrument = this.state.instruments.find((inst) => inst.InstrumentId === selectedInstrument);

    localStorage.setItem('SessionInstrumentId', selectedInstrument);
    document.APAPI.Session.SelectedInstrumentId = selectedInstrument;
    localStorage.setItem('SessionPair', instrument.Symbol);
    AlphaPoint.setProductPair(instrument.Symbol);
    AlphaPoint.instrumentChange.onNext(selectedInstrument);
    if (this.state.selectedInstrument) {
      this.unsubscribeInstrument(this.state.selectedInstrument);
    }
    this.subscribeInstrument(selectedInstrument);
    this.setState({ selectedInstrument });
  };

  subscribeInstrument = (InstrumentId) => {
    AlphaPoint.subscribeTrades(InstrumentId, 100);
    AlphaPoint.subscribeLvl2(InstrumentId);
  };

  unsubscribeInstrument = (InstrumentId) => {
    AlphaPoint.unsubscribeTradesCall(InstrumentId);
    AlphaPoint.unsubscribeLvl2(InstrumentId);
  };

  render() {
    const instrumentTicks = this.state.instrumentTicks;
    const instrument = this.state.instruments.find(ins => ins.InstrumentId == this.state.selectedInstrument);
    const decimalPlaces = this.state.decimalPlaces;
    const instrumentsList = this.state.instruments
      .filter((inst) => (inst.InstrumentId !== (instrument && instrument.InstrumentId)) && inst.Symbol === 'ETHBTC')
      .map((inst) => (
        <li key={uuidV4()} className={`instrument-${inst.Symbol}`}
          onClick={(e) => {
              e.preventDefault();
              this.selectInstrument(inst.InstrumentId);
            }}
        >
          <a
            className={AlphaPoint.config.instrumentSelectTicker && "instrument-symbol"}
          >{AlphaPoint.config.reversePairs ? (inst.Product2Symbol + inst.Product1Symbol) : inst.Symbol}</a>
          { AlphaPoint.config.instrumentSelectTicker &&
            <div className="instrument-row--detail">
              <div className="instrument-row__detail-price" data-value={ instrumentTicks[inst.InstrumentId] && formatNumberToLocale(instrumentTicks[inst.InstrumentId].LastTradedPx, decimalPlaces[inst.Product2Symbol]) }>
              </div>
              <div className="instrument-row__detail-change" data-value={ instrumentTicks[inst.InstrumentId] && formatNumberToLocale(instrumentTicks[inst.InstrumentId].Rolling24HrPxChange, decimalPlaces[inst.Product2Symbol] || AlphaPoint.config.decimalPlaces) }>
              </div>
              <div className="instrument-row__detail-volume" data-value={ instrumentTicks[inst.InstrumentId] && formatNumberToLocale(instrumentTicks[inst.InstrumentId].Rolling24HrVolume, decimalPlaces[inst.Product2Symbol] || AlphaPoint.config.decimalPlaces) }>
              </div>
            </div>
          }
        </li>
      ));
    const dropdownStyle = AlphaPoint.config.instrumentSelectTicker ? { minWidth: "400px", right: 'unset' } : { right: 'unset' };
    return (
      <div className="dropdown instrument-dropdown">
        <button id="instrument-select" className="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <img src="img/ethereum.svg"/>
          {instrument && instrument.Symbol}
          {instrumentsList.length ? <span className="caret" style={{ marginLeft: '8px' }} /> : null}
        </button>
        {instrumentsList.length ?
          <ul className="dropdown-menu" style={dropdownStyle} aria-labelledby="dropdownMenu2">
            { AlphaPoint.config.instrumentSelectTicker &&
              <li key={uuidV4()} className="instrument-header">
                <div>{AlphaPoint.translation('INSTRUMENT_SELECT.INSTRUMENT') || 'Pair'}</div>
                <div>{AlphaPoint.translation('INSTRUMENT_SELECT.LAST_PRICE') || 'Price'}</div>
                <div>{AlphaPoint.translation('INSTRUMENT_SELECT.T24_HOUR_CHANGE') || '24hr Chg'}</div>
                <div>{AlphaPoint.translation('INSTRUMENT_SELECT.VOLUME') || 'Volume'}</div>
              </li>
            }
            {instrumentsList}
          </ul> : null}
      </div>
    );
  }
}

export default InstrumentSelect;
