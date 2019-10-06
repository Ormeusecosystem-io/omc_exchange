/* global AlphaPoint */
import React from 'react';

import WidgetBase from './base';
import common from '../common';

class WithdrawHistory extends React.Component {
  constructor() {
    super();

    this.state = {
      data: [],
      page: 0,
    };
  }

  componentDidMount() {
    // used to get session token
    AlphaPoint.session
      .where(data => data.sessionToken)
      .take(1) // subscribe until valid session
      .subscribe(() => {
        AlphaPoint.getWithdrawHistory(null, (res) => this.setState({ data: res.fiatWithdrawTickets }));
      });
  }

  gotoPage = (page) => this.setState({ page });

  render() {
    const maxLines = 10;
    const totalPages = Math.ceil(this.state.data.length / maxLines);

    this.state.data.sort((a, b) => (
      common.getTimestampFromServerDate(b.date) - common.getTimestampFromServerDate(a.date)
    ));
    const rows = this.state.data.slice(maxLines * this.state.page, maxLines * (this.state.page + 1))
      .map((row) => (
        <tr key={row.reference}>
          <td>{common.getLocalDate(row.date, (AlphaPoint.config.timezoneOffset || 0))}</td>
          <td>{row.amountRequested}</td>
          <td>{Math.round(row.amountRequested * 0.0049 * 100) / 100}</td>
          <td>{row.bankAccountName}</td>
          <td>{row.reference}</td>
          <td>{
            /* eslint-disable no-nested-ternary */
            row.status === 'Pending' ? (AlphaPoint.translation('DEPOSIT_HISTORY.PENDING') || row.status)
              : row.status === 'FullyProcessed' ? (AlphaPoint.translation('DEPOSIT_HISTORY.FULLY_PROCESSED') || row.status)
                : row.status === 'AdminProcessing' ? (AlphaPoint.translation('DEPOSIT_HISTORY.PENDING') || row.status)
                  : row.status === 'Rejected' ? (AlphaPoint.translation('DEPOSIT_HISTORY.REJECTED') || row.status)
                    : row.status
            /* eslint-enable no-nested-ternary */
          }</td>
          <td>{row.status === 'Rejected' ? row.notes : ''}</td>
        </tr>
      ));

    const emptyRows = [];
    for (let i = 0; i < maxLines - rows.length; i++) {
      emptyRows.push(<tr key={i}><td colSpan="7">&nbsp;</td></tr>);
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
      <WidgetBase headerTitle={(AlphaPoint.translation('WITHDRAW_HISTORY.TITLE') || 'Withdraw History')}>
        <table className="table table-hover">
          <thead>
            <tr>
              <th className="header">{(AlphaPoint.translation('WITHDRAW_HISTORY.DATE') || 'Date')}</th>
              <th className="header">{(AlphaPoint.translation('WITHDRAW_HISTORY.AMOUNT') || 'Amount')}</th>
              <th className="header">{(AlphaPoint.translation('WITHDRAW_HISTORY.FEE') || 'Fee')}</th>
              <th className="header">{(AlphaPoint.translation('WITHDRAW_HISTORY.BANK_INFO') || 'Bank Info')}</th>
              <th className="header">{(AlphaPoint.translation('WITHDRAW_HISTORY.REFERENCE') || 'Reference')}</th>
              <th className="header">{(AlphaPoint.translation('WITHDRAW_HISTORY.STATUS') || 'Status')}</th>
              <th className="header">{(AlphaPoint.translation('WITHDRAW_HISTORY.COMMENTS') || 'Comments')}</th>
            </tr>
          </thead>

          <tbody>
            {rows}
            {emptyRows}
          </tbody>

        </table>

        <div className="pad">
          <div className="pull-right">
          {pagination && pages.length > 1 &&
            <ul className={paginationClass}>
              <li><a onClick={() => this.gotoPage(0)}>&laquo;</a></li>
              {pages}
              <li onClick={() => this.gotoPage(totalPages - 1)} ><a>&raquo;</a></li>
            </ul>
          }
          </div>
        </div>
      </WidgetBase>
    );
  }
}

export default WithdrawHistory;
