/* global AlphaPoint, $, document, localStorage, location */
import React from 'react';
import WidgetBase from './base';
import Modal from './modal';
import InputLabeled from '../misc/inputLabeled';
import SelectLabeled from '../misc/selectLabeled';
import CountryCodePicker from '../misc/countryCodePicker';
import TwoFACodeInput from './twoFACodeInput';
import { formatNumberToLocale } from './helper';

class UserInformation extends React.Component {
  constructor() {
    super();

    this.state = {
      data: {},
      userName: '',
      error: '',
      success: '',
      twoFA: {},
      passwordReset: false,
      userConfig: {},
      waiting2FA: false,
      level: 0,
      loyaltyOMSProducts: [],
      loyaltyOMSEnabled: false,
      loyaltyProductId: 0,
    };
  }

  componentDidMount() {
    this.userInformation = AlphaPoint.getUser.subscribe(data => this.setState({
      data: {
        UserId: data.UserId,
        UserName: data.UserName,
        Password: data.Password,
        Email: data.Email,
        EmailVerified: data.EmailVerified,
        AccountId: data.AccountId,
        Use2FA: data.Use2FA,
      },
      Use2FA: data.Use2FA,
    }));

    this.userConfiguration = AlphaPoint.getUserConfig.subscribe(data => {
      const configs = ((Array.isArray(data) && data) || []).reduce((item, i) => {
        item[i.Key] = i.Value;
        return item;
      }, {});

      this.setState({ userConfig: configs });
    });

    this.accountInfo = AlphaPoint.accountInfo.subscribe(data => this.setState({
      level: data.VerificationLevel,
      loyaltyProductId: data.LoyaltyEnabled ? data.LoyaltyProductId : 0,
    }));

    if (AlphaPoint.config.loyaltyToken) {
      this.loyaltyFeeConfigs = AlphaPoint.loyaltyFeeConfigs.subscribe(result => {
        const loyaltyOMSProducts = [];
        const loyaltyOMSEnabled = true;
        result.forEach(token => {
          if (token.IsEnabled) {
            const product = AlphaPoint.accountPositions.value.find(x => x.ProductId === token.LoyaltyProductId);
            const discount = token.LoyaltyDiscount * 100;
            const decimals = (Math.floor(discount) !== discount) ? discount.toString().split('.')[1].length || 0 : 0;
            product.LoyaltyDiscount = formatNumberToLocale(discount, decimals);
            loyaltyOMSProducts.push(product);
          }
        });
        this.setState({ loyaltyOMSEnabled, loyaltyOMSProducts });
      });
    }

    this.disable2FA = AlphaPoint.Disable2FA.subscribe(response => {
      // then call authenticate 2FA
      if (response.result) {
        this.setState({
          twoFA: { requireGoogle2FA: true },
        });
      }
    });

    this.showError = () => {
      $.bootstrapGrowl(
        AlphaPoint.translation('PROFILE.USER_INFO_NOT_SAVED') || 'User information not saved',
        {
          type: 'danger',
          allow_dismiss: true,
          align: AlphaPoint.config.growlwerPosition,
          delay: AlphaPoint.config.growlwerDelay,
          offset: { from: 'top', amount: 30 },
          left: '60%',
        });
    };

    this.setUserInformation = AlphaPoint.setUser
      .filter(data => Object.keys(data).length)
      .subscribe(res => {
        if (res.length && !res.UserId) {
          this.showError();
          return this.setState({ success: '', error: 'Error' });
        }

        if (res.Use2FA === this.state.Use2FA) {
          if (res.UserId) {
            this.setState({
              success: AlphaPoint.translation('PROFILE.SAVED') || 'Saved!',
              error: '',
            });

            $.bootstrapGrowl(
              AlphaPoint.translation('PROFILE.USER_INFO_SAVED') || 'User information saved',
              {
              type: 'success',
              allow_dismiss: true,
              align: AlphaPoint.config.growlwerPosition,
              delay: AlphaPoint.config.growlwerDelay,
              offset: { from: 'top', amount: 30 },
              left: '60%',
            });
            setTimeout(() => location.reload(), 300);
          }
        }

        // check if we need to activate any 2FAs
        // if (!res.Use2FA && this.state.data.UseGoogle2FA) {
        //   this.setState({ twoFA: { requireGoogle2FA: true } });
        // }

        // call disable2FA
        // if (res.Use2FA && !this.state.data.UseGoogle2FA) {
        //   this.disable2FA = AlphaPoint.Disable2FA.subscribe(response => {
        //     // then call authenticate 2FA
        //     if (response.result) this.setState({ twoFA: { requireGoogle2FA: true } });
        //   });
        //   AlphaPoint.disable2FA({});
        // }
        return true;
      });

    this.auth2FAuthentication = AlphaPoint.auth2FA.subscribe(res => {
      if (!res.Authenticated) {
        return this.setState({
          twoFA: {},
          success: '',
          error: AlphaPoint.translation('PROFILE.CODE_REJECTED') || 'Code Rejected',
          Use2FA: this.state.data.Use2FA,
        });
      }

      if (res.Authenticated && this.state.waiting2FA) {
        return this.setState({
          waiting2FA: false,
          passwordReset: true,
        });
      }

      if (res.Authenticated) {
        return this.setState({
          twoFA: {},
          data: { ...this.state.data, Use2FA: this.state.Use2FA },
          success: AlphaPoint.translation('PROFILE.SAVED') || 'Saved!',
          error: '',
        });
      }
      return false;
    });

    AlphaPoint.getUserCon({ UserId: +localStorage.UserId || AlphaPoint.getUser.value.UserId });
    AlphaPoint.getUserInfo({ UserId: +localStorage.UserId || AlphaPoint.getUser.value.UserId });

    this.setState({
      username: document.APAPI.Session.UserObj.UserName,
      email: document.APAPI.Session.UserObj.Email,
    }, () => this.userInformation.dispose());
  }

  componentWillUnmount() {
    this.userInformation.dispose();
    this.userConfiguration.dispose();
    this.accountInfo.dispose();
    this.setUserInformation.dispose();
    this.auth2FAuthentication.dispose();
    this.disable2FA.dispose();
    if (this.resetUserPassword) {
      this.resetUserPassword.dispose();
    }
    if (AlphaPoint.config.loyaltyToken) {
      this.loyaltyFeeConfigs.dispose();
    }
  }

  changed = e => {
    const data = this.state.data;

    Object.keys(this.refs).forEach(key => {
      if (this.refs[key].type === 'checkbox' || this.refs[key].type === 'radio') {
        data[key] = this.refs[key].checked;
      } else {
        data[key] = this.refs[key].value();
      }
    });

    data.Use2FA = data.UseGoogle2FA;
    this.setState({ data, success: '', error: '' });

    if (e.target.name === 'language') {
      const { userConfig } = this.state;
      localStorage.lang = e.target.value;
      userConfig.language = e.target.value;
      this.setState({ userConfig });
    }
  };

  change2FASettings = e => {
    const { value } = e.target;

    if (value === 'UseGoogle2FA') {
      return this.setState({
        Use2FA: true,
        twoFA: { requireGoogle2FA: true },
      });
    }
    AlphaPoint.disable2FA({});
    return this.setState({ Use2FA: false });
  };

  do2FAVerification = code => {
    const data = { Code: code };

    AlphaPoint.authenticate2FA(data);
  };

  submit = () => {
    // This is what the backend expects
    const data = {
      UserId: this.state.data.UserId,
      UserName: AlphaPoint.config.useEmailAsUsername ? this.state.data.Email : this.state.data.UserName,
      Email: this.state.data.Email,
      EmailVerified: this.state.data.EmailVerified,
      AccountId: this.state.data.AccountId,
      // Use2FA: this.state.Use2FA,
    };

    AlphaPoint.setUserInfo(data);

    // Name sets the userconfig but it sets the key to "null" instead of "language"
    // TODO: Fix with David Hyatt
    const payload = {
      UserId: this.state.data.UserId,
      Config: [{
        Key: 'language',
        Value: this.state.userConfig.language,
      }],
    };
    AlphaPoint.setUserCon(payload);
  };

  closeModal = () => this.setState({
    twoFA: {},
    waiting2FA: false,
    Use2FA: this.state.data.Use2FA,
  });

  resetPassword = () => {
    this.resetUserPassword = AlphaPoint.resetPass.subscribe(res => {
      // console.log('RESET RESPONSE', res);
      if (res.result) {
        this.setState({ passwordReset: res.result });
      }
      if (!res.result && res.errormsg === 'Waiting for 2FA.') {
        this.setState({
          twoFA: { passwordReset2FA: true },
          waiting2FA: true,
        });
      }
    });

    AlphaPoint.resetPassword({ UserName: this.state.username });
    setTimeout(() => {
      AlphaPoint.logout();
      document.location = AlphaPoint.config.logoutRedirect;
    }, 5000);
  };

  changeLoyalty = e => {
    const loyaltyIndex = e.target.value;
    const payload = {
      ...AlphaPoint.accountInfo.value,
      LoyaltyProductId: 0,
      LoyaltyEnabled: false,
    };
    if (loyaltyIndex > -1) {
      const { loyaltyOMSProducts } = this.state;
      const loyaltyProduct = loyaltyOMSProducts[loyaltyIndex];
      const { Amount, ProductId } = loyaltyProduct;
      payload.LoyaltyProductId = ProductId;

      // Never enable the loyalty token functionality if the balance is 0.
      if (Amount > 0) {
        payload.LoyaltyEnabled = true;
      }
    }
    return document.APAPI.RPCCall('UpdateAccount', payload, (result) => {
      if (result) {
        this.setState({
          loyaltyProductId: payload.LoyaltyEnabled ? payload.LoyaltyProductId : 0,
        });
      } else this.showError();
    });
  }

  loyaltyDisabled = index => !this.state.loyaltyOMSEnabled || this.state.loyaltyOMSProducts[index].Amount <= 0;

  render() {
    const languageList = ((AlphaPoint.config.languages && AlphaPoint.config.languages.items) || [])
      .map(item => (<option value={item.value} key={item.name}>{item.name}</option>));

    return (
      <WidgetBase
        {...this.props}
        login
        headerTitle={AlphaPoint.translation('PROFILE.TITLE_TEXT') || 'Information'}
        error={this.state.error}
        success={this.state.success}
      >
        <div className="pad-y pad">
          {AlphaPoint.config.siteName !== 'yap.cx' && AlphaPoint.config.useEmailAsUsername &&
            <div className="row">
              <InputLabeled
                ref="UserName"
                type="hidden"
                value={this.state.data.Email}
                onChange={this.changed}
                wrapperClass="col-xs-12"
                disabled={AlphaPoint.config.siteName === 'aztec' || this.state.level > 0}
              />
            </div>}
          {AlphaPoint.config.siteName !== 'yap.cx' && !AlphaPoint.config.useEmailAsUsername &&
            <div className="row">
              <InputLabeled
                ref="UserName"
                placeholder={AlphaPoint.translation('PROFILE.USERNAME') || 'User Name'}
                value={this.state.data.UserName}
                onChange={this.changed}
                wrapperClass="col-xs-12"
                disabled={AlphaPoint.config.siteName === 'aztec' || this.state.level > 0}
              />
            </div>}

          {AlphaPoint.config.siteName !== 'yap.cx' && AlphaPoint.config.siteName !== 'aztec' &&
            <div className="row">
              <InputLabeled
                ref="Email"
                placeholder={AlphaPoint.translation('PROFILE.EMAIL') || 'Email'}
                value={this.state.data.Email}
                onChange={this.changed}
                disabled={AlphaPoint.config.disableEditEmail || this.state.level > 0}
                wrapperClass="col-xs-12"
              />
            </div>}

          {AlphaPoint.config.siteName !== 'yap.cx' && AlphaPoint.config.siteName !== 'aztec' && AlphaPoint.config.showCCode &&
            <div className="row">
              <CountryCodePicker
                ref="Cell2FACountryCode"
                placeholder={AlphaPoint.translation('PROFILE.PHONE_CODE') || 'Country Code'}
                value={this.state.data.Cell2FACountryCode}
                onChange={this.changed}
                wrapperClass="col-xs-6"
              />
              <InputLabeled
                ref="Cell2FAValue"
                placeholder={AlphaPoint.translation('PROFILE.PHONE') || 'Cell Number'}
                value={this.state.data.Cell2FAValue}
                onChange={this.changed}
                wrapperClass="col-xs-6"
              />
            </div>}
          {AlphaPoint.config.disableLangUserInformation ? null :
            AlphaPoint.config.siteName !== 'yap.cx' && AlphaPoint.config.siteName !== 'aztec' &&
            <div className="row">
              <SelectLabeled
                name="language"
                ref="Language"
                placeholder={AlphaPoint.translation('PROFILE.LANGUAGE') || 'Language'}
                onChange={this.changed}
                value={this.state.userConfig.language}
                wrapperClass="col-xs-12"
              >
                {languageList}
              </SelectLabeled>
            </div>
          }
          {AlphaPoint.config.siteName !== 'aztec' &&
            <div className="row">
              <div className="col-xs-12 form-group">
                <label htmlFor="resetPass">{AlphaPoint.translation('PASSWORD_MODAL.TITLE_TEXT') || 'Reset Password'}</label>
                <div id="resetPass">
                  {!this.state.passwordReset ?
                    <a onClick={this.resetPassword} style={{ textDecoration: 'underline' }}>
                      {AlphaPoint.translation('PROFILE.RESET_PASSWORD') || 'Click here to reset your password'}
                    </a>
                    :
                    <span>{AlphaPoint.translation('PROFILE.RESET_PASS_SENT') || 'Check your email for password reset link'}</span>}
                </div>
              </div>
            </div>}

          {AlphaPoint.config.siteName !== 'aztec' &&
            <div className="row">
              <div className="col-xs-12">
                <p>{AlphaPoint.translation('2FA.TITLE_TEXT') || 'For added security, enable one of the following'}:</p>
                {AlphaPoint.config.authy2FA &&
                  <div className="radio">
                    <label htmlFor="auth">
                      <input
                        type="radio"
                        name="auth"
                        id="auth"
                        ref="UseAuthy2FA"
                        disabled={
                          AlphaPoint.userInformation.value.UseGoogle2FA
                          || AlphaPoint.userInformation.value.UseSMS2FA
                        }
                        checked={this.state.data.UseAuthy2FA}
                        onChange={this.changed}
                      />
                      {AlphaPoint.translation('PROFILE.AUTHY') || 'UseAuthy2FA'}
                    </label>
                  </div>}

                {AlphaPoint.config.authSMS &&
                  <div className="radio">
                    <label>
                      <input
                        type="radio"
                        name="auth"
                        ref="UseSMS2FA"
                        disabled={
                          AlphaPoint.userInformation.value.UseAuthy2FA ||
                          AlphaPoint.userInformation.value.UseGoogle2FA
                        }
                        checked={this.state.data.UseSMS2FA}
                        onChange={this.changed}
                      />
                      {AlphaPoint.translation('PROFILE.SMS') || 'UseSMS2FA'}
                    </label>
                  </div>}

                {AlphaPoint.config.authGoogle &&
                  <div className="radio">
                    <label>
                      <input
                        type="radio"
                        name="auth"
                        ref="UseGoogle2FA"
                        value="UseGoogle2FA"
                        checked={this.state.Use2FA}
                        onChange={this.change2FASettings}
                      />
                      {AlphaPoint.translation('PROFILE.GOOGLE') || 'UseGoogle2FA'}
                    </label>
                  </div>}

                <div className="radio">
                  <label>
                    <input
                      type="radio"
                      name="auth"
                      ref="UseNoAuth"
                      value="UseNoAuth"
                      checked={!this.state.Use2FA}
                      onChange={this.change2FASettings}
                    />
                    {AlphaPoint.translation('PROFILE.NOAUTH') || 'None'}
                  </label>
                </div>
              </div>
            </div>}
          {this.state.loyaltyOMSEnabled &&
            <div className="row loyalty">
              <div className="col-xs-12">
                <p>{AlphaPoint.translation('PROFILE.FEES') || 'Fees'}</p>
                { this.state.loyaltyOMSProducts.map((product, index) => {
                  const id = productId => `loyaltyToken${productId}`;
                  return (
                    <div className="radio">
                      <label htmlFor={id(product.ProductId)}>
                        <input
                          type="radio"
                          name="loyaltyToken"
                          id={id(product.ProductId)}
                          value={index}
                          checked={this.state.loyaltyProductId === product.ProductId}
                          onChange={this.changeLoyalty}
                          disabled={this.loyaltyDisabled(index)}
                        />
                        { this.loyaltyDisabled(index) ?
                          AlphaPoint.translation('PROFILE.LOYALTY_FEES_DISABLED', { TOKEN: product.ProductSymbol }) ||
                          `You must have a balance to use ${product.ProductSymbol} to pay for fees` :
                          AlphaPoint.translation('PROFILE.LOYALTY_FEES', { TOKEN: product.ProductSymbol }) ||
                          `Use ${product.ProductSymbol} to pay for fees`
                        }
                        <span>&nbsp;
                          {
                            AlphaPoint.translation('PROFILE.LOYALTY_DISCOUNT', { DISCOUNT: product.LoyaltyDiscount }) ||
                            `(${product.LoyaltyDiscount}% discount)`
                          }
                        </span>
                      </label>
                    </div>
                  );
                })}
                <div className="radio">
                  <label htmlFor="loyaltyToken0">
                    <input
                      type="radio"
                      name="loyaltyToken"
                      id="loyaltyToken0"
                      value={-1}
                      checked={this.state.loyaltyProductId === 0}
                      onChange={this.changeLoyalty}
                    />
                    { AlphaPoint.translation('PROFILE.LOYALTY_DEFAULT') || 'Use default fees' }
                  </label>
                </div>
              </div>
            </div>
          }

          <div className={AlphaPoint.config.siteName === 'aztec' ? 'clearfix pad' : 'clearfix pad-x pad col-xs-12'}>
            <div className="pull-right">
              <button
                type="submit"
                className="btn btn-action"
                onClick={this.submit}
              >
                {AlphaPoint.translation('BUTTONS.TEXT_SUBMIT') || 'Submit'}
              </button>
            </div>
          </div>
        </div>

        {(this.state.twoFA.requireGoogle2FA ||
          this.state.twoFA.passwordReset2FA ||
          this.state.twoFA.requireAuthy2FA ||
          this.state.twoFA.requireSMS2FA) &&
          <Modal close={this.closeModal}>
            <TwoFACodeInput
              {...this.state.twoFA}
              doNotShowQRCode={this.state.data.Use2FA}
              submit={this.do2FAVerification}
            />
          </Modal>}
      </WidgetBase>
    );
  }
}

export default UserInformation;
