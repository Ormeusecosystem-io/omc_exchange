/* global AlphaPoint, document */
import React from 'react';
import { changeAccount } from './helper';

class AccountSelect extends React.Component {
  constructor() {
    super();

    this.state = {
      selectedAccount: null,
      accounts: [],
      session: {},
    };
  }

  componentDidMount() {
    this.accounts = AlphaPoint.userAccountsInfo.subscribe(accounts => this.setState({accounts}));
    this.session = AlphaPoint.accountInfo.subscribe(session => this.setState({session}));
    this.selectedAccount = AlphaPoint.selectedAccount.subscribe(
      (selectedAccount) => this.setState({selectedAccount}),
    );
  }

  componentWillUnmount() {
    this.selectedAccount.dispose();
    this.userAccountsInfo.dispose();
    this.session.dispose();
    this.accounts.dispose();
  }

  logout = (e) => {
    e.preventDefault();
    AlphaPoint.logout();
    document.location = AlphaPoint.config.logoutRedirect;
  }

  render() {
    const { accounts, session } = this.state;
    const showLogoutLink = AlphaPoint.config.siteName !== 'aztec';
    const currentAccountInfo = this.state.accounts.find(account => (
      account.AccountId === this.state.selectedAccount
    )) || {};
    return (
      <div className="user-menu-container start-xs">
        <div className="dropdown">
          <button
            className="dropdown-toggle"
            type="button"
            id="dropdownMenu2"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            {`${AlphaPoint.translation('ACCOUNT_SELECT.TITLE_TEXT') || 'Account'}`} {currentAccountInfo.AccountName}
            {showLogoutLink || accounts.length > 1 ?
              <span className="caret" style={{ marginLeft: '1rem' }} /> : null}
          </button>
          {!accounts.length && !showLogoutLink ?
            null
            :
            <ul className="dropdown-menu" aria-labelledby="dropdownMenu2">
              {
                <li>
                  <a>
                    <i
                      className="fa fa-user-circle"/> {AlphaPoint.translation('USERNAME.ACCOUNT_ID') || 'Account ID'} {this.state.selectedAccount}
                  </a>
                </li>
              }
              {
                accounts.map((account) => {
                  if (Number(account.AccountId) !== Number(this.state.selectedAccount)) {
                    return (
                      [
                        <li role="separator" className="divider"/>,
                        <li>
                          <a onClick={() => changeAccount(account.AccountId)}>
                            {AlphaPoint.translation('USERNAME.ACCOUNT_ID') || 'Account ID'} {account.AccountId}
                          </a>
                        </li>,
                      ]
                    );
                  }
                })
              }
              {AlphaPoint.config.siteName !== 'aztec' ?
                <li id="logoutLinkContainer">
                  <a onClick={this.logout}>{AlphaPoint.translation('ACCOUNT_SELECT.SIGNOUT') || 'Sign Out'}</a>
                </li>
                :
                null}
            </ul>}
        </div>
      </div>
    );
  }
}

export default AccountSelect;
