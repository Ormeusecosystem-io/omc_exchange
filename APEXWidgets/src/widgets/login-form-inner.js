/* global AlphaPoint, localStorage, APConfig */
import React from 'react';
import InputLabeled from '../misc/inputLabeled';
import RecaptchaNoLabel from '../misc/recaptchaNoLabel';

class LoginForm extends React.Component {
  constructor() {
    super();

    this.state = {
      authyRequired: false,
      googleRequired: false,
      TwoFARequired: false,
      smsRequired: false,
      registration: false,
      registered: false,
      passwordReset: false,
      sessionToken: '',
      useClef: AlphaPoint.config.useClef,
      server: localStorage.getItem('tradingServer') || APConfig.API_V2_URL,
      showCustomServerInput: false,
      showPasswordResetForm: false,
      username: '',
      reCaptchaRequired: false,
      reCaptchaFilled: false,
      processing: false,
    };
  }

  getCookie = (name) => {
    const cookies = document.cookie.split(';');
    let found = null;

    for (let i = 0, len = cookies.length; i < len; i++) {
      const cookie = cookies[i].split('=');

      if (name === cookie[0].trim()) found = cookie[1];
    }
    return found;
  };

  signIn = (e) => {
    
    e.preventDefault();

    this.props.setBanner({
      information: AlphaPoint.translation('COMMON.PLEASE_WAIT') || 'Please wait...',
      error: '',
    });

    if (!this.refs.email.value()) {
      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNIN_MODAL.REQUEST_USERNAME') || 'Enter a User name',
      });
    }
    if (!this.refs.password.value()) {
      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNIN_MODAL.REQUEST_PASSWORD') || 'Enter a Password',
      });
    }

    if (this.state.reCaptchaRequired && !this.state.reCaptchaFilled) {
      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNIN_MODAL.RECAPTCHA_CONFIRM_TEXT') || 'Confirm if you are not a robotx',
      });
    }

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
        } else if (!res.Authenticated) {
          localStorage.setItem('SessionToken', '');
          this.props.setBanner && this.props.setBanner({ // eslint-disable-line no-unused-expressions
            information: '',
            error: AlphaPoint.translation('SIGNIN_MODAL.2FA_INVALID') || 'Please enter Valid 2FA token',
          });
        }
      });
      return AlphaPoint.authenticate2FA(data);
    }

    // this is authenticate level 1
    const data = {
      UserName: this.refs.email.value(),
      Password: this.refs.password.value(),
    };
    const code = this.refs.authCode && this.refs.authCode.value();
    const twoFaToken = this.getCookie(`${APConfig.TwoFACookie}.${data.UserName}`);

    if (AlphaPoint.config.sendOmsIdInLogin) data.OMSId = AlphaPoint.oms.value;
    if (code) data.code = code;
    if (!code && twoFaToken) data.twoFaToken = twoFaToken;

    AlphaPoint.webAuthenticateSubject
      .filter((res) => res.hasOwnProperty('Authenticated')) // eslint-disable-line no-prototype-builtins
      .subscribe((res) => {
        if (res.Requires2FA) {
          if (res.AuthType) {
            this.setState({
              TwoFARequired: true,
              AuthType: res.AuthType,
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
          this.props.setBanner && this.props.setBanner({ // eslint-disable-line no-unused-expressions
            information: '',
            error: res.errormsg || AlphaPoint.translation('SIGNIN_MODAL.2FA_INVALID') || 'Please Enter a Valid 2FA Token',
          });
          localStorage.setItem('SessionToken', '');
        }
      });
    return AlphaPoint.WebAuthenticate(data);
  };

  register = () => {
    this.props.setBanner({
      information: AlphaPoint.translation('SIGNIN_MODAL.CREATING_ACCOUNT') || 'Creating account...',
      error: '',
    });
    AlphaPoint.createAccount({
      email: this.refs.email.value(),
      password: this.refs.password.value(),
    }, (res) => {
      this.props.setBanner({
        error: res.rejectReason,
        information: '',
      });
      this.setState({ registered: res.isAccepted });
    });
  };

  reCaptchaFilled = () => {
    this.setState({ reCaptchaFilled: true });
  };

  setReCaptcha = () => {
    this.setState({ reCaptchaRequired: true });
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

  showPasswordResetForm = () => this.setState(() => ({ showPasswordResetForm: true }));

  hidePasswordResetForm = () => this.setState(() => ({ showPasswordResetForm: false }));

  resetPassword = () => {

    if (!this.state.username) {
      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNIN_MODAL.REQUEST_USERNAME') || 'Enter a Username',
      });
    }

    AlphaPoint.resetPass.subscribe((res) => {
      if (res.result) {
        this.props.setBanner({ error: '' });
        this.setState({ passwordReset: res.result, TwoFARequired: false });
      } else if (!res.result && res.detail === 'Waiting for 2FA.') {
        this.props.setBanner({
          information: AlphaPoint.translation('RESET_PASSWORD.2FA') || 'Enter your 2fa code.',
        });
      } else if (!res.result) {
        this.setState({ processing: false });
        this.props.setBanner({ error: res.detail });
      }
    });

    this.setState({ processing: true });

    return AlphaPoint.resetPassword({ UserName: this.state.username });
  };

  changeServer = (e) => {
    this.setState({ server: e.target.value });
    document.wsConnection.close();
    document.wsConnection = document.APAPI.Connect(e.target.value);
    localStorage.setItem('tradingServer', e.target.value);
  };

  defaultView() {
    const closeButton = document.getElementById('login') || '';
    const servers = APConfig.serversList.concat(['Custom server']);

    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        if (e.target.className === 'mfp-close') {
          const form = document.getElementById('loginForm');
          form.reset();
          this.props.setBanner({
            information: '',
            error: '',
          });
        }
      });
    }

    if (this.state.showPasswordResetForm || this.state.passwordReset) {
      return (
        <form id="loginForm" onSubmit={this.signIn}>
          <div className="pad">
            {!this.state.passwordReset ?
              <span id="resetForm">
                <h3 className={AlphaPoint.config.templateStyle === 'retail' ? 'text-center' : 'text-left'}>
                  {AlphaPoint.translation('PASSWORD_MODAL.TITLE_TEXT') || 'Reset Password'}
                </h3>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-control dark-placeholder"
                    placeholder={AlphaPoint.translation('REQUEST_RESET_PASSWORD.ENTER_YOUR_EMAIL_USERNAME') || 'Enter your username'}
                    onChange={e => {
                      this.props.setBanner({ error: '' });
                      this.setState({ username: e.target.value });
                    }}
                    value={this.state.username}
                  />
                </div>
                <div className="clearfix">
                  <div className={AlphaPoint.config.apexSite ? 'text-center row around-xs' : 'text-center'}>
                    <button
                      type="button"
                      className="btn btn-danger btn-inverse"
                      onClick={this.hidePasswordResetForm}
                    >{AlphaPoint.translation('BUTTONS.TEXT_CANCEL') || 'Cancel'}</button>
                    <button
                      type="button"
                      className="btn btn-action login-buttons"
                      onClick={this.resetPassword}
                      disabled={this.state.processing}
                    >
                      {this.state.processing ?
                        AlphaPoint.translation('PASSWORD_MODAL.PROCESSING') || 'Processing...' :
                        AlphaPoint.translation('PASSWORD_MODAL.TITLE_TEXT') || 'Reset Password'}
                    </button>
                  </div>
                </div>
              </span>
              :
              <div>
                <h3 className="text-center">
                  {AlphaPoint.translation('SIGNIN_MODAL.PASSWORD_SENT') || 'Check your email for password reset link'}
                </h3>
                <button
                  type="button"
                  className="btn btn-danger btn-inverse"
                  onClick={() => {
                    this.props.setBanner({ error: '' });
                    this.setState({
                      passwordReset: false,
                      showPasswordResetForm: false,
                      processing: false,
                      username: '',
                    });
                  }}
                >{AlphaPoint.translation('BUTTONS.TEXT_CLOSE') || 'Close'}</button>
              </div>}
          </div>
        </form>
      );
    }

    return (
      <form id="loginForm" onSubmit={this.signIn}>
        <div className="pad">
          <span>
            {APConfig.useServerSelect &&
              <div className="form-group">
                <label htmlFor="serverSelect">{AlphaPoint.translation('SIGNIN_MODAL.SELECT_SERVER') || 'Select server'}</label>
                <div>
                  <select
                    id="serverSelect"
                    className="form-control"
                    style={{ width: '100%' }}
                    onChange={(e) => {
                      if (e.target.value === 'Custom server') {
                        return this.setState({
                          showCustomServerInput: true,
                          server: e.target.value,
                        });
                      }
                      this.setState({ showCustomServerInput: false });
                      return this.changeServer(e);
                    }}
                    defaultValue={localStorage.getItem('tradingServer') || servers[0]}
                  >
                    {servers.map((server) => (
                      <option value={server} key={server}>{server}</option>
                    ))}
                  </select>
                </div>
              </div>}

            {this.state.showCustomServerInput &&
              <div className="form-group">
                <label htmlFor="customServer">{AlphaPoint.translation('SIGNIN_MODAL.SERVER_ADDRESS') || 'Enter server address'}</label>
                <div>
                  <input
                    id="customServer"
                    className="form-control"
                    style={{ width: '100%' }}
                    onBlur={this.changeServer}
                  />
                </div>
              </div>}
            {AlphaPoint.config.templateStyle === 'retail' ?
              <InputLabeled
                label={AlphaPoint.translation('SIGNIN_MODAL.USERNAME_QUES') || 'Username'}
                ref="email"
                onChange={e => {
                      this.props.setBanner({ error: '' });
                      this.setState({ username: e.target.value });
                    }}
              />
              :
              <InputLabeled
                label={AlphaPoint.translation('SIGNIN_MODAL.EMAIL_QUES') || 'Email'}
                ref="email"
              />}

            {AlphaPoint.config.templateStyle === 'retail' ?
              <InputLabeled
                label="Password"
                type="password"
                ref="password"
              />
              :
              <InputLabeled
                label={AlphaPoint.translation('SIGNIN_MODAL.PASSWORD_QUES') || 'Password'}
                type="password"
                ref="password"
              />}

            <RecaptchaNoLabel
              render="explicit"
              verifyCallback={this.reCaptchaFilled}
              onloadCallback={this.setReCaptcha}
            />

            {(AlphaPoint.config.siteName === 'quantatrading') &&
              <a
                className="orange-link right"
                onClick={this.resetPassword}
                style={{ cursor: 'pointer' }}
                title="Reset Your Password"
              >
                {AlphaPoint.translation('PASSWORD_MODAL.TITLE_TEXT') || 'Reset Password'}
              </a>}


            {(this.state.authyRequired || this.state.googleRequired
              || this.state.smsRequired || this.state.TwoFARequired) &&
              <InputLabeled
                label={AlphaPoint.translation('SIGNIN_MODAL.AUTH_QUES') || '2FA Verification Code'}
                type="string"
                ref="authCode"
              />}

            <div className="clearfix">
              <div className={AlphaPoint.config.apexSite ? 'text-center row around-xs' : 'text-center'}>
                {AlphaPoint.config.templateStyle !== 'retail' && !this.props.hideCancelBtn &&
                  <button
                    type="button"
                    className="btn btn-danger btn-inverse"
                    onClick={this.props.close}
                  >
                    {AlphaPoint.translation('BUTTONS.TEXT_CANCEL') || 'Cancel'}
                  </button>}
                {' '}
                {AlphaPoint.config.templateStyle === 'retail' &&
                  <button
                    type="submit"
                    onClick={this.signIn}
                    className="btn btn-action login-buttons"
                  >
                    {AlphaPoint.translation('BUTTONS.TEXT_SIGNIN') || 'Sign In'}
                  </button>}
                {' '}
                {(AlphaPoint.config.templateStyle === 'retail' && AlphaPoint.config.siteName !== 'quantatrading') &&
                  <a
                    className="orange-link"
                    onClick={this.showPasswordResetForm}
                    style={{ cursor: 'pointer' }}
                  >
                    {AlphaPoint.translation('PASSWORD_MODAL.TITLE_TEXT') || 'Reset Password'}
                  </a>}
                {AlphaPoint.config.templateStyle !== 'retail' &&
                  <button
                    type="submit"
                    onClick={this.signIn}
                    className={`btn btn-action ${AlphaPoint.config.templateStyle === 'standard' && 'm-lr-15'}`}
                  >
                    {AlphaPoint.translation('BUTTONS.TEXT_SIGNIN') || 'Sign In'}
                  </button>}
                {' '}
                {' '}
                {AlphaPoint.config.templateStyle !== 'retail' &&
                  <button
                    type="button"
                    className="btn btn-action"
                    onClick={this.showPasswordResetForm}
                  >
                    {AlphaPoint.translation('PASSWORD_MODAL.TITLE_TEXT') || 'Reset Password'}
                  </button>}
              </div>
            </div>
          </span>
        </div>
        {false && this.loadScript()}
      </form>
    );
  }

  render() {
    if (!this.state.registered) return this.defaultView();

    return (
      <h3 className="text-center">
        {AlphaPoint.translation('SIGNIN_MODAL.REGISTERED') || 'Account Created. Check your email for Activation Link.'}
      </h3>
    );
  }
}

LoginForm.defaultProps = {
  setBanner: () => { },
  close: () => { },
  hideCancelBtn: false,
  to: '',
  redirect: false,
};

LoginForm.propTypes = {
  setBanner: React.PropTypes.func,
  close: React.PropTypes.func,
  hideCancelBtn: React.PropTypes.bool,
  to: React.PropTypes.string,
  redirect: React.PropTypes.bool,
};

export default LoginForm;
