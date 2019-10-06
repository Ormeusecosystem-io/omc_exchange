/* global AlphaPoint, APConfig */
import React from 'react';

import WidgetBase from './base';
import { getTimeFormatEpoch } from '../common';

class WithdrawsAndDeposits extends React.Component {
  constructor() {
    super();

    this.state = {
      page: 0,
      data: [],
      products: [],
      accountsInfo: [],
      withdraws: [],
      deposits: [],
    };
  }

  componentDidMount() {
    this.deposits = AlphaPoint.accountDepositTransactions
      .filter(data => data)
      .subscribe(deposits => {
        const depositsArray = Object.values(deposits).map(account => account);
        const flattenedDeposits = depositsArray.reduce((a, b) => a.concat(b), []);

        this.setState({ deposits: flattenedDeposits });
      });
    this.withdraws = AlphaPoint.accountWithdrawTransactions
      .filter(data => data)
      .subscribe(withdraws => {
        const withdrawsArray = Object.values(withdraws).map(account => account);
        const flattenedWithdraws = withdrawsArray.reduce((a, b) => a.concat(b), []);

        this.setState({ withdraws: flattenedWithdraws });
      });

    this.products = AlphaPoint.products
      .filter((data) => data.length)
      .subscribe((products) => this.setState({ products }));

    this.accountsInfo = AlphaPoint.userAccountsInfo.subscribe(accountsInfo => {
      this.getAccountTransactions(accountsInfo.map(account => account.AccountId));
      this.setState({ accountsInfo });
    });
  }

  componentWillUnmount() {
    this.deposits.dispose();
    this.withdraws.dispose();
    this.products.dispose();
    this.accountsInfo.dispose();
  }

  getAccountTransactions = (accounts) => {
    accounts.forEach(AccountId => {
      const payload = {
        AccountId,
        OMSId: AlphaPoint.oms.value,
      };

      AlphaPoint.getAccountDepositTransactions(payload);
      AlphaPoint.getAccountWithdrawTransactions(payload);
    });
  }

  gotoPage = (page) => this.setState({ page });

  refresh = () => this.getAccountTransactions(this.state.accountsInfo.map(account => account.AccountId));

  render() {
    const data = [].concat(this.state.withdraws, this.state.deposits).sort((a, b) => b.TimeStamp - a.TimeStamp);
    const pagination = AlphaPoint.config.pagination;
    const paginationClass = AlphaPoint.config.useBootstrapPagination ? 'pagination' : 'pagi';
    const maxLines = AlphaPoint.config.maxLinesWidgets || 10;
    const totalPages = Math.ceil(data.length / maxLines);
    const tableClassList = APConfig.siteName === 'aztec' ?
      'table table--comfy table--hover table--striped table--light'
      :
      'table table-hover';
    const thStyle = { textAlign: 'center', fontWeight: '500' };
    const tdClass = APConfig.siteName === 'aztec' || APConfig.siteName === 'huckleberry' ? 'borderless' : '';
    const rowsSlice = pagination ?
      data.slice(maxLines * this.state.page, maxLines * (this.state.page + 1))
      :
      data;
    const rows = rowsSlice.map((row) => {
      const prodName = this.state.products.find((product) => product.ProductId === row.ProductId) || {};
      const accountInfo = this.state.accountsInfo.find(account => account.AccountId === row.AccountId);

      return (
        <tr style={{ textAlign: 'center' }} key={`${row.TransactionId}-${row.AccountId}-${row.ReferenceId}`}>
          {AlphaPoint.config.siteName === 'aztec' || AlphaPoint.config.siteName === 'huckleberry' ?
            <td className={tdClass}>{accountInfo.AccountName || row.AccountId}</td> : null}
          <td className={tdClass}>{row.TransactionId}</td>
          <td className={tdClass}>{row.ReferenceType === 'Withdraw' ? 'Withdraw' : 'Deposit'}</td>
          <td className={tdClass}>{prodName.Product}</td>
          <td className={tdClass}>
            {row.CR === 0
              ?
              row.DR.toFixed(AlphaPoint.config.decimalPlaces)
              :
              row.CR.toFixed(AlphaPoint.config.decimalPlaces)}
          </td>
          {row.ReceiveTime ?
            <td className={tdClass}>{getTimeFormatEpoch(row.ReceiveTime) || '-'}</td> :
            <td className={tdClass}>{getTimeFormatEpoch(row.TimeStamp) || '-'}</td>}
          {!AlphaPoint.config.siteName === 'aztec' && !AlphaPoint.config.siteName === 'huckleberry' &&
            <td className={tdClass}>{row.OrderState}</td>}
        </tr>
      );
    });
    const emptyRows = [];
    for (let i = 0; i < maxLines - rows.length; i++) {
      emptyRows.push(<tr key={i}><td className={tdClass} colSpan="6">&nbsp;</td></tr>);
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

    let displayPagination;
    
    displayPagination = (<ul className={paginationClass}>
      <li><a onClick={() => this.gotoPage(0)}>&laquo;</a></li>
      {pages}
      <li onClick={() => this.gotoPage(totalPages - 1)}><a>&raquo;</a></li>
    </ul>);

    const refreshIconStyle = {
      marginTop: '-4px',
      marginLeft: '10px',
      cursor: 'pointer',
    };

    return (
      <WidgetBase hideCloseLink {...this.props} headerTitle="Deposit and Withdraws">
        <div>
          <table className={tableClassList}>
            <thead>
              <tr>
                {AlphaPoint.config.siteName === 'aztec' || AlphaPoint.config.siteName === 'huckleberry' ?
                  <th className="header" style={thStyle}>{AlphaPoint.translation('ACCOUNT_ACTIONS.ACCOUNT_TEXT') || 'Account'}</th>
                  :
                  null}
                <th className="header" style={thStyle}>{AlphaPoint.translation('ACCOUNT_ACTIONS.ID_TEXT') || 'ID'}</th>
                <th className="header" style={thStyle}>{AlphaPoint.translation('ACCOUNT_ACTIONS.TYPE') || 'Type'}</th>
                <th className="header" style={thStyle}>{AlphaPoint.translation('ACCOUNT_ACTIONS.PRODUCTS_TEXT') || 'Product'}</th>
                <th className="header" style={thStyle}>{AlphaPoint.translation('ACCOUNT_ACTIONS.TOTAL_TEXT') || 'Total'}</th>
                <th className="header" style={thStyle}>{AlphaPoint.translation('ACCOUNT_ACTIONS.TIME_TEXT') || 'Time'}</th>
                {!AlphaPoint.config.siteName === 'aztec' && !AlphaPoint.config.siteName === 'huckleberry' &&
                  <th className="header" style={thStyle}>{AlphaPoint.translation('ACCOUNT_ACTIONS.STATUS_TEXT') || 'Status'}</th>}
              </tr>
            </thead>
            <tbody>
              {rows}
              {emptyRows}
            </tbody>
          </table>

          <div className="pad">
            <div className="pull-right">
              {pagination && pages.length > 1 ? displayPagination : null}
              {AlphaPoint.config.siteName === 'aztec' ?
                <i title="Refresh" className="fa fa-refresh" onClick={this.refresh} style={refreshIconStyle} />
                :
                <i title="Refresh" className="material-icons" onClick={this.refresh} style={refreshIconStyle}>refresh</i>}
            </div>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

export default WithdrawsAndDeposits;
