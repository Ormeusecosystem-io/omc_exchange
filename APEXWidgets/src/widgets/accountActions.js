import React from 'react';


import WidgetBase from './base';
import { getTimeFormatEpoch } from '../common';

const AlphaPoint = global.AlphaPoint;

function translateSide(side) {
  return side === 'Buy' ? AlphaPoint.translation('ACCOUNT_ACTIONS.BUY') : AlphaPoint.translation('ACCOUNT_ACTIONS.SELL');
}

function createDetails(data) {
  switch (data.messageType) {
    case 'NewTrade': {
      return [(AlphaPoint.translation('ACCOUNT_ACTIONS.EXECUTED') || 'Trade Executed')];
    }
    case 'OrderAdded': {
      return [(AlphaPoint.translation('ACCOUNT_ACTIONS.ORDER_ADDED') || 'Order Added')];
    }
    case 'OrderRejected': {
      return [data.rejectReasonString];
    }
    case 'ModifyOrderReject': {
      return [data.rejectReasonString];
    }
    case 'OrderRemoved': {
      return false;
    }
    case 'OrderChanged': {
      return [(AlphaPoint.translation('ACCOUNT_ACTIONS.REMAINING') || 'Remaining:'), ' ', data.qtyRemaining];
    }
    default: {
      return false;
    }
  }
}

function createValue(data) {
  switch (data.messageType) {
    case 'NewTrade': {
      return [data.tradePrice * data.tradeQty];
    }
    case 'OrderAdded': {
      return [data.price * data.qtyTotal];
    }
    case 'OrderRejected': {
      return [' '];
    }
    case 'ModifyOrderReject': {
      return false;
    }
    case 'OrderRemoved': {
      return false;
    }
    case 'OrderChanged': {
      return [data.price * data.qtyTotal];
    }
    default: {
      return false;
    }
  }
}

function createFee(data) {
  switch (data.messageType) {
    case 'NewTrade': {
      return [data.feeAmount, ' ', data.feeProductLabel];
    }
    default: {
      return false;
    }
  }
}

function createType(data) {
  switch (data.messageType) {
    case 'NewTrade': {
      return [translateSide(data.side), ' ', data.productPair];
    }
    case 'OrderAdded': {
      return [translateSide(data.side), ' ', data.productPair];
    }
    case 'OrderRejected': {
      return [' '];
    }
    case 'ModifyOrderReject': {
      return [' '];
    }
    case 'OrderRemoved': {
      return [' '];
    }
    case 'OrderChanged': {
      return [translateSide(data.side), ' ', data.productPair];
    }
    default: {
      return [' '];
    }
  }
}

function createMessageType(data) {
  switch (data.messageType) {
    case 'NewTrade': {
      return [(AlphaPoint.translation('ACCOUNT_ACTIONS.NEW_TRADE') || 'New Trade')];
    }
    case 'OrderAdded': {
      return [(AlphaPoint.translation('ACCOUNT_ACTIONS.ORDER_ADDED') || 'Order Added')];
    }
    case 'OrderRejected': {
      return [(AlphaPoint.translation('ACCOUNT_ACTIONS.ORDER_REJECTED') || 'Order Rejected')];
    }
    case 'ModifyOrderReject': {
      return [(AlphaPoint.translation('ACCOUNT_ACTIONS.ORDER_MODIFIED') || 'Order Modified')];
    }
    case 'OrderRemoved': {
      return [(AlphaPoint.translation('ACCOUNT_ACTIONS.ORDER_REMOVED') || 'Order Removed')];
    }
    case 'OrderChanged': {
      return [(AlphaPoint.translation('ACCOUNT_ACTIONS.ORDER_CHANGED') || 'Order Changed')];
    }
    case 'Withdraw': {
      return [(AlphaPoint.translation('ACCOUNT_ACTIONS.WITHDRAW') || 'Withdraw')];
    }
    case 'Deposit': {
      return [(AlphaPoint.translation('ACCOUNT_ACTIONS.DEPOSIT') || 'Deposit')];
    }
    default: {
      return data.messageType;
    }
  }
}

class AccountActions extends React.Component {
  constructor() {
    super();

    this.state = {
      activity: [],
      tradesIn: [],
      page: 0,
      showLogin: false,
      showOrders: false,
    };
  }

  componentDidMount() {
    // SUBSCRIBING TO DATA FEEDS HERE. WILL KNOW BETTER WHEN THE INFO COMES THROUGH
    this.accountActions = AlphaPoint.orderHistory.subscribe(
      (tradesIn) => this.setState({ tradesIn }) // eslint-disable-line comma-dangle
    );
    this.accountTransactions = AlphaPoint.accountTransactions.subscribe((activity) => {
      const transactions = Object.values(activity)
        .map(account => account)
        .reduce((a, b) => a.concat(b), []);

      this.setState({ activity: transactions });
    });
  }

  componentWillUnmount() {
    this.accountActions.dispose();
    this.accountTransactions.dispose();
  }

  gotoPage = (page) => this.setState({ page });

  displayOrders = (showOrders) => this.setState({ showOrders });

  loginToggle = () => this.setState({ showLogin: !this.state.showLogin });

  render() {
    const maxLines = 10;
    const tradelist = this.state.showOrders
      ?
      this.state.activity
        .filter((activity) => { // eslint-disable-line arrow-body-style
          return (activity.messageType === 'OrderRemoved' || activity.messageType === 'OrderChanged'
            || activity.messageType === 'Trade' || activity.messageType === 'OrderAdded'
            || activity.messageType === 'OrderRejected' || activity.messageType === 'ModifyOrderReject')
            ? activity.messageType : null;
        })
      :
      this.state.activity.filter((activity) => {
        if (activity.messageType === 'NewTrade') {
          return activity.messageType;
        }
        return null;
      });
    const totalPages = Math.ceil(tradelist.length / maxLines);
    const list = tradelist
      .slice(maxLines * this.state.page, maxLines * (this.state.page + 1))
      .map((action) => {
        const title = createMessageType(action);

        return (
          <tr
            key={`
              ${action.serverOrderId}
              ${action.orderReceiveTime || action.receiveTime}
              ${action.messageType}
            `}
          >
            <td>
              {action.orderReceiveTime || action.tradeTime || action.receiveTime || action.time ? getTimeFormatEpoch(action.orderReceiveTime || action.tradeTime || action.receiveTime || action.time) : ''}
            </td>
            <td>{title}</td>
            <td>{action.serverOrderId || action.tradeId || action.inputItemId}</td>
            <td>{createType(action)}</td>
            <td>{action.tradePrice || action.price || ' '}</td>
            <td>{action.tradeQty || action.qtyTotal || ' '}</td>
            <td>{createValue(action)}</td>
            <td>{createFee(action)}</td>
            <td>{createDetails(action)}</td>
          </tr>
        );
      });

    const emptyRows = [];
    for (let i = 0; i < maxLines - list.length; i++) {
      emptyRows.push(<tr key={i}><td colSpan="8">&nbsp;</td></tr>);
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
      <WidgetBase {...this.props} login headerTitle={AlphaPoint.translation('ACCOUNT_ACTIONS.TITLE_TEXT') || 'Account Actions'}>
        <div>
          <table className="table table-hover">
            <thead>
              <tr>
                <th className="header">{AlphaPoint.translation('ACCOUNT_ACTIONS.DATE_TEXT') || 'Date'}</th>
                <th className="header">{AlphaPoint.translation('ACCOUNT_ACTIONS.ACTION_TEXT') || 'Action'}</th>
                <th className="header">{AlphaPoint.translation('ACCOUNT_ACTIONS.ID_TEXT') || '#'}</th>
                <th className="header">{AlphaPoint.translation('ACCOUNT_ACTIONS.TYPE') || 'Type'}</th>
                <th className="header">{AlphaPoint.translation('ACCOUNT_ACTIONS.PRICE') || 'Price'}</th>
                <th className="header">{AlphaPoint.translation('ACCOUNT_ACTIONS.QUANTITY') || 'Quantity'}</th>
                <th className="header">{AlphaPoint.translation('ACCOUNT_ACTIONS.VALUE') || 'Value'}</th>
                <th className="header">{AlphaPoint.translation('ACCOUNT_ACTIONS.FEE') || 'Fee'}</th>
                <th className="header">{AlphaPoint.translation('ACCOUNT_ACTIONS.STATUS') || 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {list}
              {emptyRows}
            </tbody>
          </table>
          <div className="pad">
            <div className="pull-right">
              <ul className={paginationClass}>
                <li onClick={() => this.displayOrders(!this.state.showOrders)}>
                  <a className="rightMargin">
                    {(this.state.showOrders) ?
                      AlphaPoint.translation('ACCOUNT_ACTIONS.HIDE_DETAILS') || 'Hide Details' :
                      AlphaPoint.translation('ACCOUNT_ACTIONS.SHOW_DETAILS') || 'Show Details'}
                  </a>
                </li>
                {pagination && (
                <li onClick={() => this.gotoPage(0)}>
                  <a>&laquo;</a>
                </li>)}
                {pages}
                {pagination && (
                <li onClick={() => this.gotoPage(totalPages - 1)}>
                  <a>&raquo;</a>
                </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

export default AccountActions;
