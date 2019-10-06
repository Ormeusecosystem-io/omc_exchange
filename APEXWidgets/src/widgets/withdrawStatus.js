/* global AlphaPoint, APConfig, $ */
import React from 'react';
import uuidV4 from 'uuid/v4';
import {getTimeFormatEpoch} from '../common';

import WidgetBase from './base';
import {formatNumberToLocale} from './helper';

class WithdrawStatus extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      withdraws: [],
      accounts: [],
      user: {},
      page: 0,
    };
  }

  componentDidMount() {
    const excludeStatuses = AlphaPoint.config.withdrawStatusExcludes || [];

    this.withdraws = AlphaPoint.withdrawTickets.subscribe((withdraws) => {
      const withdrawsArray = Object.values(withdraws).map(account => account);
      const flattenedWithdraws = withdrawsArray.reduce((a, b) => a.concat(b), []);

      this.setState({
        withdraws: flattenedWithdraws
          .filter((withdraw) => !excludeStatuses.includes(withdraw.Status))
          .sort((a, b) => {
            const dateA = new Date(a.CreatedTimestamp);
            const dateB = new Date(b.CreatedTimestamp);
            const timeA = dateA.getTime();
            const timeB = dateB.getTime();

            if (timeA < timeB) return 1;
            if (timeA > timeB) return -1;
            return 0;
          }),
      });
    });
    this.userAccounts = AlphaPoint.userAccountsInfo.subscribe((accounts) => this.setState({accounts}));
    this.userInfo = AlphaPoint.userData.subscribe((user) => this.setState({user}));
    this.canceledWithdraw = AlphaPoint.canceledWithdraw.filter((res) => res.result).subscribe((res) => {
      $.bootstrapGrowl(
        AlphaPoint.translation('WITHDRAW.WITHDRAW_CANCELLED') || 'Withdraw canceled successfully',
        {...AlphaPoint.config.growlerDefaultOptions, type: 'success'},
      );
      this.setState({withdraws: this.state.withdraws.filter((withdraw) => withdraw.RequestCode !== res.detail)});
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

  gotoPage = (page) => this.setState({page});

  refresh = () => this.state.accounts.map((account) => account.AccountId).forEach((AccountId) => {
    AlphaPoint.getWithdrawTickets({OMSId: AlphaPoint.oms.value, AccountId});
  });

  render() {
    const pagination = AlphaPoint.config.pagination;
    const paginationClass = AlphaPoint.config.useBootstrapPagination ? 'pagination' : 'pagi';
    const maxLines = AlphaPoint.config.maxLinesWidgets || 15;
    const totalPages = pagination ? Math.ceil(this.state.withdraws.length / maxLines) : 0;
    const tableClassList = APConfig.siteName === 'aztec' ?
      'table table--comfy table--hover table--striped table--light'
      :
      'table table-hover minFont';
    const rowsSlice = pagination ?
      this.state.withdraws.slice(maxLines * this.state.page, maxLines * (this.state.page + 1))
      :
      this.state.withdraws;
    const rows = rowsSlice.map((withdraw) => {
      const accountName = this.state.accounts.find((account) => account.AccountId === withdraw.AccountId).AccountName;
      const date = new Date(withdraw.CreatedTimestamp);
      const terminalState = ['Failed', 'FullyProcessed', 'UserCancelled', 'Rejected'];
      const showCancelButton = !terminalState.includes(withdraw.Status);

      return (
        <tr key={uuidV4()}>
          <td className="borderless">{accountName}</td>
          <td className="borderless">{withdraw.AssetName}</td>
          <td className="borderless">{formatNumberToLocale(withdraw.Amount, 8)}</td>
          <td className="borderless">{withdraw.Status}</td>
          <td className="borderless">{getTimeFormatEpoch(date.getTime())}</td>
          <td className="borderless">
            {showCancelButton ?
              <div className="ordersActions" onClick={() => this.cancelWithdraw(withdraw)}>
                {APConfig.siteName === 'aztec' ?
                  <span><i className="fa fa-ban" style={{color: '#d60101'}}/>Cancel</span> :
                  <span><i className="material-icons">cancel</i>Cancel</span>}
              </div> : null}
          </td>
        </tr>
      );
    });
    const emptyRows = [];
    for (let i = 0; i < maxLines - rows.length; i++) {
      emptyRows.push(
        <tr key={i}>
          <td className="borderless" colSpan="9">&nbsp;</td>
        </tr>,
      );
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

    displayPagination = (
      <ul className="pagi">
        <li>
          <a onClick={() => this.gotoPage(0)}>&laquo;</a>
        </li>
        {pages}
        <li onClick={() => this.gotoPage(totalPages - 1)}>
          <a>&raquo;</a>
        </li>
      </ul>);

    const refreshIconStyle = {
      marginTop: '-4px',
      marginLeft: '10px',
      cursor: 'pointer',
    };

    return (
      <WidgetBase login {...this.props}>
        <div>
          <table className={tableClassList}>
            <thead>
            <tr>
              <th className="header nudge"
                  style={{width: '6rem'}}>{AlphaPoint.translation('OPEN_ORDERS.ACCOUNT') || 'Account'}</th>
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

          <div className="pad">
            <div className="pull-right">
              {pagination && pages.length > 1 ? displayPagination : null}
              {AlphaPoint.config.siteName === 'aztec' ?
                <i title="Refresh" className="fa fa-refresh" onClick={this.refresh} style={refreshIconStyle}/>
                :
                <i title="Refresh" className="material-icons" onClick={this.refresh}
                   style={refreshIconStyle}>refresh</i>}
            </div>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

WithdrawStatus.defaultProps = {
  hideCloseLink: true,
};

export default WithdrawStatus;
