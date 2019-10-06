/* global AlphaPoint */
import React from 'react';
import KYC from './kyc';
import Modal from './modal';
import {path} from './helper';

var KycLaunch = React.createClass({

  getInitialState: function () {
    return {
      launch: false,
      show: true,
      verifyLevel: 0
    };
  },
  componentWillUnmount: function () {
    this.accountInfo.dispose();
  },
  componentDidMount: function () {

    this.accountInfo = AlphaPoint.accountInfo.subscribe(function (accountData) {
      // console.log("USER INFORMATION",accountData);
      this.setState({verifyLevel: accountData.VerificationLevel});
    }.bind(this));

  },

  verficationWindow: function () {
    // this.setState({launch: true,show:false});
    if (AlphaPoint.config.internalKYCRedirect) {
      $.bootstrapGrowl(
        AlphaPoint.translation('KYC_LAUNCH.REDIRECTING') || 'Redirecting to Verification...',
        {
          type: 'info',
          allow_dismiss: true,
          align: AlphaPoint.config.growlwerPosition,
          delay: AlphaPoint.config.growlwerDelay,
          offset: {from: 'top', amount: 30},
          left: '60%'
        }
      );
      if (AlphaPoint.config.openKYCRedirectInNewWindow) {
        window.open(AlphaPoint.config.internalKYCRedirectURL);
        this.setState({show: false});
      } else {
        document.location = AlphaPoint.config.internalKYCRedirectURL
      }
    } else {
      // this.setState({showVerifyWindow: true});
      this.setState({launch: true, show: false});
    }
  },


  closeModalVerify: function () {
    this.setState({launch: false});
  },

  render: function () {

    return (
      <span className="modal-open">
        {
          this.state.show &&
          <div id="welcome-modal" className="modal in" tabIndex={-1} role="dialog">
            <div className="modal-dialog ap-modal_inner" role="document">
              <div className="ap-widget">
                <div className="ap-header">
                  <div className="ap-title text-center">
                    <span>{AlphaPoint.translation('HOME_DIRECT.WELCOME') || 'Welcome to ' + AlphaPoint.config.siteTitle}</span>
                    <div className="sub-title">
                    </div>
                    <div style={{float: 'right'}} className="ap-header-actions">
                      <div >
                        <div className="ap-header-actions-btn-close" onClick={this.props.close}>×</div>
                      </div>
                    </div>
                    <div className="modal-body">
                      <div className="pad text-center">
                        <p>{AlphaPoint.translation('HOME_DIRECT.VERIFY_MODAL_TAG') || 'Your one stop place to receive, send, and trade cryptocurrency.'}</p>
                        <div className="row">
                          <div className="col-sm-4 text-center">
                            <div className="img-content">
                              {
                                path('config.home.kycLaunch.verifyAccountIcon', AlphaPoint) ?
                                  <img src={AlphaPoint.config.home.kycLaunch.verifyAccountIcon} alt=""/> :
                                  <object data="img/misc/register-account.svg" type="image/svg+xml">
                                    <img src="img/misc/register-account@2x.png" width={107} height={107}/>
                                  </object>
                              }
                              <div
                                className="img-thumb">{AlphaPoint.translation('KYC_LAUNCH.VERIFY_ACCOUNT') || 'Verify Your Account'}</div>
                            </div>
                          </div>
                          <div className="col-sm-4 text-center">
                            <div className="img-content">
                              {
                                path('config.home.kycLaunch.addFundsIcon', AlphaPoint) ?
                                  <img src={AlphaPoint.config.home.kycLaunch.addFundsIcon} alt=""/> :
                                  <object data="img/misc/fund-account.svg" type="image/svg+xml">
                                    <img src="img/misc/fund-account@2x.png" width={120} height={99}/>
                                  </object>
                              }
                              <div
                                className="img-thumb">{AlphaPoint.translation('KYC_LAUNCH.ADD_FUNDS') || 'Add Funds'}</div>
                            </div>
                          </div>
                          <div className="col-sm-4 text-center">
                            <div className="img-content">
                              {
                                path('config.home.kycLaunch.beginTradingIcon', AlphaPoint) ?
                                  <img src={AlphaPoint.config.home.kycLaunch.beginTradingIcon} alt=""/> :
                                  <object data="img/misc/transfer-bitcoin.svg" type="image/svg+xml">
                                    <img src="img/misc/transfer-bitcoin@2x.png" width={120} height={99}/>
                                  </object>
                              }
                              <div
                                className="img-thumb">{AlphaPoint.translation('KYC_LAUNCH.BEGIN_TRADING') || 'Begin Trading'}</div>
                            </div>
                          </div>
                        </div>
                        <p className="text-center modal-paragraph">
                          {AlphaPoint.translation('HOME_DIRECT.VERIFY_MODAL_TEXT') || 'Let us know a little more about you, so we can provide you with the initial verification level before you fund your account. This is a very easy and quick step.'}
                        </p>
                        <a
                          className="deposit-button btn btn-action btn-modal"
                          data-dismiss="modal"
                          href="#"
                          onClick={this.verficationWindow}>
                          {AlphaPoint.translation('KYC_LAUNCH.VERIFY_NOW_BTN') || 'Verify Account'}
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* /.modal-content */}
                </div>

              </div>
            </div>

          </div>
        }
        {this.state.launch && <Modal close={this.closeModalVerify}><KYC /></Modal>}
      </span>
    );
  }

});

module.exports = KycLaunch;
