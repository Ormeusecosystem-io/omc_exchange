/* global AlphaPoint, document, location $ */
import React from 'react';

import QRCode from 'qrcode.react';
import WidgetBase from './base';
import SelectLabeled from '../misc/selectLabeled';
import InputLabeled from '../misc/inputLabeled';
import InputNoLabel from '../misc/inputNoLabel';
import CustomDropdown from '../misc/customDropdown';
import Spinner from '../misc/spinner';

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
      depositRequestTimedOut: false,
      depositRequestTimeOutId: 0,
      loadingDeposits: false,
    };
  }

  componentDidMount() {
    const payload = {
      OMSId: AlphaPoint.oms.value,
      AccountId: AlphaPoint.selectedAccount.value || AlphaPoint.userAccounts.value[0],
    };
    const product = this.props.Product;
    const currentProd = this.state.selected || product;

    if (AlphaPoint.config.siteName === 'bitcoindirect') this.setState({siteName: true});

    this.products = AlphaPoint.products.subscribe((products) => {
      const myProd = products.find((prod) => prod.Product === currentProd);

      this.setState({productId: myProd.ProductId});
      payload.ProductId = myProd.ProductId;
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
      const depositInfo = res.DepositInfo ? JSON.parse(res.DepositInfo) : '';
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
        selected: depositKey[0],
        selectedAddress: depositKey[0],
        loadingDeposits: false,
      });

      if (this.state.getNewDepositKeyClicked) {
        this.setState({ selectedAddress: depositKey[0], getNewDepositKeyClicked: false });
      }
    });

    this.getDeposits(payload);
  }

  componentWillUnmount() {
    this.products.dispose();
    this.deposits.dispose();
    AlphaPoint.deposits.onNext([]);
    if (AlphaPoint.config.useDepositTemplates) {
      this.depositTemplate.dispose();
      AlphaPoint.depositTemplate.onNext({});
    }
  }

  getDeposits(payload) {
    this.startDepositsRequestTimeout();
    this.setState({ loadingDeposits: true });
    if (AlphaPoint.config.useDepositTemplates) {
      AlphaPoint.getDepositRequestInfoTemplate(payload);
    } else {
      AlphaPoint.getDepositInfo({...payload, GenerateNewKey: !AlphaPoint.config.optionalNewDepositKeys});
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
    this.setState({getNewDepositKeyClicked: true});
  };

  endDepositsRequestTimeout() {
    if(this.state.depositRequestTimeOutId) {
      clearTimeout(this.state.depositRequestTimeOutId);
    }
  }

  startDepositsRequestTimeout() {
    const timeoutId = setTimeout(() => {
      this.setState({ depositRequestTimedOut: true });
    }, 5000);

    this.setState({ depositRequestTimeOutId: timeoutId });
  }

  addressChanged = (e) => this.setState({selected: e.target.value});

  paymentIdChanged = (e) => this.setState({selectedId: e.target.value});

  copyMeFunction = (e) => {
    e.preventDefault();
    const self = this;

    function copyAddress(text) {
      self.setState({selectedAddress: text, selected: text});
      const textarea = document.createElement('textarea');
      textarea.id = 'copy-this-address';
      textarea.innerText = text;
      document.body.appendChild(textarea);
      textarea.select();

      try {
        if (document.execCommand('copy')) {
          $.bootstrapGrowl(
            AlphaPoint.translation('DEPOSIT.COPIED_TO_CLIPBOARD') || 'Address Copied to Clipboard',
            {...AlphaPoint.config.growlerDefaultOptions, type: 'info'},
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
    this.setState({useImage: false});
  };

  handleOnChangeTemplate = (e) => {
    const templateFields = {...this.state.templateFields};

    templateFields[e.target.name] = e.target.value;
    this.setState({templateFields});
  }

  handleSubmitTemplate = () => {
    AlphaPoint.getDepositInfo({
      OMSId: AlphaPoint.oms.value,
      ProductId: this.props.ProductId || this.state.productId,
      DepositInfo: JSON.stringify(this.state.templateFields),
      AccountId: AlphaPoint.selectedAccount.value,
      GenerateNewKey: !AlphaPoint.config.optionalNewDepositKeys,
    });
    this.setState({ nextBtnClicked: true, loadingDeposits: true })
  }

  render() {
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
    let depositAddress = '',
      selectedPaymentId = '',
      customDepositProduct = '',
      customDepositProductAddress = '';

    if (AlphaPoint.config.customDepositAddress) {
      let product = this.props.Product;
      let addresses = Object.keys(AlphaPoint.config.depositAddresses)
        .filter(function(key){ return key === product});

        addresses.map(key => {
          customDepositProductAddress = AlphaPoint.config.depositAddresses[key];
          customDepositProduct = key
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
              <a className="copy" href=""><i className="icon-user"/>{this.state.addressList[i]}</a>
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

    let depositType = 'bitcoin';
    if (this.props.Product === 'EGD') depositType = 'egdcoin';
    if (this.props.Product === 'XFC') depositType = 'forevercoin';
    if (this.props.Product === 'ETH') depositType = 'ethereum';
    if (this.props.Product === 'QNT') depositType = 'qnt';

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
          { this.state.loadingDeposits && <LoadingBlock /> }
          <div className="pad">
            <p style={{marginBottom: '1.5rem'}}>{AlphaPoint.translation('DEPOSIT.FILL_REQUIRED_FIELDS') || 'Please fill these required fields:'}</p>
            {fields}
            <div className="clearfix">
              <div className="pull-right" style={AlphaPoint.config.siteName === 'aztec' ? {width: '100%'} : null}>
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
        >
          <div className="pad">
            <p style={{marginBottom: '.5rem'}}>{AlphaPoint.translation('DEPOSIT.FIELD_EXCHANGE_ACCOUNT') || 'Exchange Address'} <small>{AlphaPoint.translation('DEPOSIT.DAS_EXCHANGE_ACCOUNT_WARNING') || '- Be sure to send to the exchange address indicated here'}</small></p>
            <InputNoLabel
              value={this.state.dasExchangeAccount}
              readOnly
              style={{background: 'lightgray', maxWidth: '400px' }}
            />
            <p style={{marginBottom: '.5rem'}}>
            {AlphaPoint.translation('DEPOSIT.FIELD_YOUR_DAS_ACCOUNT') || 'Destination ID'} <small>{AlphaPoint.translation('DEPOSIT.DAS_YOUR_ACCOUNT_WARNING') || '- Be sure to include the ID indicated here in your withdraw memo to ensure proper routing'}</small>
            </p>
            <InputNoLabel
              value={this.state.dasAccount}
              readOnly
              style={{background: 'lightgray', maxWidth: '400px' }}
            />
            <div className="clearfix">
              <div className="pull-left">
                <button className="btn btn-action" onClick={this.props.close}>
                  {AlphaPoint.translation('BUTTONS.CLOSE') || 'Close'}
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
      >
        { this.state.loadingDeposits && <LoadingBlock /> }
        <div className="pad">
          <div style={{marginBottom: '1.5rem'}}>
            <h3>{AlphaPoint.translation('DEPOSIT.NB') || 'Please read the instructions below'}</h3>
            <p>
              {AlphaPoint.translation('DEPOSIT.INSTRUCTION1') || `Depositing ${this.props.Product} into the exchange is safe and easy.`}
            </p>
            <p>
              {AlphaPoint.translation('DEPOSIT.INSTRUCTION2') || `The address below can always be used to deposit ${this.props.Product} into your account.`}
            </p>
            <p>
              {AlphaPoint.translation('DEPOSIT.INSTRUCTION3') || `Use your ${this.props.Product} client or wallet service to send the ${this.props.Product} to the address below.`}
              {this.props.Product === 'XRP' &&
              <strong>{ AlphaPoint.translation('DEPOSIT.XRP_WARNING') || 'Be sure to include your destination tag to ensure proper routing.'}</strong>}
            </p>
          </div>

          {
            AlphaPoint.config.siteTitle === 'Dasset' &&
            <p style={{margin: '1rem 0', fontWeight: 'bold'}}>
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

          {AlphaPoint.config.templateStyle === 'retail' && !customDepositProduct &&
          <div>
            <CustomDropdown selectedAddress={this.state.selectedAddress}>
              {addresses}
            </CustomDropdown>
            {this.props.Product === 'XRP' &&
            <strong>
              {AlphaPoint.translation('DEPOSIT.DESTINATION_TAG') || 'Destination Tag'}: {AlphaPoint.selectedAccount.value}
            </strong>}
          </div>}

          {AlphaPoint.config.templateStyle !== 'retail' && !customDepositProduct &&
          <span>
            <InputLabeled value={depositAddress} label={AlphaPoint.translation('DEPOSIT.ADDRESS')}/>
          </span>}

          {AlphaPoint.config.templateStyle !== 'retail' && !customDepositProduct && this.props.Product === 'XRP' &&
          <span>
            <InputLabeled
              value={AlphaPoint.selectedAccount.value}
              label={AlphaPoint.translation('DEPOSIT.DESTINATION_TAG') || 'Destination Tag'}
            />
          </span>}


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

          <div className="clearfix" style={{display: 'flex', marginBottom: '1rem'}}>
            <div>
              {depositAddress ?
                <div style={{margin: 10, float: 'left'}}>
                  <QRCode
                    value={`${depositType}:${customDepositProductAddress !== '' ? customDepositProductAddress : this.state.selected}`}
                    size={128}
                  />
                </div>
                :
                <img
                  alt="QR Code"
                  width="200px"
                  height="200px"
                  style={{margin: 10, float: 'left'}}
                  src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                />}
            </div>
            <div>
              <p>
                {AlphaPoint.translation('DEPOSIT.INSTRUCTION4') || `Your account will automatically update after the ${AlphaPoint.config.siteName === 'quantatrading' ? 'Ethereum' : 'cryptocurrency'} network confirms your transaction. The confirmation may take up to 1 hour.`}
              </p>
              <p>
                {AlphaPoint.translation('DEPOSIT.CRYPT_STEP1') || `1) Send ${AlphaPoint.config.siteName === 'quantatrading' ? this.props.Product : 'cryptocurrency'} to this address.`}
              </p>
              <p>
                {AlphaPoint.translation('DEPOSIT.CRYPT_STEP2') || '2) Your deposit will automatically be processed.'}
              </p>
            </div>
          </div>

          {this.props.close &&
          <div className="clearfix">
            <div className="pull-right" style={AlphaPoint.config.siteName === 'aztec' ? {width: '100%'} : null}>
              {AlphaPoint.config.optionalNewDepositKeys ?

                AlphaPoint.config.disableNewDepositKeys.indexOf(this.props.Product) > -1 ? null :
                  <button
                    className="btn btn-action"
                    onClick={this.getNewDepositKey}
                    style={{float: 'left', marginRight: '1rem'}}
                  >Generate New Key</button>

                : null
              }
              <button
                className="btn btn-action"
                onClick={this.props.close}
              >{AlphaPoint.translation('BUTTONS.TEXT_CLOSE') || 'Close'}</button>
            </div>
          </div>}
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
