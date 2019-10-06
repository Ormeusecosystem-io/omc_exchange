/* global AlphaPoint */
import React from 'react';

import WidgetBase from './base';
import { getTimeFormatEpoch } from '../common';

class Trades extends React.Component {
  constructor() {
    super();

    this.state = {
      page: 0,
      data: [],
    };
  }

  componentDidMount() {
    AlphaPoint.getAccountTrades();
    this.tradeHistory = AlphaPoint.accountTrades.subscribe(data => this.setState({ data }));
  }

  componentWillUnmount() {
    this.tradeHistory.dispose();
  }

  gotoPage = (page) => this.setState({ page });

  render() {
    const maxLines = 10;
    const totalPages = Math.ceil(this.state.data.length / maxLines);
    const rows = this.state.data
      .sort((a, b) => a.TradeTime - b.TradeTime)
      // add change field for up/down/same
      .map((row, index, array) => {
        const newRow = row;
        if (!array[index + 1] || row.Price === array[index + 1].Price) {
          newRow.change = 'same';
        } else {
          if (row.Price > array[index + 1].Price) { // eslint-disable-line no-lonely-if
            newRow.change = 'up';
          } else {
            newRow.change = 'down';
          }
        }
        return newRow;
      })
      // remove extra row
      .slice(maxLines * this.state.page, maxLines * (this.state.page + 1)) // remove extra row
      // generate jsx
      .map(row => {
        let color = 'inherit';
        if (row.change !== 'same') {
          color = row.change === 'down' ? 'red' : 'green';
        }

        return (
          <tr key={`${row.id}-${row.px}-${row.qty}`}>
            <td>{row.Quantity}</td>
            <td>{row.Price}</td>
            <td><i
              className={`fa fa-2x ${row.change === 'same' ? 'fa-minus' : `fa-caret-${row.change}`}`}
              style={{ color }}
            /></td>
            <td>{getTimeFormatEpoch(row.TradeTime)}</td>
          </tr>
        );
      });

    const emptyRows = [];
    for (let i = 0; i < maxLines - rows.length; i++) {
      emptyRows.push(<tr key={i}><td colSpan="6">&nbsp;</td></tr>);
    }
    const pagination = AlphaPoint.config.pagination;
    const paginationClass = AlphaPoint.config.useBootstrapPagination ? 'pagination' : 'pagi';
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
      <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('TRADES.TITLE_TEXT') || 'Trades'}>
        <table className="table table-hover">
          <thead>
            <tr>
              <th className="header">{AlphaPoint.translation('TRADES.QUANTITY_TEXT') || 'Quantity'}</th>
              <th className="header">{AlphaPoint.translation('TRADES.PRICE_TEXT') || 'Price'}</th>
              <th className="header">{AlphaPoint.translation('TRADES.CHANGE') || 'Change'}</th>
              <th className="header">{AlphaPoint.translation('TRADES.TIME_TEXT') || 'Time'}</th>
            </tr>
          </thead>
          <tbody>
            {rows}
            {emptyRows}
          </tbody>
        </table>

        <div className="pad">
          <div className="pull-right">
            {pagination && pages.length>1 && (
              <ul className={paginationClass}>
                <li><a onClick={() => this.gotoPage(0)}>&laquo;</a></li>
                {pages}
                <li onClick={() => this.gotoPage(totalPages - 1)} ><a>&raquo;</a></li>
              </ul>
            )}
          </div>
        </div>

      </WidgetBase>
    );
  }
}

export default Trades;
