/* global AlphaPoint */
import React from 'react';

import WidgetBase from './base';
import Modal from './modal';
import ProcessingButton from '../misc/processingButton';

class APIKeys extends React.Component {
  constructor() {
    super();

    this.state = {
      data: [],
      showOptions: false,
      level: 0,
      keyShown: {},
      processing: false,
      processingDelete: null,
      trading: false,
      deposit: false,
      withdraw: false,
    };

    const data = { UserId: AlphaPoint.userData.value.UserId };
    AlphaPoint.getAPIKey(data);
  }

  componentDidMount() {

    this.getKeys = AlphaPoint.myApiKeys.subscribe((data) => {
      this.setState({ data });
    });

    this.addApiKey = AlphaPoint.addApiKey.subscribe((res) => {
      if(res.APIKey){
        const keys = [].concat(this.state.data);
        keys.push(res);
        return this.setState({
          trading: false,
          deposit: false,
          withdraw: false,
          data: keys || [],
          showOptions: false,
          keyShown: res,
          processing: false,
        });
      }
    });

    this.removeApiKey = AlphaPoint.removeApiKey.subscribe((res) => {
      if (res.result) {
        const keys = [];
        const key = this.state.processingDelete;

        this.state.data.forEach((k) => {
          if (k.APIKey !== key) keys.push(k); // eslint-disable-line no-undef
        });

        this.setState({
          data: keys || [],
          processingDelete: null,
        });
      }
    });
  }

  componentWillUnmount() {
    this.getKeys.dispose();
    this.addApiKey.dispose();
    this.removeApiKey.dispose();
  }

  showOptions = (showOptions) => this.setState({ showOptions });

  addKey = () => {
    const Permissions = [];

    this.setState({ processing: true, skip: true });

    if (this.state.trading) Permissions.push('Trading');
    if (this.state.withdraw) Permissions.push('Withdraw');
    if (this.state.deposit) Permissions.push('Deposit');

    AlphaPoint.createAPIKey({
      UserId: AlphaPoint.userData.value.UserId,
      Permissions,
    });
  }

  deleteKey = (key) => {
    const toDelete = {
      UserId: AlphaPoint.userData.value.UserId,
      APIKey: key,
    };

    this.setState({ processingDelete: key });
    AlphaPoint.deleteAPIKey(toDelete);
  }

  selectTrading = (e) => this.setState({ trading: e.target.checked });

  selectDeposit = (e) => this.setState({ deposit: e.target.checked });

  selectWithdraw = (e) => this.setState({ withdraw: e.target.checked });

  removeKeyShown = () => this.setState({ keyShown: {} });

  render() {
    const apis = this.state.data.map((k) => {
      if (k.APIKey) {
        return(<tr key={k.APIKey} colSpan="5">
          <td>{k.APIKey}</td>
          <td>{k.APISecret}</td>
          <td>{k.Permissions && k.Permissions.indexOf('Deposit') > -1 ? 'true' : 'false'}</td>
          <td>{k.Permissions && k.Permissions.indexOf('Withdraw') > -1 ? 'true' : 'false'}</td>
          <td>{k.Permissions && k.Permissions.indexOf('Trading') > -1 ? 'true' : 'false'}</td>
          <td>
            <ProcessingButton
              processing={this.state.processingDelete === k.APIKey}
              className="btn-action btn-sm"
              onClick={() => this.deleteKey(k.APIKey)}
            >
              {AlphaPoint.translation('APIKEY.BUTTON_DELETE') || 'Delete'}
            </ProcessingButton>
          </td>
        </tr>);
      }
    });

    return (
      <WidgetBase login {...this.props} headerTitle={AlphaPoint.translation('APIKEY.TITLE_TEXT') || 'API Keys'}>
        {this.state.keyShown.apiPrivateKey &&
          <Modal close={this.removeKeyShown}>
            <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('APIKEY.TITLE_TEXT') || 'API Keys'}>
              <div className="pad">
                <div>{AlphaPoint.translation('APIKEY.TABLE_KEY') || 'Public Key'} : {this.state.keyShown.apiPublicKey}</div>
                <div>{AlphaPoint.translation('APIKEY.TABLE_SECRET') || 'Secret Key'} : {this.state.keyShown.apiPrivateKey}</div>
                <br />
                <p>
                  Please write this Secret Key down as
                  it will not be displayed again. If you lose your
                  Secret Key you will have to delete your key and generate a new one.
                </p>
                <div className="clearfix">
                  <div className="pull-right">
                    <button className="btn btn-action" onClick={this.removeKeyShown}>Close</button>
                  </div>
                </div>
              </div>
            </WidgetBase>
          </Modal>}

        {this.state.level < AlphaPoint.config.apiKeysLevel ?
          <div>
            <h3 className="text-center">{AlphaPoint.translation('APIKEY.TITLE_NOT_VERIFY') || 'API Keys require Level 2 Verification.'}</h3>
            <h3 className="text-center">{AlphaPoint.translation('APIKEY.SUBTITLE_NOT_VERIFY') || 'Email support to get access.'}</h3>
          </div>
          :
          <span>
            <table className="table table-hover">
              <thead>
                <tr colSpan="6">
                  <th className="header">{AlphaPoint.translation('APIKEY.TABLE_KEY') || 'Public Key'}</th>
                  <th className="header">{AlphaPoint.translation('APIKEY.TABLE_SECRET') || 'Secret Key'}</th>
                  <th className="header">Allow Deposits</th>
                  <th className="header">{AlphaPoint.translation('APIKEY.TABLE_WITHDRAW') || 'Allow Withdraws'}</th>
                  <th className="header">Allow Trading </th>
                  <th className="header" />
                </tr>
              </thead>
              <tbody>
                {apis}
              </tbody>
            </table>
            <div className="pad clearfix">
              {!this.state.showOptions ?
                <button className="btn btn-success btn-sm" onClick={() => this.showOptions(true)}>
                  {AlphaPoint.translation('APIKEY.BUTTON_GET_NEW_KEY') || 'Get New Key'}
                </button>
                :
                <div className="keyGeneration" ng-show="showKeyGenerator">
                  <div className="keyPermissions">
                    <input
                      type="checkbox"
                      name="allow_trading"
                      onClick={this.selectTrading}
                      value={this.state.trading}
                    />
                    <span>Trading</span>
                    <br />
                    <input
                      type="checkbox"
                      name="allow_orders"
                      onClick={this.selectDeposit}
                      value={this.state.deposit}
                    />
                    <span>Deposits</span>
                    <br />
                    <input
                      type="checkbox"
                      name="allow_withdraw"
                      onClick={this.selectWithdraw}
                      value={this.state.withdraw}
                    />
                    <span>Withdraws</span>
                  </div>
                  <br />
                  <ProcessingButton
                    processing={this.state.processing}
                    className="btn btn-success btn-sm"
                    onClick={this.addKey}
                    translate="APIKEY.BUTTON_GENERATE"
                  >
                    {AlphaPoint.translation('APIKEY.BUTTON_GENERATE') || 'Generate Key'}
                  </ProcessingButton>
                </div>}
            </div>
            <div className="docs pad clearfix">
              <p>
                The Public API is available in HTTP, WebSocket, and Get Request, with streaming data on
                products, product pairs, ticker activity, trades, and the order book.
              </p>
              <p>
                The Private API is accessible only by registered users and enables access and control of a
                user&rsquo;s account. All key user functions may be executed from the API, including account
                and order management activities.
              </p>
              <p>You can access the API using the following websocket address:<br />
                <strong>{AlphaPoint.config.API_V2_URL || 'https://alphapoint.com/api'}</strong>
              </p>
              <p ap-translate="PAGE_ABOUT.BODY"><a href={AlphaPoint.config.API_LINK || 'https://alphapoint.com/api'} target="_blank">API Documentation</a></p>
            </div>
          </span>}
      </WidgetBase>
    );
  }
}

export default APIKeys;
