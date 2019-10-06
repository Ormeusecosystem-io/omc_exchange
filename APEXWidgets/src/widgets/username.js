/* global AlphaPoint, document, localStorage */
import React from 'react';
import Rx from 'rx-lite';
import uuidV4 from 'uuid/v4';
import { changeAccount } from './helper';

class Username extends React.Component {
  constructor() {
    super();

    this.state = {
      session: {},
      accounts: [],
      selectedAccount: null,
    };
  }

  componentDidMount() {
    this.accounts = AlphaPoint.userAccountsInfo.subscribe(accounts => this.setState({ accounts }));
    this.accountChangedEvent = AlphaPoint.selectedAccount
      .subscribe(selectedAccount => this.setState({ selectedAccount }));

    this.userTransferRequests = Rx.Observable.combineLatest(
      AlphaPoint.selectedAccount,
      AlphaPoint.sentTransferRequests,
      AlphaPoint.receivedTransferRequests,
      (selectedAccount, sentRequests, receivedRequests) => ({
        sentRequests: sentRequests[selectedAccount] || [],
        receivedRequests: receivedRequests[selectedAccount] || [],
      }),
    ).subscribe(({ sentRequests, receivedRequests }) => {
      const openRequests = [...sentRequests, ...receivedRequests].filter(req => req.Status === 'Requested');

      if (document.getElementById('UserRequestsCount')) {
        document.getElementById('UserRequestsCount').innerText = openRequests.length;
      }
    });
  }

  componentWillUnmount() {
    this.accounts.dispose();
    this.userTransferRequests.dispose();
    this.accountChangedEvent.dispose();
  }

  settingsDirect = () => {
    document.location = 'settings.html';
  };

  renderDropdown = selectedAccount => (
    <div>
      <button
        className="btn dropdown-toggle"
        type="button"
        id="dropdown-profile"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="true"
      >
        {selectedAccount.AccountName}
        <span className="caret" style={{ marginLeft: '10px' }} />
      </button>
      <ul className="dropdown-menu" aria-labelledby="dropdown-profile">
        {this.state.accounts
          .filter(account => account.AccountId !== selectedAccount.AccountId)
          .map(account => {
            const { AccountId, AccountName } = account;

            return (
              [
                <li key={uuidV4()}>
                  <a onClick={() => changeAccount(AccountId)}>
                    {AlphaPoint.translation('USERNAME.ACCOUNT') || 'Account'} {AccountName}
                  </a>
                </li>,
                <li key={uuidV4()} role="separator" className="divider" />,
              ]
            );
          })}
        {AlphaPoint.config.templateStyle !== 'standard' &&
          <li>
            <a href="settings.html" onClick={this.settingsDirect}>
              <i className="material-icons">settings</i>{AlphaPoint.translation('USERNAME.SETTINGS') || 'Settings'}
            </a>
          </li>}
        <li role="separator" className="divider" />
        <li>
          <a onClick={AlphaPoint.getLogout} to="/">
            <i className="material-icons">
              exit_to_app</i>{AlphaPoint.translation('USERNAME.SIGNOUT') || 'Sign Out'}
          </a>
        </li>
      </ul>
    </div>
  );

  render() {
    const currentAccountInfo = this.state.accounts.find(account => (
      account.AccountId === this.state.selectedAccount
    )) || {};
    const shouldRender = AlphaPoint.config.templateStyle === 'retail' || AlphaPoint.config.templateStyle === 'standard';

    return (
      <span>
        {shouldRender ? this.renderDropdown(currentAccountInfo) : currentAccountInfo.AccountName}
      </span>
    );
  }
}

export default Username;
