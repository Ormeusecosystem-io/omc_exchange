/* global AlphaPoint, document, location $ */
import React from 'react';
import ScrollLock from 'react-scrolllock';

import QRCode from 'qrcode.react';
import WidgetBase from './base';
import SelectLabeled from '../misc/selectLabeled';
import InputLabeled from '../misc/inputLabeled';
import InputNoLabel from '../misc/inputNoLabel';
import Spinner from '../misc/spinner';
import Popup from './errorPopup';
import { formatNumberToLocale, sortProducts, allowDeposit, allowWithdraw } from './helper';

class DepositDigital extends React.Component {
  constructor(props) {
    super(props);

    this.getDeposits = this.getDeposits.bind(this);
    this.state = {
      address: [],
      addressList: [],
      dasAccount: '',
      dasExchangeAccount: '',
      selected: props.Product || '',
      productId: 0,
      selectedId: '',
      newkey: true,
      paymentIds: [],
      useImage: false,
      copied: 0,
      accountId: 0,
      products: [],
      showTemplate: false,
      template: null,
      templateFields: {},
      getNewDepositKeyClicked: false,
      nextBtnClicked: false,
      selectedAddress: '',
      selectedRadio: 'cotix',
      depositRequestTimedOut: false,
      depositRequestTimeOutId: 0,
      loadingDeposits: false,
      showQRCode: false,
      dropdownOpen: false,
      currentProd: "BTC",
      accountInformation: []
    };
  }

  componentDidUpdate(prevProps, prevState){
    if(prevState.products.length !== this.state.products.length && this.state.products.length > 0 && this.state.accountId !== 0
        || prevState.accountId !== this.state.accountId && this.state.products.length > 0){
      let payload = {
        OMSId: AlphaPoint.oms.value,
        AccountId: AlphaPoint.selectedAccount.value || AlphaPoint.userAccounts.value[0],
      };
      const productId = this.state.products.filter(({Product}) => Product == this.state.selected)[0].ProductId 
      const prevProductId = prevState.products.filter(({Product}) => Product == prevState.selected).length ? prevState.products.filter(({Product}) => Product == prevState.selected)[0].ProductId : false
      if((productId && productId != prevProductId) || (productId && prevState.accountId !== this.state.accountId && this.state.accountId)) {
        payload = {...payload,  ProductId: productId}
        this.setState({ ...this.state, productId });
        this.getDeposits(payload);
      }
    }
  }

  componentDidMount() {
    let payload = {
      OMSId: AlphaPoint.oms.value,
      AccountId: AlphaPoint.selectedAccount.value || AlphaPoint.userAccounts.value[0],
    };
    const product = this.props.Product;
    const currentProd = this.state.selected || product;

    if (AlphaPoint.config.siteName === 'bitcoindirect') this.setState({ siteName: true });

    this.products = AlphaPoint.products.subscribe((products) => {
      products = products.filter(prod => prod.Product === "BTC" || prod.Product === "ETH")
      this.setState({...this.state, products})
    });

    this.accountChangedEvent = AlphaPoint.selectedAccount
    .subscribe(selectedAccount => {
      this.setState({ accountId: selectedAccount });
    });

    if (AlphaPoint.config.useDepositTemplates) {
      this.depositTemplate = AlphaPoint.depositTemplate.subscribe((data) => {
        if (data.Template) {
          const fields = JSON.parse(data.Template.Template);

          if (!fields.length && data.Template.UseGetDepositWorkflow) {
            AlphaPoint.getDepositInfo({
              ...payload,
              GenerateNewKey: !AlphaPoint.config.optionalNewDepositKeys,
            });
          }
          if (!fields.length && !data.Template.UseGetDepositWorkflow && (data.Template.DepositWorkflow === 'CryptoWallet')) {
            AlphaPoint.getDepositInfo({
              ...payload,
              GenerateNewKey: !AlphaPoint.config.optionalNewDepositKeys,
            });
          }

          this.setState({
            showTemplate: !!Object.keys(fields).length,
            template: data.Template,
            templateFields: fields,
          });
        } else {
          this.setState({
            showTemplate: false,
            template: null,
            templateFields: {},
          });
        }
      });
    }

    this.deposits = AlphaPoint.deposits.subscribe((res) => {
      if(!res) return 
      const depositInfo = res && res.DepositInfo ? JSON.parse(res.DepositInfo) : '';
      let depositKey;
      let selectedKey;

      this.endDepositsRequestTimeout();

      if (this.props.Product === 'XRP') {
        for (let i = 0; i < depositInfo.length; i++) {
          depositInfo[i] = depositInfo[i].split('?dt=')[0];
        }
      }

      if (product === 'DAS' || this.props.Product === 'DASC') {
        let dasExchangeAccount;
        let dasAccount;
        for (let i = 0; i < depositInfo.length; i++) {
          // depositInfo[i] = depositInfo[i].split('?dt=')[0];
          // this.setState({ dasAccount: depositInfo[i].split('?dt=')[1] });
          dasExchangeAccount = depositInfo[i].split('?dt=')[0];
          dasAccount = depositInfo[i].split('?dt=')[1];
        }
        return this.setState({
          dasExchangeAccount,
          dasAccount,
          showTemplate: false,
          loadingDeposits: false,
        });
      }

      const keys = depositInfo;

      if (product === 'MON') {
        depositKey = keys.WalletAddress ? JSON.parse(keys.WalletAddress) : '';
        selectedKey = keys.PaymentIds ? keys.PaymentIds[0] : '';
        this.setState({ paymentIds: keys.PaymentIds, selectedId: selectedKey });
      } else {
        depositKey = keys !== '' ? keys.reverse() : '';
      }

      // if (this.props.Product === 'XRP') {
      //   for (let i = 0; i < depositKey.length; i++) {
      //     depositKey[i] += '?dt='+ AlphaPoint.userAccounts.value[0];
      //   }
      // }

      // need to add something to pick the newest address, not sure if it's max or min of array
      this.setState({
        showTemplate: !res.result,
        address: depositKey[0],
        addressList: depositKey,
        selectedAddress: depositKey[0],
        loadingDeposits: false,
      });

      if (this.state.getNewDepositKeyClicked) {
        this.setState({ selectedAddress: depositKey[0], getNewDepositKeyClicked: false });
      }
    });

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
      this.setState({ accountInformation });
    });
  }

  componentWillUnmount() {
    this.accountChangedEvent.dispose();
    this.products.dispose();
    this.accountInformation.dispose();
    this.endDepositsRequestTimeout();
  }
  

  getDeposits(payload) {
    this.startDepositsRequestTimeout();
    this.setState({ loadingDeposits: true });
    if (AlphaPoint.config.useDepositTemplates) {
      AlphaPoint.getDepositRequestInfoTemplate(payload);
    } else {
      AlphaPoint.getDepositInfo({ ...payload, GenerateNewKey: !AlphaPoint.config.optionalNewDepositKeys });
    }
  }

  getNewDepositKey = () => {
    AlphaPoint.getDepositInfo({
      OMSId: AlphaPoint.oms.value,
      AccountId: AlphaPoint.selectedAccount.value || AlphaPoint.userAccounts.value[0],
      ProductId: this.state.productId,
      GenerateNewKey: true,
    });
    // generate and display new QRcode
    this.setState({ getNewDepositKeyClicked: true });
  };

  endDepositsRequestTimeout() {
    if (this.depositRequestTimeOutId) {
      clearTimeout(this.depositRequestTimeOutId);
      this.depositRequestTimeOutId = 0;
    }
  }
  
  startDepositsRequestTimeout() {
    // const timeoutId = 
    this.depositRequestTimeOutId = setTimeout(() => {
      this.setState({ depositRequestTimedOut: true });
    }, 5000);
    // this.setState({ depositRequestTimeOutId: timeoutId });
  }

  addressChanged = (e) => this.setState({ selected: e.target.value });

  paymentIdChanged = (e) => this.setState({ selectedId: e.target.value });

  copyMeFunction = (e) => {
    e.preventDefault();
    const self = this;

    function copyAddress(text) {
      self.setState({ selectedAddress: text, selected: text });
      const textarea = document.createElement('textarea');
      textarea.id = 'copy-this-address';
      textarea.innerText = text;
      document.body.appendChild(textarea);
      textarea.select();

      try {
        if (document.execCommand('copy')) {
          $.bootstrapGrowl(
            AlphaPoint.translation('DEPOSIT.COPIED_TO_CLIPBOARD') || 'Address Copied to Clipboard',
            { ...AlphaPoint.config.growlerDefaultOptions, type: 'info' },
          );
          document.querySelector('#fillMe').textContent = text;
          textarea.remove();
          return true;
        }
      } catch (error) {
        throw error;
      }

      textarea.remove();
      return false;
    }

    $('li').unbind().on('click', (event) => {
      event.preventDefault();
      if (!copyAddress(event.target.textContent)) console.log('Copy failed'); // Do something
    });
  };

  deselect = () => {
    document.getSelection().removeAllRanges();
    this.setState({ useImage: false });
  };

  handleOnChangeTemplate = (e) => {
    const templateFields = { ...this.state.templateFields };

    templateFields[e.target.name] = e.target.value;
    this.setState({ templateFields });
  }

  handleSubmitTemplate = () => {
    AlphaPoint.getDepositInfo({
      OMSId: AlphaPoint.oms.value,
      ProductId: this.props.ProductId || this.state.productId,
      DepositInfo: JSON.stringify(this.state.templateFields),
      AccountId: AlphaPoint.selectedAccount.value,
      GenerateNewKey: !AlphaPoint.config.optionalNewDepositKeys,
    });
    this.setState({ nextBtnClicked: true, loadingDeposits: true });
  }

  checkRadioButton = (selectedRadio) => {
    this.setState({ selectedRadio });
  };

  toggleQRCode(flag){
    this.setState({...this.state, showQRCode: flag})
  }

  copyToClipboard(e){
    var x = e.pageX,
    y = e.pageY;
    var textField = document.createElement('textarea');
    textField.innerText = this.state.addressList[0]; //pass the value from state
    document.body.appendChild(textField)
    textField.select()
    document.execCommand('copy')
    textField.remove()
    var copied = document.createElement('span') // tooltip copied!
    copied.innerText = "Copied";
    copied.style = `
      position: absolute;
      top: ${Number(y)-50}px;
      left: ${Number(x)-40}px;
      font-size: 12px;
      background-image: linear-gradient(244deg, #2cbfdf, #2c9cdf);
      border-radius: 8px 4px 8px 0px;
      color: #fff;
      letter-spacing: 1px;
      font-family: book;
      padding: 5px 10px;
      z-index: 99999;
    `;
    document.body.appendChild(copied);
    setTimeout(()=>{copied.remove()},2000)
  }

  toggleDropdown(flag){
    this.setState({...this.state, dropdownOpen: flag})
  }

  changeProd(prod){
    const productId = this.state.products.filter(({Product}) => Product == prod)[0].ProductId 
    let payload = {
      OMSId: AlphaPoint.oms.value,
      AccountId: AlphaPoint.selectedAccount.value || AlphaPoint.userAccounts.value[0],
      productId
    };
    this.getDeposits(payload);
    this.setState({...this.state, selected: prod, dropdownOpen: false, addressList: []})
    this.props.changeProd(productId)
  }

  render() {
    let balance;
    let hold;
    let pendingDeposit;
    if(this.state.accountInformation.length > 0){
      balance = this.state.accountInformation.find(info => info.ProductSymbol === this.state.selected).Amount;
      hold = this.state.accountInformation.find(info => info.ProductSymbol === this.state.selected).Hold;
      pendingDeposit = this.state.accountInformation.find(info => info.ProductSymbol === this.state.selected).PendingDeposits;
    }
    const headerTitle = `${AlphaPoint.translation('DEPOSIT.DEPOSIT') || 'Deposit'} ${this.props.Product ? `(${this.props.Product})` : ''}`;

    function DropDown(el) {
      this.dd = el;
      this.placeholder = this.dd.children('span');
      this.opts = this.dd.find('ul.dropdown > li');
      this.val = '';
      this.index = -1;
      this.initEvents();
    }

    DropDown.prototype = {
      initEvents: () => {
        const obj = this;

        $(obj.dd).on('click', (e) => {
          e.preventDefault();
          $(this).toggleClass('active');
          return false;
        });

        $(obj.opts).on('click', (e) => {
          e.preventDefault();
          const opt = $(this);

          obj.val = opt.text();
          obj.index = opt.index();
          obj.placeholder.text(`Gender: ${obj.val}`);
        });
      },
      getValue() {
        return this.val;
      },
      getIndex() {
        return this.index;
      },
    };

    const addresses = [];
    const paymentIds = [];
    let depositAddress = '';
    let selectedPaymentId = '';
    let customDepositProduct = '';
    let customDepositProductAddress = '';

    if (AlphaPoint.config.customDepositAddress) {
      const product = this.props.Product;
      let addresses = Object.keys(AlphaPoint.config.depositAddresses)
        .filter(key => key === product);

      addresses.map(key => {
        customDepositProductAddress = AlphaPoint.config.depositAddresses[key];
        customDepositProduct = key;
      });
    }

    if (AlphaPoint.config.templateStyle === 'retail') {
      if (customDepositProduct) {
        depositAddress = customDepositProductAddress;
      } else {
        for (let i = 0; i < this.state.addressList.length; i++) {
          addresses.push(
            <li
              onMouseOver={this.copyMeFunction}
              onMouseLeave={this.deselect}
              value={this.state.addressList[i]}
              key={this.state.addressList[i]}
            >
              <a className="copy" href=""><i className="icon-user" />{this.state.addressList[i]}</a>
            </li>,
          );
          if (this.state.addressList[i] === this.state.selected) {
            depositAddress = this.state.addressList[i];
          }
        }
      }
    } else if (customDepositProduct) {
      depositAddress = customDepositProductAddress;
    } else {
      for (let i = 0; i < this.state.addressList.length; i++) {
        addresses.push(
          <option value={this.state.addressList[i]} key={this.state.addressList[i]}>
            {this.state.addressList[i]}
          </option>,
        );
        if (this.state.addressList[i] === this.state.selected) {
          depositAddress = this.state.addressList[i];
        }
      }
    }

    if (this.state.paymentIds) {
      for (let i = 0; i < this.state.paymentIds.length; i++) {
        paymentIds.push(
          <option
            value={this.state.paymentIds[i]}
            key={this.state.paymentIds[i]}
          >{this.state.paymentIds[i]}</option>,
        );
        if (this.state.paymentIds[i] === this.state.selectedId) {
          selectedPaymentId = this.state.paymentIds[i];
        }
      }
    }

    console.log("depositAddress: ",depositAddress)
    // let depositType = 'bitcoin';
    // if (this.props.Product === 'EGD') depositType = 'egdcoin';
    // if (this.props.Product === 'XFC') depositType = 'forevercoin';
    // if (this.props.Product === 'ETH') depositType = 'ethereum';
    // if (this.props.Product === 'QNT') depositType = 'qnt';

    const LoadingBlock = () => {
      const loadingWrapperStyle = {
        position: 'absolute',
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
        background: 'rgba(255, 255, 255, .7)',
        zIndex: 1,
      };
      const loadingContentStyle = {
        textAlign: 'center',
        position: 'relative',
        top: '50%',
        transform: 'translateY(-50%)',
      };

      return (
        <div style={loadingWrapperStyle}>
          <div style={loadingContentStyle}>
            {
              !this.state.depositRequestTimedOut ?
                <Spinner /> :
                <div>
                  <p>
                    {AlphaPoint.translation('DEPOSIT.REQUEST_TIMEDOUT') || 'The server is taking too long to find an address. Please try again.'}
                  </p>
                  <button className="btn btn-action" onClick={() => location.reload(true)}>Reload page</button>
                </div>
            }
          </div>
        </div>
      );
    };

    if (AlphaPoint.config.useDepositTemplates && this.state.showTemplate) {
      const fields = Object.keys(this.state.templateFields).map((fieldName) => (
        <InputLabeled
          onChange={this.handleOnChangeTemplate}
          name={fieldName}
          label={AlphaPoint.translation(`DEPOSIT.TEMPLATE_FIELD_${fieldName}`) || fieldName}
        />
      ));

      return (
        <WidgetBase
          {...this.props}
          headerTitle={headerTitle}
        >
       
          {this.state.loadingDeposits && <LoadingBlock />}
          <div className="pad">
            <p style={{ marginBottom: '1.5rem' }}>{AlphaPoint.translation('DEPOSIT.FILL_REQUIRED_FIELDS') || 'Please fill these required fields:'}</p>
            {fields}
            <div className="clearfix">
              <div className="pull-right" style={AlphaPoint.config.siteName === 'aztec' ? { width: '100%' } : null}>
                <button className="btn btn-action" onClick={this.handleSubmitTemplate}>
                  {AlphaPoint.translation('BUTTONS.TEXT_NEXT') || 'Next'}
                </button>
              </div>
            </div>
          </div>
        </WidgetBase>
      );
    }

    if (this.props.Product === 'DAS' || this.props.Product === 'DASC') {
      return (
        <WidgetBase
          {...this.props}
          headerTitle={headerTitle}
          customClass="deposit"
        >
          <ScrollLock />
          <div className="pad">
            <p style={{ marginBottom: '.5rem' }}>{AlphaPoint.translation('DEPOSIT.FIELD_EXCHANGE_ACCOUNT') || 'Exchange Address'} <small>{AlphaPoint.translation('DEPOSIT.DAS_EXCHANGE_ACCOUNT_WARNING') || '- Be sure to send to the exchange address indicated here'}</small></p>
            <InputNoLabel
              value={this.state.dasExchangeAccount}
              readOnly
              style={{ background: 'lightgray', maxWidth: '400px' }}
            />
            <p style={{ marginBottom: '.5rem' }}>
              {AlphaPoint.translation('DEPOSIT.FIELD_YOUR_DAS_ACCOUNT') || 'Destination ID'} <small>{AlphaPoint.translation('DEPOSIT.DAS_YOUR_ACCOUNT_WARNING') || '- Be sure to include the ID indicated here in your withdraw memo to ensure proper routing'}</small>
            </p>
            <InputNoLabel
              value={this.state.dasAccount}
              readOnly
              style={{ background: 'lightgray', maxWidth: '400px' }}
            />
            <div className="clearfix">
              <div className="pull-left">
                <button className="btn btn-action close-withdraw" onClick={this.props.close}>
                  <div id="withdraw-cancel-button-icon" />
                  <div id="withdraw-cancel-button-text">{AlphaPoint.translation('BUTTONS.CLOSE') || 'Close'}</div>
                </button>
              </div>
            </div>
          </div>
        </WidgetBase>
      );
    }

    return (
      // wrap all content in widget base
      <WidgetBase
        {...this.props}
        login
        headerTitle={headerTitle}
        customClass="deposit"
        withCloseButton={true}
      >
        
        {/* {this.state.loadingDeposits && <LoadingBlock />} */}
        <h1>Deposit</h1>
        <div className="pad">

          {
            AlphaPoint.config.siteTitle === 'Dasset' &&
            <p style={{ margin: '1rem 0', fontWeight: 'bold' }}>
              Select an address below and enter it as the Recipient Address {this.props.Product === 'XRP' && `and populate the Destination
                Tag with your account ID: ${AlphaPoint.selectedAccount.value}`}
            </p>
          }

          {
            AlphaPoint.config.templateStyle !== 'retail' && !customDepositProduct &&
            <SelectLabeled
              placeholder={AlphaPoint.translation('DEPOSIT.ADDRESS_LIST') || 'Address List'}
              onChange={this.addressChanged}
              readOnly
            >
              {addresses}
            </SelectLabeled>
          }

          {customDepositProduct &&
            <span>
              <InputLabeled
                value={depositAddress}
              />
            </span>
          }

          {(this.props.Product === 'MON') &&
            <span>
              <SelectLabeled placeholder="Payment Ids List" onChange={this.paymentIdChanged}>
                {paymentIds}
              </SelectLabeled>
              <InputLabeled
                value={selectedPaymentId}
                label={AlphaPoint.translation('DEPOSIT.PAYMENTIDS') || 'Payment Id'}
              />
            </span>}
          <div className="left">
            <p>Coin</p>
            <div id="dropdown">
              <div className="selected-holder" onClick={() => this.toggleDropdown(true)}>
                <img src={`img/${this.state.selected.toLowerCase()}.png`}/>{this.state.selected} {this.state.selected === "BTC" ? "Bitcoin" : "Ethereum"} <img src="img/drop-copy2.svg" id="drop-icon"/>
              </div>
              {
                this.state.dropdownOpen &&
                <ul onMouseLeave={() => this.toggleDropdown(false)}>
                  <li onClick={() => this.changeProd("BTC")}><img src="img/btc.png"/>BTC Bitcoin</li>
                  <li onClick={() => this.changeProd("ETH")}><img src="img/eth.png"/>ETH Ethereum</li>
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
                  <div>Pending deposits:</div>
                  <div>{pendingDeposit}</div>
                </div>
            </div>
          </div>
          <div className={`right-block clearfix ${this.state.selected}`}>
            <p>{this.state.selected} address</p>
            {
              this.state.showQRCode &&
              <div id="overlay" style={{ background: 'rgba(25, 28, 54, 0.71)'}}>
                <div className="qr-container">
                  <span onClick={() => this.toggleQRCode(false)}>+</span>
                  {this.state.addressList && this.state.addressList[0] ?
                    <div style={{ margin: 10, float: 'left' }}>
                      <QRCode
                        
                        value={this.state.addressList[0]}
                        size={128}
                      />
                    </div>
                    :
                    <img
                      alt="QR Code"
                      width="200px"
                      height="200px"
                      style={{ margin: 10, float: 'left' }}
                      src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                    />}
                  
                  <div className="payment_method_checkboxes payment-method-checkboxes-mobile">
                    <label htmlFor="cotix_radio" >
                      <div className="radio-button">
                        <div className="radio-button-checked" style={{ opacity: this.state.selectedRadio === 'cotix' ? 1 : 0 }} />
                      </div>
                      <p className="">COTI-X</p>
                    </label>

                    <input value="cotix" id="cotix_radio" type="radio" name="payment_type" onClick={e => this.checkRadioButton(e.target.value)} />
                    <input value="cotipay" id="cotipay_radio" type="cotipay_radio" name="payment_type" onClick={e => this.checkRadioButton(e.target.value)} />
                    
                  </div>
            
                </div>
              </div>
            }
            <p id="deposit_payment_method_text">
              <span>{this.state.addressList[0]}</span>
            </p>
            <div className="actions">
                <button onClick={e => this.copyToClipboard(e)}><img src="img/copy-img.svg"/>Copy address</button>
                <button onClick={() => this.toggleQRCode(true)}><img src="img/qr-img.svg"/>Show QR code</button>
            </div>
            <p className="note-title">Send only {this.state.selected} to this address.</p>
            <p className="note">Sending coin or token other than {this.state.selected} to this address may result in the loss of your deposit.</p>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

DepositDigital.defaultProps = {
  close: () => {
  },
  Product: '',
  ProductId: null,
};

DepositDigital.propTypes = {
  close: React.PropTypes.func,
  Product: React.PropTypes.string,
  ProductId: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
  ]),
};

export default DepositDigital;
