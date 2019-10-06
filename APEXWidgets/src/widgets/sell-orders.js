/* global AlphaPoint */
import React from 'react';
import Rx from 'rx-lite';

import Orders from './orders';


class SellOrders extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      asks: {},
      productPairs: [],
      currentPair: '',
      instrumentId: 1,
    };
  }

  componentDidMount() {
    this.instrumentCheck = AlphaPoint.instrumentChange.subscribe(instrument => this.setState({ instrument }));

    this.sellOrdersBook = Rx.Observable.combineLatest(
      AlphaPoint.prodPair,
      AlphaPoint.orderBook,
      AlphaPoint.instruments,
      (pair, orderBook, instruments) => {
        const instrument = instruments.find(ins => ins.Symbol === pair) || {};
        return (orderBook[instrument.InstrumentId] || {}).sells || [];
      })
      .subscribe(sellsBook => {
        const data = sellsBook.sort((a, b) => b.Price - a.Price);

        this.setState({ data });
      });

    this.level2Update = AlphaPoint.lvl2Update.subscribe((data) => {
      if (data) {
        if (data.Side === 1) { // sell
          if (data.ActionType === 0 || data.ActionType === 1) { // new or update
            this.state.asks[data.Price] = data;
          } else if (data.ActionType === 2) { // delete
            delete this.state.asks[data.Price];
          }
        }
        const sells = Object.keys(this.state.asks).map(key => this.state.asks[key]);
        this.setState({ data: sells });
      }
    });
  }

  componentWillUnmount() {
    this.instrumentCheck.dispose();
    this.sellOrdersBook.dispose();
    this.level2Update.dispose();
  }

  render() {
    return (
      <Orders
        {...this.props}
        rowState="danger"
        data={this.state.data}
        headerTitle={AlphaPoint.translation('ORDERBOOK.SELL_ORDER_TEXT') || 'Sell Orders'}
      />
    );
  }
}

SellOrders.defaultProps = {
  hideCloseLink: true,
};

export default SellOrders;
