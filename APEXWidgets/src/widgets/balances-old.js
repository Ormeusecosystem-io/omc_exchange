/* global AlphaPoint */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { formatNumberToLocale, sortProducts, allowDeposit, allowWithdraw } from './helper';
import WidgetBase from './base';

import Modal from './modal';
import WithdrawDigital from './withdrawDigital';
import DepositDigital from './depositDigital';
import WithdrawFIAT2 from './withdrawFIAT2';
import DepositFIAT from './depositFIAT';
import VerificationRequired from './verificationRequired';

class BalanceRowssss extends React.Component {
  constructor() {
    super();

    this.state = {
      rowState: 'success',
      isDeposit: false,
      isWithdraw: false,
      deposit: false,
      withdraw: false,
      name: false,
      balance: false,
    };
  }

  openDeposit = () => this.setState({ isDeposit: true });

  openWithdraw = () => this.setState({ isWithdraw: true });

  closeDeposit = () => this.setState({ isDeposit: false });

  closeWithdraw = () => this.setState({ isWithdraw: false });

  mouseEnter = str => this.setState({ hover: str });

  mouseLeave = () => this.setState({ hover: '' });

  render() {
    let name = this.state.hover === 'name' ? this.props.fullName : this.props.ProductSymbol;
    if (AlphaPoint.config.ReverseBalanceHover) {
      name = this.state.hover === 'name' ? this.props.ProductSymbol : this.props.fullName;
    }
    const availableBalance = this.props.Amount - this.props.Hold;
    const showWithdrawButton = allowWithdraw(this.props.ProductSymbol);
    const showDepositButton = allowDeposit(this.props.ProductSymbol);
    return (
      <div className="col-xs-12">
        <div className="row">
          <div
            className="col-sm-2 col-xs-2"
            style={{ textAlign: 'center' }}
            onMouseEnter={() => this.mouseEnter('name')}
            onMouseLeave={this.mouseLeave}
          >
            <span className="currency-name">
              {AlphaPoint.config.BalanceHover ? name : this.props.fullName}
              <span className="hidden-sm hidden-md hidden-lg"> : {this.props.Amount}</span>
            </span>
          </div>

          <div
            className="col-sm-2 col-xs-10 hidden-xs"
            style={{ textAlign: 'center' }}
            onMouseEnter={() => this.mouseEnter('balance')}
            onMouseLeave={this.mouseLeave}
          >
            <div>
              <small>{AlphaPoint.translation('BALANCES.BALANCE') || 'Balance'}</small>
            </div>
            <div>
              {this.state.hover === 'balance'
                ? formatNumberToLocale(this.props.Amount, this.props.DecimalPlaces)
                : formatNumberToLocale(this.props.Amount, AlphaPoint.config.decimalPlaces)}
            </div>
          </div>

          <div
            className="col-sm-2 col-xs-4"
            style={{ textAlign: 'center' }}
            onMouseEnter={() => this.mouseEnter('hold')}
            onMouseLeave={this.mouseLeave}
          >
            <div>
              <small>{AlphaPoint.translation('BALANCES.HOLD') || 'Hold'}</small>
            </div>
            <div style={{ position: 'relative' }}>
              {this.state.hover === 'hold'
                ? formatNumberToLocale(this.props.Hold, this.props.DecimalPlaces)
                : formatNumberToLocale(this.props.Hold, AlphaPoint.config.decimalPlaces)}
            </div>
          </div>

          {/* COMMENTED OUT UNTIL PENDING WITHDRAW IS WORKING
          <div className="col-sm-2  col-xs-4" style={{textAlign:'right'}}
              onMouseEnter={this.mouseEnter.bind(this,'withdraw')} onMouseLeave={this.mouseLeave}>
          <div>
            <small>{AlphaPoint.translation('BALANCES.PENDING_WITHDRAWS') || "Pending withdraws"}</small>
          </div>

          <div style={{position:'relative'}}> */}
          {/* this.state.hover==='withdraw' ?
            this.props.unconfirmedWithdraw : this.props.unconfirmedWithdraw.toFixed(this.props.decimalPlaces) */}
          {/* this.props.unconfirmedWithdraw ? <div style={{
             position:'absolute', backgroundColor:'#61bae2',
             height:7, width:7, borderRadius:'100%',
             top: 6, left: -13
             }}></div> : null } */}

          <div
            className="col-sm-2  col-xs-4"
            style={{ textAlign: 'center' }}
            onMouseEnter={() => this.mouseEnter('deposit')}
            onMouseLeave={this.mouseLeave}
          >
            <div>
              <small>{AlphaPoint.translation('BALANCES.PENDING_DEPOSITS') || 'Pending deposits'}</small>
            </div>
            <div style={{ position: 'relative' }}>
              {this.state.hover === 'deposit'
                ? formatNumberToLocale(this.props.PendingDeposits, this.props.DecimalPlaces)
                : formatNumberToLocale(this.props.PendingDeposits, AlphaPoint.config.decimalPlaces)}
              {this.props.unconfirmed ? <div /> : null}
            </div>
          </div>

          <div className="col-sm-4  col-xs-4" style={{ textAlign: 'center' }}>
            { showWithdrawButton &&
              <button className="deposit-button btn btn-action" onClick={this.openDeposit}>
                {AlphaPoint.translation('BUTTONS.TEXT_DEPOSIT') || 'Deposit'}
              </button>
            }
            { showDepositButton &&
              <button className="withdraw-button btn btn-action" onClick={this.openWithdraw}>
                {AlphaPoint.translation('BUTTONS.TEXT_WITHDRAW') || 'Withdraw'}
              </button>
            }
          </div>

          {this.props.ProductType === 'CryptoCurrency' &&
            this.state.isDeposit && (
              <Modal close={this.closeDeposit}>
                <VerificationRequired>
                  <DepositDigital
                    Product={this.props.ProductSymbol}
                    close={this.closeDeposit}
                  />
                </VerificationRequired>
              </Modal>
            )}

          {this.props.ProductType === 'CryptoCurrency' &&
            this.state.isWithdraw && (
              <Modal close={this.closeWithdraw}>
                <VerificationRequired>
                  <WithdrawDigital
                    Product={this.props.ProductSymbol}
                    balance={availableBalance}
                    fullName={this.props.fullName}
                    close={this.closeWithdraw}
                  />
                </VerificationRequired>
              </Modal>
            )}

          {this.props.ProductType === 'NationalCurrency' &&
            this.state.isDeposit && (
              <Modal close={this.closeDeposit}>
                <VerificationRequired>
                  <DepositFIAT
                    Product={this.props.ProductSymbol}
                    close={this.closeDeposit}
                  />
                </VerificationRequired>
              </Modal>
            )}

          {this.props.ProductType === 'NationalCurrency' &&
            this.state.isWithdraw && (
              <Modal close={this.closeWithdraw}>
                <VerificationRequired>
                  <WithdrawFIAT2
                    balance={this.props.Amount}
                    Product={this.props.ProductSymbol}
                    close={this.closeWithdraw}
                  />
                </VerificationRequired>
              </Modal>
            )}
        </div>
      </div>
    );
  }
}

BalanceRow.defaultProps = {
  fullName: '',
  ProductSymbol: '',
  Amount: null,
  Hold: null,
  ProductType: '',
  PendingDeposits: null,
  DecimalPlaces: null,
  unconfirmed: false,
};

BalanceRow.propTypes = {
  fullName: React.PropTypes.string,
  ProductSymbol: React.PropTypes.string,
  Amount: React.PropTypes.number,
  Hold: React.PropTypes.number,
  ProductType: React.PropTypes.string,
  PendingDeposits: React.PropTypes.number,
  DecimalPlaces: React.PropTypes.number,
  unconfirmed: React.PropTypes.bool,
};

class Balances extends React.Component {
  constructor() {
    super();

    this.state = {
      accountInformation: [],
      session: {},
      filter: 'all',
      showLogin: false,
      accountInformationError: '',
      sessionError: '',
      products: [],
      selectedAccount: null,
    };
  }

  componentDidMount() {
    this.accountChangedEvent = AlphaPoint.selectedAccount
      .subscribe(selectedAccount => {
        this.setState({ selectedAccount });
      });
    this.products = AlphaPoint.products.subscribe(data => this.setState({ products: data.length && data }));
    this.accountInformation = AlphaPoint.accountPositions.subscribe(accountInformation => {
      if (AlphaPoint.config.sortProducts) {
        accountInformation.sort(sortProducts);
      }
      this.setState({ accountInformation });
    });
  }

  componentWillUnmount() {
    this.accountChangedEvent.dispose();
    this.accountInformation.dispose();
    this.products.dispose();
  }

  switchFilter = filter => this.setState({ filter });

  loginToggle = () => this.setState({ showLogin: !this.state.showLogin });

  render() {
    this.state.accountInformation.forEach(balance => {
      const product = this.state.products.find(prod => prod.Product === balance.ProductSymbol) || {};
      const name = this.state.products.find(prod => prod.Product === balance.ProductSymbol) || {};

      /* eslint-disable no-param-reassign */
      balance.DecimalPlaces = product.DecimalPlaces;
      balance.ProductType = product.ProductType;
      balance.fullName = name.ProductFullName;
      /* eslint-enable no-param-reassign */
    });

    const rows = this.state.accountInformation
      .filter(currency => {
        if (currency.AccountId !== this.state.selectedAccount) return false;
        if (!currency.fullName || currency.fullName === undefined) return false;
        if (this.state.filter === 'all') return true;
        if (this.state.filter === 'crypto' && currency.ProductType === 'CryptoCurrency') return true;
        if (this.state.filter === 'fiat' && currency.ProductType === 'NationalCurrency') return true;
        return false;
      })
      .map((currency, idx) => <BalanceRow key={idx} {...currency} />);

    let filter = (
      <div>
        <span className={`tab ${this.state.filter === 'all' ? 'active' : ''}`} onClick={() => this.switchFilter('all')}>
          {AlphaPoint.translation('BALANCES.TAB_ALL') || 'All'}
        </span>
        <span
          className={`tab ${this.state.filter === 'crypto' ? 'active' : ''}`}
          onClick={() => this.switchFilter('crypto')}
        >
          {AlphaPoint.translation('BALANCES.TAB_CRYPTO') || 'Crypto'}
        </span>
        <span
          className={`tab ${this.state.filter === 'fiat' ? 'active' : ''}`}
          onClick={() => this.switchFilter('fiat')}
        >
          {AlphaPoint.translation('BALANCES.TAB_FIAT') || 'Fiat'}
        </span>
      </div>
    );

    if (AlphaPoint.config.noBalanceFilter) filter = <div />;

    return (
      // wrap all content in widget base
      <WidgetBase
        login
        {...this.props}
        left={filter}
        error={this.state.accountInformation.rejectReason}
        headerTitle={AlphaPoint.translation('BALANCES.TITLE_TEXT') || 'Balances'}
        hideCloseLink
      >
        {AlphaPoint.config.displayBalancesHeaders && (
          <div className="table-div-headings">
            <div className="row">
              <div className="col-sm-2 col-xs-2" style={{ textAlign: 'center', fontWeight: '500' }}>
                {AlphaPoint.translation('BALANCES.CURRENCY') || 'Currency'}
              </div>
              <div className="col-sm-2 col-xs-10 hidden-xs" style={{ textAlign: 'center', fontWeight: '500' }}>
                {AlphaPoint.translation('BALANCES.BALANCE') || 'Balance'}
              </div>
              <div className="col-sm-2 col-xs-4" style={{ textAlign: 'center', fontWeight: '500' }}>
                {AlphaPoint.translation('BALANCES.HOLD') || 'Hold'}
              </div>
              <div className="col-sm-2  col-xs-4" style={{ textAlign: 'center', fontWeight: '500' }}>
                {AlphaPoint.translation('BALANCES.PENDING_DEPOSITS') || 'Pending deposits'}
              </div>
              <div className="col-sm-4  col-xs-4" style={{ textAlign: 'center', fontWeight: '500' }}>
                {AlphaPoint.translation('BALANCES.ACCOUNT_ACTIONS') || 'Account Actions'}
              </div>
            </div>
          </div>
        )}
        {rows}
      </WidgetBase>
    );
  }
}

// Balances.defaultProps = {}

export default Balances;
