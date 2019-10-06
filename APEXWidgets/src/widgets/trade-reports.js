/* global AlphaPoint, document, window, $ */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import ReactTooltip from 'react-tooltip';
import uuidV4 from 'uuid/v4';

import WidgetBase from './base';
import {getTimeFormatEpoch} from '../common';

class Row extends React.Component {
  cancel = () => {
    const data = {
      OMSId: AlphaPoint.oms.value,
      OrderId: this.props.OrderId,
      AccountId: this.props.Account || this.props.AccountId,
    };

    return AlphaPoint.cancelOrder(data);
  }

  render() {
    const id = this.props.Instrument || this.props.InstrumentId;
    const pairName = this.props.instruments.find((instrument) => instrument.InstrumentId === id);
    const accountInfo = document.APAPI.Session.Accounts.find(
      (account) => account.AccountId === (this.props.Account || this.props.AccountId),
    ).AccountInfo;
    const openOrder = this.props.OrderState === 'Working' || this.props.OrderState === 'Open';

    return (
      <tr key={this.props.OrderId} onMouseEnter={this.props.mouseenter} onMouseLeave={this.props.mouseleave}>
        <td className="borderless">{accountInfo.AccountName || this.props.Account || this.props.AccountId}</td>
        <td className="borderless">{pairName.Symbol}</td>
        {(this.props.Side === 'Buy') ?
          <td className="borderless buyFont">{AlphaPoint.translation('OPEN_ORDERS.BUY') || 'Buy'}</td> :
          <td className="borderless sellFont">{AlphaPoint.translation('OPEN_ORDERS.SELL') || 'Sell'}</td>}
        <td className="borderless txt-right">≈{parseFloat(this.props.Quantity).toFixed(2)}</td>
        <td
          className="borderless txt-right">{this.props.Price.toFixed(AlphaPoint.config.decimalPlacesTraderUI || 2)}</td>
        <td className="borderless">{this.props.Fee}</td>
        <td className="borderless">{getTimeFormatEpoch(this.props.ReceiveTime || this.props.TradeTimeMS)}</td>
        {this.props.OrderState ?
          <td className="borderless">{this.props.OrderState === 'Working' ? 'Open' : this.props.OrderState}</td>
          :
          <td className="borderless">Submitted</td>}
        {openOrder ?
          <td className="borderless">
            {window.APConfig.siteName === 'aztec' ?
              <span
                onClick={this.cancel}
                style={{cursor: 'pointer'}}
              >
                <i className="fa fa-ban" style={{color: '#d60101', cursor: 'pointer'}}/> Cancel
              </span>
              :
              <div
                className="ordersActions"
                onClick={this.cancel}
                style={{cursor: 'pointer'}}
              >
                <i className="material-icons">cancel</i>Cancel
              </div>}
          </td>
          :
          <td className="borderless"/>}
      </tr>
    );
  }
}

Row.defaultProps = {
  OrderId: null,
  Instrument: null,
  InstrumentId: null,
  instruments: [],
  Account: null,
  AccountId: null,
  OrderState: '',
  Side: '',
  Quantity: null,
  Price: null,
  ReceiveTime: null,
  TradeTime: null,
  Fee: 0,
  mouseenter: () => {
  },
  mouseleave: () => {
  },
};

Row.propTypes = {
  OrderId: React.PropTypes.number,
  Instrument: React.PropTypes.number,
  InstrumentId: React.PropTypes.number,
  instruments: React.PropTypes.arrayOf(React.PropTypes.object),
  Account: React.PropTypes.number,
  AccountId: React.PropTypes.number,
  OrderState: React.PropTypes.string,
  Side: React.PropTypes.string,
  Quantity: React.PropTypes.number,
  Price: React.PropTypes.number,
  ReceiveTime: React.PropTypes.number,
  TradeTime: React.PropTypes.number,
  Fee: React.PropTypes.number,
  mouseenter: React.PropTypes.func,
  mouseleave: React.PropTypes.func,
};

class TradeReports extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      blockTrades: [],
      trades: [],
      data: [],
      pairs: [],
      showLogin: false,
      currentOrder: null,
    };
  }

  componentDidMount() {
    this.blockTrades = AlphaPoint.tradeReports.subscribe(data => {
      const blockTrades = Object.values(data)
        .map(account => account)
        .reduce((a, b) => a.concat(b), [])
        .sort((a, b) => {
          if (a.OrderId < b.OrderId) return 1;
          if (a.OrderId > b.OrderId) return -1;
          return 0;
        });

      this.setState({blockTrades});
    });

    this.tradeHistory = AlphaPoint.accountTrades
      .filter(data => data.length)
      .subscribe(data => {
        const trades = data
          .filter(trade => trade.IsBlockTrade)
          .sort((a, b) => {
            if (a.TradeId < b.TradeId) return 1;
            if (a.TradeId > b.TradeId) return -1;
            return 0;
          });

        if (trades.length &&
          (AlphaPoint.userPermissions.value.includes('getopentradereports') ||
          AlphaPoint.userPermissions.value.includes('superuser'))) {
          setTimeout(() => AlphaPoint.getOpenTradeReports({
            OMSId: AlphaPoint.oms.value,
            AccountId: AlphaPoint.selectedAccount.value,
          }), 1000);
        }
        this.setState({trades});
      });

    this.pairs = AlphaPoint.instruments.subscribe(pairs => this.setState({pairs}));
    this.cancelResponse = AlphaPoint.cancel
      .filter(data => Object.keys(data).length && !data.result)
      .subscribe(data => $.bootstrapGrowl(
        data.errormsg,
        {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'},
      ));
  }

  componentWillUnmount() {
    this.blockTrades.dispose();
    this.tradeHistory.dispose();
    this.pairs.dispose();
    this.cancelResponse.dispose();
  }

  gotoPage = (page) => this.setState({page});

  loginToggle = () => this.setState({showLogin: !this.state.showLogin});

  showTooltip = (order) => {
    // Prevent setTimeout firing multiple times (each pixel the mouse moves) thus allowing other events to come through
    // firefox/edge bug #941
    if (this.state.currentOrder && this.state.currentOrder.OrderId === order.OrderId) return;

    setTimeout(() => this.setState({currentOrder: order}), 100);
  };

  hideTooltip = () => this.setState({currentOrder: null});

  render() {
    if (AlphaPoint.config.showBlockTradeUI) {
      const pagination = AlphaPoint.config.pagination;
      const paginationClass = AlphaPoint.config.useBootstrapPagination ? 'pagination' : 'pagi';
      const instruments = this.state.pairs;
      const data = [].concat(this.state.blockTrades, this.state.trades)
        .map(order => ({...order, SortingTime: order.ReceiveTime ? order.ReceiveTime : order.TradeTime}))
        .sort((a, b) => {
          if (a.SortingTime < b.SortingTime) return 1;
          if (a.SortingTime > b.SortingTime) return -1;
          return 0;
        });
      const maxLines = AlphaPoint.config.maxLinesWidgets || 15;
      const totalPages = pagination ? Math.ceil(data.length / maxLines) : 0;
      const rowsSlice = pagination ?
        data.slice(maxLines * this.state.page, maxLines * (this.state.page + 1))
        :
        data;
      const rows = rowsSlice
        .map((order) => (
          <Row
            mouseenter={() => this.showTooltip(order)}
            mouseleave={this.hideTooltip}
            {...order}
            instruments={instruments}
            key={uuidV4()}
          />
        ));

      const emptyRows = [];
      if (this.state.page === (totalPages - 1) || totalPages === 0) {
        for (let i = 0; i < maxLines - rows.length; i++) {
          emptyRows.push(<tr key={i}>
            <td className="borderless" colSpan="9">&nbsp;</td>
          </tr>);
        }
      }

      const pages = [];
      if (pagination) {
        const start = (this.state.page - 2) > 0 ? this.state.page - 2 : 0;
        const end = (this.state.page + 3) <= totalPages ? this.state.page + 3 : totalPages;
        for (let x = start; x < end; x++) {
          const numButton = (
            <li key={x} className={this.state.page === x ? 'active' : null}>
              <a onClick={() => this.gotoPage(x)}>{x + 1}</a>
            </li>
          );
          pages.push(numButton);
        }
      }

      const displayPagination = (<ul className='pagi'>
        <li><a onClick={() => this.gotoPage(0)}>&laquo;</a></li>
        {pages}
        <li onClick={() => this.gotoPage(totalPages - 1)}><a>&raquo;</a></li>
      </ul>);

      const tableClassList = window.APConfig.siteName === 'aztec' ?
        'table table--comfy table--hover table--striped table--light'
        :
        'table table-hover minFont';

      return (
        <WidgetBase modalId="tradeReportsModal" login {...this.props}
                    headerTitle={AlphaPoint.translation('TRADER_REPORT.TITLE_TEXT') || 'Trades Report'}>
          <div>
            <table className={tableClassList}>
              <thead>
              <tr>
                <th className="header nudge"
                    style={{width: '6rem'}}>{AlphaPoint.translation('OPEN_ORDERS.ACCOUNT') || 'Account'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.PAIR_TEXT') || 'Instrument'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.SIDE_TEXT') || 'Side'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.SIZE_TEXT') || 'Size'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.PRICE_TEXT') || 'Price'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.FEE_TEXT') || 'Fee'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.TIME_TEXT') || 'Time'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.STATUS_TEXT') || 'Status'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.ACTIONS_TEXT') || 'Actions'}</th>
              </tr>
              </thead>
              <tbody>
              {rows}
              {emptyRows}
              </tbody>
            </table>

            {this.state.currentOrder &&
            <ReactTooltip id={`orderInfo-${this.state.currentOrder.OrderId}`} class="order-tooltip" delayShow={500}>
              <div>
                <h4>Additional Trade Report Information</h4>
                <table>
                  <tbody>
                  <tr>
                    <td>Trade Report Id</td>
                    <td>{this.state.currentOrder.OrderId}</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </ReactTooltip>}

            {pagination && pages.length > 1 &&
            <div className="pad">
              <div className="pull-right">
                {displayPagination}
              </div>
            </div>}
          </div>
        </WidgetBase>
      );
    }

    return false;
  }
}

TradeReports.defaultProps = {
  hideCloseLink: true,
};

export default TradeReports;
