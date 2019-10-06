import React from 'react';
import WidgetBase from './base';
import common from '../common';
import {getTimeFormatEpoch} from '../common';
import {formatNumberToLocale} from './helper';

var OrderHistory = React.createClass({
  getInitialState: function () {
    return {
      page: 0,
      data: [],
      pairs: [],
      decimalPlaces: {},
    };
  },
  componentWillUnmount: function () {
    this.orderHistory.dispose();
    this.pairs.dispose();
  },
  componentDidMount: function () {

    this.products = AlphaPoint.products.filter(data => data.length).subscribe(products => {
      const decimalPlaces = {};
      products.forEach(product => {
        decimalPlaces[product.Product] = product.DecimalPlaces;
      });
      this.setState({decimalPlaces});
    });

    this.orderHistory = AlphaPoint.orderHistory.subscribe(function (data) {
      this.setState({data: data});
    }.bind(this));

    this.pairs = AlphaPoint.instruments.subscribe(function (data) {
      this.setState({pairs: data});
    }.bind(this));

  },

  gotoPage: function (num) {
    this.setState({page: num});
  },

  wrapStateWithTranslation(state) {
    const states = {
      Unknown: 'ORDER_HISTORY.STATE_UNKNOWN',
      Working: 'ORDER_HISTORY.STATE_WORKING',
      Rejected: 'ORDER_HISTORY.STATE_REJECTED',
      Canceled: 'ORDER_HISTORY.STATE_CANCELED',
      Expired: 'ORDER_HISTORY.STATE_EXPIRED',
      FullyExecuted: 'ORDER_HISTORY.STATE_FULLYEXECUTED',
    };
    return AlphaPoint.translation(states[state]) || state;
  },

  render() {
    const maxLines = 10;
    const totalPages = Math.ceil(this.state.data.length / maxLines);
    const history = this.state.data.sort(function (a, b) {
      return b.ReceiveTime - a.ReceiveTime
    });
    const rows = history.slice(maxLines * this.state.page, maxLines * (this.state.page + 1)).sort(function (a, b) {
      if (a.OrderId < b.OrderId) {
        return 1;
      }
      if (a.OrderId > b.OrderId) {
        return -1;
      }
      return 0;
    })
      .map(function (row) {
        const pairName = this.state.pairs.filter((pair) => {
          return pair.InstrumentId == row.Instrument;
        })[0];

        const total = row.Price * row.OrigQuantity;

        return (
          <tr key={row.OrderId + '-' + row.Price + '-' + row.Quantity}>
            <td>{row.OrderId}</td>
            <td>{pairName.Symbol}</td>
            <td >
              {row.Side === "Buy" ? (AlphaPoint.translation('ORDER_HISTORY.BUY') || 'Buy') : (AlphaPoint.translation('ORDER_HISTORY.SELL') || 'Sell')}
            </td>
            <td>{row.OrderType}</td>
            <td>{row.OrderType === "Market" ? "-" : formatNumberToLocale(row.Price, this.state.decimalPlaces[pairName.Product2Symbol])}</td>
            <td>{formatNumberToLocale(row.OrigQuantity, this.state.decimalPlaces[pairName.Product1Symbol])}</td>
            <td>{formatNumberToLocale(row.QuantityExecuted, this.state.decimalPlaces[pairName.Product1Symbol])}</td>
            <td>{formatNumberToLocale(row.Quantity, this.state.decimalPlaces[pairName.Product1Symbol])}</td>
            <td>{formatNumberToLocale(total, (row.Side === "Buy" ? this.state.decimalPlaces[pairName.Product1Symbol] : this.state.decimalPlaces[pairName.Product2Symbol]))}</td>
            <td>{getTimeFormatEpoch(row.ReceiveTime) }</td>
            <td>{this.wrapStateWithTranslation(row.OrderState)}</td>
          </tr>
        );
      }.bind(this));
    var emptyRows = [];
    for (var i = 0; i < maxLines - rows.length; i++) {
      emptyRows.push(<tr key={i}>
        <td colSpan='11'>&nbsp;</td>
      </tr>);
    }

    var pagination = AlphaPoint.config.pagination;
    var paginationClass = AlphaPoint.config.useBootstrapPagination ? 'pagination pull-right' : 'pagi pull-right';
    var start = (this.state.page - 2) > 0 ? this.state.page - 2 : 0;
    var end = (this.state.page + 3) <= totalPages ? this.state.page + 3 : totalPages;
    var pages = [];

    if (pagination) {
      for (var x = start; x < end; x++) {
        var numButton = (
          <li key={x} className={this.state.page === x ? 'active' : null}>
            <a onClick={this.gotoPage.bind(this, x)}>{x + 1}</a>
          </li>
        );
        pages.push(numButton);
      }
    }

    return (
      <WidgetBase hideCloseLink {...this.props}
                  headerTitle={AlphaPoint.translation('ORDER_HISTORY.TITLE_TEXT') || "Order History"}>
        <table className="table table-hover">
          <thead>
          <tr>
            <th className="header">{AlphaPoint.translation('ORDER_HISTORY.ID_TEXT') || "#"}</th>
            <th className="header">{AlphaPoint.translation('ORDER_HISTORY.INSTRUMENT_TEXT') || "Instrument"}</th>
            <th className="header">{AlphaPoint.translation('ORDER_HISTORY.TYPE_TEXT') || "Type"}</th>
            <th className="header">{AlphaPoint.translation('ORDER_HISTORY.ORDER_TYPE_TEXT') || "Order Type"}</th>
            <th className="header">{AlphaPoint.translation('ORDER_HISTORY.PRICE_TEXT') || "Price"}</th>
            <th className="header">{AlphaPoint.translation('ORDER_HISTORY.QUANTITY') || "Quantity"}</th>
            <th className="header">{AlphaPoint.translation('ORDER_HISTORY.EXECUTED') || "Executed"}</th>
            <th className="header">{AlphaPoint.translation('ORDER_HISTORY.REMAINING_TEXT') || "Remaining"}</th>
            <th className="header">{AlphaPoint.translation('ORDER_HISTORY.TOTAL_TEXT') || "Total"}</th>
            <th className="header">{AlphaPoint.translation('ORDER_HISTORY.TIME_TEXT') || "Time"}</th>
            <th className="header">{AlphaPoint.translation('ORDER_HISTORY.STATUS') || "Status"}</th>
          </tr>
          </thead>
          <tbody>
          {rows}
          {emptyRows}
          </tbody>
        </table>

        <div className='pad'>
          <div className='pull-right'>
            <ul className={paginationClass}>
              <li><a onClick={this.gotoPage.bind(this, 0)}>&laquo;</a></li>
              {pages}
              <li onClick={this.gotoPage.bind(this, totalPages - 1)}><a>&raquo;</a></li>
            </ul>
          </div>
        </div>
      </WidgetBase>
    );
  }
});

module.exports = OrderHistory;
