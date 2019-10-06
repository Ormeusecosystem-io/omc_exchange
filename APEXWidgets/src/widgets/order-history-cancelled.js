/* global AlphaPoint */
import React from 'react';

import WidgetBase from './base';
import { getTimeFormatEpoch } from '../common';
import { formatNumberToLocale } from './helper';

class OrderHistoryCancelled extends React.Component {
  constructor() {
    super();

    this.state = {
      page: 0,
      data: [],
      pairs: [],
      accounts: [],
      decimalPlaces: {},
    };
  }

  componentDidMount() {
    this.orderHistory = AlphaPoint.orderHistory.subscribe(data => this.setState({
      data: data.filter(order => order.OrderState !== 'FullyExecuted'),
    }));

    this.userAccounts = AlphaPoint.userAccountsInfo.subscribe(accounts => this.setState({ accounts }));

    this.pairs = AlphaPoint.instruments.subscribe(pairs => this.setState({ pairs }));

    this.products = AlphaPoint.products.filter(data => data.length).subscribe(products => {
      const decimalPlaces = {};
      products.forEach(product => {
        decimalPlaces[product.Product] = product.DecimalPlaces;
      });
      this.setState({ decimalPlaces });
    });
  }

  componentWillUnmount() {
    this.orderHistory.dispose();
    this.pairs.dispose();
  }

  gotoPage = (page) => this.setState({ page });

  render() {
    const pagination = AlphaPoint.config.pagination;
    const maxLines = AlphaPoint.config.maxLinesWidgets || 15;
    const history = this.state.data
      .filter(row => row.OrderState !== 'Working')
      .sort((a, b) => b.ReceiveTime - a.ReceiveTime);

    const rowSlice = pagination ?
      history.slice(maxLines * this.state.page, maxLines * (this.state.page + 1))
      :
      history;

    const rows = rowSlice
      .map(row => {
        const time = pagination ?
          <td className="borderless">{getTimeFormatEpoch(row.ReceiveTime)}</td>
          :
          <td className="borderless">{getTimeFormatEpoch(row.ReceiveTime)}</td>; // add .substring(11,19) to display time only
        const pairName = this.state.pairs.find(pair => pair.InstrumentId === row.Instrument);
        const accountInfo = this.state.accounts.find(account => account.AccountId === row.Account);

        return (
          <tr key={`${row.OrderId}-${row.Price}-${row.Quantity}`}>
            <td className="borderless">{accountInfo.AccountName || row.Account || null}</td>
            <td className="borderless">{pairName.Symbol}</td>
            {row.Side === 'Buy' ?
              <td className="borderless buyFont">{AlphaPoint.translation('OPEN_ORDERS.BUY') || 'Buy'}</td>
              :
              <td className="borderless sellFont">{AlphaPoint.translation('OPEN_ORDERS.SELL') || 'Sell'}</td>}
            <td className="borderless">{row.IsQuote ? 'Quote' : row.OrderType}</td>
            <td className="borderless">≈{formatNumberToLocale(row.OrigQuantity, this.state.decimalPlaces[pairName.Product1Symbol])}</td>
            <td className="borderless">{row.OrderType === 'Market' ? '-' : formatNumberToLocale(row.Price, this.state.decimalPlaces[pairName.Product2Symbol])}</td>
            {time}
            <td className="borderless">{row.OrderState}</td>
          </tr>
        );
      });

    const totalPages = pagination ? Math.ceil(history.length / maxLines) : 0;

    const emptyRows = [];
    for (let i = 0; i < maxLines - rows.length; i++) {
      emptyRows.push(<tr key={i}><td className="borderless" colSpan="8">&nbsp;</td></tr>);
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

    const paginationClass = AlphaPoint.config.useBootstrapPagination ? 'pagination pull-right' : 'pagi pull-right';
    const tableClassList = AlphaPoint.config.siteName === 'aztec' ?
      'table table--comfy table--hover table--striped table--light'
      :
      'table table-hover';

    return (
      <WidgetBase login {...this.props} headerTitle="Order History">
        <div>
          <table className={tableClassList}>
            <thead>
              <tr>
                <th className="header nudge" style={{ width: '6rem' }}>{AlphaPoint.translation('OPEN_ORDERS.ACCOUNT') || 'Account'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.PAIR_TEXT') || 'Instrument'}</th>
                <th className="header">{AlphaPoint.translation('TRADES.SIDE_TEXT') || 'Side'}</th>
                <th className="header">{AlphaPoint.translation('TRADES.TYPE_TEXT') || 'Type'}</th>
                <th className="header">{AlphaPoint.translation('TRADES.QUANTITY_TEXT') || 'Quantity'}</th>
                <th className="header">{AlphaPoint.translation('TRADES.PRICE_TEXT') || 'Price'}</th>
                <th className="header">{AlphaPoint.translation('TRADES.TIME_TEXT') || 'Time'}</th>
                <th className="header">{AlphaPoint.translation('TRADES.STATUS_TEXT') || 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {rows}
              {emptyRows}
            </tbody>
          </table>

          {pagination && pages.length > 1 &&
            <div className="clearfix pad-x">
              <ul className="pagi pull-right">
                <li><a onClick={() => this.gotoPage(0)}>&laquo;</a></li>
                {pages}
                <li onClick={() => this.gotoPage(totalPages - 1)}><a>&raquo;</a></li>
              </ul>
            </div>}

        </div>
      </WidgetBase>
    );
  }
}

export default OrderHistoryCancelled;
