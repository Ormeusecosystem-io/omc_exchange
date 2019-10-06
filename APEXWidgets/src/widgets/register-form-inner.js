/* global $, localStorage */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { getURLParameter } from './helper';
import InputLabeled from '../misc/inputLabeled';
import InputNoLabel from '../misc/inputNoLabel';
import WidgetBase from './base';
import Modal from './modal';

const AlphaPoint = global.AlphaPoint;
const document = global.document;

class ClefRegisterButton extends React.Component {
  componentWillMount() {
    !AlphaPoint.config.clefFix && AlphaPoint.clef_load(); // eslint-disable-line no-unused-expressions
  }

  render() {
    return (
      <button
        type="button"
        className="clef-button btn btn-action login-buttons"
        data-app-id={AlphaPoint.config.clefLogin}
        data-color="blue"
        data-style="flat"
        data-redirect-url={`${AlphaPoint.config.clefRedirectURL}?type=registerwithclef`}
        data-custom="true"
      >
        { AlphaPoint.translation('SIGNUP_MODAL.REGISTER_CLEF') || 'Register with Clef' }
      </button>
    );
  }
}

function TermsAndConditions(props) {
  return (
    <WidgetBase {...props} headerTitle="Terms and Conditions" style={{ width: '600px' }}>
      <div className="pad">
        { AlphaPoint.translation('SIGNUP_MODAL.TERMS') || 'Terms and Conditions' }
      </div>
    </WidgetBase>
  );
}

function PrivacyPolicy(props) {
  return (
    <WidgetBase {...props} headerTitle="Privacy Policy" style={{ width: '600px' }}>
      <div className="pad">
        { AlphaPoint.translation('SIGNUP_MODAL.PRIVACY') || 'Privacy Policy' }
      </div>
    </WidgetBase>
  );
}

class RegisterFormInner extends React.Component {
  constructor() {
    super();

    this.state = {
      authyRequired: false,
      googleRequired: false,
      smsRequired: false,
      registration: false,
      registered: false,
      passwordReset: false,
      useClef: AlphaPoint.config.useClef,
      termsAccept: true,
      showPrivacyModal: false,
      showTermsModal: false,
    };
  }

  componentDidMount() {
    this.registerUser = AlphaPoint.registerUser.subscribe(res => {
      if (res.UserId) {
        this.setState({ registered: true });
        return this.props.setBanner({ information: '', error: '' });
      }

      if (res.errormsg) {
        return this.props.setBanner({ information: '', error: res.errormsg });
      }

      return false;
    });
  }

  componentWillUnmount() {
    this.registerUser.dispose();
  }

  selectTerms = e => this.setState({ termsAccept: e.target.checked });

  register = e => {
    // const strongRegex = new RegExp('^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*\\W).*$', 'g');
    // const emptyRegex = new RegExp('^(w+S+)$', 'g');
    const mediumRegex = new RegExp('^(?=.{8,})(?=.*[A-Z])(?=.*[0-9]).*$', 'g');
    const enoughRegex = new RegExp('(?=.{8,}).*', 'g');
    const emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    const whiteSpaceRegex = /\s/;
    const growlerOpts = {
      type: 'danger',
      allow_dismiss: true,
      align: AlphaPoint.config.growlwerPosition,
      delay: AlphaPoint.config.growlwerDelay,
      offset: { from: 'top', amount: 30 },
      left: '60%',
    };

    const email = (this.refs.email.value()).trim();
    const username = AlphaPoint.config.useEmailAsUsername ? email : (this.refs.username.value()).trim();

    const data = {
      UserInfo: {
        UserName: username,
        passwordHash: this.refs.password.value(),
        Email: email,
      },
      UserConfig: AlphaPoint.config.useQNTAddressOnSignup
        ? [{ Name: 'qntaddress', Value: this.refs.qntaddress.value() }]
        : [],
      AffiliateTag: getURLParameter('aff') || '',
      OperatorId: AlphaPoint.config.OperatorId,
    };

    e.preventDefault();

    if (!this.state.termsAccept) {
      return this.props.setBanner({
        information: AlphaPoint.translation('SIGNUP_MODAL.ACCEPT_TERMS_MSG') ||  'Do you accept the terms and conditions?',
        error: '',
      });
    }

    if (!enoughRegex.test(this.refs.password.value())) {
      // $.bootstrapGrowl('Password must contain at least 8 characters', growlerOpts);

      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.PASSWORD_ENOUGH_REGEX_MSG') || 'Password must contain at least 8 characters',
      });
    }

    if (!mediumRegex.test(this.refs.password.value())) {
      // $.bootstrapGrowl(
      //   'Password must contain at least 8 characters, one number, and at least one capital letter',
      //   growlerOpts);

      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.PASSWORD_MEDIUM_REGEX_MSG') || 'Password must contain at least 8 characters, one number, and at least one capital letter',
      });
    }

    if (!this.refs.password.value() || !this.refs.password2.value()) {
      // $.bootstrapGrowl('Enter a Password', growlerOpts);

      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.PASSWORD_BLANK_MSG') ||  'Please Enter a Password',
      });
    }

    if (this.refs.password.value() !== this.refs.password2.value()) {
      // $.bootstrapGrowl(
      //   'Passwords do not match. Password must contain at least 8 characters, one number, and at least one capital letter',
      //   growlerOpts);

      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.PASSWORDS_DONT_MATCH_MSG') ||  'Passwords do not match.',
      });
    }

    if (!AlphaPoint.config.useEmailAsUsername) {
      if (!username) {
        // $.bootstrapGrowl('Please Enter a user name', growlerOpts);

        return this.props.setBanner({
          information: '',
          error: AlphaPoint.translation('SIGNUP_MODAL.USERNAME_BLANK_MSG') || 'Please Enter a User Name',
        });
      }

      // Validation: No spaces allowed in Username field
      if (whiteSpaceRegex.test(username)) {
        // $.bootstrapGrowl(AlphaPoint.translation('SIGNUP_MODAL.USERNAME_NO_SPACES_MSG') || 'Username cannot include spaces', growlerOpts);

        return this.props.setBanner({
          information: '',
          error: AlphaPoint.translation('SIGNUP_MODAL.USERNAME_NO_SPACES_MSG') || 'Username cannot include spaces',
        });
      }
    }

    if (this.refs.qntaddress && !this.refs.qntaddress.value()) {
      // $.bootstrapGrowl('Please Enter an Email Address', growlerOpts);

      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.ENTER_QNT_ADDRESS') || 'Please Enter a QNT Address',
      });
    }

    if (!email) {
      // $.bootstrapGrowl('Please Enter an Email Address', growlerOpts);

      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.EMAIL_BLANK_MSG') || 'Please enter an email address',
      });
    }

    if (!emailRegex.test(email)) {
      // $.bootstrapGrowl(AlphaPoint.translation('SIGNUP_MODAL.EMAIL_INVALID_MSG') || 'Please enter a valid email address', growlerOpts);

      // Validation: No spaces allowed in Email field
      if (whiteSpaceRegex.test(email)) {
        // $.bootstrapGrowl(AlphaPoint.translation('SIGNUP_MODAL.EMAIL_NO_SPACES_MSG') || 'Email address cannot include spaces', growlerOpts);
        // console.log(email)

        return this.props.setBanner({
          information: '',
          error: AlphaPoint.translation('SIGNUP_MODAL.EMAIL_NO_SPACES_MSG') || 'Email address cannot include spaces.',
        });
      }

      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.EMAIL_INVALID_MSG') || 'Please enter a valid email address',
      });
    }

    if (AlphaPoint.config.useQNTAddressOnSignup) {
      localStorage.setItem('UserId', this.refs.qntaddress.value());
    }

    this.props.setBanner({
      information: '',
      error: '',
    });

    return AlphaPoint.registerNewUser(data);
  };


  resetPassword = () => {
    AlphaPoint.resetPassword(
      {
        email: this.refs.email.value(),
      },
      res =>

        this.setState({
          passwordReset: res.isAccepted,
        }),
    );
  };

  showTermsModal = () => this.setState({ showTermsModal: true });

  showPrivacyModal = () => this.setState({ showPrivacyModal: true });

  closeModals = () => this.setState({ showTermsModal: false, showPrivacyModal: false });

  defaultView = () => {
    const closeButton = document.getElementById('login') || '';

    if (closeButton) {
      closeButton.addEventListener('click', e => {
        if (e.target.className === 'mfp-close') {
          const form = document.getElementById('myForm');

          form.reset();
          this.props.setBanner({
            information: '',
            error: '',
          });
        }
      });
    }

    return (
      <form id="myForm" onSubmit={this.register}>
        <div className="pad col-xs-12">
          {!this.state.passwordReset ? (
            <span>
              {!AlphaPoint.config.useEmailAsUsername &&
                <InputNoLabel placeholder="Username" ref="username" />
              }

              <InputNoLabel
                placeholder={AlphaPoint.translation('SIGNUP_MODAL.EMAIL_PLACEHOLDER') || 'Email'}
                ref="email"
                className="useremail"
              />
              {AlphaPoint.config.useQNTAddressOnSignup && (
                <InputLabeled
                  label={
                    <span>
                      If you do not have one please go to{' '}
                      <a className="plc-link" target="_blank" href="http://kyc.quantaplc.im">
                        kyc.quantaplc.im
                      </a>{' '}
                      to have your QNT address whitelisted.
                    </span>
                  }
                  placeholder={AlphaPoint.translation('SIGNUP_MODAL.QNT_ADDRESS') || 'Enter QNT Address'}
                  ref="qntaddress"
                  className="qnt-address-field"
                />
              )}
              <InputNoLabel
                placeholder={AlphaPoint.translation('SIGNUP_MODAL.PASSWORD_PLACEHOLDER') || 'Password'}
                type="password"
                ref="password"
                onChange={() => this.props.setBanner({ error: '' })}
              />
              <InputNoLabel
                placeholder={AlphaPoint.translation('SIGNUP_MODAL.VERIFYPASSWORD') || 'Confirm Password'}
                type="password"
                ref="password2"
              />

              {(this.state.authyRequired || this.state.googleRequired || this.state.smsRequired) && (
                <InputLabeled
                  placeholder={AlphaPoint.translation('SIGNUP_MODAL.AUTH_QUES') || '2FA Verification Code'}
                  type="string"
                  ref="authCode"
                />
              )}
              {!AlphaPoint.config.showTermsandConditions && (
                <div className="keyPermissions">
                  <input
                    type="checkbox"
                    name="terms_accept"
                    onClick={this.selectTerms}
                    value={this.state.termsAccept}
                  />{' '}
                  <span>
                  { AlphaPoint.translation('SIGNUP_MODAL.I_ACCEPT') || 'I accept the' }
                    <a href="terms.html">
                  &nbsp;{ AlphaPoint.translation('SIGNUP_MODAL.TERMS') || 'Terms and Conditions' }
                  </a>
                </span>
                  &nbsp;{ AlphaPoint.translation('SIGNUP_MODAL.AND') || 'and' }
                  <a href="privacy.html">
                    &nbsp;{ AlphaPoint.translation('SIGNUP_MODAL.PRIVACY') || 'Privacy Policy' }
                  </a>
                  <br />
                </div>
              )}

              {AlphaPoint.config.apexSite ? (
                <div>
                  By Clicking <strong>Sign up</strong> you accept our &nbsp;
                  <a style={{ fontWeight: 'bold', textDecoration: 'underline' }} onClick={this.showTermsModal}>
                    Terms and Conditions
                  </a>
                  &nbsp;and{' '}
                  <a style={{ fontWeight: 'bold', textDecoration: 'underline' }} onClick={this.showPrivacyModal}>
                    Privacy Policy
                  </a>
                </div>
              ) : (
                <div className="keyPermissions">
                  <span>
                     { AlphaPoint.translation('SIGNUP_MODAL.BY_CLICKING') || 'By Clicking' }
                    <span style={{ color: '#f57b20' }}>
                      &nbsp;{ AlphaPoint.translation('SIGNUP_MODAL.SIGNUP') || 'Sign Up' }
                    </span>
                    &nbsp;{ AlphaPoint.translation('SIGNUP_MODAL.YOU_ACCEPT_OUR') || 'you accept our' }
                    <a className="keyPermissions-link" onClick={this.showTermsModal}>
                      &nbsp;{ AlphaPoint.translation('SIGNUP_MODAL.TERMS') || 'Terms and Conditions' }
                    </a>
                    &nbsp;{ AlphaPoint.translation('SIGNUP_MODAL.AND') || 'and' }
                    <a className="keyPermissions-link" onClick={this.showPrivacyModal}>
                     &nbsp;{ AlphaPoint.translation('SIGNUP_MODAL.PRIVACY') || 'Privacy Policy' }
                    </a>
                  </span>
                  <br />
                </div>
              )}
              <br />
              <div className="clearfix">
                <div className={AlphaPoint.config.templateStyle === 'retail' ? '' : 'pull-right'}>
                  <br />
                  {AlphaPoint.config.templateStyle !== 'retail' && (
                    <button type="button" className="btn btn-danger" onClick={this.props.close}>
                      {AlphaPoint.translation('BUTTONS.TEXT_CANCEL') || 'Cancel'}
                    </button>
                  )}{' '}
                  {this.state.useClef && <ClefRegisterButton />}{' '}
                  {AlphaPoint.config.templateStyle === 'retail' ? (
                    <button
                      type="submit"
                      style={{ width: '100%', margin: '0 auto' }}
                      onClick={this.register}
                      className="col-xs-4 col-centered btn btn-action login-buttons"
                    >
                      {AlphaPoint.translation('SIGNUP_MODAL.SIGNUP') || 'Sign Up'}
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-action">
                      {AlphaPoint.translation('BUTTONS.TEXT_SIGNUP') || 'Create Account'}
                    </button>
                  )}
                </div>
              </div>
              <br />
            </span>
          ) : (
            <h2 className="text-center">
              {AlphaPoint.translation('SIGNIN_MODAL.PASSWORD_SENT') || 'Check email for password reset link'}
            </h2>
          )}
        </div>

        {this.state.showTermsModal && (
          <Modal close={this.closeModals}>
            <TermsAndConditions />
          </Modal>
        )}
        {this.state.showPrivacyModal && (
          <Modal close={this.closeModals}>
            <PrivacyPolicy />
          </Modal>
        )}
      </form>
    );
  };

  render() {
    if (!this.state.registered) return this.defaultView();

    return (
      <span>
        <h3 className={AlphaPoint.config.apexSite ? 'text-center pad' : 'text-center'}>
          {AlphaPoint.translation('SIGNUP_MODAL.REGISTERED') ||
            'Account Created. Check your email for Activation Link.'}
        </h3>
      </span>
    );
  }
}

RegisterFormInner.defaultProps = {
  setBanner: () => {},
  close: () => {},
  hideCloseLink: true,
};

RegisterFormInner.propTypes = {
  setBanner: React.PropTypes.func,
  close: React.PropTypes.func,
};

export default RegisterFormInner;
