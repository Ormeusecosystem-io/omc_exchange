/* global $, AlphaPoint, APConfig */
import React from 'react';
import ScrollLock from 'react-scrolllock';
import Rx from 'rx-lite';
import uuidV4 from 'uuid/v4';
import {
  truncateToDecimals,
  formatNumberToLocale,
  parseNumberToLocale,
  customFixed,
  getAccountStatus
} from './helper';

import WidgetBase from './base';
import Modal from './modal';
import InputLabeled from '../misc/inputLabeled';
import ProcessingButton from '../misc/processingButton';
import TwoFACodeInput from './twoFACodeInput';
import ErrorPopup from './errorPopup';
import {SuccessPopup} from './successPopup';

const WAValidator = require('wallet-address-validator');

class WithdrawDigital extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showTemplateTypeSelect: false,
      showTemplate: false,
      showDefaultForm: false,
      templateTypes: [],
      template: {},
      validAddress: false,
      data: {},
      prodName: '',
      error: '',
      success: '',
      setAmount: null,
      setAmountString: '',
      accountId: 0,
      productId: 0,
      twoFA: {},
      twoFACancel: false,
      processing: false,
      withdraw2FA: false,
      maxValueFormatted: '',
      addressErrMsg: '',
      selected: props.Product || "",
      fullName: props.fullName || "",
      dropdownOpen: false,
      accountInformation: [],
      accountInfo: null,
      address: "",
      balance: 0,
      hold: 0,
      availableBalance: 0,
      PendingWithdraws: ""
    };
  }

  async componentDidMount() {
    let payload = {};
    const instrument = this.props.Product || APConfig.WithdrawCryptoProduct;

    this.productsAndAccount = Rx.Observable.combineLatest(
      AlphaPoint.selectedAccount,
      AlphaPoint.products,
      (accountId, products) => {
        if (accountId && products.length) {
          const data = {
            accountId,
            OMSId: AlphaPoint.oms.value,
            productId: products.find((product) => product.Product === instrument).ProductId,
          };

          payload = data;
          return data;
        }
        return false;
      },
    )
      .filter(data => data)
      .take(1)
      .subscribe((data) => {
        if (data) {
          this.setState(data);
          AlphaPoint.getWithdrawTemplateTypes(data);
        }
      });

    this.withdrawTemplateTypes = AlphaPoint.withdrawTemplateTypes
      .filter((res) => Object.keys(res).length)
      .subscribe((res) => {
        if (res.result) {
          if (res.TemplateTypes.length > 1) {
            return this.setState({
              showTemplateTypeSelect: true,
              selectedTemplate: res.TemplateTypes[0],
              templateTypes: res.TemplateTypes,
            });
          }

          const templateData = {
            accountId: payload.accountId,
            productId: payload.productId,
            templateType: res.TemplateTypes[0],
          };

          return AlphaPoint.getWithdrawTemplate(templateData);
        }

        return this.setState({showDefaultForm: true});
      });

    this.withdrawTemplate = AlphaPoint.withdrawTemplate.subscribe((res) => {
      if (res.result) {
        if (!res.Template || res.Template === '[]') {
          return this.setState({showDefaultForm: true});
        }
        const response = JSON.parse(res.Template);

        if (response.isSuccessful) {
          return this.setState({
            template: response.Template,
            showTemplate: true,
            showTemplateTypeSelect: false,
          });
        }
        return this.setState({
          template: response,
          showTemplate: true,
          showTemplateTypeSelect: false,
        });
      }
      return false;
    });

    this.submitWithdraw = AlphaPoint.submitWithdraw.subscribe((res) => {
      if (Object.keys(res).length) {
        if (res.requireGoogle2FA || res.requireAuthy2FA || res.requireSMS2FA) {
          return this.setState({data: res, twoFA: res, processing: false});
        }

        if (res.result) {
          const successMessage = AlphaPoint.translation('WITHDRAW.CRYPTO_RECEIVED') || 'Request Received';
          const successMessage2 = AlphaPoint.translation('WITHDRAW.CRYPTO_CONFIRM') || 'Please Check your email';

          this.setState({
            data: res,
            withdraw2FA: res.result,
            success: '',
            error: '',
            processing: false,
          }, () => {
            AlphaPoint.getWithdrawTickets({
              OMSId: AlphaPoint.oms.value,
              AccountId: AlphaPoint.selectedAccount.value,
            });
          });
        } else {
          if (res.errormsg === 'Waiting for 2FA.') { // eslint-disable-line no-lonely-if
            this.setState({data: res, twoFA: {withdraw2FA_Request: true}, processing: false});
          } else if (res.errormsg === 'Server Error' && !res.detail) {
            this.setState({
              data: res,
              success: '',
              error: AlphaPoint.translation('WITHDRAW.INVALID_VALUES') || 'Check fields for invalid values.',
              processing: false
            });

            $.bootstrapGrowl(
              AlphaPoint.translation('WITHDRAW.WITHDRAW_FAILED') || 'Withdraw Failed',
              {
              type: 'danger',
              allow_dismiss: true,
              align: AlphaPoint.config.growlwerPosition,
              delay: AlphaPoint.config.growlwerDelay,
              offset: {from: 'top', amount: 30},
              left: '60%',
            });
          } else {
            this.setState({data: res, success: '', error: `${res.errormsg}.`, processing: false});
            $.bootstrapGrowl(res.detail, {
              type: 'danger',
              allow_dismiss: true,
              align: AlphaPoint.config.growlwerPosition,
              delay: AlphaPoint.config.growlwerDelay,
              offset: {from: 'top', amount: 30},
              left: '60%',
            });
          }
        }

        return AlphaPoint.submitWithdraw.onNext([]);
      }
      return false;
    });

    if (AlphaPoint.config.useWithdrawFees) {
      this.withdrawFee = AlphaPoint.withdrawFee.subscribe(fee => this.setState({fee}));
    }

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
      accountInformation = accountInformation.filter(info => info.ProductSymbol === "BTC" || info.ProductSymbol === "ETH")
      let newState = {...this.state, accountInformation};
      if(accountInformation.length > 0){
        let {availableBalance, hold, balance, PendingWithdraws} = this.getAvailableBalance(accountInformation);
        newState = {...newState, balance, hold, availableBalance, PendingWithdraws};
      }
      this.setState(newState);
    });

    this.accountInformation2 = AlphaPoint.accountInfo.subscribe(data => {
      this.setState({...this.state,accountInfo: data})
    })
  }
  
  onClickVerifyAccount(){
    window.location.href = "/settings.html#account-verification"
  }
  

  getAvailableBalance(accountInformation, selected){
    const prodSelected = selected || this.state.selected;
    let balance = accountInformation.find(info => info.ProductSymbol === prodSelected).Amount;
    let hold = accountInformation.find(info => info.ProductSymbol === prodSelected).Hold;
    let availableBalance = balance - hold > 0 ? balance - hold : 0;
    let PendingWithdraws = accountInformation.find(info => info.ProductSymbol === prodSelected).PendingWithdraws
    return {availableBalance, hold, balance, PendingWithdraws};
  }

  componentWillUnmount() {
    this.accountInformation.dispose()
    this.accountInformation2.dispose()
    this.withdrawTemplateTypes.dispose()
    AlphaPoint.withdrawTemplateTypes.onNext([]);
    AlphaPoint.withdrawTemplate.onNext([]);
    AlphaPoint.submitWithdraw.onNext([]);
  
  }

  onChangeTemplateField = (e) => {
    const template = {...this.state.template};
    template[e.target.name] = e.target.value;
    if(e.target.name === 'ExternalAddress'){
      if(e.target.value === ''){
        return this.setState({
          ...this.state,
          template, 
          validAddress: false, 
          addressErrMsg: '',
          address: e.target.value
        })
      }
      const validAddress = WAValidator.validate(e.target.value, this.state.selected);
      const addressErrMsg = `Please enter a valid ${this.state.fullName} address`;
      return validAddress ? this.setState({validAddress, template, addressErrMsg: false, address: e.target.value}) : this.setState({validAddress, template, addressErrMsg, address: e.target.value })
    }
    return this.setState({template});
  };

  getWithdrawTemplate = () => {
    const payload = {
      accountId: this.state.accountId,
      productId: this.state.productId,
      templateType: this.state.selectedTemplate,
    };

    AlphaPoint.getWithdrawTemplate(payload);
  };

  withdraw = () => {
    if(!this.state.validAddress){
      return this.setState({addressErrMsg: this.state.addressErrMsg || 'Required field'});
    }
    const balance = this.state.balance;
    const availableBalance = this.state.availableBalance;
    const {fee, setAmount, template: templateFields} = this.state;
    const payload = {
      OMSId: AlphaPoint.oms.value,
      accountId: this.state.accountId,
      productId: this.state.productId,
      amount: setAmount === balance ? setAmount - fee : setAmount,
      templateForm: JSON.stringify(this.state.template),
      TemplateType: this.state.template.TemplateType || 'ToExternalBitcoinAddress',
    };
    if (templateFields.ExternalAddress === '') {
      return this.setState({
        error: AlphaPoint.translation('WITHDRAW.ENTER_ADDRESS') || 'Please enter the external address you\'d like to withdraw to',
        processing: false,
      });
    }

    if (setAmount === '' || setAmount <= 0) {
      return this.setState({
        error: AlphaPoint.translation('WITHDRAW.VALID_AMOUNT') || 'Please enter a valid amount to withdraw',
        processing: false,
      });
    }

    this.setState({processing: true});
    if (this.refs.address) payload.sendToAddress = this.refs.address.value();
    if (this.props.Product === 'MON') payload.PaymentId = this.refs.paymentId.value();

    if (setAmount > availableBalance) {
      return this.setState({error: 'Insufficient Funds', success: '', processing: false});
    }

    return AlphaPoint.withdraw(payload).then(()=>{
      this.setState({success: AlphaPoint.translation('WITHDRAW.CONFIRM') || 'Withdraw request sent.', processing: false});
    });
  }

  checkWithdrawPermission(){
    const {allowedToProceed, errorMessage} = this.props.checkWithdrawPermission()
    if(!allowedToProceed){
      this.setState({...this.state, errorModal: true, errorMessage})
    }
    return allowedToProceed
  }

  do2FAVerification = (Code) => {
    const data = {Code};

    this.auth2FAuthentication = AlphaPoint.auth2FA.subscribe((res) => {
      if (!res.Authenticated) {
        return this.setState({
          twoFA: {},
          success: '',
          error: AlphaPoint.translation('WITHDRAW.CODE_REJECTED') || 'Code Rejected',
        });
      }
      return this.setState({
        twoFA: {},
        success: AlphaPoint.translation('PROFILE.SAVED') || 'Saved!',
        error: '',
      });
    });

    return AlphaPoint.authenticate2FA(data);
  }

  sendAmount = (amount) => this.setState({setAmount: amount});

  // onKeyPress = (e) => {
  //   if (e.key === "-" || (e.key >= "a" && e.key <= "z") || (e.key >= "A" && e.key <= "Z")) {
  //     e.preventDefault();
  //   }
  // }

  changeAmount = value => {
    const patt = new RegExp('[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)');
    const res = patt.test(value);
    const precisionNum = (res) ? 10 : 8;
    // console.log("res: ", res)
    value = customFixed(value, precisionNum);
    
    
    if (AlphaPoint.config.useWithdrawFees && value) {
      AlphaPoint.getWithdrawFee({
        OMSId: AlphaPoint.oms.value,
        ProductId: this.state.productId,
        AccountId: this.state.accountId,
        Amount: value,
      });
    }
    return this.setState({
              ...this.state, 
              setAmount: value, 
              setAmountString: value
            });
    // return this.setState({ setAmount: value, setAmountString: maxValueFormatted, maxValueFormatted: maxValueFormatted });
  }

  closeModal = () => this.setState({ twoFA: {}, twoFACancel: true });

  selectWithdrawTemplate = (e) => this.setState({ selectedTemplate: e.target.value });

  toggleDropdown(flag){
    this.setState({...this.state, dropdownOpen: flag})
  }

  changeProd(prod, fullName){
    const productId = this.state.accountInformation.filter(({ProductSymbol}) => ProductSymbol == prod)[0].ProductId;
    let {availableBalance, hold, balance, PendingWithdraws} = this.getAvailableBalance(this.state.accountInformation, prod);
    this.setState({
        ...this.state, 
        selected: prod, 
        dropdownOpen: false, 
        fullName, address: "", 
        validAddress: false, 
        productId, 
        addressErrMsg: false,
        availableBalance,
        hold,
        balance,
        PendingWithdraws
    })
    this.props.changeProd(productId);
  }

  close(){
    this.setState({...this.state, data: {}, setAmountString: "", address: "", processing: false})
  }

  render() {
    let balance = this.state.balance;
    let hold = this.state.hold;
    let PendingWithdraws = this.state.PendingWithdraws;
    let availableBalance = this.state.availableBalance;
    const headerTitle = `${AlphaPoint.translation('WITHDRAW.WITHDRAW') || 'Withdraw'} ${this.props.Product ? `(${this.props.Product})` : ''}`;
    if (this.state.showTemplateTypeSelect) {
      return (
        <WidgetBase
          {...this.props}
          headerTitle={headerTitle}
          success={this.state.success}
          customClass="withdraw-digital"
        >
          <div className="pad">
            <h3>{AlphaPoint.translation('WITHDRAW.SELECT_TEMPLATE') || 'Select a withdraw template'}</h3>
            <select className="form-control" onChange={this.selectWithdrawTemplate} value={this.state.selectedTemplate}>
              {this.state.templateTypes.map((type) => <option key={uuidV4()}>{type}</option>)}
            </select>
          </div>
          <div className="pad">
            
            {/* <div className="clearfix">
              <div className="pull-right" style={AlphaPoint.config.siteName === 'aztec' ? {width: '100%'} : null}>
                <button
                  className="btn btn-action btn-inverse"
                  onClick={this.props.close}
                >
                  {AlphaPoint.translation('BUTTONS.TEXT_CANCEL') || 'Cancel'}
                </button>
                <button
                  className="btn btn-action"
                  onClick={this.getWithdrawTemplate}
                >
                  {AlphaPoint.translation('BUTTONS.TEXT_NEXT') || 'Next'}
                </button>
              </div>
            </div> */}
          </div>
        </WidgetBase>
      );
    }

    if (this.state.showTemplate || this.state.showDefaultForm) {
      return (
        <WidgetBase
          {...this.props}
          headerTitle={headerTitle}
          error={this.state.error}
          success={this.state.success}
          customClass="withdraw-digital"
          withCloseButton={true} 
        >
          <h1>Withdrawal</h1>
          <div className="pad">
            <div className="left">
              <p>Coin</p>
              <div id="dropdown">
                <div className="selected-holder" onClick={() => this.toggleDropdown(true)}>
                  <img src={`img/${this.state.selected.toLowerCase()}.png`}/>{this.state.selected} {this.state.selected === "BTC" ? "Bitcoin" : "Ethereum"} <img src="img/drop-copy2.svg" id="drop-icon"/>
                </div>
                {
                  this.state.dropdownOpen &&
                  <ul onMouseLeave={() => this.toggleDropdown(false)}>
                    <li onClick={() => this.changeProd("BTC", "Bitcoin")}><img src="img/btc.png"/>BTC Bitcoin</li>
                    <li onClick={() => this.changeProd("ETH", "Ethereum")}><img src="img/eth.png"/>ETH Ethereum</li>
                  </ul>
                }
              </div>
              <div className="balances">
                  <div className="row">
                    <div>Balance:</div>
                    <div>{balance}</div>
                  </div>
                  <div className="row">
                    <div>Hold:</div>
                    <div>{hold}</div>
                  </div>
                  <div className="row">
                    <div>Pending withdraws:</div>
                    <div>{PendingWithdraws}</div>
                  </div>
              </div>
            </div>
            <div className={`right-block clearfix ${this.state.selected}`}>
              <input onBlur={() => this.setState({ error: '' })} value={this.state.address} placeholder={`Recipient’s ${this.state.selected} address`} onChange={this.onChangeTemplateField} name="ExternalAddress"/>
              {this.state.addressErrMsg && <p className="error">{this.state.addressErrMsg}</p>}
              <div className="amount-holder">
                  <input
                    placeholder='Amount'
                    value={this.state.setAmountString}
                    onChange={(e)=>this.changeAmount(e.target.value)}
                    onBlur={() => this.setState({ error: '' })}
                    ref="amount"
                    type="number"
                    min="0"
                  />
                  
                  <div>
                    <span>Available balance:</span>
                    <div>{formatNumberToLocale(availableBalance, 8)} {this.state.selected}</div>
                  </div>
                  {this.state.error && <p className="error">{this.state.error}</p>}
              </div>
              <p><span>Minimum withdrawal:</span>0.00020000 {this.state.selected}</p>
              <div className="please-note">
                  <span>Please note:</span>
                  <div>Fees will be deducted from your withdrawal amount.</div>
              </div>
              <button className="btn btn-action" onClick={() => this.checkWithdrawPermission() && this.withdraw()}>Withdraw</button>
            </div>
          </div>
          {this.state.errorModal &&
            <ErrorPopup close={() => this.setState({errorModal: false})} verify={() => this.onClickVerifyAccount()} errorMessage={this.state.errorMessage}/>
          }
          {
            this.state.data.result && <SuccessPopup close={() => this.close()}/>
          }
        </WidgetBase>
      );
    }
    return null
  }
}

WithdrawDigital.defaultProps = {
  balance: null,
  Product: '',
  close: () => {
  },
  fullName: '',
};

WithdrawDigital.propTypes = {
  balance: React.PropTypes.oneOfType([
    React.PropTypes.number,
    React.PropTypes.string,
  ]),
  Product: React.PropTypes.string,
  close: React.PropTypes.func,
  fullName: React.PropTypes.string,
};

export default WithdrawDigital;

