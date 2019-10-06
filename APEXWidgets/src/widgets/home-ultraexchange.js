/* global AlphaPoint */
import React from 'react';

import Modal from './modal';
import Trades from './trades';
import Kyc from './kyc';
import KYCLaunch from './kyc_launch';
import {path} from './helper';
import ProcessingButton from '../misc/processingButton';

class HomeUltraExchange extends React.Component {
  constructor() {
    super();

    this.state = {
      showHomeModal: true,
      showKYCModal: false,
      showHome1: null,
      madeDeposits: false,
      accountData: {},
      verifyLevel: 0,
      levelIncreaseStatus: '',
      configMitek: {},
      processing: false
    };
  }

  componentDidMount() {

    this.userConfiguration = AlphaPoint.getUserConfig.subscribe(data => {
      let configMitek = [];
      if (data.length > 0) {
        configMitek = data.reduce((item, i) => {
          item[i.Key] = i.Value; // eslint-disable-line no-param-reassign
          return item;
        }, {});

        configMitek.UseNoAuth = JSON.parse(configMitek.UseNoAuth || 'true');
        configMitek.UseGoogle2FA = JSON.parse(configMitek.UseGoogle2FA || 'false');
        this.setState({ configMitek });
      }

      let levelIncreaseStatus = '';

      if (data.length > 0) {
      levelIncreaseStatus = data.reduce((item, i) => {
          // Tells component what to render
          if (i.Key === "levelIncreaseStatus") {
            this.setState({ levelIncreaseStatus: i.Value });

            return i.Value;
          }
        }, {});
      }

      this.accountInfo = AlphaPoint.accountInfo.subscribe(accountData => {
        let showHomeModal = false;

        if (accountData.VerificationLevel <= 1 && levelIncreaseStatus === 'fail') {
          showHomeModal = true;
        } else if (accountData.VerificationLevel <= 1 && (levelIncreaseStatus === 'pass' || levelIncreaseStatus === 'underReview')) { // If kyc form has been submitted, then this will disable kyc_launch modal
          showHomeModal = false;
        } else if (accountData.VerificationLevel < 1 && !this.state.showKYCModal) {
          showHomeModal = true;
        }

        this.setState({
          accountData: accountData,
          verifyLevel: accountData.VerificationLevel,
          showHomeModal,
        });


        this.tradeHistory = AlphaPoint.accountTrades.subscribe(data => {
          if (data.length) {
            this.setState({ showHome1: false });
          } else if (accountData.AccountId) {
            this.setState({ showHome1: true });
          }
        });
      });
    });


    this.depositHistory = AlphaPoint.accountTransactions.subscribe(data => {
      let depositBool = false;
      if (data && data[AlphaPoint.selectedAccount.value]) {
        const actions = Object.values(data)
          .map(account => account)
          .reduce((a, b) => a.concat(b), [])
          .filter(transaction => transaction.ReferenceType === 'Deposit');

        depositBool = actions.length > 0;
      }
      this.setState({ madeDeposits: depositBool });
    });

  }

  shouldLaunchKYC = () => {
    if (this.state.verifyLevel <= 0) {

      if (AlphaPoint.config.internalKYCRedirectURL) {
        if (AlphaPoint.config.openKYCRedirectInNewWindow) {
          window.open(AlphaPoint.config.internalKYCRedirectURL);
        } else {
          document.location = AlphaPoint.config.internalKYCRedirectURL
        }
      } else {
        this.setState({ showKYCModal: true });
      }
    }
  };

  closeModalKYC = () => this.setState({ showKYCModal: false });

  closeModalHome = () => this.setState({ showHomeModal: false });

  launchMitek = e => {
    e.preventDefault();

    this.setState({ processing: true });

    const growlerOptions = {
      allow_dismiss: true,
      align: 'center',
      delay: AlphaPoint.config.growlerDelay,
      offset: { from: 'top', amount: 60 }
    };


    const clientInfo = {
      alphaPointSessiontoken: AlphaPoint.session.value.sessionToken, // session token of the user to be validated, not used yet
      alphaPointUserID: AlphaPoint.session.value.userId,
      validationStage: 2, // validation stage from identityMind controlPanel
      validator: AlphaPoint.config.kycType,
    };

    const userInfo = {
      firstName: this.state.configMitek.fname,
      middleName: this.state.configMitek.middleName,
      lastName: this.state.configMitek.lname,
      dob: this.state.configMitek.dob,
      accountName: JSON.stringify(AlphaPoint.userData.value.UserId),
      email: this.state.configMitek.email,
      billingStreetAddress: this.state.configMitek.billingStreetAddress,
      billingCountry: this.state.configMitek.billingCountry,
      billingCity: this.state.configMitek.billingCity,
      billingState: this.state.configMitek.billingState,
      billingZip: this.state.configMitek.billingZip,
      phone: this.state.configMitek.telephone,
      state: this.state.configMitek.billingState,
      billingFlatNumber: '',
      billingStreetNumber: this.state.configMitek.billingStreetNumber, // greenId has it separated from streetName
      billingStreetType: this.state.configMitek.billingStreetType, // greenId specific, shall not be included in streetName
      billingSuburb: this.state.configMitek.billingCity, // Australia specific
      salutation: '',
    };
    
    const params = {
      requestIdentifier: AlphaPoint.config.kycClientId,
      clientInfo,
      userInfo,
    };

    this.verifcationLevelUpdate = AlphaPoint.verificationLevelUpdate.subscribe(res => {
      if (res.VerificationStatus === 'Approved') {
        this.props.increaseLevel(res.VerificationLevel);
      }
    });

    this.verifyLevel = AlphaPoint.verifylevel.subscribe(res => {
      let link;

      if (res.result === 'Unknown Validator Request') {
        this.setState({ processing: false });
        $.bootstrapGrowl(
          AlphaPoint.translation('KYC.UNKNOWN_VALIDATOR_REQUEST') || 'Unknown Validator Request',
          { ...growlerOptions, type: 'danger' },
        );
      }
      
      if (res.ValidationAnswerData) {
        link = res.ValidationAnswerData.RedirectUrl;
        if (res.ErrorMessage === 'SYSTEM: The remote server returned an error: (400) Bad Request.') {
          $.bootstrapGrowl(
            AlphaPoint.translation('KYC.TRY_AGAIN') || 'Please try again',
            growlerOptions,
          );
          $.bootstrapGrowl(
            AlphaPoint.translation('KYC.MISSING_BILLING_COUNTRY') || 'Check that you have entered Billing Country',
            growlerOptions,
          );
        }
        if (res.ValidationAnswerData.RedirectUrl) {
          window.location.href = `mitek.html${link}`;
        }
        if (!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.NeedsManualReview) { // eslint-disable-line max-len
          this.setState({ processing: false });
          $.bootstrapGrowl(
            AlphaPoint.translation('KYC.REVIEWING_VERIFICATION_DOCS') || 'We are currently reviewing your verification document(s).',
            { ...growlerOptions, type: 'danger' },
          );
          // close modal after growler notification
          this.props.close();

        }
        if (!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.ApiErrorDescription) { // eslint-disable-line max-len
          this.setState({ processing: false });
          $.bootstrapGrowl(
            res.ValidationAnswerData.ApiErrorDescription,
            { ...growlerOptions, type: 'danger', delay: 10000 },
          );
          // close modal after growler notification
          this.props.close();

        }
      }
    });
    // Make validateUserRegistration call to get redirectURL to lead to mitek page...
    // Need this redirectURL so url parameters are set in the html page this redirect will lead to
    AlphaPoint.validateUserRegistration(params);

  }

  render() {
    const check = (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        x="0px"
        y="0px"
        viewBox="0 0 100 100"
        enableBackground="new 0 0 100 100"
        xmlSpace="preserve"
      >
        <g>
          <path d="M1,52.067c0,0,25.368,31.711,31.711,46.933C50.469,50.8,98.669,2.6,98.669,2.6S73.3,20.358,32.71,71.095L1,52.067z" />
        </g>
      </svg>
    );

    return (
      <div className="content">
        {this.state.showHome1 &&
          <span>
            <h2 className="section-title">
              {AlphaPoint.translation('HOME_DIRECT.HEADER') || 'Getting Started with'}
            </h2>
            <p>{AlphaPoint.translation('HOME_DIRECT.MISSION2') || 'Please complete these three easy steps to fully enable your member platform.'}</p>

            <div className="services-list">
              <div className="service-item">
                <a onClick={this.shouldLaunchKYC}>
                  <h3 className="service-title">{AlphaPoint.translation('HOME_DIRECT.STEP1') || 'Step 1 - Verify Your Account'}</h3>
                  <div className="service-thumb">
                    {
                      path('config.home.gettingStarted.step1Img', AlphaPoint) ?
                        <img src={AlphaPoint.config.home.gettingStarted.step1Img} alt="" /> :
                        <object data="img/misc/register-account.svg" type="image/svg+xml">
                          <img src="img/misc/register-account@2x.png" width={107} height={107} />
                        </object>
                    }
                  </div>

                  <div className="service-content">
                    <p>
                      {
                        AlphaPoint.translation('HOME_DIRECT.STEP1_CONTENT') ||
                          'In order to start making transactions, we need to run a security check to verify your identity. This is for your security and the safety of your funds. We have implemented the latest technology in this process, which minimize the waiting time, so that you can have your account up and running very fast.'
                      }
                    </p>
                  </div>

                  <div className={(this.state.verifyLevel < 1) ? 'service-checked' : 'service-checked active'}>
                    <a href="#">{check}</a>
                  </div>
                </a>
              </div>

              <div className="service-item">
                  <h3 className="service-title">Step 2 - Verify Your ID</h3>
                  <div className="service-thumb">
                  {
                    path('config.home.gettingStarted.step1Img', AlphaPoint) ?
                      <img src={AlphaPoint.config.home.gettingStarted.step1Img} alt="" /> :
                      <object data="img/misc/register-account.svg" type="image/svg+xml">
                        <img src="img/misc/register-account@2x.png" width={107} height={107} />
                      </object>
                  }
                  </div>
                  <div className="service-content">
                    <p>{AlphaPoint.translation('HOME_DIRECT_V2.STEP2') || 'After you complete step 1 of verifying your account, for higher withdrawal, deposit and trading limits, please verify your identification'}</p>
                      <br />
                      {((this.state.verifyLevel === 1 && this.state.levelIncreaseStatus === 'pass') || (this.state.verifyLevel === 2 && this.state.levelIncreaseStatus !== 'underReview')) &&
                        <ProcessingButton
                        type="submit"
                        onClick={this.launchMitek}
                        processing={this.state.processing}
                        className="btn btn-action btn-orange"
                        >
                          {AlphaPoint.translation('BUTTONS.TEXT_SUBMIT_UPLOAD_DOCS') || 'Verify ID'}
                        </ProcessingButton>
                      }
                  </div>

                  <div className={(this.state.verifyLevel < 3) ? 'service-checked' : 'service-checked active'}>
                    {check}
                  </div>
              </div>

              <div className="service-item">
                <a href="my-accounts.html">
                  <h3 className="service-title">Step 3 - Add Funds</h3>
                  <div className="service-thumb">
                    {
                      path('config.home.gettingStarted.step2Img', AlphaPoint) ?
                        <img src={AlphaPoint.config.home.gettingStarted.step2Img} alt="" /> :
                        <object data="img/misc/fund-account.svg" type="image/svg+xml">
                          <img src="img/misc/fund-account@2x.png" width={107} height={86} />
                        </object>
                    }
                  </div>

                  <div className="service-content">
                    <p>
                      {
                        AlphaPoint.translation('HOME_DIRECT.STEP2') ||
                        'To add funds to your account just click on "Deposit/Withdraw" option on the left menu. There you will be presented your account which you can fund using wire transfer or your existing wallet. The procedure is very simple, and your new balance will reflect the new funds immediately.'
                      }
                    </p>
                  </div>

                  <div className={(this.state.madeDeposits) ? 'service-checked active' : 'service-checked'}>
                    <a href="my-accounts.html">{check}</a>
                  </div>
                </a>
              </div>

              <div className="service-item">
                <a href="my-accounts.html">
                  <h3 className="service-title">Step 4 - Buy, Sell, Trade</h3>

                  <div className="service-thumb">
                    {
                      path('config.home.gettingStarted.step3Img', AlphaPoint) ?
                        <img src={AlphaPoint.config.home.gettingStarted.step3Img} alt="" /> :
                        <object data="img/misc/transfer-bitcoin.svg" type="image/svg+xml">
                          <img src="img/misc/transfer-bitcoin@2x.png" width={107} height={86} />
                        </object>
                    }
                  </div>

                  <div className="service-content">
                    <p>
                      {
                        AlphaPoint.translation('HOME_DIRECT.STEP3') || `Buying, selling, and trading cryptocurrency in ${AlphaPoint.config.siteTitle} is extremely simple, and after just a few steps you will complete each transaction quickly and securely. Just click the "Buy/Sell" or "Send/Request" buttons on the left menu and you will be well on your way. Clarity and simplicity are our main goals, but if you have any questions, just let us know and we will assist you.`
                      }
                    </p>
                  </div>

                  <div className="service-checked">
                    <a href="trade.html">{check}</a>
                  </div>
                </a>
              </div>
              {this.state.showKYCModal && <Modal close={this.closeModalKYC}><Kyc /></Modal>}
            </div>
          </span>}

        {this.state.showHome1===false &&
          <span>
            <h2 className="section-title">{AlphaPoint.translation('HOME_DIRECT.HEADER') || 'Getting Started with'}</h2>
            <p>{AlphaPoint.translation('HOME_DIRECT.MISSION') || 'Our mission is to provide you and the whole world with a simple, reliable and low-cost service to use, buy, sell, and trade bitcoin, the must popular crypto-currency that allows you to actually purchase and sell goods.'}</p>

            <div className="ap-body">
              <div className="inner">
                <div className="row">
                  <div className={AlphaPoint.config.disableSendRequest ? "col-md-6 col-sm-6 col-xs-12" : "col-md-3 col-sm-6 col-xs-12"}>
                    <div className="pricing-table pricing-table-popular">
                      <a href="buy-sell.html">
                        <h3 className="pricing-table-title">
                          <span>{AlphaPoint.translation('HOME_DIRECT.BUY_BITCOIN') || 'Buy'}</span>
                        </h3>
                        <div className="pricing-table-content">
                          <object data="img/misc/buy_bitcoin.svg" type="image/svg+xml">
                            <img src="img/misc/buy_bitcoin.svg" alt="" />
                          </object>
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className={AlphaPoint.config.disableSendRequest ? "col-md-6 col-sm-6 col-xs-12" : "col-md-3 col-sm-6 col-xs-12"}>
                    <div className="pricing-table pricing-table-popular">
                      <a href="buy-sell.html?sell">
                        <h3 className="pricing-table-title">
                          <span>{AlphaPoint.translation('HOME_DIRECT.SELL_BITCOIN') || 'Sell'}</span>
                        </h3>
                        <div className="pricing-table-content">
                          <object data="img/misc/sell_ bitcoin.svg" type="image/svg+xml">
                            <img src="img/misc/sell_ bitcoin.svg" alt="" />
                          </object>
                        </div>
                      </a>
                    </div>
                  </div>
                  {AlphaPoint.config.disableSendRequest ? null :
                    <div>
                      <div className="col-md-3 col-sm-6 col-xs-12">
                        <div className="pricing-table pricing-table-popular">
                          <a href="send-request.html">
                            <h3 className="pricing-table-title">
                              <span>{AlphaPoint.translation('HOME_DIRECT.SEND_BITCOIN') || 'Send'} </span>
                            </h3>
                            <div className="pricing-table-content">
                              <object data="img/misc/send_bitcoin.svg" type="image/svg+xml">
                                <img src="img/misc/send_bitcoin.svg" alt="" />
                              </object>
                            </div>
                          </a>
                        </div>
                      </div>
                      <div className="col-md-3 col-sm-6 col-xs-12">
                        <div className="pricing-table pricing-table-popular">
                          <a href="send-request.html?request">
                            <h3 className="pricing-table-title">
                              <span>{AlphaPoint.translation('HOME_DIRECT.REQUEST_BITCOIN') || 'Request'} </span>
                            </h3>
                            <div className="pricing-table-content">
                              <object data="img/misc/request_bitcoin.svg" type="image/svg+xml">
                                <img src="img/misc/request_bitcoin.svg" alt="" />
                              </object>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>}
                </div>

                <h3 className="tables-title">{AlphaPoint.translation('HOME_DIRECT.RECENT_TRANSACTIONS') || 'Recent Transactions'}</h3>
                <div className="ap-trades"><Trades /></div>
              </div>
            </div>
          </span>}

        {this.state.showHomeModal && this.state.showHome1 && <KYCLaunch close={this.closeModalHome} />}

        {false &&
          <div id="welcome-modal" className="modal" role="dialog">
            <div className="modal-dialog ap-modal_inner" role="document">
              <div className="ap-widget">
                <div className="ap-header">
                  <div className="ap-title text-center">
                    <span>{AlphaPoint.translation('HOME_DIRECT.WELCOME') || `Welcome to ${AlphaPoint.config.siteTitle}`}</span>
                    <div className="sub-title" />
                  </div>
                  <div className="ap-header-actions" style={{ float: 'right' }}>
                    <div />
                    <div className="ap-header-actions-btn-close" data-dismiss="modal">�</div>
                  </div>
                </div>
                <div className="modal-body">
                  <div className="pad text-center">
                    <p>Please complete these three easy steps.</p>
                    <div className="row">
                      <div className="col-sm-4 text-center">
                        <div className="img-content">
                          <object data="img/misc/register-account.svg" type="image/svg+xml">
                            <img src="img/misc/register-account@2x.png" width="107" height="107" alt="" />
                          </object>
                          <div className="img-thumb">Verify Your Account</div>
                        </div>
                      </div>
                      <div className="col-sm-4 text-center">
                        <div className="img-content">
                          <object data="img/misc/fund-account.svg" type="image/svg+xml">
                            <img src="img/misc/fund-account@2x.png" width="120" height="99" alt="" />
                          </object>
                          <div className="img-thumb">Add Funds</div>
                        </div>
                      </div>
                      <div className="col-sm-4 text-center">
                        <div className="img-content">
                          <object data="img/misc/transfer-bitcoin.svg" type="image/svg+xml">
                            <img src="img/misc/transfer-bitcoin@2x.png" width="120" height="99" alt="" />
                          </object>
                          <div className="img-thumb">Buy, Sell, Trade</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-center modal-paragraph">One more step to fully activate your bitcoin platform.</p>
                    <a className="deposit-button btn btn-action btn-modal">Verify Account</a>
                  </div>
                </div>
              </div>
            </div>
          </div>}
      </div>
    );
  }
}

export default HomeUltraExchange;
