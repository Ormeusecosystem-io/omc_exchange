/* global AlphaPoint */
import React from 'react';

import WidgetBase from './base';

class ProductPairs extends React.Component {
  constructor() {
    super();

    this.state = {
      data: [],
      tickers: [],
      currentPair: '',
    };
  }

  componentDidMount() {
    this.productPairs = AlphaPoint.productPairs.subscribe((data) => {
      this.setState({
        data: data.productPairs,
        currentPair: data.currentPair,
      });
    });

    this.ticker = AlphaPoint.ticker.subscribe((data) => {
      const currentData = [].concat(this.state.data);

      data.forEach((pair) => {
        let value = 0;

        if (!pair.bid || !pair.ask) {
          value = pair.ask || pair.bid;
        } else {
          value = (pair.bid + pair.ask) / 2;
        }

        currentData.forEach((x) => {
          if (x.name === pair.prodPair) x.average = value.toFixed(4);
        });
      });
      this.setState({ data: currentData });
    });
  }

  componentWillUnmount() {
    this.productPairs.dispose();
    this.ticker.dispose();
  }

  changePair = (pair) => AlphaPoint.setProductPair(pair);

  render() {
    const pairs = this.state.data.map((pair) => {
      const btnStyle = pair.name === this.state.currentPair ? 'btn-action' : 'btn-default';
      return (
        <div className={`btn ${btnStyle}`} style={{ marginRight: 5 }} key={pair.name} onClick={() => this.changePair(pair.name)}>
          <div className="pair">{pair.product1Label}/{pair.product2Label}</div>
          <div className="value">{pair.average}</div>
        </div>
      );
    });

    return (
      <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('PRODUCT_PAIRS.TITLE_TEXT') || 'Product Pairs'}>
        <div className="pad">
          {pairs}
        </div>
      </WidgetBase>
    );
  }
}

export default ProductPairs;
