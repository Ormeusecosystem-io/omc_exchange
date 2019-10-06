/* global AlphaPoint, document, localStorage, APConfig */
import React from 'react';
import Recaptcha from 'react-recaptcha';
import ScrollLock from 'react-scrolllock';
import InputNoLabel from '../misc/inputNoLabel';
import axios from 'axios';
import Axios from '../axios';
import { track } from '../analytics';
import merchants from '../merchants.json';
import InputLabeled from '../misc/inputLabeled';
import { checkValidity } from './helper';


class LoginFormInnerV2 extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleSubscribe = this.handleSubscribe.bind(this);
    this.reCaptchaLoaded = this.reCaptchaLoaded.bind(this);
    this.verifyCallback = this.verifyCallback.bind(this);
    this.state = {
      authyRequired: false,
      googleRequired: false,
      TwoFARequired: false,
      smsRequired: false,
      sessionToken: '',
      formError: { username: false, password: false },
      emailErr: false,
      passwordErr: false,
      resetPasswordSuccess: false,
      showCaptcha: false,
      ccaxSuccess: false,
      verifyEmailSuccess: false,
      verifyEmailFail: false,
      invalid2Fa: false,
      generalErr: false
    };
  }

  componentDidMount(){
    if(this.getQueryVariable('status')) {
      this.props.setBanner({ 
        information: "Somthing went wrong please try again",
        error: "Somthing went wrong please try again",
      });
    }
    if(this.getQueryVariable('resetPassword') === "success"){
      this.setState({...this.state, resetPasswordSuccess: true})
    }
    if(this.props.isMerchants && this.props.queryParams.email) {
      this.refs.email.setValue(this.props.queryParams.email)
    }
    if(this.getQueryVariable('emailVerification') === 'true'){
      if(this.getQueryVariable('email')){
        this.refs.email.setValue(this.getQueryVariable('email'));
      }
      this.setState({...this.state, verifyEmailSuccess: true})
    }
    if(this.getQueryVariable('emailVerification') === 'false'){
      this.setState({...this.state, verifyEmailFail: true})
    }
  }
  
  getQueryVariable = (variable) => {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return false
  }

  getCookie = name => {
    const cookies = document.cookie.split(';');
    let found = null;

    for (let i = 0, len = cookies.length; i < len; i++) {
      const cookie = cookies[i].split('=');

      if (name === cookie[0].trim()) found = cookie[1];
    }
    return found;
  };


  createCookie = (name, value, days) => {
    let expires = '';

    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value}${expires}; path=/`;
  };

  signIn = () => {

    if (this.state.googleRequired) {
      // send the 2FA code
      const data = { Code: this.refs.authCode.value() };

      AlphaPoint.auth2FA.subscribe((res) => {
        if (res.Authenticated) {
          if (this.props && this.props.to) {
            document.location = this.props.to;
          } else if (this.props.redirect && AlphaPoint.config.loginRedirect) {
            document.location = AlphaPoint.config.loginRedirect;
          }
          AlphaPoint.config.siteName !== 'bitcoindirect.net' && this.props.close(); // eslint-disable-line no-unused-expressions
          return null;
        }
        localStorage.setItem('SessionToken', undefined);
        this.setState({...this.state, invalid2Fa: "Invalid Auth Code. Please Try Again."})
      });
      return AlphaPoint.authenticate2FA(data);
    }

    // this is authenticate level 1
    const data = { UserName: this.refs.email.value(), Password: this.refs.password.value() };
    // login data .. LOG IN TO CCA BEFORE SHIFT
    const code = this.refs.authCode && this.refs.authCode.value();
    const twoFaToken = this.getCookie(`${APConfig.TwoFACookie}.${data.UserName}`);

    if (AlphaPoint.config.sendOmsIdInLogin) data.OMSId = AlphaPoint.oms.value;
    if (code) data.code = code;
    if (!code && twoFaToken) data.twoFaTokens = twoFaToken;

    AlphaPoint.webAuthenticateSubject
      .filter((res) => res.hasOwnProperty('Authenticated')) // eslint-disable-line no-prototype-builtins
      .subscribe((res) => {
        if (res.Requires2FA) {
          if (res.AuthType) {
            this.setState({
              TwoFARequired: true,
              showCaptcha: false,
              AuthType: res.AuthType,
              ccaxSuccess: true
            });
            if (res.AuthType === 'Google') {
              this.props.setBanner && this.props.setBanner({ // eslint-disable-line no-unused-expressions
                information: AlphaPoint.translation('SIGNIN_MODAL.2FA_INFO') || 'Please enter 2FA token',
                error: '',
              });
              this.setState({
                googleRequired: true,
                sessionToken: res.SessionToken,
              });
            }
          }
          if (this.props.setBanner) {
            this.props.setBanner({
              information: AlphaPoint.translation('SIGNIN_MODAL.2FA_REQUIRED') || 'Two factor authentication required',
              error: '',
            });
          }
          return;
        }

        if (res.Authenticated) {
          if (res.twoFaToken) {
            this.createCookie(`${APConfig.TwoFACookie}.${data.UserName}`, res.twoFaToken);
          }
          if (res.SessionToken) localStorage.setItem('SessionToken', res.SessionToken);
          if (this.props && this.props.to) {
            document.location = this.props.to;
          } else if (this.props.redirect && AlphaPoint.config.loginRedirect) {
            document.location = AlphaPoint.config.loginRedirect;
          }
          if (AlphaPoint.config.siteName !== 'bitcoindirect.net') this.props.close();
        } else {
          this.setState({...this.state, showCaptcha: false, generalErr: AlphaPoint.translation('SIGNIN_MODAL.ERROR_MSG') || res.errormsg || ''})
          localStorage.setItem('SessionToken', undefined);
        }
      });

    return AlphaPoint.WebAuthenticate(data);
  };

  resetPassword = () => {
      window.location.href = "/reset-password.html"
  }
  
  redirectToVerificationRequiredPage = (email) => {
    document.location = `/signup.html?usermail=${email}`;
  }


  setFormError = (field) => {
    const formErrorObject = this.state.formError;
    formErrorObject[field] = true;
    this.setState({ formError: formErrorObject });    
  }

  onSubmit(e){
    e.preventDefault();
    if(this.state.ccaxSuccess){
      return this.signIn();
    }
    if(this.validate()){
      this.setState({...this.state, showCaptcha: true})
      document.getElementsByTagName("body")[0].style.overflow="hidden";
    }
  }

  ccaCheckUser = () => {
    localStorage.setItem('isRefresh', 'false');
    track(`Auth start`);

    const ccaData = {
      email: this.refs.email.value(),
      password: this.refs.password.value(),
      source: 'CotiX',
    };

    const ccaLogin = Axios.put('auth/login', ccaData);

    ccaLogin.then(res => {
      // console.log("cca login res: ", res)
      if (res.status === 200) {
        this.setState({...this.state, emailErr: false, passwordErr: false, formError: { username: false, password: false }})
        track(`authentication`, 'Auth success');
        if(res.data.source && Object.keys(merchants).filter(m => m === res.data.source).length > 0){
          localStorage.setItem("ccxMerchant", res.data.source)
        }
        else{
          localStorage.removeItem("ccxMerchant");
        }
        localStorage.setItem('pageProperties', JSON.stringify({ view: "balances", section: 'Wallet', productId: 1 }))
        return this.signIn();
      }
    })
      .catch(err => {
        // track(`Auth fails: ${this.refs.email.value()}`);
        // console.log("cca login err: ", err.response);
        let errMessage ;
        if (err && err.response && err.response.status !== 200) {
          if (err.response.data.errorMessage !== 'Email Not Verified') {
            errMessage = err.response.data.errorMessage || err.response.data.error;
          }

          if (err.response.status === 400 && err.response.data.errorMessage === 'Email not verified') {  
            // track(`Auth fail: ${this.refs.email.value()} Redirected to verification page`);
            this.redirectToVerificationRequiredPage(this.refs.email.value());
          }
          if (err.response.status === 500 && err.response.data.errorMessage === 'Cotix signUp error' && err.response.data.error === 'Username already exists.' ) {
            this.signIn(e);
          }
          track(`Auth fail: ${errMessage}`);
          if(errMessage === 'Account not found' || errMessage === 'Invalid parameters'){
            this.setState({...this.state, emailErr: errMessage, passwordErr: false, showCaptcha: false})
          }
          if(errMessage === 'Wrong Password'){
            this.setState({...this.state, passwordErr: errMessage, emailErr: false, showCaptcha: false})
          }
        }
      });
  }



  validateOne = (e) => {
    const FieldName = e.target.name;
    const ValidateObject = this.state.formError;
    ValidateObject[FieldName] = !this.refs[FieldName].value();
    this.setState({ formError: ValidateObject, [`${FieldName}Err`]: false });
  }

  validate = (e) => {
    const ValidateObject = {};
    let isValid = true;
    if (!this.refs.email.value()) {
      ValidateObject.email = "Enter a username";
      ValidateObject.username = true;
      isValid = false;
    }
    else if(!checkValidity(this.refs.email.value(), {isEmail: true})){
      ValidateObject.email = "Invalid parameters";
      ValidateObject.username = true;
      isValid = false;
    }
    if (!this.refs.password.value()) {
      ValidateObject.password = true;
      isValid = false;
    }
    this.setState({...this.state, formError: ValidateObject });
    return isValid
  }

  reCaptchaFilled = () => {
    this.setState({ reCaptchaFilled: true });
  };

  setReCaptcha = () => {
    this.setState({ reCaptchaRequired: true });
  };

  handleSubscribe() {
    if (this.state.isVerified) {
      // console.log('VERIFIED!!!');
    }
  }

  reCaptchaLoaded() {
    // console.log('loaded!');
  }

  verifyCallback(response) {
    if (response) {
      const formErrorObject = this.state.formError;
      formErrorObject.captcha = false;
      this.ccaCheckUser();
      
    }
  }

  userNotApproved = data => {
    const { status, token } = data;
    window.location = `${process.env.ON_BOADRDING_URL}?token=${token}`;
  }

  onClickOutside(e){
    const popup = document.getElementsByClassName("captcha-holder")[0];
    if(e.target == popup){
      this.setState({
        ...this.state,
        showCaptcha: false
      });
    }
  }

  render() {
    const servers = APConfig.serversList.concat(['Custom server']);
    return (
      <form id="loginForm" onSubmit={(e) => this.onSubmit(e)}>
        {/* {this.state.showCaptcha && <ScrollLock />} */}
        <h1>{this.state.TwoFARequired ? "Two-factor Authentication" : "Log In"}</h1>
        {this.state.verifyEmailSuccess && <div id="success">Email verification successful</div>}
        {this.state.verifyEmailFail && <div id="fail">Email verification failed. Please log in and click on resend email link to receive a new verification email</div>}
        {this.state.resetPasswordSuccess && <div id="success">Your password has been changed successfully.</div>}
        {this.state.generalErr && <div id="fail">{this.state.generalErr}</div>}
        <div className="login-box">
         
            
            <span className="input input--custom" style={{display: this.state.TwoFARequired ? "none" : "initial"}}>
              <InputLabeled
                placeholder={
                  AlphaPoint.translation('SIGNIN_MODAL.USERNAME') || 'Username'
                }
                wrapperClass={`error-${this.state.formError.email || this.state.emailErr !== false}`}
                error={this.state.formError.email || this.state.emailErr}
                className={`input-field ${this.state.formError.email || this.state.emailErr ? 'input-err-true' : ''}`}
                ref="email"
                name="email"
                // colorChange={this.colorInIcons}
                onChange={this.validateOne}
                disabled={this.state.TwoFARequired}
              />
              {this.state.formError.email && <div className="form-error">{this.state.formError.email}</div>}
              {this.state.emailErr && <p className="form-error">{this.state.emailErr}</p>}
            </span>
          
          {
            <span className="input input--custom" style={{display: this.state.TwoFARequired ? "none" : "initial"}}>
              <InputLabeled
                wrapperClass={`error-${this.state.formError.password || this.state.passwordErr !== false}`}
                error={this.state.formError.password || this.state.passwordErr}
                placeholder={
                  AlphaPoint.translation('SIGNIN_MODAL.PASSWORD_PLACEHOLDER') || 'Password'
                }
                type="password"
                className={`input-field ${this.state.formError.password || this.state.passwordErr ? 'input-err-true' : ''}`}
                ref="password"
                name="password"
                // colorChange={this.colorInIcons}
                onChange={this.validateOne}
                disabled={this.state.TwoFARequired}
              />
              {this.state.formError.password && <div className="form-error">{
                AlphaPoint.translation('SIGNIN_MODAL.REQUEST_PASSWORD') || 'Enter a Password'}
              </div>}
              {this.state.passwordErr && <p className="form-error">{this.state.passwordErr}</p>}
            </span>
          }
          
          {(this.state.authyRequired ||
            this.state.googleRequired ||
            this.state.smsRequired ||
            this.state.TwoFARequired) && (
            <span className="input input--custom">
              <InputNoLabel
                placeholder={
                  AlphaPoint.translation('SIGNIN_MODAL.AUTH_QUES') ||
                    'Your 2FA Verification Code'
                }
                type="string"
                className="input-field"
                ref="authCode"
                name="authCode"
                // colorChange={this.colorInIcons}
                onChange={this.validateOne}
              />
              {this.state.invalid2Fa && <div className="form-error">Invalid Auth Code. Please Try Again.</div>}
            </span>
          )}
          <button type="submit" className="btn btn-lg submit underline">{this.state.TwoFARequired ? "Confirm" : "LOG IN"}</button>

          {
            this.state.showCaptcha && 
            <div className="clearfix captcha-holder" onClick={(e) => this.onClickOutside(e)}>
            <div
              className={
                AlphaPoint.config.apexSite
                  ? 'text-center row around-xs'
                  : 'text-center'
              }
            >
              <div
                className="re-captcha-container"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '24px auto 14px',
                  width: '340px',
                  border: this.state.formError.captcha && '2px solid rgba(222, 12, 12, 0.7)',
                  padding: this.state.formError.captcha && '2px 1px 1px 2px',
                }
                }
              >
                { <Recaptcha
                  sitekey="6Lc9yrsUAAAAAELIegIzlEpsOkaauXbxBUejmFCq"
                  render="explicit"
                  onloadCallback={this.reCaptchaLoaded}
                  verifyCallback={this.verifyCallback}
                />
                }
              </div>
              
            </div>
          </div>
          }
        </div>
      </form>
    );
  }
}
LoginFormInnerV2.contextTypes = {
  router: React.PropTypes.func,
};
LoginFormInnerV2.defaultProps = {
  setBanner: () => {},
  close: () => {},
  to: '',
  redirect: false,
};
LoginFormInnerV2.propTypes = {
  setBanner: React.PropTypes.func,
  close: React.PropTypes.func,
  to: React.PropTypes.string,
  redirect: React.PropTypes.bool,
};
export default LoginFormInnerV2;