/* global AlphaPoint */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { formatNumberToLocale, sortProducts, allowDeposit, allowWithdraw, getAccountStatus } from './helper';
import WidgetBase from './base';
import Modal from './modal';
import WithdrawDigital from './withdrawDigital';
import DepositDigital from './depositDigital';
import TransferDigital from './TransferDigital';
import WithdrawFIAT2 from './withdrawFIAT2';
import DepositFIAT from './depositFIAT';
import VerificationRequired from './verificationRequired';
import ErrorPopup from './errorPopup';

class BalanceRow extends React.Component {
  constructor() {
    super();

    this.state = {
      sortDirection: {
        currency: true,
        balance: true,
        hold: true,
        deposits: true,
      },
      rowState: 'success',
      isDeposit: false,
      isTransfer: false,
      isWithdraw: false,
      deposit: false,
      withdraw: false,
      name: false,
      balance: false
    };
  }

  openDeposit = () => this.setState({ isDeposit: true });

  openTransfer = () => this.setState({isTransfer: true})

  openWithdraw = () => this.setState({ isWithdraw: true });

  closeDeposit = () => this.setState({ isDeposit: false });

  closeTransfer = () => this.setState({isTransfer: false})

  closeWithdraw = () => this.setState({ isWithdraw: false });

  mouseEnter = str => this.setState({ hover: str });

  mouseLeave = () => this.setState({ hover: '' });

  openMobileDetails = () => this.setState({ showMobile: !this.state.showMobile });

  render() {
    const actionButtons = (
      <div className="balances-value account-action-buttons">
          <button className={`deposit-button btn btn-action ${this.props.ProductType}`} onClick={() => this.props.onItemClick({view: "deposit", coin: this.props.ProductSymbol, productId: this.props.ProductId})}>
            <img src="images/icons/deposit.svg" alt="" /><span>{AlphaPoint.translation('BUTTONS.TEXT_DEPOSIT') || 'Deposit'}</span>
          </button>
          <button className="withdraw-button btn btn-action" onClick={() => this.props.checkWithdrawPermission() && this.props.onItemClick({view: "withdrawal", coin: this.props.ProductSymbol, productId: this.props.ProductId, availableBalance: availableBalance, fullName: this.props.fullName})}>
              <img src="images/icons/withdraw.svg" alt="" /><span>{'Withdraw'}</span>
          </button>
      </div>
    )
    let name = this.state.hover === 'name' ? this.props.fullName : this.props.ProductSymbol;
    if (AlphaPoint.config.ReverseBalanceHover) {
      name = this.state.hover === 'name' ? this.props.ProductSymbol : this.props.fullName;
    }

    const availableBalance = this.props.Amount - this.props.Hold;
    const showWithdrawButton = allowWithdraw(this.props.ProductSymbol);
    const showDepositButton = allowDeposit(this.props.ProductSymbol);
    const currency_name = AlphaPoint.config.BalanceHover ? name : this.props.fullName; 
    const topRowActive = this.state.showMobile ? 'top-row-active' : '';
    const topRowActiveWhite = this.state.showMobile ? 'white-' : '';
    return (
      <div className="row">
        <div className={`top-row ${topRowActive}`}>
          <div className={`balances-value currency-icon icon-${currency_name}`} >
            <div style={{width: "20px", marginRight: "10px"}}>
              <img src={`images/icons/${this.props.ProductSymbol.toLowerCase()}.svg`} alt="" />
            </div>
            {AlphaPoint.config.BalanceHover ? name : this.props.fullName}
          </div>
          <div className="balances-value balance-value">
            {this.props.fullName}
          </div>
          <div
            className="balances-value balance-value"
            onMouseEnter={() => this.mouseEnter('balance')}
            onMouseLeave={this.mouseLeave}
          >
            {formatNumberToLocale(this.props.Amount, this.props.DecimalPlaces)}
            {/* {this.state.hover === 'balance'
                ? formatNumberToLocale(this.props.Amount, this.props.DecimalPlaces)
                : formatNumberToLocale(this.props.Amount, AlphaPoint.config.decimalPlaces)} */}
          </div>

          <div className="balances-value balance-hold" style={{ position: 'relative' }} onMouseEnter={() => this.mouseEnter('hold')}
            onMouseLeave={this.mouseLeave}>
            {this.state.hover === 'hold'
              ? formatNumberToLocale(this.props.Hold, this.props.DecimalPlaces)
              : this.props.Hold > 0 ? formatNumberToLocale(this.props.Hold, 8) : formatNumberToLocale(this.props.Hold, AlphaPoint.config.decimalPlaces)}
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

          <div className="balances-value pending-deposits" style={{ position: 'relative' }}>
            {this.state.hover === 'deposit'
              ? formatNumberToLocale(this.props.PendingDeposits, this.props.DecimalPlaces)
              : formatNumberToLocale(this.props.PendingDeposits, AlphaPoint.config.decimalPlaces)}
            {this.props.unconfirmed ? <div /> : null}
          </div>
          {
            this.props.windowWidth > 768 && actionButtons
          }
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
          this.state.isTransfer && (
            <Modal close={this.closeTransfer}>
              <VerificationRequired>
                <TransferDigital
                  productId={this.props.ProductId}
                  product={this.props.ProductSymbol}
                  type={this.props.ProductType}
                  amount={this.props.Amount}
                  hold={this.props.Hold}
                  close={this.closeTransfer}
                  balance={availableBalance}
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
                  availableBalance={availableBalance}
                  balance={this.props.Amount}
                  Product={this.props.ProductSymbol}
                  close={this.closeWithdraw}
                />
              </VerificationRequired>
            </Modal>
          )}
        </div>
        {this.props.windowWidth <= 768 && actionButtons}
        {this.state.showMobile &&
        <div>

          <div className="currency-details">
            <div className="currency-detail-rows">
              <div className="detail-name">Balance</div>

              <div className="detail-amount">{this.props.Amount}</div>
            </div>
            <div className="currency-detail-rows">
              <div className="detail-name">Hold</div>
              <div className="detail-amount">{availableBalance}</div>
            </div>
            <div className="currency-detail-rows">
              <div className="detail-name">Pending</div>
              <div className="detail-amount">{formatNumberToLocale(this.props.PendingDeposits, AlphaPoint.config.decimalPlaces)}</div>
            </div>
          </div>

          <div className="action-buttons-row">
            <div className="balances-value account-action-buttons">
              { (showDepositButton && this.props.ProductSymbol !== 'CPS') &&
              <button className={`deposit-button btn btn-action ${this.props.ProductType}`} onClick={this.openDeposit}>
                <img src="images/icons/buttonIcon_deposit_withdraw_16X16.svg" alt="" /><span>{AlphaPoint.translation('BUTTONS.TEXT_DEPOSIT') || 'Deposit'}</span>
              </button>
              }
              <button className={`transfer-button btn btn-action`} onClick={this.openTransfer}>
                <img src="images/icons/buttonicons_transfer_16X16.svg" alt="" /><span>transfer</span>
              </button>
              { (showWithdrawButton && this.props.ProductSymbol !== 'CPS') &&
              <button className="withdraw-button btn btn-action" onClick={() => this.props.checkWithdrawPermission() && this.openWithdraw()}>
                <img src="images/icons/buttonIcon_withdraw_white_16X16.svg" alt="" /><span>{AlphaPoint.translation('BUTTONS.TEXT_WITHDRAW') || 'Withdraw'}</span>
              </button>
              }
            </div>
          </div>

        </div>
        }
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
      sortDirection: {
        currency: true,
        balance: true,
        hold: true,
        deposits: true,
      },
      showMobile: false,
      accountInformation: [],
      session: {},
      filter: 'all',
      showLogin: false,
      accountInformationError: '',
      sessionError: '',
      products: [],
      selectedAccount: null,
      accountInfo: null,
      errorModal: false,
      windowWidth: window.innerWidth
    };
  }

  checkWithdrawPermission(){
    const {allowedToProceed, errorMessage} = this.props.checkWithdrawPermission()
    if(!allowedToProceed){
      this.setState({...this.state, errorModal: true, errorMessage})
    }
    return allowedToProceed
  }

  handleResize() {
      this.setState({windowWidth: window.innerWidth})
  }

  async componentDidMount() {
    window.addEventListener('resize', this.handleResize.bind(this));
    this.accountChangedEvent = AlphaPoint.selectedAccount
      .subscribe(selectedAccount => {
        if(!this.state.selectedAccount) this.setState({ selectedAccount });
      });
    this.products = AlphaPoint.products.subscribe(data => !this.state.products.length && this.setState({ ...this.state, products: data.length ? data : [] }) );
    
    this.accountInformation = AlphaPoint.accountPositions.subscribe(accountInformation => {
      if (AlphaPoint.config.sortProducts) {
        accountInformation.sort(sortProducts);
      }
      if(accountInformation && accountInformation.length){
        accountInformation = accountInformation.map(info => {
          if(info.ProductSymbol === 'BTC' || info.ProductSymbol === 'ETH'){
            return {...info, Amount: Number(formatNumberToLocale(info.Amount, 8))}
          }
          return {...info, Amount: Number(formatNumberToLocale(info.Amount, 4))}
        })
      }
      if(!this.state.accountInformation.length) this.setState({ ...this.state, accountInformation });
    });

  }

  componentWillUnmount() {
    const keys = Object.keys(this);
    keys.filter(key => this[key].dispose ).forEach(key => this[key].dispose() && delete this[key]);
  }

  switchFilter = filter => this.setState({ filter });

  loginToggle = () => this.setState({ showLogin: !this.state.showLogin });

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

    const sorted_array = [].concat(this.state.accountInformation).sort(compare);
    const sortDirection = this.state.sortDirection;
    sortDirection[fieldName] = !this.state.sortDirection[fieldName];
    this.setState({ accountInformation: sorted_array, sortDirection });
  };

  onClickVerifyAccount(){
    window.location.href = "/settings.html#account-verification"
  }

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
        if (currency.ProductSymbol !== "BTC" && currency.ProductSymbol !== "ETH") return false;
        if (currency.AccountId !== this.state.selectedAccount) return false;
        if (!currency.fullName || currency.fullName === undefined) return false;
        if (this.state.filter === 'all') return true;
        if (this.state.filter === 'crypto' && currency.ProductType === 'CryptoCurrency') return true;
        if (this.state.filter === 'fiat' && currency.ProductType === 'NationalCurrency') return true;

        return false;
      })
      .map((currency, idx) => <BalanceRow windowWidth={this.state.windowWidth} onItemClick={this.props.onItemClick} key={idx} {...currency} checkWithdrawPermission={() => this.checkWithdrawPermission()}/>);

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
      <div id="right" className="column">
          <div className="balances-table">
              <div id="balances-table-header">
              <div className="tables-title">Balances</div>
              <div id="search_button"></div>
              </div>
              <div className='ap-balances'>
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
                        <div className="balance-table-heading">
                          <span>{this.state.windowWidth > 768 ? 'Currency' : 'Coin'}</span>
                          
                        </div>
                        <div className="balance-table-heading">
                          <span>Name</span>
                          
                        </div>
                        <div className="balance-table-heading">
                          <span>{AlphaPoint.translation('BALANCES.BALANCE') || 'Balance'}</span>
                          
                        </div>
                        <div className="balance-table-heading">
                          <span>{AlphaPoint.translation('BALANCES.HOLD') || 'Hold'}</span>
                          
                        </div>
                        <div className="balance-table-heading">
                          <span>{AlphaPoint.translation('BALANCES.PENDING_DEPOSITS') || 'Pending deposits'}</span>
                          
                        </div>
                        <div className="balance-table-heading">
                          <span>{AlphaPoint.translation('BALANCES.ACCOUNT_ACTIONS') || 'Account Actions'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {rows}
                  {this.state.errorModal &&
                    <ErrorPopup close={() => this.setState({errorModal: false})} verify={() => this.onClickVerifyAccount()} errorMessage={this.state.errorMessage}/>
                  }
                </WidgetBase>
              </div>
          </div>
      </div>
    );
  }
}

// Balances.defaultProps = {}

export default Balances;
