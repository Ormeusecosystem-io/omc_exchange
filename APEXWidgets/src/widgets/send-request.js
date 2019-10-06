/* global AlphaPoint, $ */
import React from 'react';
import uuidV4 from 'uuid/v4';

import WidgetBase from './base';
import ConfirmReject from './confirmReject';
import InputNoLabel from '../misc/inputNoLabel';
import Modal from './modal';
import TwoFACodeInput from './twoFACodeInput';

import {
  ordersWidgetDidMount,
  ordersWidgetWillUnmount,
  getOrderFee,
  changeValueOnMarketChange,
  changeAmountOnMarketChange,
} from '../misc/ordersWidgetsHelper';
import {
  formatNumberToLocale,
  parseNumberToLocale,
  getDecimalPrecision,
} from './helper';

class SendRequest extends React.Component {
  constructor(props) {
    super(props);

    this.validEmail = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    this.ordersWidgetDidMount = ordersWidgetDidMount.bind(this);
    this.ordersWidgetWillUnmount = ordersWidgetWillUnmount.bind(this);
    this.getOrderFee = getOrderFee;
    this.changeValueOnMarketChangeFunc = changeValueOnMarketChange.bind(this);
    this.changeAmountOnMarketChangeFunc = changeAmountOnMarketChange.bind(this);

    this.state = {
      send: !props.request,
      balances: [],
      products: [],
      productPairs: [],
      currentProduct: 1,
      currentProductSymbol: '',
      currentProductPair: '',
      decimalPlaces: {},
      amountLastChanged: true,
      // transactionFee: 0,
      netAmount: 0,
      // values to grab
      amount: 0,
      username: '',
      notes: '',
      // validation tools
      invalidAmount: false,
      invalidUsername: false,
      invalidInput: true,
      errorMessage: '',
      // post-submission tools
      processing: false,
      authProcessing: false,
      // true shows confirm successful authentication message
      confirmCloseButton: false,
      // true fires a 'try authentication code again' button
      tryAuthenticatingAgainButton: false,

      authenticationConfirmModal: false,
      processSuccessMessage: '',
      processErrorMessage: '',
      twoFA: { requireGoogle2FA: false },
    };
  }

  componentDidMount() {
    this.productPairs = AlphaPoint.instruments.subscribe(productPairs => this.setState({ productPairs }));
    this.productPair = AlphaPoint.prodPair.subscribe(currentProductPair => this.setState({ currentProductPair }));

    this.ordersWidgetDidMount(true);

    this.products.dispose();
    this.products = AlphaPoint.products.subscribe(prod => {
      // console.log(prod);

      const cryptofilter = product => product.ProductType && product.ProductType === 'CryptoCurrency';
      this.setState({ products: prod.filter(cryptofilter) });

      const decimalPlaces = {};
      prod.forEach(product => {
        decimalPlaces[product.Product] = product.DecimalPlaces;
      });
      this.setState({ decimalPlaces });

      prod
        .filter(cryptofilter)
        .filter((products, index) => index === 0)
        .forEach(product => {
          this.setState({ currentProduct: product.ProductId, currentProductSymbol: product.Product });
        });
    });

    this.accountInformation = AlphaPoint.accountPositions.subscribe(balances => this.setState({ balances }));
    this.transferFunds = AlphaPoint.transfunds
      .filter(data => Object.keys(data).length)
      .subscribe(data => {
        const growlerOpts = AlphaPoint.config.growlerDefaultOptions;

        if (data && data.result) {
          $.bootstrapGrowl(
            AlphaPoint.translation('TRANSFER_SUCCESSFUL') || 'Transfer successful',
            { ...growlerOpts, type: 'success' });
          if (this.state.processing) this.setState({ processing: false, confirmCloseButton: true });
        } else if (data && !data.result && data.detail === 'Waiting for 2FA') {
          // stop spinner
          if (this.state.processing) this.setState({ processing: false });
          // show 2fa modal
          this.setState({ twoFA: { requireGoogle2FA: true } });
          // subscribe to authenticate2fa
          AlphaPoint.auth2FA.subscribe((res) => {
            if (res.Authenticated && this.state.authProcessing) {
              // stop spinner, show confirm button to close modal, show message to visually confirm a successful authentication and transfer
              this.setState({ authProcessing: false, twoFA: { requireGoogle2FA: false }, authenticationConfirmModal: true, confirmCloseButton: true, processErrorMessage: '', processSuccessMessage: `You have been authenticated and your ${this.state.send && 'send'} request was successful.` });
            } else if (this.state.authProcessing) {
              this.setState({ authProcessing: false, twoFA: { requireGoogle2FA: false }, authenticationConfirmModal: true, tryAuthenticatingAgainButton: true, processSuccessMessage: '', processErrorMessage: `Authentication Failed.` });
            }
          });

        } else if (data && !data.result) {
          $.bootstrapGrowl(
            (AlphaPoint.translation('SEND_UNSUCCESSFUL') || 'Send unsuccessful') + data.detail ? data.detail : '',
            { ...growlerOpts, type: 'danger' });
          if (this.state.processing) this.setState({ processing: false, tryAgain: true });
        }
        this.setState({ processing: false });
      });

    this.requestfunds = AlphaPoint.requestfunds
      .filter(data => Object.keys(data).length)
      .subscribe(data => {
        if (data && data.result) {
          AlphaPoint.getSentTransferRequests(AlphaPoint.selectedAccount.value);
          if (this.state.processing) this.setState({ processing: false });
        } else if (data && !data.result) {
          if (this.state.processing) this.setState({ processing: false });
        }
      });
  }

  componentWillUnmount() {
    this.productPairs.dispose();
    this.productPair.dispose();
    this.products.dispose();
    this.accountInformation.dispose();
    this.transferFunds.dispose();
    this.requestfunds.dispose();
  }

  sendFunds = e => {
    e.preventDefault();

    const payload = {
      OMSId: AlphaPoint.oms.value,
      ProductId: this.state.currentProduct,
      SenderAccountId: AlphaPoint.selectedAccount.value,
      Notes: this.state.notes,
      ReceiverUsername: this.state.username,
      Amount: this.state.netAmount,
    };

    if (!payload.Amount || payload.Amount <= 0) {
      this.setState({
        invalidInput: true,
        errorMessage: AlphaPoint.translation('SEND_REQUEST.VALID_AMOUNT_OF') || 'Please enter a valid amount of ' + this.state.currentProductSymbol,
        invalidAmount: true,
        invalidUsername: false,
      });
      return false;
    } else if (!this.validEmail.test(payload.ReceiverUsername)) {
      this.setState({
        invalidInput: true,
        errorMessage: AlphaPoint.translation('SEND_REQUEST.VALID_EMAIL') || 'Please enter a valid email address',
        invalidUsername: true,
        invalidAmount: false,
      });
      return false;
    }
    this.setState({ processing: true, invalidUsername: false, invalidAmount: false, errorMessage: '' });
    return AlphaPoint.transferFunds(payload);
  }

  requestFunds = e => {
    e.preventDefault();

    const payload = {
      OMSId: AlphaPoint.oms.value,
      ProductId: this.state.currentProduct,
      Notes: this.state.notes,
      ReceiverUsername: this.state.username,
      Amount: this.state.netAmount,
    };

    if (!payload.Amount || payload.Amount <= 0) {
      this.setState({
        invalidInput: true,
        errorMessage: AlphaPoint.translation('SEND_REQUEST.VALID_AMOUNT_OF') || 'Please enter a valid amount of ' + this.state.currentProductSymbol,
        invalidAmount: true,
        invalidUsername: false,
      });
      return false;
    } else if (!this.validEmail.test(payload.ReceiverUsername)) {
      this.setState({
        invalidInput: true,
        errorMessage: AlphaPoint.translation('SEND_REQUEST.VALID_EMAIL') || 'Please enter a valid email address',
        invalidUsername: true,
        invalidAmount: false,
      });
      return false;
    }
    this.setState({ processing: true, invalidUsername: false, invalidAmount: false, errorMessage: '' });
    return AlphaPoint.requestFunds(payload);
  }

  changeMode = send => this.setState({ send, invalidInput: true, invalidUsername: false, invalidAmount: false, errorMessage: '', amount: 0, netAmount: 0 });

  changeProd = e => {
    const myProduct = this.state.products.find(product => product.Product === e.target.value) || {};

    this.setState({ amount: 0, netAmount: 0, username: '' });
    AlphaPoint.setProduct(myProduct.ProductId);

    this.setState({ currentProduct: myProduct.ProductId, currentProductSymbol: myProduct.Product, invalidInput: true, invalidUsername: false, invalidAmount: false, errorMessage: '' });
  }

  changeAmount = e => {
    const { currentProductSymbol, decimalPlaces } = this.state;
    const amount = e.target.value;
    const netAmount = parseNumberToLocale(amount);
    const decimals = getDecimalPrecision(netAmount);
    const decimalsAllowed = decimalPlaces[currentProductSymbol];

    const msgInvalid = AlphaPoint.translation('BUY_SELL_MODAL.VALID_NUMBER') || 'Please enter a valid number';
    const msgDecimals = `${AlphaPoint.translation('BUY_SELL_MODAL.MAX_DECIMAL') || 'Max decimal places allowed is'} ${decimalsAllowed}`;

    if (decimals > decimalsAllowed) {
      this.setState({ invalidInput: true, invalidAmount: true, errorMessage: msgDecimals });
    } else if (isNaN(netAmount)) {
      this.setState({ invalidInput: true, invalidAmount: true, errorMessage: msgInvalid });
    } else {
      this.setState({ invalidInput: false, invalidAmount: false, errorMessage: '', amount, netAmount });
    }
  }

  changeUsername = e => {
    const value = e.target.value;

    if (!this.validEmail.test(value)) {
      return this.setState({
        invalidInput: true,
        errorMessage: AlphaPoint.translation('SEND_REQUEST.VALID_EMAIL') || 'Please enter a valid email address',
        invalidUsername: true,
        username: e.target.value,
      });
    }
    return this.setState({
      invalidUsername: false,
      errorMessage: '',
      invalidInput: false,
      username: e.target.value,
    });
  };

  changeNotes = (e) => {
    e.preventDefault();
    this.setState({ notes: e.target.value });
  }

  do2FAVerification = code => {
    const data = { Code: code };
    AlphaPoint.authenticate2FA(data);
    this.setState({ authProcessing: true });
  };

  closeTwoFAModal = () => {
    this.setState({ twoFA: { requireGoogle2FA: false } });
  };

  tryAuthenticatingAgain = () => {
    this.setState({
      twoFA: { requireGoogle2FA: true },
      authenticationConfirmModal: false,
      tryAuthenticatingAgainButton: false,
    });
  }

  closeAuthenticationConfirmModal = () => {
    this.setState({ authenticationConfirmModal: false });
  }

  render() {
    const inputsRadio = [];
    const labelsRadio = [];

    const options = this.state.products.map((prod, index) => {
      if (index === 0) {
        return <option value={prod.Product} key={uuidV4()}>{prod.Product}</option>;
      }
      return <option value={prod.Product} key={uuidV4()}>{prod.Product}</option>;
    });

    const myProduct = this.state.products.find((prod) => this.state.currentProduct === prod.ProductId) || {};

    const tabs = (
      <div>
        <span className={`tab tab-first ${this.state.send ? 'active' : ''}`}
              onClick={() => this.changeMode(true)}>
          {AlphaPoint.translation('SEND_REQUEST.SEND_BITCOIN') || 'Send'} {myProduct.ProductFullName}
          </span>
        <span className={`tab tab-second ${!this.state.send ? 'active' : ''}`}
              onClick={() => this.changeMode(false)}>
          {AlphaPoint.translation('SEND_REQUEST.REQUEST_BITCOIN') || 'Request'} {myProduct.ProductFullName}
          </span>
        <span className="blue-line" />
      </div>
    );

    if (this.state.products.length > 0) {
      for (let i = 0; i < this.state.products.length; i++) {
        inputsRadio.push(
          <input
            type="radio"
            value={this.state.products[i].Product}
            name="sc-1-1"
            id={`sc-1-1-${i + 1}`}
            readOnly
            onClick={this.changeProd}
            key={i}
            checked={(this.state.products[i].ProductId === this.state.currentProduct && true) || false}
          />,
        );
        labelsRadio.push(
          <label
            htmlFor={`sc-1-1-${i + 1}`}
            data-value={this.state.products[i].Product}
          >{this.state.products[i].Product}</label>,
        );
      }
    }

    return (
      <WidgetBase
        {...this.props}
        headerTitle=""
      >
          {this.state.authenticationConfirmModal &&
            <Modal idModal="confirm" close={this.closeAuthenticationConfirmModal}>
              <div className="ap-widget">
                <div className="ap-header">
                  <div className="ap-title text-center">
                    <div style={{ float: 'right' }} className="ap-header-actions">
                      <div>
                        <div style={{ right: '17px', top: '0', fontSize: '30px' }}
                             className="ap-header-actions-btn-close"
                             onClick={this.closeAuthenticationConfirmModal}>×</div>
                      </div>
                    </div>
                    <span style={{ borderBottom: '2px solid #c8c8c8', height: '60px' }}>
                      {this.state.processSuccessMessage &&
                        <span style={{
                          position: 'relative',
                          display: 'block',
                          transform: 'translateX(-50%)',
                          left: '50%',
                          textAlign: 'center',
                          top: '25%',
                          fontSize: '24px',
                          fontWeight: '600',
                          color: '#0ea920',
                          borderBottom: 'none'
                        }}
                        >{this.state.processSuccessMessage}</span>}
                      {this.state.processErrorMessage &&
                        <span style={{
                          position: 'relative',
                          display: 'block',
                          transform: 'translateX(-50%)',
                          left: '50%',
                          textAlign: 'center',
                          top: '25%',
                          fontSize: '24px',
                          fontWeight: '600',
                          color: 'lightcoral',
                          borderBottom: 'none'
                        }}
                        >{this.state.processErrorMessage}</span>}
                    </span>
                    <div className="sub-title" />
                  </div>
                </div>
                <div className="modal-body" style={{ padding: '0px' }}>
                  <div className="pad text-center">

                    {this.state.confirmCloseButton &&
                      <div className="loader-container-confirm">
                        <button className="confirm-close-btn blue-btn"
                                onClick={this.closeAuthenticationConfirmModal}>
                          {AlphaPoint.translation('COMMON.OKAY') || 'Okay'}
                        </button>
                      </div>}

                    {this.state.tryAuthenticatingAgainButton &&
                      <div className="loader-container-confirm">
                        <button className="try-again-btn blue-btn"
                                onClick={this.tryAuthenticatingAgain}>
                          { AlphaPoint.translation('SEND_REQUEST.TRY_AGAIN') || 'Try Again' }
                        </button>
                      </div>}

                    <div className="row">
                      <div className="col-sm-12">

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ Modal>
          }

          {(this.state.twoFA.requireGoogle2FA) &&
            <Modal close={this.closeTwoFAModal}>
              <TwoFACodeInput
                {...this.state.twoFA}
                authProcessing={this.state.authProcessing}
                submit={this.do2FAVerification}
                doNotShowQRCode={true}
              />
            </Modal>
          }

          <div className="container-fluid">
            <div className="row">
              <div className="col-md-9 col-xs-12">
                <div className="content">
                  <h2 className="section-title">
                    {AlphaPoint.translation('SEND_REQUEST.SECTION_TITLE') || 'Send and Receive Funds'}
                    </h2>
                  <div className="send-request-page inner">
                    <div className="tabs-main pull-left">
                      {tabs}
                    </div>
                    {!AlphaPoint.config.usePairDropdown ?
                      <div className="segmented-control pull-right">
                        {inputsRadio}
                        {labelsRadio}
                      </div>
                      :
                      <div className="pull-right">
                        <select className="form-control pull-left"
                                style={{ borderRadius: '10px' }}
                                value={myProduct.Product}
                                onChange={this.changeProd}>
                          {options}
                        </select>
                      </div>
                    }
                    <div className="clearfix" />
                    {this.state.errorMessage &&
                      <div style={{
                        backgroundColor: '#e15959',
                        color: '#fff',
                        padding: '16px',
                        width: '100%',
                        fontSize: '14px',
                        letterSpacing: '1px',
                        fontWeight: '600',
                        margin: '0 auto',
                        marginTop: '35px',
                        marginBottom: '-35px'
                      }}>{this.state.errorMessage}</div>
                    }
                    <div className="row mt50">
                      <div className="col-md-6">
                        <h3 className="title-blue-bg">
                          {this.state.send ?
                            AlphaPoint.translation('SEND_REQUEST.BLUE_TITLE_SEND') || 'Select Amount to Send' :
                            AlphaPoint.translation('SEND_REQUEST.BLUE_TITLE_REQUEST') || 'Select Amount to Request'}
                        </h3>
                        <div className="input-group">
                          <span className="input-group-addon" id="sizing-addon3">{myProduct.Product}</span>
                          <InputNoLabel
                            placeholder={0.00000000}
                            type="text"
                            value={this.state.amount}
                            onChange={this.changeAmount}
                            name="amount"
                            className={this.state.invalidAmount && 'danger-bdr'}
                          />
                        </div>
                        <p className="send-receive-text">
                          {this.state.send ?
                            AlphaPoint.translation('SEND_REQUEST.SEND_MESSAGE') || `Enter the amount of ${myProduct.ProductFullName} you wish to send.` :
                            AlphaPoint.translation('SEND_REQUEST.REQUEST_MESSAGE') || `Enter the amount of ${myProduct.ProductFullName} you wish to request.`}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <h3 className="title-blue-bg">
                          {this.state.send ?
                            AlphaPoint.translation('SEND_REQUEST.SEND_WHO') || 'Recipient' :
                            AlphaPoint.translation('SEND_REQUEST.REQUEST_WHO') || 'From'}
                        </h3>
                        <InputNoLabel
                          placeholder={ AlphaPoint.translation('SEND_REQUEST.RECIPIENT_EMAIL') || `Enter Recipient's email address`}
                          name="username"
                          value={this.state.username}
                          onChange={this.changeUsername}
                          className={this.state.invalidUsername && 'danger-bdr'}
                        />
                        <p className="send-receive-text mt20">
                          {this.state.send ?
                            AlphaPoint.translation('SEND_REQUEST.NOT_REGISTERED_RECIPIENT_MSG') ||
                            `Note - if the receipient is not a registered user of ${AlphaPoint.config.siteTitle}, they will receive an email invitation to create an account and claim their funds.` :
                            AlphaPoint.translation('SEND_REQUEST.NOT_REGISTERED_SENDER_MSG') ||
                            `Note - if the sender is not a registered user of ${AlphaPoint.config.siteTitle}, they will receive an email invitation to create an account and claim their funds.`}
                          </p>
                      </div>
                    </div>
                    <div className="row mt30">
                      <div className="col-md-6">
                        <h3 className="title-blue-bg">
                          {AlphaPoint.translation('SEND_REQUEST.NOTE') || 'Add a Note (Optional)'}
                        </h3>
                        <textarea
                          id="notes"
                          className="form-control"
                          maxLength={AlphaPoint.config.maxFormTextLength || 350}
                          value={this.state.notes}
                          onChange={this.changeNotes} />
                      </div>
                      <div className="col-md-6">
                        <h3 className="title-bottom-border xs-mt-20">
                          {AlphaPoint.translation('SEND_REQUEST.TRANSACTION_SUMMARY') || 'Transaction Summary'}
                          </h3>
                        <table className="table table-borderless">
                          <tbody>
                            <tr>
                              <td>{AlphaPoint.translation('SEND_REQUEST.TOTAL_AMOUNT') || 'Total Amount'}</td>
                              <td className="text-right">
                                {formatNumberToLocale(this.state.netAmount, this.state.decimalPlaces[myProduct.Product] || '0')} {myProduct.Product}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="text-center">
                          <a className="btn btn-orange" disabled={this.state.invalidInput} onClick={this.state.send ? this.sendFunds : this.requestFunds}>
                            {this.state.processing && <i className="fa fa-spinner fa-spin" />}
                            {!this.state.processing && this.state.send ?
                              (AlphaPoint.translation('SEND_REQUEST.SEND_BITCOIN') || 'Send') + ` ${myProduct.ProductFullName}`:
                              (AlphaPoint.translation('SEND_REQUEST.REQUEST_BITCOIN') || 'Request') + ` ${myProduct.ProductFullName}`
                            }</a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ConfirmReject />
                </div>
              </div>
            </div>
          </div>
      </WidgetBase>
    );
  }
}

SendRequest.defaultProps = {
  hideCloseLink: true,
  request: false,
};

SendRequest.propTypes = {
  request: React.PropTypes.bool,
};

export default SendRequest;
