/* global AlphaPoint, window */
import React from 'react';
import uuidV4 from 'uuid/v4';

import WidgetBase from './base';

class PendingWithdraws extends React.Component {
  constructor() {
    super();

    this.state = {
      withdraws: [],
      accounts: [],
      user: {},
      page: 0,
    };
  }

  componentDidMount() {
    this.withdraws = AlphaPoint.withdrawTickets.subscribe((withdraws) => {
      const withdrawsArray = Object.values(withdraws).map(account => account);
      const flattenedWithdraws = withdrawsArray.reduce((a, b) => a.concat(b), []);

      this.setState({ withdraws: flattenedWithdraws.filter((withdraw) => withdraw.Status === 'New' || withdraw.Status === 'Pending') });
    });
    this.userAccounts = AlphaPoint.userAccountsInfo.subscribe((accounts) => this.setState({ accounts }));
    this.userInfo = AlphaPoint.userData.subscribe((user) => this.setState({ user }));
    this.canceledWithdraw = AlphaPoint.canceledWithdraw.filter((res) => res.result).subscribe((res) => {
      this.setState({ withdraws: this.state.withdraws.filter((withdraw) => withdraw.RequestCode !== res.detail) });
    });
  }

  componentWillUnmount() {
    this.withdraws.dispose();
    this.userAccounts.dispose();
    this.userInfo.dispose();
    this.canceledWithdraw.dispose();
  }

  cancelWithdraw = (ticket) => {
    const payload = {
      UserId: this.state.user.UserId,
      OMSId: ticket.OMSId,
      AccountId: ticket.AccountId,
      RequestCode: ticket.RequestCode,
    };

    AlphaPoint.cancelWithdraw(payload);
  };

  gotoPage = (page) => this.setState({ page });

  refresh = () => this.state.accounts.forEach((AccountId) => {
    AlphaPoint.getWithdrawTickets({ OMSId: AlphaPoint.oms.value, AccountId });
  });

  render() {
    const pagination = AlphaPoint.config.pagination;
    const paginationClass = AlphaPoint.config.useBootstrapPagination ? 'pagination' : 'pagi';
    const maxLines = AlphaPoint.config.maxLinesWidgets || 15;
    const totalPages = pagination ? Math.ceil(this.state.withdraws.length / maxLines) : 0;
    const tableClassList = window.APConfig.siteName === 'aztec' ?
      'table table--comfy table--hover table--striped table--light'
      :
      'table table-hover minFont';
    const rowsSlice = pagination ?
      this.state.withdraws.slice(maxLines * this.state.page, maxLines * (this.state.page + 1))
      :
      this.state.withdraws;
    const rows = rowsSlice.map((withdraw) => {
      const accountName = this.state.accounts.find((account) => account.AccountId === withdraw.AccountId).AccountName;

      return (
        <tr key={uuidV4()}>
          <td className="borderless">{accountName}</td>
          <td className="borderless">{withdraw.AssetName}</td>
          <td className="borderless">{withdraw.Amount}</td>
          <td className="borderless">Pending</td>
          <td className="borderless">{withdraw.CreatedTimestamp.replace(/[TZ]/g, ' ')}</td>
          <td className="borderless">
            <div className="ordersActions" onClick={() => this.cancelWithdraw(withdraw)}>
              {window.APConfig.siteName === 'aztec' ?
                <span><i className="fa fa-ban" style={{ color: '#d60101' }} />Cancel</span> :
                <span><i className="material-icons">cancel</i>Cancel</span>}
            </div>
          </td>
        </tr>
      );
    });
    const emptyRows = [];
    for (let i = 0; i < maxLines - rows.length; i++) {
      emptyRows.push(<tr key={i}><td className="borderless" colSpan="9">&nbsp;</td></tr>);
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
      <li><a onClick={() => this.gotoPage(0)}>&laquo;</a></li>
      {pages}
      <li onClick={() => this.gotoPage(totalPages - 1)}><a>&raquo;</a></li>
    </ul>);

    return (
      <WidgetBase login {...this.props}>
        <div>
          <table className={tableClassList}>
            <thead>
              <tr>
                <th className="header nudge" style={{ width: '6rem' }}>{AlphaPoint.translation('OPEN_ORDERS.ACCOUNT') || 'Account'}</th>
                <th className="header">{AlphaPoint.translation('TRADES.PRODUCT') || 'Product'}</th>
                <th className="header">{AlphaPoint.translation('TRADES.AMOUNT_TEXT') || 'Amount'}</th>
                <th className="header">{AlphaPoint.translation('TRADES.STATUS') || 'Status'}</th>
                <th className="header">{AlphaPoint.translation('TRADES.CREATED') || 'Created'}</th>
                <th className="header">{AlphaPoint.translation('OPEN_ORDERS.ACTIONS_TEXT') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {rows}
              {emptyRows}
            </tbody>
          </table>
        </div>
        {pagination && pages.length > 1 &&
          <div className="pad">
            <div className="pull-right">
              {displayPagination}
            </div>
          </div>}
        <div className="pad" onClick={this.refresh}>
          {AlphaPoint.config.siteName === 'aztec' ?
            <i className="fa fa-refresh" />
            :
            <i className="material-icons">refresh</i>}
        </div>
      </WidgetBase>
    );
  }
}

export default PendingWithdraws;
