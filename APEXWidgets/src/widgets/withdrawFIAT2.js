/* global $, AlphaPoint, document, localStorage */
import React from 'react';
import uuidV4 from 'uuid/v4';
import ScrollLock from 'react-scrolllock';

import WidgetBase from './base';
import Modal from './modal';
import InputLabeled from '../misc/inputLabeled';
import SelectLabeled from '../misc/selectLabeled';
import TextareaLabeled from '../misc/textareaLabeled';
import ProcessingButton from '../misc/processingButton';
import TwoFACodeInput from './twoFACodeInput';

import { parseNumberToLocale, getDecimalPrecision } from './helper';

const cities = AlphaPoint.config.cities;
const provinces = AlphaPoint.config.provinces;

class WithdrawFIAT2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showTemplateTypeSelect: false,
      showTemplate: false,
      showDefaultForm: false,
      templateTypes: [],
      templatesArray: [],
      template: {},
      editedTemplate: {},
      data: {},
      error: '',
      success: '',
      twoFA: {},
      twoFACancel: false,
      processing: false,
      bankProvince: '',
      kycFullName: '',
      billingData: {},
      productId: AlphaPoint.products.value.find((product) => product.Product === props.Product).ProductId,
      accountId: AlphaPoint.selectedAccount.value || AlphaPoint.userAccounts.value[0],
      validNumber: false,

      amountString: '',
      validfullName: false,
      validamount: false,
      validbankName: false,
      validbankAccount: false,
      validbankAddress: false,
      validswiftCode: false,
      errorMsg: {
        fullName: '',
        amount: '',
        bankName: '',
        bankAccount: '',
        bankAddress: '',
        swiftCode: ''
      }
    };
  }

  componentDidMount() {
    const { accountId, productId } = this.state;
    const data = {
      accountId,
      productId,
    };

    this.selectedAccount = AlphaPoint.selectedAccount.subscribe(account => this.setState({ accountId: account }));

    this.withdrawTemplateTypes = AlphaPoint.withdrawTemplateTypes.subscribe((res) => {
      // console.log("withdrawTemplateTypes res",res);
      if (Object.keys(res).length) {
        if (res.result) {
          if (res.TemplateTypes.length > 1) {
            return this.setState({
              showTemplateTypeSelect: true,
              selectedTemplate: res.TemplateTypes[0],
              templateTypes: res.TemplateTypes,
            });
          }
          if (res.TemplateTypes.length === 0) {
            return this.setState({ showDefaultForm: true });
          }

          const templateData = { ...data, templateType: res.TemplateTypes[0] };
          this.setState({ selectedTemplate: res.TemplateTypes[0] });
          return AlphaPoint.getWithdrawTemplate(templateData);
        }
        return this.setState({ showDefaultForm: true });
      }
      return false;
    });

    if (AlphaPoint.config.useCoinsPHWithdrawTemplate) {
      const template = { ID: null, Email: null, PhoneNumber: null };
      return this.setState({
        templatesArray: template,
        template: template,
        editedTemplate: template,
        showTemplate: true,
        showTemplateTypeSelect: false,
        TemplateType: 'CoinsPH'
      });
    }

    this.withdrawTemplate = AlphaPoint.withdrawTemplate.subscribe((res) => {
      if (res.result) {
        if (!res.Template || res.Template === '[]' || !AlphaPoint.config.useCoinsPHWithdrawTemplate) {
          return this.setState({ showDefaultForm: true });
        }
        const response = JSON.parse(res.Template);

        if (Array.isArray(response)) {
          return this.setState({
            templatesArray: response.length > 1 ? response : [],
            template: response.length > 1 ? {} : response[0],
            editedTemplate: response.length > 1 ? {} : response[0],
            showTemplate: true,
            showTemplateTypeSelect: false,
          });
        }

        if (response.isSuccessful) {
          return this.setState({
            template: response.Template,
            editedTemplate: response.Template,
            showTemplate: true,
            showTemplateTypeSelect: false,
          });
        }
        return this.setState({
          template: response,
          editedTemplate: response,
          showTemplate: true,
          showTemplateTypeSelect: false,
        });
      }
      return false;
    });

    this.submitWithdraw = AlphaPoint.submitWithdraw.subscribe((res) => {
      if (Object.keys(res).length) {
        if (res.requireGoogle2FA || res.requireAuthy2FA || res.requireSMS2FA) {
          return this.setState({
            data: res,
            twoFA: res,
            processing: false,
          });
        }

        if (!res.result) {
          const defaultResponse = `There was an error: ${res.errormsg}, ${res.detail}`;
          let error = '';

          if (res.errorcode) {
            if (res.errorcode === 67) {
              error = AlphaPoint.translation('ERRORS.REQUEST_FAILED') || defaultResponse;
            }

            if (res.errorcode === 100) {
              if (res.detail) {
                if (res.detail === 'Insufficient Balance') {
                  error = AlphaPoint.translation('ERRORS.NOT_ENOUGH_FUNDS') || defaultResponse;
                }
                if (res.detail === 'Invalid ProductId' ||
                  res.detail === 'Withdraw Amount must be greater than zero' ||
                  res.detail === 'OMSId, AccountId and ProductId are Required' ||
                  res.detail === 'Withdraw Amount must be greater than zero and less than 9223372036.854775807') {
                  error = defaultResponse;
                }
              }
            } else if (res.errorcode === 102) {
              error = 'Invalid data entered';
            } else if (res.errormsg.indexOf('invalid amount') > -1) {
              error = AlphaPoint.translation('ERRORS.INVALID_AMOUNT') || defaultResponse;
            } else if (res.errormsg.indexOf('Not Enough funds') > -1) {
              const response = res.errormsg.split(':');

              error = (AlphaPoint.translation('ERRORS.NOT_ENOUGH_FUNDS') + response[1]) || defaultResponse;
            } else if (res.errormsg.indexOf('Bank Account Mismatch') > -1) {
              error = AlphaPoint.translation('ERRORS.BANK_MISMATCH') || defaultResponse;
            } else if (res.errormsg.indexOf('Not allowed. Verification level failed.') > -1) {
              const response = res.errormsg.split(':');

              error = (AlphaPoint.translation('ERRORS.VERIFY_FAILED1') + response[1] +
                AlphaPoint.translation('ERRORS.VERIFY_FAILED2') + response[3]) || defaultResponse;
            } else {
              error = `${res.errormsg}: ${res.detail}`;
            }
          } else {
            // this is a generic error with no code
            error = `There was a problem with your request: ${res.detail}`;
          }

          $.bootstrapGrowl(error, {
            type: 'danger',
            allow_dismiss: true,
            align: AlphaPoint.config.growlwerPosition,
            delay: AlphaPoint.config.growlwerDelay,
            offset: { from: 'top', amount: 30 },
            left: '60%',
          });

          return this.setState({
            data: res,
            error,
            processing: false,
          });
        }
        const successTemp = AlphaPoint.translation('WITHDRAW.FIAT_TEMP_CONFIRM') || 'Request Received';
        const successTemp2 = AlphaPoint.translation('WITHDRAW.FIAT_TEMP_CONFIRM2') || 'Please Check your email';

        res.errormsg = '';
        $.bootstrapGrowl(successTemp, {
          type: 'success',
          allow_dismiss: true,
          align: AlphaPoint.config.growlwerPosition,
          delay: AlphaPoint.config.growlwerDelay,
          offset: { from: 'top', amount: 30 },
          left: '60%',
        });
        if (AlphaPoint.config.confirmWithEMail) {
          $.bootstrapGrowl(successTemp2, {
            type: 'info',
            allow_dismiss: true,
            align: AlphaPoint.config.growlwerPosition,
            delay: AlphaPoint.config.growlwerDelay,
            offset: { from: 'top', amount: 30 },
            left: '60%',
          });
        }

        return this.setState({
          data: res,
          error: '',
          processing: false,
          showDefaultForm: false,
          showTemplate: false,
        });
      }

      return AlphaPoint.getWithdrawTickets({
        OMSId: AlphaPoint.oms.value,
        AccountId: AlphaPoint.selectedAccount.value,
      });
    });

    if (AlphaPoint.config.useWithdrawFees) {
      this.withdrawFee = AlphaPoint.withdrawFee.subscribe(fee => this.setState({ fee }));
    }

    this.products = AlphaPoint.products.filter(data => data.length).subscribe(products => {
      const decimalPlaces = {};
      products.forEach(product => {
        decimalPlaces[product.Product] = product.DecimalPlaces;
      });
      this.setState({ decimalPlaces });
    });

    AlphaPoint.getWithdrawTemplateTypes(data);
  }

  componentWillUnmount() {
    /* eslint-disable no-unused-expressions */
    AlphaPoint.withdrawTemplateTypes.onNext([]);
    AlphaPoint.withdrawTemplate.onNext([]);
    AlphaPoint.submitWithdraw.onNext([]);
    this.selectedAccount.dispose();
    this.auth2FAuthentication && this.auth2FAuthentication.dispose();
    this.submitWithdraw && this.submitWithdraw.dispose();
    this.withdrawTemplateTypes && this.withdrawTemplateTypes.dispose();
    this.withdrawTemplate && this.withdrawTemplate.dispose();
    this.withdrawFee && this.withdrawFee.dispose();
    this.products.dispose();
    /* eslint-enable no-unused-expressions */
  }

  onChangeTemplateField = (e) => {
    const template = { ...this.state.editedTemplate };

    template[e.target.name] = e.target.value;
    this.setState({ editedTemplate: template });
  };

  getWithdrawTemplate = () => {
    const payload = {
      accountId: this.state.accountId,
      productId: this.state.productId,
      templateType: this.state.selectedTemplate,
    };

    AlphaPoint.getWithdrawTemplate(payload);
  };

  selectWithdrawTemplate = (e) => {
    this.setState({ selectedTemplate: e.target.value });
  };

  changeBilling = (e) => {
    const data = {};

    Object.keys(this.refs).forEach((key) => {
      if (this.refs[key].type === 'checkbox' || this.refs[key].type === 'radio') {
        data[key] = this.refs[key].checked;
      } else {
        data[key] = this.refs[key].value();
      }
    });


    return this.setState({
      billingData: data,
      success: '',
      error: '',
      ["valid" + e.target.name]: e.target.value !== ''
    });
  };

  closeModal = () => {
    this.setState({
      twoFA: {},
      twoFACancel: true,
    });
  }

  changeAmount = e => {
    const amount = parseNumberToLocale(e.target.value);
    const decimals = getDecimalPrecision(amount);
    const decimalsAllowed = this.state.decimalPlaces[this.props.Product];
    const msgDecimals = `Only ${decimalsAllowed} decimal places are allowed for ${this.props.Product}.`;
    const msgMaximum = `Your withdrawal value request is higher than your account balance.`;

    if(e.target.value === ''){
      this.setState({
        ...this.state,
        amountString: e.target.value, 
        validamount: false, 
        errorMsg:{
          ...this.state.errorMsg,
          [e.target.name]: null
        }
      })
    }
    else if (decimals > decimalsAllowed) {
      this.setState({ 
        ...this.state,
        amount, 
        amountString: e.target.value, 
        errorMsg: {
          ...this.state.errorMsg,
          [e.target.name]: msgDecimals
        }, 
        validamount: false 
      }); 
    } 
    else if (!isNaN(amount)) { 
      if(amount > this.props.availableBalance){
        return this.setState({ 
          ...this.state,
          amount, 
          amountString: e.target.value, 
          errorMsg: {
            ...this.state.errorMsg,
            [e.target.name]: msgMaximum
          }, 
          validamount: false 
        });
      } 
      this.setState({validamount: true, amount, amountString: e.target.value})
      if (AlphaPoint.config.useWithdrawFees && amount) {
        AlphaPoint.getWithdrawFee({
          OMSId: AlphaPoint.oms.value,
          ProductId: this.state.productId,
          AccountId: this.state.accountId,
          Amount: amount,
        });
      }
    }
    return null;
  };

  withdraw = e => {
    e.preventDefault();
    if(!this.state.validamount || !this.state.validbankName || !this.state.validbankAccount || !this.state.validfullName || !this.state.validbankAddress || !this.state.validswiftCode){
      return this.displayErrorMsg();
    }
    const balance = this.props.balance;
    const templateForm = { ...this.state.template, ...this.state.editedTemplate };
    const templateType = 'FIAT';

    this.setState({ processing: true });

    if (this.state.amount > balance) {
      return this.setState({ error: 'Insufficient Funds', success: '', processing: false });
    }

    const data = {
      OMSId: AlphaPoint.oms.value,
      productId: this.state.productId,
      accountId: this.state.accountId,
      amount: +this.state.amount,
      TemplateType: this.state.TemplateType || this.state.template.TemplateType
        || this.state.selectedTemplate || templateType,
    };

    if (this.state.showDefaultForm) {
      // NZD withdrawals must include Fullname
      if (this.props.Product === 'NZD' && !this.refs.fullName.value()) {
        const error = AlphaPoint.translation('WITHDRAW.FULLNAME_REQUIRED')
          || 'Please enter your full name';
        $.bootstrapGrowl(error, {
          type: 'danger',
          allow_dismiss: true,
          align: AlphaPoint.config.growlwerPosition,
          delay: AlphaPoint.config.growlwerDelay,
          offset: { from: 'top', amount: 30 },
          left: '60%',
        });
        return this.setState({
          error: AlphaPoint.translation('WITHDRAW.FULLNAME_REQUIRED')
            || 'Please enter your full name',
          processing: false,
        });
      }
      templateForm.fullName = this.refs.fullName.value();
      templateForm.language = localStorage && localStorage.lang ? localStorage.lang : AlphaPoint.config.defaultLanguage;
      templateForm.comment = this.refs.comment.value();
      if (AlphaPoint.config.siteName !== 'dasset') { templateForm.bankAddress = this.refs.bankAddress.value(); }
      templateForm.bankAccountNumber = this.refs.bankAccountNumber.value();
      templateForm.bankAccountName = this.refs.bankAccountName.value();
      if (this.refs.swiftCode) templateForm.swiftCode = this.refs.swiftCode.value();
      if (this.refs.sortCode) templateForm.sortCode = this.refs.sortCode.value();

      // Save the billing data
      const billingData = {};
      /* eslint-disable quotes */
      /* eslint-disable prefer-template */
      billingData.billingInfo = "{\"bankAccountName\":\"" + this.refs.bankAccountName.value() + "\",\"bankAccountNumber\":\""
        + this.refs.bankAccountNumber.value() + "\",\"fullName\":\"" + templateForm.fullName + "\",\"bankAddress\":\"" + templateForm.userAddress + "\"";
      if (templateForm.bankCity) billingData.billingInfo += ",\"bankCity\":\"" + templateForm.bankCity + "\"";
      if (templateForm.bankProvince) billingData.billingInfo += ",\"bankProvince\":\"" + templateForm.bankProvince + "\"";
      if (this.props.instrument === 'USD') billingData.billingInfo += ",\"swiftCode\":\"" + this.refs.swiftCode.value() + "\"";
      billingData.billingInfo += "}";
      /* eslint-enable quotes */
      /* eslint-enable prefer-template */
    }
    data.templateForm = JSON.stringify(templateForm);
    return AlphaPoint.withdraw(data);
  }

  displayErrorMsg = () => {
    const newErrorMsg = {};
    const currentErrorMsg = this.state.errorMsg;
    for(let key in currentErrorMsg){
      key === 'amount' ? 
        newErrorMsg[key] = !this.state.validamount && (this.state.errorMsg.amount || 'Required field') 
        : 
        newErrorMsg[key] = !this.state['valid'+ key] && 'Required field';
    }
    this.setState({errorMsg: newErrorMsg})
  }

  do2FAVerification = (code) => {
    const data = {};

    if (this.state.twoFA.requireGoogle2FA) {
      data.val2FaGoogleCode = code;
    }
    if (this.state.twoFA.requireAuthy2FA) {
      data.val2FaOAuthyCode = code;
    }
    if (this.state.twoFA.requireSMS2FA) {
      data.val2FaSMSCode = code;
    }

    data.val2FaRequestCode = this.state.twoFA.val2FaRequestCode;

    AlphaPoint.do2FAVerification(data, (res) => {
      if (res.rejectReason) {
        if (res.rejectReason.indexOf('Withdraw is Pending for Operator Approval') > -1) {
          const successTemp = res.rejectReason;
          res.isAccepted = true;
          res.rejectReason = '';
          return this.setState({
            twoFA: {},
            data: res,
            success: successTemp,
            processing: false,
          });
        }
        return this.setState({
          twoFA: {},
          data: res,
          error: res.rejectReason,
          processing: false,
        });
      }
      return this.setState({
        twoFA: {},
        data: res,
        processing: false,
      });
    });
  }

  selectTemplateArrayOption = (e) => {
    const { value } = e.target;
    const template = this.state.templatesArray.find((temp) => temp.nickname === value);

    if (!value) return this.setState({ template: {} });
    return this.setState({ template });
  };

  getScrollArea = ref => {
    this.scrollArea = ref;
  };


  render() {
    const headerTitle = `${AlphaPoint.translation('WITHDRAW.WITHDRAW') || 'Withdraw'} ${this.props.Product ? `(${this.props.Product})` : ''}`;
    const provinceList = (provinces || []).map((item, i) => (<option value={item.code} key={i}>{(item.name)}</option>)); // eslint-disable-line react/no-array-index-key
    let province;
    if (AlphaPoint.config.siteName === 'xfcmarket') {
      province = this.state.billingData.bankProvince ?
        this.state.billingData.bankProvince
        :
        provinceList[0].props.value;
    }
    const cityList = (cities || []).map((item, i) => {
      if (province === item.province) {
        return <option value={item.code} className="show" key={i}>{item.name}</option>; // eslint-disable-line react/no-array-index-key
      }
      return null;
    });

    if (this.state.showTemplateTypeSelect) {
      return (
        <WidgetBase
          {...this.props}
          headerTitle={headerTitle}
          error={this.state.error}
          success={this.state.success}
          customClass="withdraw-cash"
          withCloseButton={true}
          ref={this.getScrollArea}
        >
          <ScrollLock touchScrollTarget={this.scrollArea} />
          <div className="pad">
            <h3>{AlphaPoint.translation('WITHDRAW.SELECT_TEMPLATE') || 'Select a withdraw template'}</h3>
            <select className="form-control" onChange={this.selectWithdrawTemplate} value={this.state.selectedTemplate}>
              {this.state.templateTypes.map((type) => <option>{type}</option>)}
            </select>
          </div>
          <div className="pad">
            <div className="clearfix">
              <div className="pull-right" style={AlphaPoint.config.siteName === 'aztec' ? { width: '100%' } : null}>
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
            </div>
          </div>
        </WidgetBase>
      );
    }

    if (this.state.showTemplate) {
      return (
        <WidgetBase
          {...this.props}
          headerTitle={headerTitle}
          error={this.state.error}
          success={this.state.success}
          customClass="withdraw-cash"
          withCloseButton={true}
          ref={this.getScrollArea}
        >
          <ScrollLock touchScrollTarget={this.scrollArea} />
          <div className="pad">
            <InputLabeled
              placeholder={AlphaPoint.translation('WITHDRAW.AMOUNT') || 'Amount'}
              onChange={this.changeAmount}
              value={this.state.amountString}
              type="text"
              ref="amount"
            />

            {this.state.templatesArray.length ?
              <SelectLabeled placeholder="Select account" onChange={this.selectTemplateArrayOption}>
                <option value="">Select account</option>
                {this.state.templatesArray.map((template) => (
                  <option value={template.nickname}>{template.nickname}</option>
                ))}
              </SelectLabeled> : null}

            {Object.keys(this.state.template)
              .filter((key) => key !== 'TemplateType')
              .map((field, index) => {
                if (this.state.template[field]) {
                  return (
                    <div key={uuidV4()} style={{ marginBottom: '1rem' }}>
                      <p
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          marginBottom: '0.5rem',
                        }}
                      >{field.replace(/([a-z])([A-Z])/g, '$1 $2')}</p>
                      <p style={{ marginLeft: '1rem' }}>{this.state.template[field]}</p>
                    </div>
                  );
                }
                return (<InputLabeled
                  key={index} // eslint-disable-line react/no-array-index-key
                  name={field}
                  label={field.replace(/([a-z])([A-Z])/g, '$1 $2')}
                  placeholder={field.replace(/([a-z])([A-Z])/g, '$1 $2')}
                  onChange={this.onChangeTemplateField}
                  value={this.state.editedTemplate[field]}
                  wrapperClass={'withdrawfiat-'+field.toLowerCase()+'-input'}
                />);
              })}

            {AlphaPoint.config.useWithdrawFees && this.state.fee
              ? <p>{AlphaPoint.translation('WITHDRAW.FEE_MESSAGE') || 'You\'ll be charged a fee of'} {this.state.fee}{this.props.Product}</p>
              : null}

            <div className="clearfix">
              <div className="pull-right" style={AlphaPoint.config.siteName === 'aztec' ? { width: '100%' } : null}>
                <button
                  className="btn btn-action btn-inverse"
                  onClick={this.props.close}
                >
                  {AlphaPoint.translation('BUTTONS.TEXT_CANCEL') || 'Cancel'}
                </button>
                <ProcessingButton
                  className="btn btn-action"
                  onClick={this.withdraw}
                  processing={this.state.processing}
                  disabled={this.state.processing || !this.state.validNumber}
                >
                  {AlphaPoint.translation('WITHDRAW.PROCESS_WITHDRAW') || 'Process Withdraw'}
                </ProcessingButton>
              </div>
            </div>
          </div>
        </WidgetBase>
      );
    }

    if (this.state.showDefaultForm) {
      return (
        // wrap all content in widget base
        <WidgetBase
          {...this.props}
          headerTitle={headerTitle}
          error={this.state.error}
          success={this.state.success}
          customClass="withdraw-cash"
          withCloseButton={true}
          ref={this.getScrollArea}
        >
           {navigator.userAgent.toLowerCase().indexOf("iphone") > -1 
            ? null
            : <ScrollLock touchScrollTarget={this.scrollArea} />}
          <div className="pad withdraw-pad">
            <form onSubmit={this.withdraw}>
              {/* {AlphaPoint.config.siteName === 'dasset' && this.props.Product === 'NZD' ? '' : <p>{AlphaPoint.translation('WITHDRAW.TITLE_TEXT') || 'Withdraw Form'}</p>} */}

              {/* {AlphaPoint.config.siteName === 'dasset' && this.props.Product === 'NZD' ?
                <p>
                  Step 1: Create a new withdraw ticket for each withdrawal.
                  The name on the bank account must match your verified identity.
                  <br />
                  Step 2: Dasset will process your withdrawal and you will receive
                  your funds within 24 business hours.
                </p>
                : <p>{AlphaPoint.translation('WITHDRAW.FORM_TITLE') || 'Create the withdraw ticket.'}</p>
              } */}

              {/* {(AlphaPoint.config.siteName === 'worldpayex.com' && this.props.instrument === 'USD') ?
                <p>{AlphaPoint.translation('WITHDRAW.STEP_1') || 'Please write form in English.'}</p>
                :
                <span />} */}
                <p>Create a <span className="withdraw-cash-title-bold">Withdraw Ticket</span></p>
                <div id="withdraw-form-container">
                <ul className="withdraw-form-left">
                <li>
                <InputLabeled
                  placeholder={AlphaPoint.translation('WITHDRAW.AMOUNT') || 'Amount'}
                  onChange={this.changeAmount}
                  value={this.state.amountString}
                  type="text"
                  ref="amount"
                  throwError={!this.state.validamount}
                  errorDescription={this.state.errorMsg.amount}
                  name="amount"
                />
                </li>
                <li>
                <InputLabeled
                  placeholder={AlphaPoint.translation('WITHDRAW.BANK_NAME') || 'Bank Name'}
                  ref="bankAccountName"
                  value={this.state.billingData.bankAccountName}
                  onChange={this.changeBilling}
                  throwError={!this.state.validbankName}
                  errorDescription={this.state.errorMsg.bankName}
                  name="bankName"
                />
                </li>
                {AlphaPoint.config.siteName === 'xfcmarket' &&
                  <li><SelectLabeled
                    className="form-control pull-left"
                    ref="bankProvince"
                    onChange={this.changeBilling}
                    placeholder={AlphaPoint.translation('WITHDRAW.BANK_PROVINCE') || 'Bank Province'}
                    style={{ width: '250px' }}
                    value={this.state.billingData.bankProvince}
                  >
                    {provinceList}
                  </SelectLabeled></li>}
                {AlphaPoint.config.siteName === 'xfcmarket' &&
                  <li><SelectLabeled
                    className="form-control pull-left"
                    ref="bankCity"
                    onChange={this.changeBilling}
                    placeholder={AlphaPoint.translation('WITHDRAW.BANK_CITY') || 'Bank City'}
                    style={{ width: '250px' }}
                    value={this.state.billingData.bankCity}
                  >
                    {cityList}
                  </SelectLabeled></li>}
                  <li>
                <InputLabeled
                  placeholder={AlphaPoint.translation('WITHDRAW.ACCOUNT_ID') || 'Bank Account #'}
                  ref="bankAccountNumber"
                  value={this.state.billingData.bankAccountNumber}
                  onChange={this.changeBilling}
                  throwError={!this.state.validbankAccount}
                  errorDescription={this.state.errorMsg.bankAccount}
                  name="bankAccount"
                />
                </li>                
                </ul>
                <ul className="withdraw-form-right">             
                <li>
                <InputLabeled
                  placeholder={AlphaPoint.translation('WITHDRAW.FULLNAME') || 'Full Name'}
                  ref="fullName"
                  value={this.state.billingData.fullName}
                  onChange={this.changeBilling}
                  required={this.props.Product === 'NZD'}
                  throwError={!this.state.validfullName}
                  errorDescription={this.state.errorMsg.fullName}
                  name="fullName"
                />
                </li>
                {AlphaPoint.config.siteName !== 'dasset' && <li><InputLabeled
                  placeholder={AlphaPoint.translation('WITHDRAW.BANK_ADDRESS') || 'Bank Address'}
                  ref="bankAddress"
                  value={this.state.billingData.bankAddress}
                  onChange={this.changeBilling}
                  throwError={!this.state.validbankAddress}
                  errorDescription={this.state.errorMsg.bankAddress}
                  name="bankAddress"
                /></li>}                   
                {/* Swift Code displayed for all Fiat Currency except NZD */}
                {this.props.Product !== 'NZD' &&
                  <li>
                  <InputLabeled
                    placeholder={AlphaPoint.translation('WITHDRAW.SWIFT') || 'Swift Code'}
                    ref="swiftCode"
                    value={this.state.billingData.swiftCode}
                    onChange={this.changeBilling}
                    throwError={!this.state.validswiftCode}
                    errorDescription={this.state.errorMsg.swiftCode}
                    name="swiftCode"
                  />
                  </li>
                  }
                {AlphaPoint.config.siteName === 'londonblockexchange' &&
                  <li>
                  <InputLabeled
                    placeholder={AlphaPoint.translation('WITHDRAW.SORT') || 'Sort Code'}
                    ref="sortCode"
                    value={this.state.billingData.sortCode}
                    onChange={this.changeBilling}
                  />
                  </li>}
                <li className="withdraw-cash-comment">
                  <p>{AlphaPoint.translation('WITHDRAW.COMMENT') || 'The comment field is optional. Please use it for special instructions.'}</p>
                </li>
                <li>
                <TextareaLabeled
                  rows="4"
                  placeholder={AlphaPoint.translation('WITHDRAW.COMMENT_LABEL') || 'Comment'}
                  ref="comment"
                  wrapperClass="withdraw-comment-input"
                />
                </li>
                </ul>    
                </div>

              {AlphaPoint.config.useWithdrawFees && this.state.fee
                ? <p>{AlphaPoint.translation('WITHDRAW.FEE_MESSAGE') || 'You\'ll be charged a fee of'} {this.state.fee}{this.props.Product}</p>
                : null}

            <div className="withdraw-modal-actions">
              
                  <button
                    className="btn btn-action btn-inverse close-withdraw"
                    onClick={this.props.close}
                  >
                                    <div id="withdraw-cancel-button-icon"></div>
                                    <div>{AlphaPoint.translation('BUTTONS.CANCEL') || 'Cancel'}</div>
                  </button>
                  {' '}
                  <ProcessingButton
                    className="btn btn-action withdraw-modal-withdraw-button"
                    onClick={this.withdraw}
                    processing={this.state.processing}
                    disabled={this.state.processing}
                    type="submit"
                  ><div className="withdraw-modal-withdraw-button-icon"></div>
                    <div className="withdraw-modal-withdraw-button-text">
                      {AlphaPoint.translation('BUTTONS.WITHDRAW') || 'Withdraw'}
                    </div>
                  </ProcessingButton>
              
            </div>

            </form>
        </div>

          {(this.state.twoFA.requireGoogle2FA || this.state.twoFA.requireAuthy2FA || this.state.twoFA.requireSMS2FA) &&
            <Modal close={this.closeModal}>
              <TwoFACodeInput {...this.state.twoFA} submit={this.do2FAVerification} />
            </Modal>}
        </WidgetBase>
      );
    }

    if (this.state.data.result) {
      return (
        <WidgetBase
          {...this.props}
          headerTitle={headerTitle}
          error={this.state.error}
          success={this.state.success}
          customClass="withdraw-cash"
          withCloseButton={true}
          ref={this.getScrollArea}
          successPopup={!this.state.twoFACancel}
        >
          <ScrollLock touchScrollTarget={this.scrollArea} />
          {!this.state.twoFACancel ?
            <div className="pad pad-success">
              <div className="successIcon"></div>
              <h3 className="text-center success">{AlphaPoint.translation('WITHDRAW.FIAT_CONFIRM') || 'Request Received'}</h3>
              <div id="withdrawFiat-note">Please allow 3–5 days for processing.</div>
              <button className="btn btn-action" id="close" onClick={()=>this.props.close()}>
                <div id="deposit-close-button-icon"></div>
                <div>CLOSE</div>
              </button>
            </div>
            :
            <div className="pad">
              <h3 className="text-center">{AlphaPoint.translation('WITHDRAW.CANCEL') || 'Withdraw request cancelled.'}</h3>
              <div className=" clearfix">
                <div className="pull-right">
                  <button className="btn btn-action" onClick={this.props.close}>{AlphaPoint.translation('BUTTONS.TEXT_CLOSE') || 'Close'}</button>
                </div>
              </div>
            </div>}
        </WidgetBase>
      );
    }

    return null;
  }
}

WithdrawFIAT2.defaultProps = {
  Product: '',
  instrument: '',
  close: () => { },
  balance: null,
};

WithdrawFIAT2.propTypes = {
  Product: React.PropTypes.string,
  instrument: React.PropTypes.string,
  close: React.PropTypes.func,
  balance: React.PropTypes.number,
};

export default WithdrawFIAT2;
