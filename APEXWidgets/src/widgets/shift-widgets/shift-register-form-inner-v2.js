/* global $ */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import {getURLParameter} from '../helper';
import InputLabeled from '../../misc/inputLabeled';
import InputNoLabel from '../../misc/inputNoLabel';
import WidgetBase from '../base';
import Modal from '../modal';
import ReCAPTCHAv2 from '../../misc/shift-fields/shift-recaptcha-v2';

const AlphaPoint = global.AlphaPoint;
const document = global.document;

// DIFFERENCE FROM AP WIDGET:
// ADDS RECAPTCHA
// ADDS TRANSLATIONS
// REMOVE INLINE STYLES

class ClefRegisterButton extends React.Component {
  componentWillMount() {
    !AlphaPoint.config.clefFix && // eslint-disable-line no-unused-expressions
    AlphaPoint.clef_load();
  }

  render() {
    return (
      <button
        type="button"
        className="clef-button btn btn-action login-buttons"
        data-app-id={AlphaPoint.config.clefLogin}
        data-color="blue"
        data-style="flat"
        data-redirect-url={
          `${AlphaPoint.config.clefRedirectURL}?type=registerwithclef`
        }
        data-custom="true"
      >
        {AlphaPoint.translation('SIGNUP_MODAL.REGISTER_CLEF') || 'Register with Clef'}
      </button>
    );
  }
}

function TermsAndConditions(props) {
  return (
    <WidgetBase
      {...props}
      headerTitle={AlphaPoint.translation("SIGNUP_MODAL.TERMS") || "Terms and Conditions"}
    >
      <div className="pad terms-and-conditions">{AlphaPoint.translation("SIGNUP_MODAL.TERMS") || "Terms and Conditions"}</div>
    </WidgetBase>);
}

function PrivacyPolicy(props) {
  return (
    <WidgetBase
      {...props}
      headerTitle={AlphaPoint.translation("SIGNUP_MODAL.PRIVACY") || "Privacy Policy"}
    >
      <div className="pad privacy-policy">{AlphaPoint.translation("SIGNUP_MODAL.PRIVACY") || "Privacy Policy"}</div>
    </WidgetBase>);
}

class ShiftRegisterFormInnerV2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      authyRequired: false,
      googleRequired: false,
      smsRequired: false,
      registration: false,
      registered: false,
      passwordReset: false,
      useClef: AlphaPoint.config.useClef,
      password: '',
      password2: '',
      username: '',
      email: '',
      termsAccepted: true,
      termsAndConditions: false,
      riskOfCrypto: false,
      notEUResident: false,
      showPrivacyModal: false,
      showTermsModal: false,
      inputsFilled: {email: "", username: "", password: "", password2: ""}
    };

    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {

    this.registerUser = AlphaPoint.registerUser.subscribe((res) => {
      if (res.UserId) {
        this.setState({ registered: true });
        return this.props.setBanner({ information: '', error: '' });
      }

      if (res.errormsg) {
        // $.bootstrapGrowl(res.errormsg, {
        //   type: 'danger',
        //   allow_dismiss: true,
        //   align: AlphaPoint.config.growlwerPosition,
        //   delay: AlphaPoint.config.growlwerDelay,
        //   offset: { from: 'top', amount: 30 },
        //   left: '60%',
        // });
        if (res.errormsg === "Username already exists." && AlphaPoint.config.useEmailAsUsername) {
          res.errormsg = AlphaPoint.translation("SIGNUP_MODAL.EMAIL_EXISTS") || "Email address already exists.";
        }

        return this.props.setBanner({
          information: '', 
          error: res.errormsg
        });
      }

      return false;
    });
  }

  componentWillUnmount() {
    this.registerUser.dispose();
  }

  selectTerms = (e) => this.setState({ termsAccepted: e.target.checked });

  register = (e) => {
    // const strongRegex = new RegExp('^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*\\W).*$', 'g');
    // const emptyRegex = new RegExp('^(w+S+)$', 'g');
    const mediumRegex = new RegExp('^(?=.{8,})(?=.*[A-Z])(?=.*[0-9]).*$', 'g');
    const emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    const enoughRegex = new RegExp('(?=.{8,}).*', 'g');
    const whiteSpaceRegex = /\s/;

    const email = (this.state.email).trim();
    const username = (this.state.username).trim();

    const growlerOpts = {
      type: 'danger',
      allow_dismiss: true,
      align: AlphaPoint.config.growlwerPosition,
      delay: AlphaPoint.config.growlwerDelay,
      offset: { from: 'top', amount: 30 },
      left: '60%',
    };
    const data = {
      UserInfo: {
        UserName: AlphaPoint.config.useEmailAsUsername ? email : username,
        passwordHash: this.state.password,
        Email: email,
      },
      UserConfig: [],
      AffiliateTag: getURLParameter('aff') || '',
      OperatorId: AlphaPoint.config.OperatorId,
    };

    e.preventDefault();

    if (!this.state.termsAccepted) {
      return this.props.setBanner({
        information: AlphaPoint.translation('SIGNUP_MODAL.ACCEPT_TERMS_MSG') || 'Do you accept the terms and conditions?',
        error: '',
      });
    }

    if (!enoughRegex.test(this.state.password)) {
      // $.bootstrapGrowl('Password must contain at least 8 characters', growlerOpts);

      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.PASSWORD_ENOUGH_REGEX_MSG') || 'Password must contain at least 8 characters',
      });
    }

    if (!mediumRegex.test(this.state.password)) {
      // $.bootstrapGrowl(
      //   'Password must contain at least 8 characters, one number, and at least one capital letter',
      //   growlerOpts);

      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.PASSWORD_MEDIUM_REGEX_MSG') || 'Password must contain at least 8 characters, one number, and at least one capital letter',
      });
    }

    if (!this.state.password || !this.state.password2) {

      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.PASSWORD_BLANK_MSG') || 'Please enter a password',
      });
    }

    if (this.state.password !== this.state.password2) {
      // $.bootstrapGrowl(
      //   'Passwords do not match. Password must contain at least 8 characters, one number, and at least one capital letter',
      //   growlerOpts);

      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.PASSWORDS_DONT_MATCH_MSG') || 'Passwords do not match.',
      });
    }

    if (!AlphaPoint.config.useEmailAsUsername) {
      if (!username) {

        return this.props.setBanner({
          information: '',
          error: AlphaPoint.translation('SIGNUP_MODAL.USERNAME_BLANK_MSG') || 'Please enter a username',
        });
      }

      // Validation: No spaces allowed in Username field
      if (whiteSpaceRegex.test(username)) {

        return this.props.setBanner({
          information: '',
          error: AlphaPoint.translation('SIGNUP_MODAL.USERNAME_NO_SPACES_MSG') || 'Username cannot include spaces',
        });
      }
    }

    if (!email) {

      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.EMAIL_BLANK_MSG') || 'Please enter your email address',
      });
    }

    if (!emailRegex.test(email)) {
      // Validation: No spaces allowed in Email field
      if (whiteSpaceRegex.test(email)) {

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

    if (AlphaPoint.config.registerForm.checkboxNotEUResident) {
      if (!this.state.notEUResident) {
        return this.props.setBanner({
          information: '',
          error: AlphaPoint.translation('SIGNUP_MODAL.EU_RESIDENT_RESTRICTION_MSG') || `${AlphaPoint.config.siteTitle} restricts users that are EU residents`,
        });
      }
    }
    if (AlphaPoint.config.registerForm.checkboxRiskOfCrypto) {
      if (!this.state.riskOfCrypto) {
        return this.props.setBanner({
          information: '',
          error: AlphaPoint.translation('SIGNUP_MODAL.RISK_ACCEPT_MSG') || 'Please acknowledge the risks associated with crypto-currency trading activities',
        });
      }
    }
    if (AlphaPoint.config.registerForm.checkboxTermsAndConditions) {
      if (!this.state.termsAndConditions) {
        return this.props.setBanner({
          information: '',
          error: AlphaPoint.translation('SIGNUP_MODAL.TERMS_ACCEPT_MSG') || 'Please read and agree to the terms and conditions',
        });
      }
    }
    // reCAPTCHA check
    if (!grecaptcha.getResponse()) {
      return this.props.setBanner({
        information: '',
        error: AlphaPoint.translation('SIGNUP_MODAL.ROBOT_CAPTCHA') || 'Are You a Robot?'
      });
    }

    return AlphaPoint.registerNewUser(data);
  }

  resetPassword = () => {
    AlphaPoint.resetPassword({
      email: this.state.email,
    }, (res) => this.setState({
      passwordReset: res.isAccepted,
    }));
  }

  showTermsModal = () => this.setState({ showTermsModal: true });

  showPrivacyModal = () => this.setState({ showPrivacyModal: true });

  closeModals = () => this.setState({ showTermsModal: false, showPrivacyModal: false });

  handleInputChange = (e) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    const inputsFilled = this.state.inputsFilled;

    this.setState({
      [name]: value
    });

    if (target.type !== 'checkbox') {
      inputsFilled[name] = value;
      this.setState({ inputsFilled })
    }
  }

  defaultView = () => {
    const closeButton = document.getElementById('login') || '';

    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        if (e.target.className === 'mfp-close') {
          const form = document.getElementById('registerForm');

          form.reset();
          this.props.setBanner({
            information: '',
            error: '',
          });
        }
      });
    }

    return (
      <form id="registerForm" onSubmit={this.register}>
        <div className={AlphaPoint.config.v2Widgets ? "pad" : "pad col-xs-12"}>
          {!this.state.passwordReset ?
            <span>
              {!AlphaPoint.config.useEmailAsUsername &&
              <span className="input input--custom">
                <InputNoLabel
                  placeholder={AlphaPoint.translation('SIGNUP_MODAL.USERNAME') || 'Username'}
                  className="input-field"
                  name="username"
                  onChange={this.handleInputChange}
                />
                <i className={"fa fa-user " + (this.state.inputsFilled.username && "completed")}
                   aria-hidden="true"></i>
              </span>
              }
              <span className="input input--custom">
                <InputNoLabel
                  placeholder={AlphaPoint.translation('SIGNUP_MODAL.EMAIL') || 'Email'}
                  className="input-field"
                  name="email"
                  onChange={this.handleInputChange}
                />
                <i className={"fa fa-envelope " + (this.state.inputsFilled.email && "completed")}
                   aria-hidden="true"></i>
              </span>
              <span className="input input--custom">
                <InputNoLabel
                  placeholder={AlphaPoint.translation('SIGNUP_MODAL.PASSWORD') || 'Password'}
                  className="input-field"
                  type="password"
                  name="password"
                  onChange={this.handleInputChange}
                />
                <i className={"fa fa-key " + (this.state.inputsFilled.password && "completed")}
                   aria-hidden="true"></i>
              </span>
              <span className="input input--custom">
                <InputNoLabel
                  placeholder={AlphaPoint.translation('SIGNUP_MODAL.VERIFYPASSWORD') || 'Confirm Password'}
                  className="input-field"
                  type="password"
                  name="password2"
                  onChange={this.handleInputChange}
                />
                <i className={"fa fa-key " + (this.state.inputsFilled.password2 && "completed")}
                   aria-hidden="true"></i>
              </span>

              {AlphaPoint.config.registerForm.checkboxNotEUResident &&
              <label className="register-checkbox-label">
                <input
                  name="notEUResident"
                  className="register-checkbox"
                  type="checkbox"
                  checked={this.state.notEUResident}
                  onChange={this.handleInputChange}/>
                {AlphaPoint.translation('SIGNUP_MODAL.NOT_EU_RESIDENT') || 'I am not a resident of E.U.'}
              </label>
              }
              {AlphaPoint.config.registerForm.checkboxRiskOfCrypto &&
              <label className="register-checkbox-label">
                <input
                  name="riskOfCrypto"
                  type="checkbox"
                  className="register-checkbox"
                  checked={this.state.riskOfCrypto}
                  onChange={this.handleInputChange}/>
                {AlphaPoint.translation('SIGNUP_MODAL.RISK_ASSOCIATED') || 'I understand there are risks associated with crypto-currency trading activities.'}
              </label>
              }
              {AlphaPoint.config.registerForm.checkboxTermsAndConditions &&
              <label className="register-checkbox-label">
                <input
                  name="termsAndConditions"
                  type="checkbox"
                  className="register-checkbox"
                  checked={this.state.termsAndConditions}
                  onChange={this.handleInputChange}/>
                {AlphaPoint.translation('SIGNUP_MODAL.READ_AND_AGREE') || `I have read &amp; agree with Terms &amp; Conditions and Privacy Policy of ${AlphaPoint.config.siteTitle}.`}
              </label>
              }

              {(this.state.authyRequired
              || this.state.googleRequired
              || this.state.smsRequired) &&
              <InputLabeled
                placeholder={AlphaPoint.translation('SIGNUP_MODAL.AUTH_QUES') || '2FA Verification Code'}
                type="string"
                name="authCode"
              />
              }
              {!AlphaPoint.config.registerForm.showTermsandConditions && !AlphaPoint.config.registerForm.checkboxTermsAndConditions &&
              <div className="keyPermissions">
                <input
                  type="checkbox"
                  name="terms_accept"
                  onClick={this.selectTerms}
                  value={this.state.termsAccepted}
                /> 
                  <span>{AlphaPoint.translation('SIGNUP_MODAL.I_ACCEPT') || 'I accept the' }
                  <a href="terms.html">{AlphaPoint.translation('SIGNUP_MODAL.TERMS') || 'Terms and Conditions'}</a> </span>
                &nbsp;{AlphaPoint.translation('SIGNUP_MODAL.AND') || 'and'} 
                  <a href="privacy.html">{AlphaPoint.translation('SIGNUP_MODAL.PRIVACY') || 'Privacy Policy'} </a>
                <br />
              </div>
              }

              {(AlphaPoint.config.apexSite && !AlphaPoint.config.registerForm.checkboxTermsAndConditions) &&
              <div className="keyPermissions">
                {AlphaPoint.translation('SIGNUP_MODAL.BY_CLICKING') || 'By Clicking'} 
                <strong>{AlphaPoint.translation('SIGNUP_MODAL.SIGNUP') || 'Sign Up'}</strong> 
                {AlphaPoint.translation('SIGNUP_MODAL.YOU_ACCEPT_OUR') || 'you accept our'}&nbsp;
                <a className="keyPermissions-link" onClick={this.showTermsModal}>{AlphaPoint.translation('SIGNUP_MODAL.TERMS') || 'Terms and Conditions'}</a>
                &nbsp;{AlphaPoint.translation('SIGNUP_MODAL.AND') || "and"}&nbsp;
                <a className="keyPermissions-link" onClick={this.showPrivacyModal}>{AlphaPoint.translation('SIGNUP_MODAL.PRIVACY') || 'Privacy Policy'}</a>
              </div>
              }
              <br />
              {/* RECAPTCHA */}
              <ReCAPTCHAv2 />
              {/* END RECAPTCHA */}
              <div className="clearfix">
                <div className={AlphaPoint.config.templateStyle === 'retail' ? '' : 'pull-right'}>
                  <br />
                  {AlphaPoint.config.templateStyle !== 'retail' &&
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={this.props.close}
                  >
                    {AlphaPoint.translation('BUTTONS.TEXT_CANCEL') || 'Cancel'}
                  </button>}
                  <p className="password-rules">
                    {AlphaPoint.translation('SIGNUP_MODAL.PASSWORD_RULES') || 'The password needs to be at least 8 characters, including 1 number and 1 capital letter.'}
                  </p>
                  {this.state.useClef && <ClefRegisterButton />}
                  {' '}
                  {AlphaPoint.config.templateStyle === 'retail' ?
                    <button
                      type="submit"
                      style={AlphaPoint.config.v2Widgets ? null : {width: '100%', margin: '0 auto'}}
                      onClick={this.register}
                      className="btn btn-lg submit underline"
                    >
                      {AlphaPoint.translation('SIGNUP_MODAL.SIGNUP') || 'Sign Up'}
                    </button>
                    :
                    <button
                      type="submit"
                      className="btn btn-action"
                    >
                      {AlphaPoint.translation('BUTTONS.TEXT_SIGNUP') || 'Create Account'}
                    </button>
                  }
                </div>
              </div>
              <br />
            </span>
            :
            <h2 className="text-center">
              {AlphaPoint.translation('SIGNIN_MODAL.PASSWORD_SENT') || 'Check email for password reset link'}
            </h2>
          }
        </div>

        {this.state.showTermsModal && <Modal close={this.closeModals}><TermsAndConditions /></Modal>}
        {this.state.showPrivacyModal && <Modal close={this.closeModals}><PrivacyPolicy /></Modal>}
      </form>
    );
  };

  render() {
    if (!this.state.registered) return this.defaultView();

    return (
      <span>
        <h3 className={AlphaPoint.config.apexSite ? 'text-center pad' : 'text-center'}>
          {AlphaPoint.translation('SIGNUP_MODAL.REGISTERED') || 'Account Created. Check your email for Activation Link.'}
        </h3>
      </span>);
  }
}

ShiftRegisterFormInnerV2.defaultProps = {
    setBanner: () => {
    },
    close: () => {
    },
    hideCloseLink: true,
};

ShiftRegisterFormInnerV2.propTypes = {
    setBanner: React.PropTypes.func,
    close: React.PropTypes.func,
};

export default ShiftRegisterFormInnerV2;
