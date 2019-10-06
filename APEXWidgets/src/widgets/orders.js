/* eslint-disable react/no-multi-comp */
/* global AlphaPoint */
import React from 'react';
import { formatNumberToLocale } from './helper';

import WidgetBase from './base';

class OrderRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      rowState: props.rowState,
      prod1Decimals: 2,
      prod2Decimals: 2,
    };
    this.changed = this.changed.bind(this);
  }

  componentDidMount() {
    this.changed();
    let product1;
    let product2;

    AlphaPoint.instruments.value
      .filter(instrument => instrument.Symbol === this.props.currentPair)
      .map(currentInstrument => {
        product1 = currentInstrument.Product1Symbol;
        product2 = currentInstrument.Product2Symbol;
        return true;
      });

    AlphaPoint.products.value
      .filter(product => {
        if (product.Product === product1 || product.Product === product2) return true;
        return false;
      })
      .reduce((prod1, prod2) => this.setState({
        prod1Decimals: prod1.DecimalPlaces,
        prod2Decimals: prod2.DecimalPlaces,
      }));
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.Quantity !== this.props.Quantity) {
      this.setState({ rowState: this.props.rowState });
      this.changed();
    }
  }

  changed = () => {
    const self = this;

    this.timer = setTimeout(() => {
      if (self.isMounted()) {
        self.setState({ rowState: '' });
      }
    }, 1000);
    clearTimeout(this.timer);
  };

  render() {
    return (
      <tr className={this.state.rowState} key={this.props.Price}>
        <td>{formatNumberToLocale(this.props.Quantity, this.state.prod1Decimals)}</td>
        <td>{formatNumberToLocale(this.props.Price, this.state.prod2Decimals)}</td>
        <td>{formatNumberToLocale(this.props.Price * this.props.Quantity, AlphaPoint.config.decimalPlaces)}</td>
      </tr>
    );
  }
}

OrderRow.defaultProps = {
  rowState: '',
  currentPair: '',
  Quantity: null,
  Price: null,
};
OrderRow.propTypes = {
  rowState: React.PropTypes.string,
  currentPair: React.PropTypes.string,
  Quantity: React.PropTypes.number,
  Price: React.PropTypes.number,
};

class Orders extends React.Component {
  constructor(props) {
    super(props);

    this.state = { currentPair: '' };
  }

  componentDidMount() {
    this.productPair = AlphaPoint.prodPair.subscribe(data => this.setState({ currentPair: data }));
  }

  componentWillUnmount() {
    this.productPair.dispose();
  }

  render() {
    const maxLines = 10;
    let rows = [];

    if (this.props.data.length) {
      rows = this.props.data.slice(0, maxLines).map(row => (
        <OrderRow
          currentPair={this.state.currentPair}
          {...row}
          Price={row.Price}
          Quantity={row.Quantity}
          key={row.Price}
          rowState={this.props.rowState}
          type={this.props.type}
        />
      ));
    }

    const emptyRows = [];
    for (let i = 0; i < maxLines - rows.length; i++) {
      emptyRows.push(<tr key={i}><td colSpan="3">&nbsp;</td></tr>);
    }

    return (
      <WidgetBase {...this.props}>
        <table className="table table-hover">
          <thead>
            <tr>
              <th className="header">{AlphaPoint.translation('ORDERBOOK.QUANTITY_TEXT') || 'Quantity'}</th>
              <th className="header">{AlphaPoint.translation('ORDERBOOK.PRICE_TEXT') || 'Price'}</th>
              <th className="header">{AlphaPoint.translation('ORDERBOOK.TOTAL_TEXT') || 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            {rows}
            {emptyRows}
          </tbody>
        </table>
      </WidgetBase>
    );
  }
}

Orders.defaultProps = {
  data: [],
  rowState: '',
  type: '',
};
Orders.propTypes = {
  data: React.PropTypes.arrayOf(React.PropTypes.object),
  rowState: React.PropTypes.string,
  type: React.PropTypes.string,
};

export default Orders;
