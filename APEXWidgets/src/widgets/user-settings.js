import React from 'react';
import WidgetBase from './base';
import InputNoLabel from '../misc/inputNoLabel';
import Modal from './modal';
import Kyc from './kyc';
import TwoFACodeInput from './twoFACodeInput';
import axios from '../axios';

var LimitRow = React.createClass({

  render: function () {

    var style
    var showhr //  okqneo
    var products = this.props.products;
    var level = this.props.level
    var daily = <div className="col-xs-3 text-center mt10"> 0 </div>
    var monthly = <div className="col-xs-3 text-center mt10"> 0 </div>

    if (products.length > 0) {
      var header = products.map(function (product) {
        return <div className="col-xs-3"> {product.Product} </div>
      })

      daily = products.map(function (product) {
        var currency = AlphaPoint.config.currencyLimits.filter(function (currencyIn) {
            return (currencyIn.name === product.Product)
          }.bind(this))[0] || {};

        if (Object.keys(currency).length > 0) {
          if (level === 0) {
            return <div className="col-xs-3 text-center mt10"> {currency.level0.daily} </div>
          } else if (level === 1) {
            return <div className="col-xs-3 text-center mt10"> {currency.level1.daily} </div>
          } else if (level === 2) {
            return <div className="col-xs-3 text-center mt10"> {currency.level2.daily} </div>
          }
        }
      })
      monthly = products.map(function (product) {
        var currency = AlphaPoint.config.currencyLimits.filter(function (currency) {
            return (currency.name === product.Product)
          }.bind(this))[0] || {};
        if (Object.keys(currency).length > 0) {
          if (level === 0) {
            return <div className="col-xs-3 text-center mt10"> {currency.level0.monthly} </div>
          } else if (level === 1) {
            return <div className="col-xs-3 text-center mt10"> {currency.level1.monthly} </div>
          } else if (level === 2) {
            return <div className="col-xs-3 text-center mt10"> {currency.level2.monthly} </div>
          }
        }
      })
    }

    // console.log('header',header);

    (level > 0) ? style = {visibility: "hidden"} : style = {display: "block"}
    // (this.props.level > 0 )?  showhr = {visibility:"hidden"} : showhr  = {display:"block"}
    return (
      <div className="col-xs-12">
        <div className="row ">
          <div className="col-xs-4 limit-header" style={{marginTop: '32px'}}>
            <div className="row">{AlphaPoint.translation('USER_SETTINGS.LEVEL') || 'Level'} {level}</div>
            <div className="row mt10">{AlphaPoint.translation('USER_SETTINGS.DAILY_LIMIT') || 'Daily Limit'}</div>
            <div className="row mt10">{AlphaPoint.translation('USER_SETTINGS.MONTHLY_LIMIT') || 'Month Limit'}</div>
          </div>

          <div className="col-xs-8">
            <div className="row limit-header" style={style}>
              {header}
            </div>
            <hr className="limit-hr" style={style}/>
            <div className="row">
              {daily}
            </div>
            <div className="row">
              {monthly}
            </div>
          </div>
        </div>
      </div>
    )
  }
})

var Settings = React.createClass({
  getDefaultProps: function () {
    return {
      hideCloseLink: true
    }
  },

  getInitialState: function () {
    return {
      data: {
        UseNoAuth: true,
        UseGoogle2FA: false
      },
      accountInfo: [],
      username: '',
      userId: AlphaPoint.userData.value.UserId,
      twoFA: {},
      passwordReset: false,
      waiting2FA: false,
      showVerifyWindow: false,
      stateDataCache: '',
      prerun: false,
      rerun: 0,
      useFA: false,
      hold2FA: false,
      useFaState: false,
      lastChanged: false,
      products: [],
      levelIncreaseStatus: '',
      userConfig: null
    };
  },

  componentWillUnmount: function () {
    const keys = Object.keys(this);
    keys.filter(key => this[key].dispose ).forEach(key => this[key].dispose() && delete this[key]);
  },

  async componentDidMount(){
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    this.userInformation = AlphaPoint.getUser.subscribe(function (data) {
      this.setState({username: data, useFA: data.Use2FA, hold2FA: data.Use2FA});
    }.bind(this));
    
    this.products = AlphaPoint.products.subscribe(function (data) {
      this.setState({products: data})
    }.bind(this))
    
    this.accountInformation = AlphaPoint.accountInfo.subscribe(function (data) {
      this.setState({accountInfo: data})
    }.bind(this))
    
    this.verifyInfoUpdate = AlphaPoint.verificationLevelUpdate.subscribe(function (data) {
      this.setState({accountInfo: data})
    }.bind(this));
    
    this.userConfiguration = AlphaPoint.getUserConfig.subscribe(function (data) {
      let configs = this.state.data;
      let that = this;
      if (data.length > 0) {
        
        configs = data.reduce(function (item, i) {
          item[i.Key] = i.Value;
          
          if (i.Key === "levelIncreaseStatus") {
            that.setState({levelIncreaseStatus: i.Value});
          }
          
          return item;
        }, {});
        
        if (configs.UseNoAuth && configs.UseGoogle2FA) {
          configs.UseNoAuth = JSON.parse(configs.UseNoAuth)
          configs.UseGoogle2FA = JSON.parse(configs.UseGoogle2FA)
        }
      }
      
      this.setState({data: configs, stateDataCache: configs, userConfig: data}); //cache to have a copy of configuration data from DidMount
    }.bind(this));
    
    AlphaPoint.getUserCon({UserId: AlphaPoint.userData.value.UserId})
    
    var server = {};
    this.userConfiguration = AlphaPoint.getUserConfig.subscribe(function (data) {


      var configs = [];

      if (data.length > 0) {
        configs = data.reduce(function (item, i) {
          item[i.Key] = i.Value;
          return item;
        }, {});

        configs.UseNoAuth = !this.state.username.Use2FA;
        configs.UseGoogle2FA = this.state.username.Use2FA;

      }
      server = configs;
    }.bind(this));

    this.userConfigurationSubs = AlphaPoint.setUserConfig.subscribe(function (data) {
      var live = this.state.data;
      if (data.length == 0) {
        return;
      }

      if (this.state.hold2FA) {
        var temp2FA = {
          requireGoogle2FA: true,
          useFaState: this.state.hold2FA
        }
        this.setState({twoFA: temp2FA});
      }
      if (!this.state.hold2FA && live.UseGoogle2FA) {
        var temp2FA = {
          requireGoogle2FA: true,
          useFaState: this.state.hold2FA
        }
        this.setState({twoFA: temp2FA});
      }

      if (!server.UseGoogle2FA && !live.UseGoogle2FA && data.result) {

        if (!this.state.showVerifyWindow) {
          // show successful  message here!
        }
      }

    }.bind(this))
  },

  componentDidUpdate(prevProps, prevState){
    if(prevState.useFA && !this.state.useFA) {
      this.update2FA();
    } 
  },

  changed: function (e) {

    var data = {};
    for (var key in this.refs) {

      if (this.refs[key].type === 'checkbox' || this.refs[key].type === 'radio') {
        data[key] = this.refs[key].checked;

      } else {
        data[key] = this.refs[key].value ;
      }
    }
    this.setState({data: data});
  },

  changed2FA: function (state) {
    this.setState({useFA: state});
  },

  do2FAVerification: function (code) {

    var data = {};
    var server = []

    var data = {
      Code: code
    }

    var payloadData = this.configurePayload()

    this.auth2FAuthentication = AlphaPoint.auth2FA.subscribe(function (res) {

      if (res.length == 0) return

      var reset = this.state.stateDataCache

      if (res.Authenticated == false) {
        this.setState({twoFA: {}, data: reset, useFA: this.state.username.Use2FA, waiting2FA: false, codeRejected: true});
      }

      if (res.Authenticated == true && this.state.waiting2FA) {
        this.setState({waiting2FA: false, passwordReset: true});
      }

      if (res.Authenticated == true) {
        this.setState({hold2FA: this.state.useFA})
        AlphaPoint.setUserCon(payloadData)
      }

    }.bind(this));

    AlphaPoint.authenticate2FA(data);
  },

  configurePayload: function () {

    var configurationPairs = [];
    var identification = AlphaPoint.userData.value.UserId
    // In the for in below the data has to be sent in an array containing an object wit key value as the props

    for (var key in this.refs) {
      if (this.refs[key].type === 'checkbox' || this.refs[key].type === 'radio' || key == 'UseGoogle2FA' || key == 'UseNoAuth') {
        var userConfigs = {
          Key: key,
          Value: JSON.stringify(this.refs[key].checked)
        }
      } else {

        var myVal = this.refs[key].value;

        var userConfigs = {
          Key: key,
          Value: myVal
        };
      }

      configurationPairs.push(userConfigs);
    }

    var payloadData = {
      UserId: identification,
      UserId: this.state.username.UserId,
      Config: configurationPairs
    };

    return payloadData;
  },

  update: function (e) {

    var data = {};
    var server = {};
    var configRes;

    var payloadData = this.configurePayload()

    // console.log("SERVER",server); // this is the set got from the server

    var live = this.state.data;

    live.UseNoAuth = !this.state.useFA
    live.UseGoogle2FA = this.state.useFA

    // console.log("LIVE",live); // this the current set up on the page


    this.setState({prerun: false})
    // this.setState({rerun:false})

    if (this.state.rerun > 0) {
      this.setState({rerun: 0})
      return;
    }

    AlphaPoint.setUserCon(payloadData);
  },

  update2FA: function () {
    var live = this.state.data;
    var payloadData = this.configurePayload();

    live.UseGoogle2FA = this.state.useFA // Will be the state of useFA...manipulated by changed2FA()
    live.UseNoAuth = !this.state.useFA // Should obviously therefore be the opposite


    if (!this.state.hold2FA && live.UseGoogle2FA) {
      var temp2FA = {
        requireGoogle2FA: true,
        useFaState: this.state.hold2FA
      }
      this.setState({twoFA: temp2FA});
    }

    //call disable2FA
    if (this.state.hold2FA && !live.UseGoogle2FA) {

      AlphaPoint.Disable2FA.subscribe(function (res) {
        //then call authenticate 2FA
        var temp2FA = {
          requireGoogle2FA: true,
          useFaState: this.state.hold2FA
        }
        this.setState({twoFA: temp2FA});
      }.bind(this));

      AlphaPoint.disable2FA({});
    }

    AlphaPoint.setUserCon(payloadData);
  },

  closeModal: function () {
    this.setState({twoFA: {}, waiting2FA: false});
    // document.location.reload()/
  },

  verficationWindow: function () {
    if (AlphaPoint.config.internalKYCRedirect) {
      $.bootstrapGrowl(
        AlphaPoint.translation('USER_SETTINGS.REDIRECT_VERIFICATION') || 'Redirecting to Verification...',
        {
        type: 'info',
        allow_dismiss: true,
        align: AlphaPoint.config.growlwerPosition,
        delay: AlphaPoint.config.growlwerDelay,
        offset: {from: 'top', amount: 30},
        left: '60%'
      });
      if (AlphaPoint.config.openKYCRedirectInNewWindow) {
        window.open(AlphaPoint.config.internalKYCRedirectURL, '_blank')
      } else {
        document.location = AlphaPoint.config.internalKYCRedirectURL
      }
    } else {
      this.setState({showVerifyWindow: true});
    }

  },

  closeModalVerify: function () {
    this.setState({showVerifyWindow: false});
  },


  resetPassword: function () {
    this.resetUserPassword = AlphaPoint.resetPass.subscribe(function (res) {
      if (res.result) {
        this.setState({passwordReset: res.result});
      }
      if (!res.result && res.errormsg === "Waiting for 2FA.") {
        const temp2FA = {
          passwordReset2FA: true,
        };
        this.setState({twoFA: temp2FA, waiting2FA: true});
      }
    }.bind(this));

    AlphaPoint.resetPassword({UserName: this.state.username.UserName});
  },

  render: function () {
    let accountText;

    // TODO: Make switch case with fall-through for a more speedy conditional render
    if (AlphaPoint.config.kycType === 'greenId') { // GreenId

      if (this.state.accountInfo.VerificationLevel === 0) {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFY_ACCT') || "Verify Account";
      } else if (this.state.accountInfo.VerificationLevel === AlphaPoint.config.UnderManualReviewLevel) {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFICATION_STATUS') || "Check Verification Status";
      } else if (this.state.accountInfo.VerificationLevel == AlphaPoint.config.VerifiedLevel) {
        accountText = AlphaPoint.translation('USER_SETTINGS.ACCT_VERIFIED') || "Fully Verified";
      }

    }
    if (AlphaPoint.config.kycType === 'IM' || AlphaPoint.config.kycType === 'IDV') { // Identity Mind or IDV

      if (this.state.accountInfo.VerificationLevel === 0) {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFY_ACCT') || "Verify Account";
      }
      if (this.state.accountInfo.VerificationLevel === 0 && this.state.levelIncreaseStatus === 'fail') {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFY_ACCT') || "Verify Account";
      }
      if (this.state.accountInfo.VerificationLevel === 0 && this.state.levelIncreaseStatus === 'underReview') {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFICATION_STATUS') || "Check Verification Status";
      }
      if (this.state.accountInfo.VerificationLevel === 1 && this.state.levelIncreaseStatus === "underReview") {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFICATION_STATUS') || "Check Verification Status";
      }
      if (this.state.accountInfo.VerificationLevel === 1 && this.state.levelIncreaseStatus === "fail") {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFY_ACCT') || "Verify Account";
      }

      if (this.state.accountInfo.VerificationLevel === 1 && this.state.levelIncreaseStatus === "pass") {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFY_ID') || "Verify ID";
      }
      if (this.state.accountInfo.VerificationLevel === 1 && this.state.levelIncreaseStatus === "fail") {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFY_ID') || "Verify ID";
      }
      if (this.state.accountInfo.VerificationLevel === 2 && this.state.levelIncreaseStatus === "pass") {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFY_ID') || "Verify ID";
      }
      if (this.state.accountInfo.VerificationLevel === 2 && AlphaPoint.config.kycType === 'IDV') {
        accountText = AlphaPoint.translation('USER_SETTINGS.ACCT_VERIFIED') || "Fully Verified";
      }
      if (this.state.accountInfo.VerificationLevel === 2 && this.state.levelIncreaseStatus === "fail") {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFY_ID') || "Verify ID";
      }
      if (this.state.accountInfo.VerificationLevel === 2 && this.state.levelIncreaseStatus === "underReview") {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFICATION_STATUS') || "Check Verification Status";
      }

      if (this.state.accountInfo.VerificationLevel === 3) {
        accountText = AlphaPoint.translation('USER_SETTINGS.ACCT_VERIFIED') || "Fully Verified";
      }

    } else if (AlphaPoint.config.kycType === 'ManualKYC') { // ManualKYC

      if (this.state.accountInfo.VerificationLevel === 0 && this.state.levelIncreaseStatus === '') {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFY_ACCT') || "Verify Account";
      }
      if (this.state.accountInfo.VerificationLevel === 0 && this.state.levelIncreaseStatus === 'underReview') {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFICATION_STATUS') || "Check Verification Status";
      }
      if (this.state.accountInfo.VerificationLevel === 1 && !AlphaPoint.config.sendDocsToEmail) {
        accountText = AlphaPoint.translation('USER_SETTINGS.ACCT_VERIFIED') || "Fully Verified";
      }
      if (this.state.accountInfo.VerificationLevel === 1 && AlphaPoint.config.sendDocsToEmail) {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFY_ID') || "Verify ID";
      }
      if (this.state.accountInfo.VerificationLevel === 2 && AlphaPoint.config.sendDocsToEmail) {
        accountText = AlphaPoint.translation('USER_SETTINGS.VERIFICATION_STATUS') || "Check Verification Status";
      }
      if (this.state.accountInfo.VerificationLevel === 3 && AlphaPoint.config.sendDocsToEmail) {
        accountText = AlphaPoint.translation('USER_SETTINGS.ACCT_VERIFIED') || "Fully Verified";
      }
    }

    return (
      <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('USER_SETTINGS.TITLE_TEXT') || 'Settings'}>
          
      <input type="hidden" ref='firstName' value={this.state.data.firstName} onChange={this.changed} />
      <input type="hidden" ref='lastName' value={this.state.data.lastName} onChange={this.changed}/>
      <input type="hidden" ref='ccode' value={this.state.data.ccode} onChange={this.changed}/>
      <input type="hidden" ref='telephone' value={this.state.data.telephone} onChange={this.changed}/>

        { this.state.hold2FA !== this.state.useFA 
          ?
          <div id="towFAexpand">
            <TwoFACodeInput {...this.state.twoFA} useFA={this.state.useFA} hold2FA={this.state.hold2FA} submit={this.do2FAVerification} close={()=> this.setState({useFA: false})}/>
            <input type="hidden" ref="UseGoogle2FA" checked={this.state.useFA} />
            <input type="hidden" ref='UseNoAuth' checked={!this.state.useFA} />
          </div>

          :

          <div className="settings-container">
            <h3 className="title-blue-bg">{AlphaPoint.translation('USER_SETTINGS.SECURITY_TEXT') || "Security Settings"}</h3>
              <div className="settings-accordion">
                <div className="row" id="accountStatus">
                  <p>Email</p>
                  <p id="account-status" style={{color: 'rgb(45, 200, 166)'}}>Verified</p>
                </div>
              </div>
          </div>
        }
        {
          this.state.passwordReset &&
         <div id="layout">
            <div id="popup">
                <img src="img/change-pass-popup.svg"/>
                <p>Check your email for password reset link</p>
                <button onClick={() => this.setState({...this.state, passwordReset: false})}>Close</button>
            </div>
         </div>       
        }
        {this.state.showVerifyWindow
        && <Modal close={this.closeModalVerify}>
        {/* <Kyc close={this.closeModalVerify}/> */}
        </Modal>}

  </WidgetBase>

    );
  }
});

module.exports = Settings;
