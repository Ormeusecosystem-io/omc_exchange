/* global AlphaPoint */
import React from 'react';
import { formatNumberToLocale } from './helper';

class MarketValue extends React.Component {
  constructor() {
    super();
    this.state = {
      data: [],
      pair: '',
      pairs: [],
      showLoginForm: false,
      update: '',
      products: [],
      instrumentId: 1,
    };
  }

  componentDidMount() {
    // this.bookTickers = AlphaPoint.tickerBook.subscribe((data) => {
    //   this.setState({ data });
    // });

    this.level1Data = AlphaPoint.Level1.subscribe(data => this.setState({ data }));

    this.selectedInstrument = AlphaPoint.instrumentChange
      .subscribe(instrumentId => this.setState({ instrumentId: +instrumentId }));

    this.productPairs = AlphaPoint.instruments.subscribe((data) => {
      this.setState({ pairs: data });
    });

    this.productPair = AlphaPoint.prodPair.subscribe((currentPair) => {
      this.setState({ pair: currentPair });
    });

    this.products = AlphaPoint.products.subscribe((data) => {
      this.setState({ products: data });
    });
  }

  componentWillUnmount() {
    this.marketValue.dispose();
    this.productPairs.dispose();
    this.productPair.dispose();
    this.products.dispose();
  }

  show = () => {
    this.setState({ showLoginForm: true });
  }

  hide = () => {
    if (this.isMounted()) {
      this.setState({ showLoginForm: false });
    }
  }

  render() {
    // Getting symbols for display
    const pairData = this.state.pairs.find(pair => pair.InstrumentId === this.state.instrumentId) || {};
    const product1 = pairData.Product1Symbol || '';
    const product2 = pairData.Product2Symbol || '';
    const price = formatNumberToLocale(
      this.state.data[this.state.instrumentId] && this.state.data[this.state.instrumentId].LastTradedPx,
      AlphaPoint.config.decimalPlaces,
    ) || '';
    // Getting full names for display
    const product1MoreData = this.state.products.find(prod => product1 === prod.Product) || {};
    const product2MoreData = this.state.products.find(prod => product2 === prod.Product) || {};
    const product1FullName = product1MoreData.ProductFullName || '';
    const product2FullName = product2MoreData.ProductFullName || '';

    // console.log(this.state.data); creates empty array
    // console.log(this.state.instrumentId); outputs 1
    // console.log(this.state.data[1]);

    return (
      <span>
        {AlphaPoint.config.fullNamesInMarketValueWidget
          ? `${price} ${AlphaPoint.config.standardTemplateTradeUI ? '' : ` - ${product1FullName}/${product2FullName}`}`
          : `${price} ${AlphaPoint.config.standardTemplateTradeUI ? '' : ` - ${product1}/${product2}`}`}
      </span>
    );
  }
}

export default MarketValue;
