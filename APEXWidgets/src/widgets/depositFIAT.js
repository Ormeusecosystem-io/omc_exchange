/* global FileReader, AlphaPoint, location, localStorage, window */
import React from 'react';
import uuidV4 from 'uuid/v4';
import html2canvas from 'html2canvas';
import WidgetBase from './base';
import InputLabeled from './../misc/inputLabeled';
import SelectLabeled from './../misc/selectLabeled';
import TextareaLabeled from './../misc/textareaLabeled';
import ProcessingButton from './../misc/processingButton';
import { formatNumberToLocale, parseNumberToLocale, getDecimalPrecision } from './helper';
import Trustpay from './paymentProcessors/Trustpay';
import RazorpayDeposit from './paymentProcessors/Razorpay';
import Psigate from './paymentProcessors/Psigate';
import Interswitch from './paymentProcessors/Interswitch';
import Fennas from './paymentProcessors/Fennas';

class DepositFIAT extends React.Component {
  constructor() {
    super();

    this.state = {
      save_ref: null,
      data: {},
      processing: false,
      data_uri: null,
      showTemplate: false,
      template: null,
      templatesArray: [],
      templateFields: {},
      templateFieldsCompleted: {},
      checkoutId: '',
      DepositWorkflow: '',
      address: '',
      addressList: [],
      selected: '',
      ProductId: null,
      showDefaultForm: false,
      session: {},
      showAccountProviderSelect: false,
      accountProviders: [],
      decimalPlaces: {},
      amountString: '',
      maxDeposit: 10000,
      validNumber: false,
      fullName: "",
      accountId: null,
      validName: false,
      errorMsg: {
        name: '',
        amount: ''
      }
    };
  }

  componentWillMount() {
    if (typeof location.origin === 'undefined') {
      location.origin = `${location.protocol}//${location.host}`;
    }
  }

  print(){
    var content = document.getElementById("deposit_ticket_created");
    var pri = document.getElementById("ifmcontentstoprint").contentWindow;
    pri.document.open();
    pri.document.write(content.innerHTML);
    pri.document.close();
    pri.focus();
    pri.print();
  }
  
  save(){
    html2canvas(document.querySelector("#deposit_ticket_created")).then(canvas => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/png");
      link.setAttribute('download','deposit_details.png')
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    
  }

  componentDidMount() {
    this.session = AlphaPoint.accountInfo.subscribe((session) => this.setState({ session }));

    let ProductId;
    if (this.props.ProductId) {
      ProductId = this.props.ProductId;
      this.setState({ ProductId: this.props.ProductId });
    } else if (!this.props.ProductId && this.props.Product) {
      ProductId = AlphaPoint.products.value.find((product) => product.Product === this.props.Product).ProductId;
      this.setState({ ProductId });
    }

    this.products = AlphaPoint.products.filter(data => data.length).subscribe(products => {
      const decimalPlaces = {};
      products.forEach(product => {
        decimalPlaces[product.Product] = product.DecimalPlaces;
      });
      this.setState({ decimalPlaces });
    });

    const accountId = AlphaPoint.selectedAccount.value || AlphaPoint.userAccounts.value[0];
    this.setState({accountId})

    const payload = {
      OMSId: AlphaPoint.oms.value,
      ProductId,
      AccountId: accountId,
    };

    this.createDeposit = AlphaPoint.createDeposit.subscribe((res) => {
      if (res && !res.success) {
        if (res.detail && res.detail.indexOf('invalid amount') > -1) {
          res.errormsg = AlphaPoint.translation('ERRORS.DEPOSIT.FIAT.GENERAL_ERROR') || `There was an error: ${res.errormsg}, ${res.detail}`;
          return this.setState({
            data: res,
            error: res.errormsg,
            processing: false,
          });
        }
        if (res.result === false) {
          this.setState({ processing: false });
          if (res.detail === 'Exceeds_Daily_Deposit_Limit') {
            this.setState({
              data: res,
              error: AlphaPoint.translation('ERRORS.DEPOSIT.FIAT.EXCEEDS_DAILY_LIMIT') || `Deposit Failed. ${formatNumberToLocale(this.state.amount, this.state.decimalPlaces[this.props.Product])} ${this.props.Product} exceeds your daily deposit limit.`
            });
          }
          if (res.detail === 'Exceeds_Monthly_Deposit_Limit') {
            this.setState({
              data: res,
              error: AlphaPoint.translation('ERRORS.DEPOSIT.FIAT.EXCEEDS_Monthly_LIMIT') || `Deposit Failed. ${formatNumberToLocale(this.state.amount, this.state.decimalPlaces[this.props.Product])} ${this.props.Product} exceeds your monthly deposit limit.`
            });
          }
          if (res.detail === 'Exceeds_Yearly_Deposit_Limit') {
            this.setState({
              data: res,
              error: AlphaPoint.translation('ERRORS.DEPOSIT.FIAT.EXCEEDS_Yearly_LIMIT') || `Deposit Failed. ${formatNumberToLocale(this.state.amount, this.state.decimalPlaces[this.props.Product])} ${this.props.Product} exceeds your yearly deposit limit.`
            });
          }
          if (res.detail.indexOf('must be greater than zero and less than') > -1) this.setState({ data: res, error: AlphaPoint.translation('ERRORS.DEPOSIT.FIAT.AMOUNT_RANGE') || res.detail });
        }
      } else if (res && res.success) {
        this.setState({ data: res, processing: false });
      } else if (res.length > 0) {
        this.setState({ data: res, processing: false });
      }
      return false;
    });

    if (AlphaPoint.config.useDepositTemplates) {
      // =======================================
      // Store account providers for product NGN
      // =======================================
      if (this.props.Product === 'NGN') {
        let ProductId;

        if (this.props.ProductId) {
          ProductId = this.props.ProductId;
        } else if (!this.props.ProductId && this.props.Product) {
          ProductId = AlphaPoint.products.value.find((product) => product.Product === this.props.Product).ProductId;
        }

        const getAllTemplatesPayload = {
          ProductId,
          OMSId: AlphaPoint.oms.value,
        };

        AlphaPoint.getAllDepositRequestInfoTemplates(getAllTemplatesPayload);
      }


      this.depositTemplate = AlphaPoint.depositTemplate.subscribe((data) => {
        if (data.length && this.props.Product === 'NGN') {
          return this.setState({ accountProviders: data });
        }

        if (!data) return AlphaPoint.getDepositInfo(payload); // If data is literally nothing, which may happen, we have to continue workflow
        if (Object.keys(data).length) {
          if (data.Template) {
            const fields = JSON.parse(data.Template.Template);

            if (!Object.keys(fields).length && data.Template.UseGetDepositWorkflow) {
              AlphaPoint.getDepositInfo(payload);
            }

            if (!Object.keys(fields).length && !data.Template.UseGetDepositWorkflow) {
              return this.setState({
                showDefaultForm: true,
                showTemplate: false,
                showAccountProviderSelect: false,
                template: null,
                templateFields: {},
                DepositWorkflow: '',
              });
            }

            if (Array.isArray(fields)) {
              return this.setState({
                showTemplate: !!Object.keys(fields).length,
                showDefaultForm: !Object.keys(fields).length,
                showAccountProviderSelect: false,
                template: data.Template,
                templatesArray: fields.length > 1 ? fields : [],
                templateFields: fields.length > 1 ? {} : fields[0],
                DepositWorkflow: data.Template.DepositWorkflow || '',
              });
            }

            this.setState({
              showTemplate: !!Object.keys(fields).length,
              showAccountProviderSelect: false,
              template: data.Template,
              templateFields: fields,
              DepositWorkflow: data.Template.DepositWorkflow || '',
            });
          } else {
            this.setState({
              showDefaultForm: true,
              showTemplate: false,
              showAccountProviderSelect: false,
              template: null,
              templateFields: {},
              DepositWorkflow: '',
            });
          }
        }

        return false;
      });
    }

    this.deposits = AlphaPoint.deposits.subscribe((res) => {
      const keys = res.DepositInfo ? JSON.parse(res.DepositInfo) : '';
      const depositKey = keys !== '' ? keys.reverse() : '';

      // need to add something to pick the newest address, not sure if it's max or min of array
      this.setState({
        showTemplate: false,
        address: depositKey[0],
        addressList: depositKey,
        selected: depositKey[0],
      });
    });

    if (AlphaPoint.config.useDepositTemplates) {
      if (this.props.Product === 'NGN') {
        return this.setState({ showAccountProviderSelect: true });
      }
      AlphaPoint.getDepositRequestInfoTemplate(payload);
    } else {
      this.setState({ showDefaultForm: true });
    }

    return true;
  }

  componentWillUnmount() {
    this.createDeposit.dispose();
    this.deposits.dispose();
    AlphaPoint.createDeposit.onNext({});
    AlphaPoint.deposits.onNext({});
    if (this.depositTemplate) {
      this.depositTemplate.dispose();
      AlphaPoint.depositTemplate.onNext({});
    }
    this.products.dispose();
  }

  getNewDepositKey = () => {
    AlphaPoint.getDepositInfo({
      OMSId: AlphaPoint.oms.value,
      AccountId: AlphaPoint.selectedAccount.value || AlphaPoint.userAccounts.value[0],
      ProductId: this.state.ProductId,
      GenerateNewKey: true,
    });
  };

  handleFile = (e) => {
    // this was setup for WPX and XFC, not used so far in V2
    const reader = new FileReader();
    const file = e.target.files[0];

    reader.onload = (upload) => this.setState({ data_uri: upload.target.result });
    reader.readAsDataURL(file);
  }

  deposit = () => {

    if(!this.state.validName || !this.state.validNumber){
      return this.displayErrorMsg();
    }

    const data = {};
    this.setState({ processing: true, data: {} });
    // removing non alphanumeric characters in amount field
    const amount = +this.state.amount;

    data.productId = this.state.ProductId;
    data.accountId = AlphaPoint.selectedAccount.value;
    data.status = 'New';
    data.currencyCode = this.props.Product;
    data.amount = amount;
    data.imageB64 = '';
    if (this.state.data_uri) data.imageB64 = this.state.data_uri;

    // setup the depositInfo
    data.language = (localStorage && localStorage.lang) ? localStorage.lang : AlphaPoint.config.defaultLanguage;
    if (AlphaPoint.config.useCoinsPHDepositTemplate) {
      data.bankName = (this.refs.bankName) ? this.refs.bankName.value() : '';
      data.referenceNumber = (this.refs.referenceNumber) ? this.refs.referenceNumber.value() : '';
      data.depositInfo = JSON.stringify({
        language: data.language,
        'Bank Name': data.bankName,
        'Reference Number': data.referenceNumber,
      });
    } else {
      data.fullName = this.refs.fullName.value();
      data.depositInfo = JSON.stringify({
        'Full Name': data.fullName,
        language: data.language,
      });
    }

    AlphaPoint.createDepositTicket(data);
    this.setState({ AccountProviderId: null });
  }

  displayErrorMsg = () => {
    this.setState({
      errorMsg: {
        ['name']: !this.state.validName && 'Required field',
        ['amount']: !this.state.validNumber && (this.state.errorMsg.amount || 'Required field'),
      }
    })
  }

  handleOnChangeTemplate = e => {
    const { name, value } = e.target;

    this.setState({
      templateFieldsCompleted: {
        ...this.state.templateFieldsCompleted,
        [name]: value,
      },
    });
  }

  handleFullNameChange = e => {
    this.setState({
      ...this.state,
      fullName: e.target.value,
      validName: e.target.value !== ''
    })
  }

  handleSubmitTemplate = () => {
    const template = { ...this.state.templateFieldsCompleted };
    const submitTemplatePayload = {
      OMSId: AlphaPoint.oms.value,
      ProductId: this.state.ProductId,
      DepositInfo: JSON.stringify(template),
      AccountId: AlphaPoint.selectedAccount.value,
      GenerateNewKey: !AlphaPoint.config.optionalNewDepositKeys,
    };
    if (Object.keys(this.state.templateFields).find(field => field === 'Currency')) {
      template.Currency = this.props.Product;
    }
    if (this.state.AccountProviderId) {
      submitTemplatePayload.AccountProviderId = this.state.AccountProviderId;
    }
    if (this.state.DepositWorkflow === 'GenericPayment') {
      submitTemplatePayload.GenerateNewKey = true;
    }

    AlphaPoint.getDepositInfo(submitTemplatePayload);
    this.setState({ AccountProviderId: '' });
  }

  selectTemplateArrayOption = (e) => {
    const { value } = e.target;
    const templateFields = this.state.templatesArray.find((temp) => temp.nickname === value);

    if (!value) return this.setState({ templateFields: {} });
    return this.setState({ templateFields });
  }

  addressChanged = e => this.setState({ selected: e.target.value });

  handleChangeAmount = e => {
    const amount = parseNumberToLocale(e.target.value);
    const decimals = getDecimalPrecision(amount);
    const decimalsAllowed = this.state.decimalPlaces[this.props.Product];
    const msgDecimals = `Only ${decimalsAllowed} decimal places are allowed for ${this.props.Product}.`;
    const msgMaximum = `Please enter a value between 100 - ${this.state.maxDeposit}.`;
    
    if(e.target.value === ''){
      this.setState({
        amountString: e.target.value, 
        validNumber: false, 
        errorMsg:{
          ...this.state.errorMsg,
          [e.target.name]: null
        }
      })
    }
    else if (decimals > decimalsAllowed) {
      this.setState({ 
        amount, 
        amountString: e.target.value, 
        errorMsg: {
          ...this.state.errorMsg,
          [e.target.name]: msgDecimals
        }, 
        validNumber: false 
      }); 
    } 
    else if (!isNaN(amount)) {
      if(amount > this.state.maxDeposit || amount < 100){
        return this.setState({ 
          amount, 
          amountString: e.target.value, 
          errorMsg: {
            ...this.state.errorMsg,
            [e.target.name]: msgMaximum
          }, 
          validNumber: false 
        }); 
      }
      return this.setState({ amount, amountString: e.target.value, validNumber: true });
    }
    return null;
  }

  selectAccountProvider = (AccountProviderId) => {
    const payload = {
      OMSId: AlphaPoint.oms.value,
      ProductId: this.state.ProductId,
      AccountId: AlphaPoint.selectedAccount.value,
      AccountProviderId,
    };
    this.setState({ AccountProviderId });

    return AlphaPoint.getDepositRequestInfoTemplate(payload); // If data is literally nothing, which may happen, we have to continue workflow
  }

  render() {
    const headerTitle = `${AlphaPoint.translation('DEPOSIT.DEPOSIT') || 'Deposit'} ${this.props.Product ? `(${this.props.Product})` : ''}`;


    if (this.state.showAccountProviderSelect) {
      const providersList = this.state.accountProviders.map(provider => (
        <a
          className="account-provider-square"
          key={provider.providerId}
          onClick={() => this.selectAccountProvider(provider.providerId)}
        >
          {provider.providerId === 7 || provider.providerId === 10
            ? <span>
              {provider.providerId === 7 && <i id="webpayIcon" className="material-icons">credit_card</i>}
              {provider.providerId === 10 && <i id="quicktellerIcon" className="material-icons">account_balance</i>}
              <span className="account-provider-text">
                {provider.providerId === 7 && 'Web Pay'}
                {provider.providerId === 10 && 'Quick Teller'}
              </span>
            </span>
            : <span style={{ display: 'flex', alignItems: 'center' }}>
              <i className="material-icons" style={{ marginRight: '1rem' }}>credit_card</i>
              <span className="account-provider-text">{provider.providerName}</span>
            </span>}
        </a>
      ));
      return (
        <WidgetBase
          {...this.props}
          login
          headerTitle={headerTitle}
          error={this.state.error}
        >
          <h4 style={{ display: 'block', textAlign: 'center', fontSize: '23px', marginBottom: '30px' }}>Pick Your Account Provider</h4>
          <div className="account-provider-container">
            {providersList}
          </div>
        </WidgetBase>
      );
    }
    if (AlphaPoint.config.apexSite && this.state.showTemplate) {
      const fields = Object.keys(this.state.templateFields).map(fieldName => {
        if (!this.state.template.UseGetDepositWorkflow) {
          return (
            <div key={uuidV4()} style={{ marginBottom: '1rem' }}>
              <p
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                }}
              >{fieldName.replace(/([a-z])([A-Z])/g, '$1 $2')}</p>
              <p style={{ marginLeft: '1rem' }}>{this.state.templateFields[fieldName]}</p>
            </div>
          );
        }
        if (fieldName === 'Currency') {
          return (
            <InputLabeled
              key={fieldName}
              value={this.props.Product}
              name={fieldName}
              label={fieldName.replace(/([a-z])([A-Z])/g, '$1 $2')}
              placeholder={fieldName.replace(/([a-z])([A-Z])/g, '$1 $2')}
              disabled
            />
          );
        }
        if (`${this.state.templateFields[fieldName]}`.indexOf('[') === 0) {
          const arrayOfValues = this.state.templateFields[fieldName]
            .split(',')
            .map(el => el.trim().replace(/[[\]]/g, ''));

          return (
            <SelectLabeled
              key={fieldName}
              label={fieldName.replace(/([a-z])([A-Z])/g, '$1 $2')}
              name={fieldName}
              onChange={this.handleOnChangeTemplate}
              value={this.state.templateFieldsCompleted[fieldName]}
            >
              {arrayOfValues.map(val => (<option key={val} value={val}>{val}</option>))}
            </SelectLabeled>
          );
        }
        return (
          <InputLabeled
            key={fieldName}
            onChange={this.handleOnChangeTemplate}
            value={this.state.templateFieldsCompleted[fieldName] || ''}
            name={fieldName}
            label={fieldName.replace(/([a-z])([A-Z])/g, '$1 $2')}
            placeholder={fieldName.replace(/([a-z])([A-Z])/g, '$1 $2')}
          />
        );
      });

      return (
        <WidgetBase
          {...this.props}
          headerTitle={headerTitle}
          withCloseButton={true}
        >
          <div className="pad">
            {this.state.templatesArray.length ?
              <SelectLabeled placeholder="Select account" onChange={this.selectTemplateArrayOption}>
                <option value="">Select account</option>
                {this.state.templatesArray.map((template) => (
                  <option value={template.nickname}>{template.nickname}</option>
                ))}
              </SelectLabeled> : null}
            {fields.length ?
              <div>
                {this.state.template.UseGetDepositWorkflow ?
                  <p style={{ marginBottom: '1.5rem' }}>Please fill these required fields:</p> :
                  <p style={{ marginBottom: '1.5rem' }}>Here&quot;s the information for the deposit:</p>
                }
                {fields}
                <div className="clearfix">
                  <div className="pull-right" style={AlphaPoint.config.siteName === 'aztec' ? { width: '100%' } : null}>
                    {this.state.template.UseGetDepositWorkflow ?
                      <button className="btn btn-action" onClick={this.handleSubmitTemplate}>{AlphaPoint.translation('BUTTONS.TEXT_NEXT') || 'Next'}</button> :
                      <button className="btn btn-action" onClick={this.props.close}>{AlphaPoint.translation('BUTTONS.TEXT_CLOSE') || 'Close'}</button>
                    }
                  </div>
                </div>
              </div> : null}
          </div>
        </WidgetBase>
      );
    }

    // if (this.state.address && this.state.DepositWorkflow === 'MerchantForm') {
    //   return (
    //     <WidgetBase
    //       {...this.props}
    //       headerTitle={headerTitle}
    //     >
    //       <div className="pad" style={{ color: '#000' }}>
    //         <form action={location.href} className="paymentWidgets" data-brands="VISA MASTER AMEX" />
    //         <Script url={`https://test.prtpe.com/v1/paymentWidgets.js?checkoutId=${this.state.address}`} />
    //       </div>
    //     </WidgetBase>
    //   );
    // }

    if (this.state.address && this.state.DepositWorkflow === 'GenericPayment') {
      const depositInfo = JSON.parse(this.state.address);

      if (depositInfo.RedirectURL) {
        window.location = depositInfo.RedirectURL;
        return (<WidgetBase
          {...this.props}
          headerTitle={headerTitle}
        >
          <div className="pad">Redirecting...</div>
        </WidgetBase>);
      }

      if (depositInfo.PaymentAPI === 'TrustPay') {
        return <Trustpay url={depositInfo.URL} title={headerTitle} />;
      }

      if (depositInfo.SerializedPaymentTransactionObject) {
        const options = JSON.parse(depositInfo.SerializedPaymentTransactionObject);

        if (depositInfo.PaymentAPI === 'Razorpay') {
          return <RazorpayDeposit options={options} />;
        }

        if (depositInfo.PaymentAPI === 'Psigate') {
          return (
            <Psigate options={{ ...options, Email: this.state.templateFieldsCompleted.Email }} />
          );
        }

        if (depositInfo.PaymentAPI === 'Interswitch') {
          return (
            <Interswitch options={options} />
          );
        }

        if (depositInfo.PaymentAPI === 'Fennas') {
          return (
            <Fennas options={options} />
          );
        }
      }
    }

    if (this.state.address === 'true' && this.state.DepositWorkflow === 'GenericPaymentOneForm') {
      return (
        <WidgetBase
          {...this.props}
          headerTitle="Deposit pending"
          style={{ width: '600px' }}
        >
          <div className="pad">
            <div style={{ textAlign: 'center' }}>
              <i style={{ color: 'white', fontSize: '5rem' }} className="material-icons">alarm</i>
            </div>
            <div style={{ fontSize: '1rem', textAlign: 'center', margin: '1rem 0', lineHeight: '2' }}>
              Your deposit is being processed.<br />
              Your account balance will be updated soon.
            </div>
          </div>
        </WidgetBase>
      );
    }

    if (this.state.address && this.state.DepositWorkflow === 'MerchantRedirect') {
      const formObject = JSON.parse(this.state.address);

      return (
        <WidgetBase
          {...this.props}
          headerTitle={headerTitle}
        >
          <div className="pad" style={{ color: '#000' }}>
            <form style={{ textAlign: 'center' }} action="https://sandbox.interswitchng.com/webpay/pay" method="POST">
              {Object.keys(formObject).map(key => <input key={uuidV4()} type="hidden" value={formObject[key]} name={key} id={key} />)}
              <button
                className="btn btn-action"
                type="submit"
                style={{
                  float: 'none',
                  width: '300px',
                  margin: '0 auto',
                }}
              >
                {AlphaPoint.translation('BUTTONS.PAY') || 'Pay'}
              </button>
            </form>
          </div>
        </WidgetBase>
      );
    }

    if (this.state.addressList.length) {
      const addresses = this.state.addressList.map((address) => (
        <option value={address} key={address}>{address}</option>
      ));
      const depositAddress = this.state.addressList.find((address) => address === this.state.selected);
      const depositType = this.props.Product;

      return (
        <WidgetBase
          {...this.props}
          login
          headerTitle={headerTitle}
        >
          <div className="pad">
            <div style={{ marginBottom: '1.5rem' }}>
              <h3>{AlphaPoint.translation('DEPOSIT.NB') || 'Please read the instructions below'}</h3>
              <p>{AlphaPoint.translation('DEPOSIT.FIAT_INSTRUCTION1') || 'Depositing fiat into the exchange is safe and easy.'}</p>
              <p>{AlphaPoint.translation('DEPOSIT.FIAT_INSTRUCTION2') || 'The address below can always be used to deposit fiat into your account.'}</p>
              <p>{AlphaPoint.translation('DEPOSIT.FIAT_INSTRUCTION3') || 'Use your fiat client or wallet service to send the fiat to the address below.'}</p>
            </div>

            <SelectLabeled placeholder={AlphaPoint.translation('DEPOSIT.ADDRESS_LIST') || 'Address List'} onChange={this.addressChanged} readOnly>
              {addresses}
            </SelectLabeled>
            <p>{AlphaPoint.translation('DEPOSIT.FIAT_QUICKTELLER_INSTRUCTIONS') || ''}</p>
            <span><InputLabeled value={depositAddress} label={AlphaPoint.translation('DEPOSIT.ADDRESS')} /></span>

            <div className="clearfix" style={{ display: 'flex', marginBottom: '1rem' }}>
              {this.props.Product !== 'NGN' &&
                <div>
                  <img
                    alt="QR Code"
                    width="200"
                    height="200"
                    style={{ margin: 10, float: 'left' }}
                    src={depositAddress ? `https://api.qrserver.com/v1/create-qr-code/?data='${depositType}:${depositAddress}&size=128x128` : 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='}
                  />
                </div>}
              <div>
                <p>{AlphaPoint.translation('DEPOSIT.FIAT_WITH_ADDRESS_INSTRUCTION4') || 'Your account will automatically update after the fiat network confirms your transaction. The confirmation may take up to 1 hour.'}</p>
                <p>{AlphaPoint.translation('DEPOSIT.FIAT_WITH_ADDRESS_STEP1') || '1) Send fiat to this address.'}</p>
                <p>{AlphaPoint.translation('DEPOSIT.FIAT_WITH_ADDRESS_STEP2') || '2) Your deposit will automatically be processed.'}</p>
              </div>
            </div>

            {this.props.close &&
              <div className="clearfix">
                <div className="pull-right" style={AlphaPoint.config.siteName === 'aztec' ? { width: '100%' } : null}>
                  {AlphaPoint.config.optionalNewDepositKeys // eslint-disable-line
                    ? AlphaPoint.config.disableNewDepositKeys.indexOf(this.props.Product) > -1
                      ? null
                      : <button
                        className="btn btn-action"
                        onClick={this.getNewDepositKey}
                        style={{ float: 'left', marginRight: '1rem' }}
                      >Generate New Key</button>
                    : null}
                  <button className="btn btn-action" onClick={this.props.close}>{AlphaPoint.translation('BUTTONS.TEXT_CLOSE') || 'Close'}</button>
                </div>
              </div>}
          </div>
        </WidgetBase>
      );
    }

    if (this.state.showDefaultForm) {
      return (
        // wrap all content in widget base
        <WidgetBase
          {...this.props}
          login
          headerTitle={headerTitle}
          error={this.state.error}
          withCloseButton={true}
          customClass="deposit-cash"
          successPopup={this.state.data.success}
          depositFiat
        >
          {!this.state.data.success ?
            <div className="pad">
              {/* <p>{AlphaPoint.translation('DEPOSIT.TITLE_TEXT') || 'Deposit Form'}</p> */}
              {!AlphaPoint.config.showDepositBankDetails // eslint-disable-line no-nested-ternary
                ? AlphaPoint.config.siteName === 'dasset' && this.props.Product === 'NZD'
                  ? <p>
                    {AlphaPoint.translation('DEPOSIT.FIAT_STEP1') || 'Step 1: Create a new deposit ticket for each deposit. One ticket per deposit.'}
                    <br />
                    {AlphaPoint.translation('DEPOSIT.FIAT_STEP2') || 'Step 2: Check your email for the deposit instructions.'}
                  </p>
                  : <p>
                    {AlphaPoint.translation('DEPOSIT.FIAT_STEP1') || 'Step 1: Create the deposit ticket.'}
                    <br />
                    {AlphaPoint.translation('DEPOSIT.FIAT_STEP2') || 'Step 2: Process deposit instructions on the deposit receipt.'}
                  </p>
                :
                <div className="create-tickect-title">
                  Create a <span style={{fontWeight: 'bold'}}>Deposit Ticket</span>
                </div>}
              {AlphaPoint.config.useCoinsPHDepositTemplate ?
                <div className="deposit-cash-form-container">
                  <div id="deposit-cash-form-left">
                  <InputLabeled
                    placeholder={AlphaPoint.translation('DEPOSIT.BANK_NAME') || 'Bank Name'}
                    ref="bankName"
                    className="form-control"
                  />
                  <InputLabeled
                    placeholder={AlphaPoint.translation('DEPOSIT.AMOUNT') || 'Amount'}
                    ref="amount"
                    className="form-control"
                    type="text"
                    onChange={this.handleChangeAmount}
                    value={this.state.amountString}
                  />
                  <InputLabeled
                    placeholder={AlphaPoint.translation('DEPOSIT.REFERENCE_NUMBER') || 'Reference Number'}
                    ref="referenceNumber"
                    className="form-control"
                  />
                  </div>
                  <div id="deposit-cash-form-right">
                    {AlphaPoint.config.depositFileUpload && <InputLabeled placeholder={AlphaPoint.translation('DEPOSIT.RECEIPT') || 'Transaction Receipt'} ref="receipt" type="file" onChange={this.handleFile} className="form-control" />}
                    {/* <p>{AlphaPoint.translation('DEPOSIT.COMMENT') || 'The comment field is optional. Please use it for special instructions.'}</p> */}
                    <TextareaLabeled rows="6" placeholder={AlphaPoint.translation('DEPOSIT.COMMENT_LABEL') || 'Comment'} ref="comment" className="form-control" />
                  </div>
                </div>
                :
                <div className="deposit-cash-form-container">
                  <div id="deposit-cash-form-left">                  
                  <InputLabeled 
                    placeholder={AlphaPoint.translation('DEPOSIT.FULLNAME') || 'Full Name'} 
                    ref="fullName" 
                    className="form-control"
                    onChange={this.handleFullNameChange}
                    value={this.state.fullName}
                    throwError={!this.state.validName}
                    errorDescription={this.state.errorMsg.name}
                    name="name"
                    />
                  <InputLabeled
                    placeholder={AlphaPoint.translation('DEPOSIT.AMOUNT') || 'Amount'}
                    ref="amount"
                    className="form-control"
                    type="text"
                    onChange={this.handleChangeAmount}
                    value={this.state.amountString}
                    throwError={!this.state.validNumber}
                    errorDescription={this.state.errorMsg.amount}
                    name="amount"
                  />
                  </div>
                </div>
              }
              <div className="deposit-cash-action-seperator" />
              <div className="actions-wrapper">
                {this.props.close && <button className="btn btn-action btn-inverse" onClick={this.props.close}>
                  <div id="deposit-cancel-button-icon" />
                  <div className="deposit-cancel-button-text">{AlphaPoint.translation('BUTTONS.CANCEL') || 'Cancel'}</div>
                </button>}
                {' '}
                <ProcessingButton
                  className="btn btn-action btn-submit"
                  processing={this.state.processing}
                  onClick={this.deposit}
                  // disabled={!this.state.validNumber || !this.state.validName || this.state.processing}
                  disabled={this.state.processing}
                  >
                  <div id="deposit-submit-button-icon" />
                  <div>{AlphaPoint.translation('BUTTONS.DEPOSIT') || 'Deposit'}</div>
                </ProcessingButton>
              </div>
            </div> 
            :
            <div className="pad pad-success" ref={el => (this.componentRef = el)}>
              <div id="deposit_ticket_created">
                <div className="successIcon"></div>
                <h3 className="text-center success">Your deposit ticket was created successfully.</h3>
                <h2>Once you complete your bank wire transaction, we will be able to proceed with your request</h2>
                <div id="deposit-info-table">
                  <div id="inner-left" className="inner-info">
                    <div className="header-title">Bank details</div>
                    <div className="body-info">
                      <span>Bank: XXXXXX</span>
                      <span>IBAN: XXXXXX</span>
                      <span>SWIFT: XXXXXX</span>
                      <span>Beneficiary: xxxxxxx</span>
                    </div>
                  </div>
                  <div id="inner-right" className="inner-info">
                    <div className="header-title">Deposit information</div>
                    <div className="body-info">
                      <span>Account ID: {this.state.accountId}</span>
                      <span>Deposit amount: {this.state.amountString}</span>
                    </div>
                  </div>
                </div>
                <p id="note">
                  Please remember to indicate your deposit information in the comments section and allow up to 5 days before you see the funds in your account.
                </p>
              </div>
              <div className="buttons-wrapper">
                <button className="btn btn-action" id="close" onClick={this.props.close}>
                  <div id="deposit-close-button-icon"></div>
                  <div>CLOSE</div>
                </button>
                
                <button onClick={()=>this.save()} className="btn btn-action" id="save">
                  <div id="deposit-save-button-icon"></div>
                  <div>SAVE</div>
                </button>

                <button onClick={()=>this.print()} className="btn btn-action" id="print">
                  <div id="deposit-print-button-icon"></div>
                  <div>PRINT</div>
                </button>

              </div>
              <iframe id="ifmcontentstoprint" style={{height: "0px", width: "0px", position: "absolute"}}></iframe>
            </div>
            }
        </WidgetBase>
      );
    }

    return null;
  }
}

DepositFIAT.defaultProps = {
  close: () => { },
  Product: '',
  ProductId: null,
};

DepositFIAT.propTypes = {
  close: React.PropTypes.func,
  Product: React.PropTypes.string,
  ProductId: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
  ]),
};

export default DepositFIAT;
