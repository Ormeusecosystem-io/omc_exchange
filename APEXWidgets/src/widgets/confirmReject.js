/* global AlphaPoint, $ */
import React from 'react';
import uuidV4 from 'uuid/v4';
import Rx from 'rx-lite';
import {formatNumberToLocale} from './helper';
import Modal from './modal';
import TwoFACodeInput from './twoFACodeInput';

class ConfirmReject extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      transfers: [],
      receivedTransfers: [],
      sentRequests: [],
      receivedRequests: [],
      selectedTab: 'transfers',
      sortKey: '',
      page: 0,
      useFA: false,
      hold2FA: false,
      transfersOrdered: false,
      req: {}
    };
  }

  componentDidMount() {
    this.userInformation = AlphaPoint.getUser.subscribe(data => this.setState({
      username: data,
      useFA: data.Use2FA,
      hold2FA: false,
    }));

    this.accountTransfersAndRequests = Rx.Observable.combineLatest(
      AlphaPoint.selectedAccount,
      AlphaPoint.sentTransfers,
      AlphaPoint.receivedTransfers,
      AlphaPoint.sentTransferRequests,
      AlphaPoint.receivedTransferRequests,
      (selectedAccount, transfers, receivedTransfers, sentRequests, receivedRequests) => ({
        transfers: (transfers[selectedAccount] || []),
        receivedTransfers: (receivedTransfers[selectedAccount] || []),
        sentRequests: sentRequests[selectedAccount] || [],
        receivedRequests: receivedRequests[selectedAccount] || [],
      }),
    ).subscribe(({
      transfers,
      receivedTransfers,
      sentRequests,
      receivedRequests,
    }) => {
      this.setState({
        transfers,
        receivedTransfers,
        transfersOrdered: true,
        sentRequests: this.sortBy(sentRequests, 'LastUpdateTimestamp', 'desc'),
        receivedRequests: this.sortBy(receivedRequests, 'LastUpdateTimestamp', 'desc'),
      });
    });

    this.confirmRequests = AlphaPoint.confirmrequests.filter(data => Object.keys(data).length).subscribe(data => {
      if (data.result) {
        AlphaPoint.userAccounts.value.forEach(accountId => {
          AlphaPoint.getSentTransferRequests(accountId);
          AlphaPoint.getReceivedTransferRequests(accountId);
          AlphaPoint.getTransfers(accountId);
        });
        return $.bootstrapGrowl(
          AlphaPoint.translation('COMMON.REQUEST_SENT') || 'Request Sent',
          {...AlphaPoint.config.growlerDefaultOptions, type: 'success'}
        );
      }

      return $.bootstrapGrowl(
        (AlphaPoint.translation('COMMON.ERROR') || 'Error') + `: ${data.errormsg && data.detail ? data.detail : data.errormsg}`,
        {...AlphaPoint.config.growlerDefaultOptions, type: 'danger', delay: 10000}
      );
    });

    this.rejectRequests = AlphaPoint.rejectrequests.filter(data => Object.keys(data).length).subscribe(data => {
      if (data.result) {
        AlphaPoint.userAccounts.value.forEach(accountId => {
          AlphaPoint.getSentTransferRequests(accountId);
          AlphaPoint.getReceivedTransferRequests(accountId);
          AlphaPoint.getTransfers(accountId);
        });
        return $.bootstrapGrowl(
          AlphaPoint.translation('COMMON.REQUEST_CANCELED') || 'Request Canceled',
          {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'}
        );
      }
      return $.bootstrapGrowl(
        (AlphaPoint.translation('COMMON.ERROR') || 'Error') `: ${data.errormsg}`,
        {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'}
      );
    });

    this.auth2FAuthentication = AlphaPoint.auth2FA.subscribe(res => {
      if (res.length === 0) return;
      if (res.Authenticated && this.state.hold2FA) {
        this.allowRequest(this.state.req);
        this.closeModal();
      }
    });
  }

  componentWillUnmount() {
    this.accountTransfersAndRequests.dispose();
    this.confirmRequests.dispose();
    this.rejectRequests.dispose();
    this.auth2FAuthentication.dispose();
  }

  confirmRequest = req => {
    if (this.state.useFA) {
      this.setState({ hold2FA: true, req });
    } else {
      this.allowRequest(req);
    }
  };
  allowRequest = req => {
    AlphaPoint.confirmRequestTransfers({
      OMSId: req.OMSId,
      OperatorId: AlphaPoint.config.OperatorId,
      RequestCode: req.RequestCode,
    });
  };

  closeModal = () => {
    this.setState({ hold2FA: false });
  };

  do2FAVerification = (code) => {
    var data = {
      Code: code
    }

    AlphaPoint.authenticate2FA(data);
  };

  rejectRequest = req =>
    AlphaPoint.rejectRequestTransfers({
      OMSId: req.OMSId,
      OperatorId: AlphaPoint.config.OperatorId,
      RequestCode: req.RequestCode,
    });

  sortSelectedTabBy = key => {
    this.setState({
      [this.state.selectedTab]:
        this.state.sortKey === key
          ? this.state[this.state.selectedTab].reverse()
          : this.state[this.state.selectedTab].sort((a, b) => {
            if (a[key] < b[key]) return 1;
            if (a[key] > b[key]) return -1;
            return 0;
          }),
      sortKey: key,
    });
  };

  sortBy = (ary, key, order) => {
    this.setState({ sortKey: key });
    if (order === 'desc') {
      return ary.sort((a, b) => {
            if (a[key] < b[key]) return 1;
            if (a[key] > b[key]) return -1;
            return 0;
          });
    } else {
      return ary.sort((a, b) => {
            if (a[key] > b[key]) return 1;
            if (a[key] < b[key]) return -1;
            return 0;
          });
    }
  };

  render() {
    const pagination = AlphaPoint.config.pagination;
    const paginationClass = AlphaPoint.config.useBootstrapPagination ? 'pagination pull-right' : 'pagi pull-right';
    const { page, transfers, selectedTab } = this.state;
    const rowCount = 5;
    const totalPages = Math.ceil(this.state[selectedTab].length / rowCount);
    const data = (this.state.selectedTab === 'transfers' || this.state.selectedTab === 'receivedTransfers') ? this.state[selectedTab].slice(0).reverse() : this.state[selectedTab].slice(0);
    const pages = [];
    const start = page - 2 > 0 ? page - 2 : 0;
    const end = page + 3 <= totalPages ? page + 3 : totalPages;

    if (pagination) {
      for (let x = start; x < end; x++) {
        const numButton = (
          <li key={x} className={page === x ? 'active' : null}>
            <a onClick={() => this.setState({ page: x })}>{x + 1}</a>
          </li>
        );
        pages.push(numButton);
      }
    }

    const widgetStyle = { overflow: 'auto' };
    const thStyle = { cursor: 'pointer' };
    const tdStyle = { wordBreak: 'break-word' };
    const tdNoteStyle = { wordBreak: 'break-word', width: '24%' };
    const sortIconStyles = {
      fontSize: '2rem',
      verticalAlign: 'middle',
      marginLeft: '0.5rem',
    };

    return (
      <div style={widgetStyle}>
        <h3>{AlphaPoint.translation('CONFIRM_REJECT.TITLE_TEXT') || 'Transactions Status'}</h3>
        <div>
          <select onChange={e => this.setState({selectedTab: e.target.value, sortKey: '', page: 0})}>
            <option
              value="transfers">{AlphaPoint.translation('CONFIRM_REJECT.SENT_TRANSFERS') || 'Sent Transfers'}</option>
            <option
              value="receivedTransfers">{AlphaPoint.translation('CONFIRM_REJECT.RECEIVED_TRANSFERS') || 'Received Transfers'}</option>
            <option
              value="sentRequests">{AlphaPoint.translation('CONFIRM_REJECT.SENT_REQUESTS') || 'Sent Requests'}</option>
            <option
              value="receivedRequests">{AlphaPoint.translation('CONFIRM_REJECT.RECEIVED_REQUESTS') || 'Received Requests'}</option>
          </select>
        </div>
        {this.state.selectedTab === 'transfers' || this.state.selectedTab === 'receivedTransfers' ? (
          <div>
            <table className="table table-condensed">
              <thead>
              <tr>
                {this.state.selectedTab === 'receivedTransfers' ? (
                  <th style={thStyle} onClick={() => this.sortSelectedTabBy('SenderUserName')}>
                    {AlphaPoint.translation('CONFIRM_REJECT.SENDER') || 'Sender'}
                    <i style={sortIconStyles} className="material-icons">
                      sort
                    </i>
                  </th>
                ) : (
                  <th style={thStyle} onClick={() => this.sortSelectedTabBy('ReceiverUserName')}>
                    {AlphaPoint.translation('CONFIRM_REJECT.RECIPIENT') || 'Recipient'}
                    <i style={sortIconStyles} className="material-icons">
                      sort
                    </i>
                  </th>
                )}
                <th style={thStyle} onClick={() => this.sortSelectedTabBy('Amount')}>
                  {AlphaPoint.translation('CONFIRM_REJECT.AMOUNT') || 'Amount'}
                  <i style={sortIconStyles} className="material-icons">
                    sort
                  </i>
                </th>
                <th style={thStyle} onClick={() => this.sortSelectedTabBy('ProductId')}>
                  {AlphaPoint.translation('CONFIRM_REJECT.PRODUCT') || 'Product'}
                  <i style={sortIconStyles} className="material-icons">
                    sort
                  </i>
                </th>
                <th style={{verticalAlign: 'middle'}}>{AlphaPoint.translation('CONFIRM_REJECT.NOTE') || 'Note'}</th>
              </tr>
              </thead>
              <tbody>
              {data.slice(rowCount * page, rowCount * (page + 1)).map(transfer => (
                <tr key={uuidV4()}>
                  <td>
                    {this.state.selectedTab === 'receivedTransfers'
                      ? transfer.SenderUserName
                      : transfer.ReceiverUserName}
                  </td>
                  <td>{formatNumberToLocale(
                    transfer.Amount,
                    AlphaPoint.products.value.find(prod => prod.ProductId === transfer.ProductId).DecimalPlaces)}
                  </td>
                  <td>{AlphaPoint.products.value.find(prod => prod.ProductId === transfer.ProductId).Product}</td>
                  <td>{transfer.Notes}</td>
                </tr>
              ))}
              </tbody>
            </table>
            {data.length > 5 && pagination && (
              <ul className={paginationClass}>
                <li>
                  <a onClick={() => this.setState({page: 0})}>&laquo;</a>
                </li>
                {pages}
                <li onClick={() => this.setState({page: totalPages - 1})}>
                  <a>&raquo;</a>
                </li>
              </ul>
            )}
          </div>
        ) : (
          <div>
            <table className="table table-condensed">
              <thead>
              <tr>
                <th
                  style={thStyle}
                  onClick={() =>
                    this.sortSelectedTabBy(this.state.selectedTab === 'sentRequests' ? 'PayerUsername' : 'RequestorUsername')
                  }
                >
                  {this.state.selectedTab === 'sentRequests'
                    ? AlphaPoint.translation('CONFIRM_REJECT.RECIPIENT') || 'Recipient'
                    : AlphaPoint.translation('CONFIRM_REJECT.SENTBY') || 'Sent by'}
                  <i style={sortIconStyles} className="material-icons">
                    sort
                  </i>
                </th>
                <th style={thStyle} onClick={() => this.sortSelectedTabBy('Amount')}>
                  {AlphaPoint.translation('CONFIRM_REJECT.AMOUNT') || 'Amount'}
                  <i style={sortIconStyles} className="material-icons">
                    sort
                  </i>
                </th>
                <th style={thStyle} onClick={() => this.sortSelectedTabBy('LastUpdateTimestamp')}>
                  {AlphaPoint.translation('CONFIRM_REJECT.TIME') || 'Time'}
                  <i style={sortIconStyles} className="material-icons">
                    sort
                  </i>
                </th>
                <th style={{verticalAlign: 'middle'}}>{AlphaPoint.translation('CONFIRM_REJECT.NOTE') || 'Note'}</th>
                <th style={thStyle} onClick={() => this.sortSelectedTabBy('Status')}>
                  {AlphaPoint.translation('CONFIRM_REJECT.STATUS') || 'Status'}
                  <i style={sortIconStyles} className="material-icons">
                    sort
                  </i>
                </th>
                {this.state.selectedTab === 'receivedRequests' && (
                  <th style={{verticalAlign: 'middle'}}>
                    {AlphaPoint.translation('CONFIRM_REJECT.ACTION') || 'Action'}
                  </th>
                )}
              </tr>
              </thead>
              <tbody>
              {data.slice(rowCount * page, rowCount * (page + 1)).map(req => {
                const date = new Date(req.LastUpdateTimestamp);

                return (
                  <tr key={uuidV4()}>
                    <td
                      style={tdStyle}>{this.state.selectedTab === 'sentRequests' ? req.PayerUsername : req.RequestorUsername}</td>
                    <td style={tdStyle}>
                      {formatNumberToLocale(req.Amount, AlphaPoint.products.value.find(prod => prod.ProductId === req.ProductId).DecimalPlaces)}&nbsp;
                      <strong>{req.ProductName}</strong>
                    </td>
                    <td style={tdStyle}>{date.toLocaleString()}</td>
                    <td style={tdNoteStyle}>{req.Notes}</td>
                    <td style={tdStyle}>{req.Status}</td>
                    {this.state.selectedTab === 'receivedRequests' && (
                      <td style={{display: 'flex', flexWrap: 'wrap'}}>
                        {req.Status === 'Requested' && (
                          <button className="deposit-button btn btn-action" onClick={() => this.confirmRequest(req)}>
                            {AlphaPoint.translation('CONFIRM_REJECT.SEND') || 'Send'}
                          </button>
                        )}
                        {req.Status === 'Requested' && (
                          <button className="withdraw-button btn btn-action" onClick={() => this.rejectRequest(req)}>
                            {AlphaPoint.translation('CONFIRM_REJECT.IGNORE') || 'Ignore'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              </tbody>
            </table>
            {data.length > 5 && pagination && (
              <ul className={paginationClass}>
                <li>
                  <a onClick={() => this.setState({page: 0})}>&laquo;</a>
                </li>
                {pages}
                <li onClick={() => this.setState({page: totalPages - 1})}>
                  <a>&raquo;</a>
                </li>
              </ul>
            )}
          </div>
        )}
        {(this.state.useFA && this.state.hold2FA) &&
        (<Modal close={this.closeModal}>
          <TwoFACodeInput {...this.state.useFA} submit={this.do2FAVerification}/>
        </Modal>)}
      </div>
    );
  }
}

export default ConfirmReject;
