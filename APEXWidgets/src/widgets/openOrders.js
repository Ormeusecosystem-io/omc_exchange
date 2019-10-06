/* global AlphaPoint */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import Rx from 'rx-lite';

import WidgetBase from './base';
import { getTimeFormatEpoch } from '../common';

class Row extends React.Component {
  componentDidMount() {
    Rx.Observable.combineLatest(
      AlphaPoint.cancel,
      AlphaPoint.openorders,
      (cancel, openorders) => openorders.filter(order => order.OrderId !== cancel.OrderId),
    ).subscribe(orders => this.setState({ data: orders }));
  }

  componentWillUnmount() {

  }

  cancel = () => {
    const data = {
      OMSId: AlphaPoint.oms.value,
      OrderId: this.props.OrderId,
    };

    AlphaPoint.cancelOrder(data);
  }

  render() {
    const id = this.props.Instrument;
    const pairName = this.props.instruments.find(instrument => instrument.InstrumentId === id);

    return (
      <tr key={this.props.OrderId}>
        <td>{this.props.OrderId}</td>
        <td>{pairName.Symbol}</td>
        <td>{this.props.OrderType}</td>
        <td>
          {this.props.Side === 'Buy' ? (AlphaPoint.translation('OPEN_ORDERS.BUY') || 'Buy') : (AlphaPoint.translation('OPEN_ORDERS.SELL') || 'Sell')}
        </td>
        <td>{this.props.Quantity}</td>
        <td>{this.props.OrigQuantity - this.props.QuantityExecuted}</td>
        <td>{this.props.Price.toFixed(AlphaPoint.config.decimalPlaces)}</td>
        <td>{getTimeFormatEpoch(this.props.ReceiveTime) }</td>
        <td>
          {false && <button className="btn btn-success" onClick={this.execute}>{AlphaPoint.translation('OPEN_ORDERS.EXECUTE') || 'Execute'}</button>}
          {' '}
          {false && <button className="btn btn-warning" onClick={this.top}>{AlphaPoint.translation('OPEN_ORDERS.TOP') || 'Top'}</button>}
          {' '}
          <button className="btn btn-action" onClick={this.cancel}>{AlphaPoint.translation('OPEN_ORDERS.CANCEL') || 'Cancel'}</button>
        </td>
      </tr>
    );
  }
}

Row.defaultProps = {
  Instrument: null,
  OrderId: null,
  OrderType: '',
  Side: '',
  Quantity: null,
  QuantityExecuted: null,
  OrigQuantity: null,
  Price: null,
  ReceiveTime: null,
  instruments: [],
};
Row.propTypes = {
  Instrument: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
  ]),
  OrderId: React.PropTypes.number,
  OrderType: React.PropTypes.string,
  Side: React.PropTypes.string,
  Quantity: React.PropTypes.number,
  QuantityExecuted: React.PropTypes.number,
  OrigQuantity: React.PropTypes.number,
  Price: React.PropTypes.number,
  ReceiveTime: React.PropTypes.number,
  instruments: React.PropTypes.arrayOf(React.PropTypes.object),
};

class OpenOrders extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      data: [],
      pairs: [],
      showLogin: false,
      trades: {},
    };
  }

  componentDidMount() {
    this.openOrders = AlphaPoint.openorders.subscribe(data => {
      this.setState({
        data: data.filter(order => order.OrderType !== 'BlockTrade'),
      });
    });

    this.pairs = AlphaPoint.instruments.subscribe(pairs => this.setState({ pairs }));

    this.trades = AlphaPoint.subscribe1.subscribe(data => this.setState({ trades: data || {} }));
  }

  componentWillUnmount() {
    this.openOrders.dispose();
    this.trades.dispose();
    this.pairs.dispose();
  }

  gotoPage = (page) => this.setState({ page });

  loginToggle = () => this.setState({ showLogin: !this.state.showLogin });

  render() {
    const pagination = AlphaPoint.config.pagination;
    const paginationClass = AlphaPoint.config.useBootstrapPagination ? 'pagination pull-right' : 'pagi pull-right';
    const trade = this.state.trades;
    const instruments = this.state.pairs;
    const maxLines = 5;
    const totalPages = Math.ceil(this.state.data.length / maxLines);

    this.state.data.sort((a, b) => {
      if (a.OrderId < b.OrderId) { return 1; }
      if (a.OrderId > b.OrderId) { return -1; }
      return 0;
    });

    const rows = this.state.data
      .slice(maxLines * this.state.page, maxLines * (this.state.page + 1))
      .map(order => <Row {...order} {...trade} instruments={instruments} key={order.OrderId} />);

    const emptyRows = [];
    for (let i = 0; i < maxLines - rows.length; i++) {
      emptyRows.push(<tr key={i}><td colSpan="10">&nbsp;</td></tr>);
    }

    const start = (this.state.page - 2) > 0 ? this.state.page - 2 : 0;
    const end = (this.state.page + 3) <= totalPages ? this.state.page + 3 : totalPages;

    const pages = [];

    if (pagination) {
      for (let x = start; x < end; x++) {
        const numButton = (
          <li key={x} className={this.state.page === x ? 'active' : null}>
            <a onClick={() => this.gotoPage(x)}>{x + 1}</a>
          </li>
        );
        pages.push(numButton);
      }
    }

    return (
      <WidgetBase login {...this.props} headerTitle={AlphaPoint.translation('OPEN_ORDERS.TITLE_TEXT') || 'Open Orders'}>
        <div>
          <table className="table table-hover">
            <thead>
              <tr>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.ID_TEXT') || '#'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.INSTRUMENT_TEXT') || 'Instrument'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.ORDER_TYPE_TEXT') || 'Order Type'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.TYPE_TEXT') || 'Type'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.TOTAL_TEXT') || 'Total'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.REMAINING_TEXT') || 'Remaining'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.PRICE_TEXT') || 'Price'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.TIME_TEXT') || 'Time'}</th>
                <th className="header" />
              </tr>
            </thead>
            <tbody>
              {rows}
              {emptyRows}
            </tbody>
          </table>
          <div className="clearfix pad-x">
            <ul className={paginationClass}>
              <li><a onClick={() => this.gotoPage(0)}>&laquo;</a></li>
              {pages}
              <li onClick={() => this.gotoPage(totalPages - 1)} ><a>&raquo;</a></li>
            </ul>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

OpenOrders.defaultProps = {
  hideCloseLink: true,
};

export default OpenOrders;
