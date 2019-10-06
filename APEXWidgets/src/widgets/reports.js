/* global AlphaPoint, document, $, AP_API, localStorage, APConfig, Blob, window */
import React from 'react';
import Pikaday from 'react-pikaday';
import {b64toBlob} from './helper';
import WidgetBase from './base';

class Reports extends React.Component {
  constructor() {
    super();

    this.state = {
      userAccounts: [],
      reportType: 'TradeActivity',
      prevReports: [],
      pendingReports: [],
      selectedAccounts: [AlphaPoint.selectedAccount.value],
      StartTime: new Date(),
      EndTime: new Date(),
      scheduled: false,
      frequency: 'Hourly',
      allAccountsSelected: false,
      scheduledTickets: [],
      accountsInfo: [],
    };
  }

  componentWillMount() {
    this.pollUserReportData();
  }

  componentDidMount() {
    this.userAccounts = AlphaPoint.userAccounts.subscribe((userAccounts) => this.setState({userAccounts}));

    this.userReports = AlphaPoint.userReports.subscribe((reports) => {
      this.setState({
        prevReports: reports.filter((report) => report.resultStatus === 'SuccessComplete'),
        pendingReports: reports.filter((report) => report.resultStatus !== 'SuccessComplete' && report.resultStatus !== 'Cancelled'),
      });
    });

    this.userAccountsInfo = AlphaPoint.userAccountsInfo.subscribe((accountsInfo) => this.setState({accountsInfo}));

    this.userReportTickets = AlphaPoint.userReportTickets.subscribe((tickets) => {
      const scheduledTickets = tickets.filter((ticket) => ticket.ReportFrequency !== 'onDemand' && ticket.RequestStatus !== 'UserCancelled');

      this.setState({scheduledTickets});
    });
  }

  componentWillUnmount() {
    this.userAccounts.dispose();
    this.userReports.dispose();
    this.userReportTickets.dispose();
    this.userAccountsInfo.dispose();
  }

  pollUserReportData = () => {
    AlphaPoint.getUserReportWriterResultRecords();
    AlphaPoint.getUserReportTickets();
  };

  changeReportType = e => this.setState({reportType: e.target.value});

  handleCheck = e => {
    const {value, checked} = e.target;

    if (value === 'all') {
      if (checked) {
        return this.setState({
          selectedAccounts: this.state.userAccounts,
          allAccountsSelected: true,
        });
      }
      return this.setState({
        selectedAccounts: [],
        allAccountsSelected: false,
      });
    }

    if (checked) {
      this.setState({selectedAccounts: this.state.selectedAccounts.concat(+value)});
    } else {
      this.setState({
        selectedAccounts: this.state.selectedAccounts.filter((account) => +value !== account),
      });
    }

    return true;
  }

  handleScheduledCheck = e => this.setState({scheduled: e.target.checked});

  changeStartTime = date => this.setState({StartTime: date});

  changeEndTime = date => this.setState({EndTime: date});

  changeFrequency = e => this.setState({frequency: e.target.value});

  validate = () => {
    if (!this.state.StartTime) return true;

    if (!this.state.scheduled && !this.state.EndTime) return true;

    if (!this.state.selectedAccounts.length) return true;

    return false;
  }

  handleSubmit = () => {
    const today = new Date();
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const startTimeUTC = Date.parse(this.state.StartTime);
    const startTime = new Date(this.state.StartTime);
    const endTime = new Date(this.state.EndTime);
    const requestType = this.state.scheduled ?
      `Schedule${this.state.reportType}Report`
      :
      `Generate${this.state.reportType}Report`;
    const requestPayload = {
      accountIdList: this.state.selectedAccounts,
      omsId: AlphaPoint.oms.value,
    };

    if (!this.state.scheduled) {
      if (endTime > today) {
        return $.bootstrapGrowl(
          AlphaPoint.translation('REPORTS.END_DATE_EARLIER_CURRENT') || 'End date has to be earlier than current date',
          {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'},
        );
      }
      endTime.setHours(23, 59, 59, 999);
      requestPayload.startTime = new Date(startTime.getTime() - (startTime.getTimezoneOffset() * 60000)).toISOString();
      requestPayload.endTime = new Date(endTime.getTime() - (endTime.getTimezoneOffset() * 60000)).toISOString();
    } else {
      if (startTimeUTC < todayUTC) {
        return $.bootstrapGrowl(
          AlphaPoint.translation('REPORTS.START_DATE_NOT_EARLIER_CURRENT') || 'Start date for scheduled reports can\'t be earlier than the current date',
          {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'},
        );
      }
      requestPayload.frequency = this.state.frequency;
      requestPayload.beginTime = startTime.toISOString();
    }

    document.APAPI.RPCCall(requestType, requestPayload, (data) => {
      if (data.RequestStatus === 'Submitted') {
        $.bootstrapGrowl(
          AlphaPoint.translation('REPORTS.REQUEST_SUBMITTED') || 'Report request submitted',
          {...AlphaPoint.config.growlerDefaultOptions, type: 'succcess'},
        );
      }

      if (data.bAccepted === false) {
        $.bootstrapGrowl(
          data.rejectMessage,
          {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'},
        );
      }

      this.pollUserReportData();
      this.props.close();
    });
  }

  handleCancelReport = reportId => {
    document.APAPI.RPCCall('CancelUserReport', {UserReportId: reportId}, (data) => {
      if (data.result) {
        const pendingReports = this.state.pendingReports.filter((report) => report.urtTicketId !== reportId);

        this.setState({pendingReports});
        $.bootstrapGrowl(
          AlphaPoint.translation('REPORTS.CANCELLED') || 'Report cancelled',
          {...AlphaPoint.config.growlerDefaultOptions, type: 'success'},
        );
      }
    });
  }

  handleCancelScheduledReport = requestId => {
    document.APAPI.RPCCall('CancelUserReport', {UserReportId: requestId}, (data) => {
      if (data.result) {
        const scheduledTickets = this.state.scheduledTickets.filter((ticket) => ticket.RequestId !== requestId);

        this.setState({scheduledTickets});
        $.bootstrapGrowl(
          AlphaPoint.translation('REPORTS.SCHEDULED_CANCELLED') || 'Scheduled report cancelled',
          {...AlphaPoint.config.growlerDefaultOptions, type: 'success'},
        );
      }
    });
  }

  createNewWebsocketConnection = callback => {
    this.ws = new AP_API();

    this.ws.Connect(localStorage.getItem('tradingServer') || APConfig.API_V2_URL);

    this.ws.IsConnectedEvent.attach(() => {
      this.ws.RPCCall('WebAuthenticateUser', {SessionToken: localStorage.getItem('SessionToken')}, (rv) => {
        if (rv.Authenticated) {
          localStorage.setItem('SessionToken', rv.SessionToken);
          callback();
        }
      });
    });
  }

  handleDownload = (descriptorId, name) => {
    // this.createNewWebsocketConnection(() => {
    //   this.ws.RPCCall('DownloadDocument', { descriptorId: descriptorId }, (response) => {
    //     if (response.statusCode === 'Success') this.createDocumentFile(response);
    //   });
    // });
    document.APAPI.RPCCall('DownloadDocument', {descriptorId}, (response) => {
      if (response.statusCode === 'Success') this.createDocumentFile(response, name);
    });
  }

  createDocumentFile = (fileInfo, name) => {
    const calls = fileInfo.numSlices;
    const blobsArray = [];
    let sliceNum = 0;
    let remainingSlices = fileInfo.numSlices;

    function saveFile() {
      const a = document.createElement('a');

      document.body.appendChild(a);
      a.setAttribute('style', 'display: none');
      return (data, fileName) => {
        const blob = new Blob(data, {type: 'text/csv'});
        const url = window.URL.createObjectURL(blob);

        if ((window.navigator.appVersion.toString().indexOf('.NET') > 0 ||
          window.navigator.appVersion.toString().indexOf('Edge') > 0) &&
          window.navigator.msSaveBlob) {
          return window.navigator.msSaveBlob(blob, `${fileName}.csv`);
        }

        a.href = url;
        a.download = `${fileName}.csv`;
        a.click();
        return window.URL.revokeObjectURL(url);
      };
    }

    function createAndSaveFile(data) {
      if (data.statusCode === 'Success') {
        blobsArray.push(b64toBlob(data.base64Bytes));
        remainingSlices--;
        if (!remainingSlices) {
          const save = saveFile();

          save(blobsArray, name);
          // const blob = new Blob(blobsArray, { type: 'text/csv' });
          // const fileObj = {
          //   href: window.URL ? window.URL.createObjectURL(blob) : window.webkitURL.createObjectURL(blob),
          //   name: fileInfo.docName,
          // };
          // window.open(fileObj.href, '_self');

          // this.ws.closeConnection();
          // this.ws = null;
        }
      }
    }

    for (let i = 0; i < calls; i++) {
      document.APAPI.RPCCall('DownloadDocumentSlice', {
        descriptorId: fileInfo.descriptorId,
        sliceNum: sliceNum++
      }, createAndSaveFile);
    }
  };

  render() {
    const isAztec = AlphaPoint.config.siteName === 'aztec';

    return (
      <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('REPORTS.TITLE_TEXT') || 'Reports'}>
        <div className="pad reports">
          <div className="clearfix">
            <div className="row">
              <div className="col-xs-6">
                <div className="form-group">
                  <label htmlFor="reportType">
                    {AlphaPoint.translation('REPORTS.CHOOSE_REPORT_TYPE') || 'Choose report type:'}
                  </label>
                  <select name="reportType" id="reportType" className="form-control" onChange={this.changeReportType}>
                    <option value="TradeActivity">
                      {AlphaPoint.translation('REPORTS.TRADE_ACTIVITY') || 'Trade Activity'}
                    </option>
                    <option value="TransactionActivity">
                      {AlphaPoint.translation('REPORTS.TRANSACTION_ACTIVITY') || 'Transaction Activity'}
                    </option>
                    <option value="TreasuryActivity">
                      {AlphaPoint.translation('REPORTS.TREASURY_ACTIVITY') || 'Treasury Activity'}
                    </option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="reportType">
                    {AlphaPoint.translation('REPORTS.START_DATE') || 'Start date:'}
                  </label>
                  <Pikaday value={this.state.StartTime} onChange={this.changeStartTime} className="form-control"/>
                </div>
                {!this.state.scheduled &&
                <div className="form-group">
                  <label htmlFor="reportType">
                    {AlphaPoint.translation('REPORTS.END_DATE') || 'End date:'}
                  </label>
                  <Pikaday value={this.state.EndTime} onChange={this.changeEndTime} className="form-control"/>
                </div>}
                <div className="form-group">
                  <div className="checkbox">
                    <label htmlFor="scheduled">
                      <input id="scheduled" type="checkbox" onClick={this.handleScheduledCheck}
                             style={{position: 'static'}}/> &nbsp;
                      {AlphaPoint.translation('REPORTS.SCHEDULED') || 'Scheduled'}
                    </label>
                  </div>
                </div>
                {this.state.scheduled &&
                <div className="form-group">
                  <label htmlFor="frequency">
                    {AlphaPoint.translation('REPORTS.CHOOSE_FRECUENCY') || 'Choose frequency:'}
                  </label>
                  <select name="frequency" id="frequency" className="form-control" onChange={this.changeFrequency}>
                    <option value="Hourly">
                      {AlphaPoint.translation('REPORTS.HOURLY') || 'Hourly'}
                    </option>
                    <option value="Daily">
                      {AlphaPoint.translation('REPORTS.DAILY') || 'Daily'}
                    </option>
                    <option value="Weekly">
                      {AlphaPoint.translation('REPORTS.WEEKLY') || 'Weekly'}
                    </option>
                    <option value="Monthly">
                      {AlphaPoint.translation('REPORTS.MONTHLY') || 'Monthly'}
                    </option>
                    <option value="Annual">
                      {AlphaPoint.translation('REPORTS.ANNUAL') || 'Annual'}
                    </option>
                  </select>
                </div>}
              </div>
              <div className="col-xs-6">
                <div className="form-group">
                  <label htmlFor="accounts">
                    {AlphaPoint.translation('REPORTS.CHOOSE_ACCOUNTS') || 'Choose accounts:'}
                  </label>
                  {this.state.userAccounts.length > 1 &&
                  <div className="checkbox">
                    <label htmlFor="all">
                      <input id="all" type="checkbox" value="all" onClick={this.handleCheck}
                             style={{position: 'static'}}/> &nbsp;
                      {AlphaPoint.translation('REPORTS.ALL') || 'All'}
                    </label>
                  </div>}
                  {this.state.userAccounts.map(account => {
                    const info = this.state.accountsInfo.find((inf) => inf.AccountId === account);

                    return (<div className="checkbox" key={account}>
                      <label htmlFor={`account${account}`}>
                        <input
                          id={`account${account}`}
                          type="checkbox"
                          value={account}
                          onChange={this.handleCheck}
                          checked={!!~this.state.selectedAccounts.indexOf(account)}
                          disabled={this.state.allAccountsSelected}
                          style={{position: 'static'}}
                        /> <span style={{opacity: this.state.allAccountsSelected ? 0.5 : 1}}>
                          {info.AccountName}
                        </span>
                      </label>
                    </div>);
                  })}
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xs-12">
                {this.state.errorMessage}
              </div>
            </div>
            <div className="row around-xs">
              <button onClick={this.pollUserReportData}>
                {AlphaPoint.translation('REPORTS.REFRESH_REPORTS') || 'Refresh reports'}&nbsp;
                <i title="Refresh" className={isAztec ? "fa fa-refresh" : 'material-icons'} onClick={this.refresh}>
                  {!isAztec && 'refresh'}
                </i>
              </button>
              <button onClick={this.handleSubmit} disabled={this.validate()}>
                {this.state.scheduled ?
                  AlphaPoint.translation('REPORTS.SCHEDULE_REPORT') || 'Schedule report' :
                  AlphaPoint.translation('REPORTS.GENERATE_REPORT') || 'Generate report'}
              </button>
            </div>
          </div>

          {this.state.pendingReports.length ?
            <div style={{marginTop: '1rem'}}>
              <h6 style={{marginBottom: '0.5rem'}}>
                {AlphaPoint.translation('REPORTS.PENDING_REPORTS') || 'Pending reports:'}
              </h6>
              <table className="table">
                <thead>
                <tr>
                  <th>
                    {AlphaPoint.translation('REPORTS.REPORT') || 'Report'}
                  </th>
                  <th>
                    {AlphaPoint.translation('REPORTS.STATUS') || 'Status'}
                  </th>
                  <th style={{textAlign: 'center'}}>
                    {AlphaPoint.translation('REPORTS.ACTIONS') || 'Actions'}
                  </th>
                </tr>
                </thead>
                <tbody>
                {this.state.pendingReports.map((report) => {
                  const descriptionArray = report.reportDescriptiveHeader.split('|');
                  const name = `${descriptionArray[1]} ${descriptionArray[0]} from
                      ${descriptionArray[2].substr(0, 10)} to ${descriptionArray[3].substr(0, 10)}`;

                  return (
                    <tr>
                      <td>{name}</td>
                      <td>{report.resultStatus}</td>
                      <td style={{textAlign: 'center'}}>
                          <span
                            style={{cursor: 'pointer'}}
                            onClick={() => this.handleCancelReport(report.urtTicketId)}
                          >
                            <i className={isAztec ? "fa fa-ban" : "material-icons"}>{!isAztec && 'cancel'}</i>&nbsp;
                            {AlphaPoint.translation('REPORTS.CANCEL') || 'Cancel'}
                          </span>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div> : null}

          {this.state.scheduledTickets.length ?
            <div style={{marginTop: '1rem'}}>
              <h6 style={{marginBottom: '0.5rem'}}>
                {AlphaPoint.translation('REPORTS.SCHEDULE_REPORTS') || 'Schedule reports:'}
                </h6>
              <table className="table">
                <thead>
                <tr>
                  <th>{AlphaPoint.translation('REPORTS.TYPE') || 'Type'}</th>
                  <th>{AlphaPoint.translation('REPORTS.FREQUENCY') || 'Frequency'}</th>
                  <th>{AlphaPoint.translation('REPORTS.ACCOUNTS') || 'Accounts'}</th>
                  <th>{AlphaPoint.translation('REPORTS.CREATED') || 'Created'}</th>
                  <th style={{textAlign: 'center'}}>
                    {AlphaPoint.translation('REPORTS.ACTIONS') || 'Actions'}
                  </th>
                </tr>
                </thead>
                <tbody>
                {this.state.scheduledTickets.map((report) => (
                  <tr>
                    <td>{report.reportFlavor}</td>
                    <td>{report.ReportFrequency}</td>
                    <td>
                      <ul style={{listStyle: 'none', marginBottom: 0}}>
                        {report.accountIds.map((id) => {
                          const info = this.state.accountsInfo.find((inf) => inf.AccountId === id);

                          return (<li>{info.AccountName}</li>);
                        })}
                      </ul>
                    </td>
                    <td>{report.createTime.substring(0, 10)}</td>
                    <td style={{textAlign: 'center'}}>
                      <span
                        style={{cursor: 'pointer'}}
                        onClick={() => this.handleCancelScheduledReport(report.RequestId)}
                      >
                        <i className={isAztec ? "fa fa-ban" : "material-icons"}>{!isAztec && 'cancel'}</i>&nbsp;
                        {AlphaPoint.translation('REPORTS.CANCEL') || 'Cancel'}
                      </span>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div> : null}

          {this.state.prevReports.length ?
            <div style={{marginTop: '1rem'}}>
              <h6 style={{marginBottom: '0.5rem'}}>
                {AlphaPoint.translation('REPORTS.PREVIOUS_REPORTS') || 'Previous reports:'}
              </h6>
              <table className="table">
                <thead>
                <tr>
                  <th>
                    {AlphaPoint.translation('REPORTS.REPORT') || 'Report'}
                  </th>
                  <th>
                    {AlphaPoint.translation('REPORTS.CREATED') || 'Created'}
                  </th>
                  <th>
                    {AlphaPoint.translation('REPORTS.LINK') || 'Link'}
                  </th>
                </tr>
                </thead>
                <tbody>
                {this.state.prevReports.map((report) => {
                  const descriptionArray = report.reportDescriptiveHeader.split('|');
                  const name = `${descriptionArray[1]} ${descriptionArray[0]} from ${
                    descriptionArray[1] === 'Hourly' ?
                      descriptionArray[2].replace(/[TZ]/g, ' ').trim() :
                      descriptionArray[2].substr(0, 10)
                    } to ${
                    descriptionArray[1] === 'Hourly' ?
                      descriptionArray[3].split('T')[1].replace('Z', '') :
                      descriptionArray[3].substr(0, 10)
                    }`;

                  return (
                    <tr>
                      <td style={{width: '380px'}}>{name}</td>
                      <td>{report.reportExecutionCompleteTime.substring(0, 10)}</td>
                      <td>
                        <a onClick={() => this.handleDownload(report.descriptorId, name)}>
                          {!isAztec && <i className="material-icons">file_download</i>}
                          {AlphaPoint.translation('REPORTS.DOWNLOAD') || 'Download'}
                        </a>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div> : null}
        </div>
      </WidgetBase>
    );
  }
}

Reports.defaultProps = {
  close: () => {
  },
};

Reports.propTypes = {
  close: React.PropTypes.func,
};

export default Reports;
