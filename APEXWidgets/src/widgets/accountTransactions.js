/* global AlphaPoint, APConfig */
import React from 'react';

import WidgetBase from './base';
import { getTimeFormatEpoch } from '../common';
import { formatNumberToLocale } from './helper';

class AccountTransactions extends React.Component {
  constructor() {
    super();

    this.state = {
      sortDirection: {
        id: true,
        type: true,
        product: true,
        total: true,
        time: true,
      },
      toggleOpen: {},
      page: 0,
      data: [
      ],
      products: [],
      accountsInfo: [],
      decimalPlaces: {},
      selectedAccount: null,
    };
  }

  componentDidMount() {
    this.accountChangedEvent = AlphaPoint.selectedAccount
      .subscribe(selectedAccount => {
        this.setState({ selectedAccount });
      });

    this.accountTransactions = AlphaPoint.accountTransactions.subscribe((data) => {
      const actions = Object.values(data)
        .map(account => account)
        .reduce((a, b) => a.concat(b), [])
        .filter((transaction) => transaction.ReferenceType === 'Deposit' || transaction.ReferenceType === 'Withdraw' || transaction.ReferenceType === 'Transfer' )
        .sort((a, b) => {
          if (a.TimeStamp < b.TimeStamp) return 1;
          if (a.TimeStamp > b.TimeStamp) return -1;
          return 0;
        }).map(tx => (tx.ReferenceType == 'Transfer' && ( tx.Counterparty == 10 || tx.Counterparty == 192 ) ) ? {...tx, ReferenceType: "Withdraw"} : tx )

      this.setState({ data: actions });
    });


    this.products = AlphaPoint.products
      .filter((data) => data.length)
      .subscribe((products) => {

        const decimalPlaces = {};
        products.forEach(product => {
          decimalPlaces[product.Product] = product.DecimalPlaces;
        });

        this.setState({ products, decimalPlaces })
      }
    );

    this.accountsInfo = AlphaPoint.userAccountsInfo.subscribe(accountsInfo => this.setState({ accountsInfo }));
  }

  componentWillUnmount() {
    this.accountChangedEvent.dispose();
    this.accountTransactions.dispose();
    this.products.dispose();
    this.accountsInfo.dispose();
  }

  gotoPage = (page) => this.setState({ page });

  refresh = () => AlphaPoint.getAccountTransactions(AlphaPoint.selectedAccount.value);

  sortRows = (paramName, ascending = true, fieldName) => {
    const compare = (a, b) => {
      if (ascending === true) {
        if (a[paramName] < b[paramName]) { return -1; }
        if (a[paramName] > b[paramName]) { return 1; }
      } else {
        if (a[paramName] < b[paramName]) { return 1; }
        if (a[paramName] > b[paramName]) { return -1; }
      }
      return 0;
    };

    const sorted_array = [].concat(this.state.data).sort(compare);
    const sortDirection = this.state.sortDirection;
    sortDirection[fieldName] = !this.state.sortDirection[fieldName];
    this.setState({ data: sorted_array, sortDirection });
  };

  openMobileDetails = (row_number) => {
    const toggleOpen = this.state.toggleOpen;
    if (toggleOpen[row_number] === undefined) {
      toggleOpen[row_number] = true;
    } else {
      toggleOpen[row_number] = !this.state.toggleOpen[row_number];
    }
    this.setState({ showMobile: !this.state.showMobile, toggleOpen });
  };

  render() {
    const pagination = AlphaPoint.config.pagination;
    const paginationClass = AlphaPoint.config.useBootstrapPagination ? 'pagination' : 'pagi';
    const maxLines = AlphaPoint.config.maxLinesWidgets || 10;
    
    const tableClassList = APConfig.siteName === 'aztec' ?
      'table table--comfy table--hover table--striped table--light'
      :
      'table table-hover';
    const thStyle = { textAlign: 'center', fontWeight: '500' };
    const tdClass = APConfig.siteName === 'aztec' || APConfig.siteName === 'huckleberry' ? 'borderless' : '';
    const filteredRows = this.state.data.filter(slice => this.props.withdraw ? slice.ReferenceType === 'Withdraw' : this.props.deposit ? slice.ReferenceType === 'Deposit' : true).filter(slice => this.props.productId ? slice.ProductId === this.props.productId : true);
    const totalPages = Math.ceil(filteredRows.length / maxLines);
    const rowsSlice = pagination ?
      filteredRows.slice(maxLines * this.state.page, maxLines * (this.state.page + 1))
      :
      filteredRows;
      const rows = rowsSlice.filter(slice => this.props.withdraw ? slice.ReferenceType === 'Withdraw' : this.props.deposit ? slice.ReferenceType === 'Deposit' : true)
      .map((row, index) => {
      if (row.AccountId !== this.state.selectedAccount) return;
      const prodName = this.state.products.find((product) => product.ProductId === row.ProductId) || {};
      // const prodName = row;
      
      const accountInfo = this.state.accountsInfo.find(account => account.AccountId === row.AccountId);
      const topRowActive = this.state.toggleOpen[index] ? 'top-row-active' : '';
      // <div style={{ textAlign: 'center' }} key={`${row.TransactionId}-${row.AccountId}-${row.ReferenceId}`}>
      return (
        <div key={index} style={{ textAlign: 'center' }} className="transaction-row">
          <div className={`transaction-top-row ${topRowActive}`}>
            {AlphaPoint.config.siteName === 'aztec' || AlphaPoint.config.siteName === 'huckleberry' ?
              <div className={`transactions-history-id ${tdClass}`}>{accountInfo.AccountName || row.AccountId}</div> : null}
            <div className={`transactions-history-transaction-id ${tdClass}`}>{row.TransactionId}</div>
            <div className={`transactions-history-transaction-type ${tdClass}`}>{row.ReferenceType}</div>
            <div className={`transactions-history-transaction-product ${tdClass}`}>{prodName.Product}</div>
            <div className={`transactions-history-transaction-total ${tdClass}`}>
              {row.CR === 0
                ?
                formatNumberToLocale(row.DR, this.state.decimalPlaces[prodName.Product])
                :
                formatNumberToLocale(row.CR, this.state.decimalPlaces[prodName.Product])}
            </div>
            {row.ReceiveTime ?
              <div className={`transactions-history-transaction-time ${tdClass}`}>{getTimeFormatEpoch(row.ReceiveTime) || '-'}</div> :
              <div className={`transactions-history-transaction-time ${tdClass}`}>{getTimeFormatEpoch(row.TimeStamp) || '-'}</div>}
            {!AlphaPoint.config.siteName === 'aztec' && !AlphaPoint.config.siteName === 'huckleberry' &&
              <div className={` ${tdClass} transactions-history-transaction-state`}>{row.OrderState}</div>}
          </div>
          {this.state.toggleOpen[index] && <div className="transaction-bottom-row">
            <div className="transaction-detail">
              <div className="transaction-detail-name">ID</div>
              <div className="transaction-detail-value">{ accountInfo.AccountName || row.AccountId }</div>
            </div>
            <div className="transaction-detail">
              <div className="transaction-detail-name">Type</div>
              <div className="transaction-detail-value">{row.ReferenceType === 'Withdrawal' ? AlphaPoint.translation('ACCOUNT_TRANSACTIONS.WITHDRAW') || 'Withdraw' : AlphaPoint.translation('ACCOUNT_TRANSACTIONS.DEPOSIT') || 'Deposit'}</div>
            </div>
            <div className="transaction-detail">
              <div className="transaction-detail-name">Product</div>
              <div className="transaction-detail-value">{prodName.Product}</div>
            </div>
            <div className="transaction-detail">
              <div className="transaction-detail-name">Total</div>
              <div className="transaction-detail-value">{row.CR === 0
                ?
                formatNumberToLocale(row.DR, this.state.decimalPlaces[prodName.Product])
                :
                formatNumberToLocale(row.CR, this.state.decimalPlaces[prodName.Product])}
              </div>
            </div>
            <div className="transaction-detail">
              <div className="transaction-detail-name">Time</div>
              <div className="transaction-detail-value">{row.ReceiveTime ? getTimeFormatEpoch(row.ReceiveTime) || '-' : getTimeFormatEpoch(row.TimeStamp) || '-' }</div>
            </div>
          </div>}
        </div>
      );
    });

    const noActivity = (
      <div id="no-activity">
        <img src="img/no-activity.svg"/>
        <p>You have no activity history.</p>
      </div>
    )
    const emptyRows = [];
    for (let i = 0; i < maxLines - rows.length; i++) {
      emptyRows.push(<div key={i}><div className={` ${tdClass}`} colSpan="6">&nbsp;</div></div>);
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

    let displayPagination = (<ul className={paginationClass}>
      <li><a onClick={() => this.gotoPage(0)}>&laquo;PREV</a></li>
      {pages}
      <li onClick={() => this.gotoPage(totalPages - 1)}><a>NEXT&raquo;</a></li>
    </ul>);

    const refreshIconStyle = {
      marginTop: '-4px',
      marginLeft: '10px',
      cursor: 'pointer',
    };

    return (
      <div id="right" className="column">
        <div className="balances-table" style={{marginTop: this.props.deposit && "40px"}}>
            <div className="tables-title">{this.props.deposit ? "Recent deposit history" : this.props.withdraw ? "Recent withdrawal history" : "Deposit and Withdraw History"}</div>
            <div className="account-transactions-table">
              <WidgetBase hideCloseLink {...this.props} headerTitle={AlphaPoint.translation('ACCOUNT_TRANSACTIONS.TITLE_TEXT') || 'Deposits and Withdraws'}>
                <div className="transaction-history-container">
                  <div className={`transactions-history-table-header ${tableClassList}`}>
                    {AlphaPoint.config.siteName === 'aztec' || AlphaPoint.config.siteName === 'huckleberry' ?
                      <div className="header" style={thStyle}>
                        <div className="transactions-header-text">{AlphaPoint.translation('ACCOUNT_TRANSACTIONS.ACCOUNTID_TEXT') || 'Account ID'}</div>
                        <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.id, 'id')} data-sort="AccountId" data-direction={this.state.sortDirection.id}  />
                      </div>
                      :
                      null}
                    <div className="header" style={thStyle}>
                      <div className="transactions-header-text">{AlphaPoint.translation('ACCOUNT_TRANSACTIONS.ID_TEXT') || 'ID'}</div>
                      <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.id, 'id')} data-sort="OMSId" data-direction={this.state.sortDirection.id}  />
                    </div>
                    <div className="header" style={thStyle}>
                      <div className="transactions-header-text">{AlphaPoint.translation('ACCOUNT_TRANSACTIONS.TYPE') || 'Type'}</div>
                      <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.type, 'type')} data-sort="ReferenceType" data-direction={this.state.sortDirection.type}  />
                    </div>
                    <div className="header" style={thStyle}>
                      <div className="transactions-header-text">{AlphaPoint.translation('ACCOUNT_TRANSACTIONS.PRODUCT') || 'Product'}</div>
                      <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.product, 'product')} data-sort="ProductId" data-direction={this.state.sortDirection.product}  />
                    </div>
                    <div className="header" style={thStyle}>
                      <div className="transactions-header-text">{AlphaPoint.translation('ACCOUNT_TRANSACTIONS.TOTAL') || 'Total'}</div>
                      <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.total, 'total')} data-sort="Balance" data-direction={this.state.sortDirection.total}  />
                    </div>
                    <div className="header" style={thStyle}>
                      <div className="transactions-header-text">{AlphaPoint.translation('ACCOUNT_TRANSACTIONS.TIME') || 'Time'}</div>
                      <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.time, 'time')} data-sort="TimeStamp" data-direction={this.state.sortDirection.time}  />
                    </div>
                    {!AlphaPoint.config.siteName === 'aztec' && !AlphaPoint.config.siteName === 'huckleberry' &&
                      <div className="header" style={thStyle}>
                        <div className="transactions-header-text">{AlphaPoint.translation('ACCOUNT_TRANSACTIONS.STATUS_TEXT') || 'Status'}</div>
                        <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.status, 'status')} data-sort="statusId" data-direction={this.state.sortDirection.status}  />
                      </div>}
                  </div>
                  <div className="transactions-history-table-body">
                    {rows.length > 0 ? rows : noActivity}
                    {/* {emptyRows} */}
                  </div>
                  <div className="pad">
                    <div className="pull-right">
                      {pagination && pages.length > 1 ? displayPagination : null}
                      {AlphaPoint.config.siteName === 'aztec' ?
                        <i title="Refresh" className="fa fa-refresh" onClick={this.refresh} style={refreshIconStyle} />
                        :
                        <i title="Refresh" className="material-icons" onClick={this.refresh} style={refreshIconStyle}>{AlphaPoint.translation('ACCOUNT_TRANSACTIONS.REFRESH') || 'refresh'}</i>}
                    </div>
                  </div>
                </div>
              </WidgetBase>
            </div>
        </div>
      </div>
    );
  }
}

export default AccountTransactions;
