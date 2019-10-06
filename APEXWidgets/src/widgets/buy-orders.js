/* global AlphaPoint */
import React from 'react';
import Rx from 'rx-lite';

import Orders from './orders';

class BuyOrders extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      bids: {},
      instrument: 1,
    };
  }

  componentDidMount() {
    this.instrumentCheck = AlphaPoint.instrumentChange.subscribe(instrument => this.setState({ instrument }));

    this.buyOrdersBook = Rx.Observable.combineLatest(
      AlphaPoint.prodPair,
      AlphaPoint.orderBook,
      AlphaPoint.instruments,
      (pair, orderBook, instruments) => {
        const instrument = instruments.find(ins => ins.Symbol === pair) || {};
        return (orderBook[instrument.InstrumentId] || {}).buys || [];
      })
      .subscribe(buysBook => {
        const data = buysBook.sort((a, b) => b.Price - a.Price);

        this.setState({ data });
      });

    this.level2Update = AlphaPoint.lvl2Update.subscribe(data => {
      if (data) {
        if (data.Side === 0) { // buy
          if (data.ActionType === 0 || data.ActionType === 1) { // new or update
            this.state.bids[data.Price] = data;
          } else if (data.ActionType === 2) { // delete
            delete this.state.bids[data.Price];
          }
        }
        const buys = Object.keys(this.state.bids).map(key => this.state.bids[key]);

        this.setState({ data: buys });
      }
    });
  }


  componentWillUnmount() {
    this.instrumentCheck.dispose();
    this.buyOrdersBook.dispose();
    this.level2Update.dispose();
  }

  render() {
    return (
      <Orders
        {...this.props}
        rowState="success"
        data={this.state.data}
        headerTitle={AlphaPoint.translation('ORDERBOOK.BUY_ORDER_TEXT') || 'Buy Orders'}
      />
    );
  }
}

BuyOrders.defaultProps = {
  hideCloseLink: true,
};

export default BuyOrders;
