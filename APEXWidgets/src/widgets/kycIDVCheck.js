/* global AlphaPoint, $, window */
/* eslint-disable react/no-multi-comp */
import React from 'react';

import ProcessingButton from '../misc/processingButton';
import ApDatepicker from '../misc/form/apDatepicker';
import ApSelect from '../misc/form/apSelect';
import ApInput from '../misc/form/apInput';
import {states, countriesCodes} from '../common';

export default class IDVCheck extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      requiredFields: {
        // throwError booleans
        dob: false,
        billingCountry: false,
      },
      userConfig: {
        FirstName: '',
        LastName: '',
        dob: '',
        BillingStreetAddress: '',
        MerchCountry: '',
        BillingCountry: '',
        BillingCountryCode: '',
        BillingCity: '',
        BillingZip: '',
        Phone: '',
      },
      processing: false,
      regexMatch: true,
      confirmClose: false,
      verificationLevel: 0,
      formIsValid: true,
    };
    this.isRequired = this.isRequired.bind(this);
  }

  componentDidMount() {
    this.userConfiguration = AlphaPoint.getUserConfig.subscribe(data => {
      let userConfig = this.state.userConfig;

      if (data.length > 0) {
        data.reduce((item, i) => {
          return userConfig[i.Key] = i.Value; // eslint-disable-line no-param-reassign
        }, {});

        userConfig.UseNoAuth = userConfig.UseNoAuth && (userConfig.UseNoAuth.toString() || "true");
        userConfig.UseGoogle2FA = userConfig.UseGoogle2FA && (userConfig.UseGoogle2FA.toString() || "false");

        this.setState({ userConfig });
      }

    });

    this.accountInfo = AlphaPoint.accountInfo.subscribe(data => {
      this.setState({verificationLevel: data.VerificationLevel});
    });

    AlphaPoint.getUserCon({UserId: AlphaPoint.userData.value.UserId});
  };

  componentWillUnmount() {
    /* eslint-disable no-unused-expressions */
    this.userConfiguration && this.userConfiguration.dispose();
    this.verifyLevel && this.verifyLevel.dispose();
    this.verifcationLevelUpdate && this.verifcationLevelUpdate.dispose();
    /* eslint-enable no-unused-expressions */
  };

  dateChanged = field => date => {
    const {userConfig} = this.state;
    userConfig[field] = date;
    this.setState({userConfig});
  };

  changed = (name, value, validationMessagesLength, formIsValid = true) => {
    const userConfig = this.state.userConfig;

    if (name === 'BillingCountry') {
      countriesCodes.filter(country => {
        return value === country.code;
      }).map(selectedCountry => {
        userConfig.BillingCountryCode = selectedCountry.code;
        userConfig[name] = selectedCountry.name;
        this.setState({ userConfig });
      });
    } else if (name === "MerchCountry") {
      countriesCodes.filter(country => {
        return value === country.code;
      }).map(selectedCountry => {
        userConfig.MerchCountry = selectedCountry.name;
        this.setState({ userConfig });
      });
    } else {
      userConfig[name] = value;
      this.setState({userConfig, formIsValid});
    }
  };

  // Required Fields validation
  isRequired() {
    const userConfig = this.state.userConfig;
    let formIsValid = true;

    const kycFields = AlphaPoint.config.kycFields || [];
    const kycRequiredFields = Object.keys(kycFields).filter(key => {
      return kycFields[key].includes('required')
    });

    for (const key in userConfig) {

      if (!userConfig[key]) {
        if (kycRequiredFields.indexOf(key) > -1) {
          formIsValid = false;
          this.setState({
            formIsValid: false,
            [key]: true
          });
        }
      } else {
        this.setState({ [key]: false });
      }
    }
    return formIsValid;
  };


  submit = (e) => {

    if (this.isRequired()) { // Checking for required fields; returns submit as false if any kycRequiredFields are empty
      e.preventDefault();
      this.props.setError('');
      
      const Config = [];

      Object.keys(this.state.userConfig).forEach(key => {
        let value = this.state.userConfig[key];
        let entry = {
          Key: key,
          Value: value,
        };
        Config.push(entry);
      });

      let configs = {
        UserId: AlphaPoint.userData.value.UserId,
        Config,
      };

      // Set userInfo
      let userInfo = {
        FirstName: this.state.userConfig.FirstName,
        LastName: this.state.userConfig.LastName,
        dob: this.state.userConfig.dob,
        accountName: JSON.stringify(AlphaPoint.userData.value.UserId),
        BillingStreetAddress: this.state.userConfig.BillingStreetAddress,
        MerchCountry: this.state.userConfig.MerchCountry,
        BillingCountry: this.state.userConfig.BillingCountry,
        BillingCountryCode: this.state.userConfig.BillingCountryCode,
        BillingCity: this.state.userConfig.BillingCity,
        BillingZip: this.state.userConfig.BillingZip,
        Phone: this.state.userConfig.Phone,
      };

      AlphaPoint.setUserConfig.subscribe(data => {
        // if (data.result) console.log('setUserConfig success');
        if (!data.result && data.length > 0) console.error('setUserConfig failed');
      });

      // Setting user config
      AlphaPoint.setUserCon(configs);

      const clientInfo = {
        alphaPointSessiontoken: AlphaPoint.session.value.SessionToken, // session token of the user to be validated, not used yet
        alphaPointUserID: JSON.stringify(AlphaPoint.userData.value.UserId),
        validationStage: 0, 
        validator: AlphaPoint.config.kycType,
      };

      const params = {
        clientInfo,
        userInfo
      };

      this.verifyLevel = AlphaPoint.verifylevel.subscribe(res => {

        if (res.result === 'Unknown Validator Request') {
          // this.setState({ processing: false });
          this.setState({
            validatorErrorMesssage: AlphaPoint.translation('KYC.UNKNOWN_VALIDATOR_REQUEST') || 'Unknown Validator Request',
            validatorRespondedMesssage: ''
          });
          if (res.ValidationAnswerData) {
            if (res.ValidationAnswerData.isAccepted) {
              this.setState({
                validatorErrorMesssage: '',
                validatorRespondedMesssage: AlphaPoint.translation('KYC.INFO_ACCEPTED') || 'Your information has been accepted',
              });
            }
            if ((!res.ValidationAnswerData.isAccepted && res.NeedsManualReview)) {
              this.setState({
                validatorErrorMesssage: AlphaPoint.translation('KYC.VERIFICATION_DENIED') || 'Verification Denied: Not Accepted',
                validatorRespondedMesssage: ''
              });
            }
          }
          this.setState({processing: false, confirmClose: true});
        } else if (res === "Validator Not Connected") {
          this.setState({
            processing: false,
            confirmClose: true,
            validatorErrorMesssage: res,
            validatorRespondedMesssage: ''
          });
        } else if (res === null) {
          this.setState({
            processing: false,
            confirmClose: true,
            validatorErrorMesssage: AlphaPoint.translation('KYC.VALIDATOR_NO_SETUP') || 'Validator may not be setup yet. Please contact the site administrator',
            validatorRespondedMesssage: ''
          });
        } else if (res === "Unable to validate") {
          this.setState({
            processing: false,
            confirmClose: true,
            validatorErrorMesssage: res,
            validatorRespondedMesssage: ''
          });
        } else if (res === "Validator Call failed: The remote server returned an error: (500) Internal Server Error.") {
          this.setState({
            processing: false,
            confirmClose: true,
            validatorErrorMesssage: res,
            validatorRespondedMesssage: ''
          });
        } else if (res === "Validator Call failed: Unable to connect to the remote server") {
          this.setState({
            processing: false,
            confirmClose: true,
            validatorErrorMesssage: 'Validator Call failed: Unable to connect to the remote server',
            validatorRespondedMesssage: ''
          });
        } else if (res.ErrorMessage) {
          console.error("Validator Response:", res.ErrorMessage);

          this.setState({
            processing: false, 
            confirmClose: true,
            validatorErrorMesssage: AlphaPoint.translation('KYC.VALIDATION_ERROR') || 'Validator Error - Please try again.',
            validatorRespondedMesssage: ''
          });
        } else if (res === false) {
          this.setState({
            processing: false, 
            confirmClose: true,
            validatorErrorMesssage: AlphaPoint.translation('KYC.VALIDATION_ERROR') || 'Validator Error - Please try again.',
            validatorRespondedMesssage: ''
          });
        }

        // IF VALIDATOR HAS A VALID RESPONSE WITH VALIDATION ANSWER DATA
        if (res.ValidationAnswerData) {
          if (res.ValidationAnswerData.isAccepted) {
            this.setState({
              processing: false, 
              confirmClose: true,
              validatorErrorMesssage: '',
              validatorRespondedMesssage: AlphaPoint.translation('KYC.INFO_ACCEPTED') || 'Your information has been accepted. Click "Continue", to proceed with the Verification Process'
            });

          } else if ((!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.NeedsManualReview)) { // eslint-disable-line max-len
            this.setState({
              processing: false, 
              confirmClose: true,
              validatorErrorMesssage: '',
              validatorRespondedMesssage: AlphaPoint.translation('KYC.INFO_MANUAL_REVIEW') || 'Your information requires manual review'
            });

          } else if (!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.ApiErrorDescription) {
            this.setState({
              processing: false, 
              confirmClose: true,
              validatorErrorMesssage: res.ValidationAnswerData.ApiErrorDescription,
              validatorRespondedMesssage: ''
            });
          } else if (!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.ApiError) {
            this.setState({
              processing: false, 
              confirmClose: true,
              validatorErrorMesssage: res.ValidationAnswerData.ApiErrorDescription,
              validatorRespondedMesssage: ''
            });
          } else {
            // TODO: Add info style
            this.setState({
              processing: false, 
              confirmClose: true,
              validatorErrorMesssage: AlphaPoint.translation('KYC.RESPONSE', {answerData: res.ValidationAnswerData}) || `${res.ValidationAnswerData}`,
              validatorRespondedMesssage: ''
            });
          }
        }
      });

      // console.log(params);
      this.setState({processing: true});
      AlphaPoint.validateUserRegistration(params);

    } else { // If fields specified in isRequired() function are empty,
      e.preventDefault();
      return false;
    }
  };

  render() {
    const countries = countriesCodes.map(country => (
      <option value={country.code} key={country.code}>{country.name}</option>
    ));

    if (AlphaPoint.config.onlyShowOneCountryKYC) {
      if (AlphaPoint.config.kycCountriesList.length > 1) {
        var listSpecificCountries = countriesCodes.filter(function (country) {
          return AlphaPoint.config.kycCountriesList.indexOf(country.name) > -1;
        }).map(theCountry => (
          <option value={theCountry.code} key={theCountry.code}>{theCountry.name}</option>
        ));
      } else {
        var listSpecificCountries = countriesCodes.filter(country => {
          return country.name === AlphaPoint.config.kycCountriesList
        }).map(theCountry => (
          <option value={theCountry.code} key={theCountry.code}>{theCountry.name}</option>
        ));
      }
    }

    const billingCountrySelected = countriesCodes.find(country => country.code === this.state.userConfig.BillingCountryCode) || '';
    const merchCountrySelected = countriesCodes.find(country => country.name === this.state.userConfig.MerchCountry) || '';

    return (
      <div>
        {this.state.processing &&
          <div className="loader-container">
            <div className="loader">{AlphaPoint.translation('COMMON.LOADING') || 'Loading...'}</div>
          </div>
        }

        {this.state.confirmClose &&
          <div className="loader-container-confirm">
            <span>{this.state.validatorRespondedMesssage}</span>
            <button 
              className="confirm-close-btn blue-btn"
              onClick={() => window.location.reload()}
            >{AlphaPoint.translation('COMMON.CONTINUE') || 'Continue'}</button>
          </div>}

        <form onSubmit={this.submit} style={{overflow: 'hidden'}}>
          <div className="pad-y row" style={{marginTop: '15px'}}>
            <div className="col-xs-12">
              <h5>{AlphaPoint.translation('VERIFY.PERSONAL_INFORMATION') || 'Personal Information'}</h5>
              <hr className="kyc-form-section-divider" />
            </div>
            
            <div className="col-xs-12">
              
              <div className={`${AlphaPoint.config.templateStyle === 'retail' ? 'col-xs-6' : 'row'}`}>
                <ApInput
                  name="FirstName"
                  value={this.state.userConfig.FirstName}
                  validations={AlphaPoint.config.kycFields.FirstName && AlphaPoint.config.kycFields.FirstName}
                  onChange={this.changed}
                  label={AlphaPoint.translation('VERIFY.FIRSTNAME') || 'First Name'}
                  wrapperClass={`${AlphaPoint.config.templateStyle === 'retail' ? 'col-xs-12' : 'col-xs-8'} ap-input-firstname`}
                />
              </div>
              <div className={`${AlphaPoint.config.templateStyle === "retail" ? 'col-xs-6' : 'row'}`}>
                <ApInput
                  name="LastName"
                  value={this.state.userConfig.LastName}
                  validations={AlphaPoint.config.kycFields.LastName && AlphaPoint.config.kycFields.LastName}
                  onChange={this.changed}
                  label={AlphaPoint.translation('VERIFY.LASTNAME') || 'Last Name'}
                  wrapperClass={`${AlphaPoint.config.templateStyle === 'retail' ? 'col-xs-12' : 'col-xs-8'} ap-input-lastname`}
                />
              </div>
              <div className={`${AlphaPoint.config.templateStyle === "retail" ? 'col-xs-6' : 'row'}`}>
                <ApDatepicker
                  name="dob"
                  dob
                  value={this.state.userConfig.dob}
                  onChange={this.dateChanged('dob')}
                  throwError={this.state.requiredFields.dob}
                  errorDescription={AlphaPoint.translation('VERIFY.REQUIRED_TEXT') || 'This field is required'}
                  label={AlphaPoint.translation('VERIFY.DATE') || 'dob'}
                  wrapperClass={`${AlphaPoint.config.templateStyle === 'retail' ? 'col-xs-12' : 'col-xs-8'}  ap-datepicker-dob`}
                />
              </div>
              <div className={`${AlphaPoint.config.templateStyle === "retail" ? 'col-xs-6' : 'row'}`}>
                <ApInput
                  name="phone"
                  value={this.state.userConfig.phone}
                  validations={AlphaPoint.config.kycFields.phone && AlphaPoint.config.kycFields.phone}
                  onChange={this.changed}
                  label={AlphaPoint.translation('VERIFY.PHONE') || 'Phone'}
                  wrapperClass={`${AlphaPoint.config.templateStyle === 'retail' ? 'col-xs-12' : 'col-xs-8'}  ap-input-phone`}
                />
              </div>

              <div className={`${AlphaPoint.config.templateStyle === "retail" ? 'col-xs-6' : 'row'}`}>
                <ApSelect
                  name="MerchCountry"
                  onChange={this.changed}
                  value={this.state.userConfig.MerchCountry}
                  throwError={this.state.requiredFields.MerchCountry}
                  errorDescription={AlphaPoint.translation('VERIFY.REQUIRED_TEXT') || 'This field is required'}
                  label={AlphaPoint.translation('VERIFY.COUNTRY_OF_ORIGIN') || 'Country of Origin'}
                  wrapperClass={`${AlphaPoint.config.templateStyle === 'retail' ? 'col-xs-12' : 'col-xs-8'}  ap-select-country_of_origin`}
                >
                  <option value={this.state.userConfig.MerchCountry}>
                    {merchCountrySelected.name || AlphaPoint.translation('VERIFY.SELECT_COUNTRY') || 'Select Country'}
                  </option>
                  {AlphaPoint.config.onlyShowOneCountryKYC ? listSpecificCountries : countries}
                </ApSelect>
              </div>
            </div>
          </div>
          
          <div className="pad-y row">
            <div className="col-xs-12">
              <h5>{AlphaPoint.translation('VERIFY.BILLING_ADDRESS_INFO') || 'Billing Address Information'}</h5>
              <hr className="kyc-form-section-divider" />
            </div>

            <div className="col-xs-12">
              <div className={`${AlphaPoint.config.templateStyle === "retail" ? 'col-xs-6' : 'row'}`}>  
                <ApInput
                  name="BillingStreetAddress"
                  value={this.state.userConfig.BillingStreetAddress}
                  validations={AlphaPoint.config.kycFields.BillingStreetAddress && AlphaPoint.config.kycFields.BillingStreetAddress}
                  onChange={this.changed}
                  label={AlphaPoint.translation('VERIFY.ADDRESS') || 'Billing Street Address'}
                  wrapperClass={`${AlphaPoint.config.templateStyle === 'retail' ? 'col-xs-12' : 'col-xs-8'}  ap-input-billing_street_address`}
                />
              </div>
              <div className={`${AlphaPoint.config.templateStyle === "retail" ? 'col-xs-6' : 'row'}`}>
                <ApInput
                  name="BillingCity"
                  value={this.state.userConfig.BillingCity}
                  validations={AlphaPoint.config.kycFields.BillingCity && AlphaPoint.config.kycFields.BillingCity}
                  onChange={this.changed}
                  label={AlphaPoint.translation('VERIFY.CITY') || 'Billing City'}
                  wrapperClass={`${AlphaPoint.config.templateStyle === 'retail' ? 'col-xs-12' : 'col-xs-8'}  ap-input-billing_city`}
                />
              </div>
              <div className={`${AlphaPoint.config.templateStyle === "retail" ? 'col-xs-6' : 'row'}`}>
                <ApInput
                  name="BillingZip"
                  value={this.state.userConfig.BillingZip}
                  validations={AlphaPoint.config.kycFields.BillingZip && AlphaPoint.config.kycFields.BillingZip}
                  onChange={this.changed}
                  label={AlphaPoint.translation('VERIFY.ZIP') || 'Billing Zip Code'}
                  wrapperClass={`${AlphaPoint.config.templateStyle === 'retail' ? 'col-xs-12' : 'col-xs-8'}  ap-input-billing_zip_code`}
                />
              </div>
              <div className={`${AlphaPoint.config.templateStyle === "retail" ? 'col-xs-6' : 'row'}`}>
                <ApSelect
                  name="BillingCountry"
                  onChange={this.changed}
                  value={this.state.userConfig.BillingCountry}
                  throwError={this.state.requiredFields.BillingCountry}
                  errorDescription={AlphaPoint.translation('VERIFY.REQUIRED_TEXT') || 'This field is required'}
                  label={AlphaPoint.translation('VERIFY.COUNTRY') || 'Billing Country'}
                  wrapperClass={`${AlphaPoint.config.templateStyle === 'retail' ? 'col-xs-12' : 'col-xs-8'}  ap-select-billing_country`}
                >
                  <option value={this.state.userConfig.BillingCountry}>
                    {billingCountrySelected.name || AlphaPoint.translation('VERIFY.SELECT_COUNTRY') || 'Select Country'}
                  </option>
                  {AlphaPoint.config.onlyShowOneCountryKYC ? listSpecificCountries : countries}
                </ApSelect>
              </div>
            </div>
          </div>


          <div className="pad row kyc-submit-container" style={{paddingBottom: '10px'}}>
            <div className="col-xs-8" style={{paddingTop: '15px'}}>
              {false &&
              <ProcessingButton
                type="submit"
                onClick={this.submit}
                processing={this.state.processing}
                className="btn btn-action input-verify"
              >{AlphaPoint.translation('VERIFY.SUBMIT_ACCOUNT_APPLICATION') || 'Submit Application'}</ProcessingButton>}
            
            
            
              <ProcessingButton
                type="submit"
                processing={this.state.processing}
                disabled={!this.state.formIsValid}
                className="btn btn-action input-verify"
              >{AlphaPoint.translation('VERIFY.SUBMIT_ACCOUNT_APPLICATION') || 'Submit Application'}</ProcessingButton>

              {!this.state.formIsValid && <span style={{
                color: 'lightcoral',
                fontWeight: '600',
                fontSize: '13px',
                display: 'inline-block',
                marginLeft: '12px'
              }}>{AlphaPoint.translation('VERIFY.FORM_INVALID_MESSAGE') || 'Please check that each field is filled in correctly.'}</span>}
            </div>
          </div>
        </form>
      </div>
    );
  }
}

IDVCheck.defaultProps = {
  increaseLevel: () => {},
  setError: () => {},
  hideHeader: true,
};

IDVCheck.propTypes = {
  increaseLevel: React.PropTypes.func,
  setError: React.PropTypes.func,
};
