import TickerScrolling from '../ticker-scrolling';

class ShiftTickerScrolling extends TickerScrolling {

  prepareInstruments(instrument) {
    const currencies = AlphaPoint.config.tickerScrolling.showInstruments;
    return currencies.indexOf(instrument.Symbol) !== -1;
  }

  componentDidMount() {
    super.componentDidMount();
    this.instruments = AlphaPoint.instruments
      .filter(prods => prods.length)
      .subscribe((instruments) => {
        const preparedInstruments = instruments.filter(this.prepareInstruments);
        
        super.setState({ instruments: preparedInstruments });
      });
  }
}

export default ShiftTickerScrolling;