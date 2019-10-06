/* global AlphaPoint, $, alert, window */
/* eslint-disable react/no-multi-comp, no-alert */
import React from 'react';

import ProcessingButton from '../misc/processingButton';
import ApInput from '../misc/form/apInput';
import ApDatepicker from '../misc/form/apDatepicker';
import ApSelect from '../misc/form/apSelect';
import { states, countriesCodes } from '../common';

export default class GreenId extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        // throwError booleans
        requiredFields: {
          dob: false,
          billingCountry: false,
          passportExpiration: false,
        },
        userConfig: {
          firstName: '',
          middleName: '',
          lastName: '',
          dob: '',
          telephone: '',
          billingFlatNumber: '',
          billingStreetNumber: '',
          billingStreetAddress: '',
          billingStreetType: '',
          billingCountry: '',
          billingCity: '',
          billingSuburb: '',
          billingZip: '',
          driverLicenseNumber: '',
          driverLicenseVersion: '',
          passportNumber: '',
          passportExpiration: '',
        },

        processing: false,
        // regexMatch: true,
        confirmClose: false,
        verificationLevel: 0,
        formIsValid: true,
      };
      // this.passportNumberValidation = this.passportNumberValidation.bind(this);
      this.isRequired = this.isRequired.bind(this);
    }

    componentDidMount() {

      this.userConfiguration = AlphaPoint.getUserConfig.subscribe(data => {
        let configs = this.state.userConfig;

        if (data.length > 0) {

          data.reduce((item, i) => {

            return configs[i.Key] = i.Value; // eslint-disable-line no-param-reassign

          }, {});

          configs.UseNoAuth = configs.UseNoAuth && (configs.UseNoAuth.toString() || "true");
          configs.UseGoogle2FA = configs.UseGoogle2FA && (configs.UseGoogle2FA.toString() || "false");

          this.setState({ userConfig: configs });
        }

      });

      this.accountInfo = AlphaPoint.accountInfo.subscribe(data => {
        this.setState({ verificationLevel: data.VerificationLevel })
      })

      AlphaPoint.getUserCon({ UserId: AlphaPoint.userData.value.UserId });
    }

    componentWillUnmount() {
      /* eslint-disable no-unused-expressions */
      this.userConfiguration && this.userConfiguration.dispose();
      this.verifyLevel && this.verifyLevel.dispose();
      this.verifcationLevelUpdate && this.verifcationLevelUpdate.dispose();
      this.validatorRes && this.validatorRes.dispose();
      /* eslint-enable no-unused-expressions */
    }

    dateChanged = field => date => {
      const { userConfig } = this.state;
      userConfig[field] = date;
      this.setState({ userConfig });
    }

    changed = (name, value, validationMessagesLength, formIsValid) => {
      const userConfig = this.state.userConfig;
      userConfig[name] = value;
      this.setState({ userConfig, formIsValid });
    }

    submit = (e) => {
      if (this.isRequired()) { // Checking for required fields; returns submit as false if any kycRequiredFields are empty
        const that = this;
        const configIn = [];
        const growlerOptions = {
          allow_dismiss: true,
          align: "center",
          delay: AlphaPoint.config.growlerDelay,
          offset: { from: 'top', amount: 30 },
          left: '60%',
        };
        const growlerOptionsLongDelay = {
          allow_dismiss: true,
          align: "center",
          delay: 20000,
          offset: { from: 'top', amount: 30 },
          left: '60%',
        };
        let configs = {};
        let server = {};
        let userInfo = {};

        e.preventDefault();
        this.setState({ processing: true });

        Object.keys(this.state.userConfig).forEach(key => {
          let entry,
              value = this.state.userConfig[key];

            entry = {
              Key: key,
              Value: value,
            }
            configIn.push(entry);

        });
        // console.log("configIn", configIn);

        configs = {
          UserId: AlphaPoint.userData.value.UserId,
          Config: configIn,
        };

        this.props.setError('');

        // Set userInfo
        userInfo = {
          firstName: this.state.userConfig.firstName,
          middleName: this.state.userConfig.middleName,
          lastName: this.state.userConfig.lastName,
          dob: this.state.userConfig.dob,
          accountName: JSON.stringify(AlphaPoint.userData.value.UserId),
          billingStreetAddress: this.state.userConfig.billingStreetAddress,
          billingCountry: this.state.userConfig.billingCountry,
          billingCity: AlphaPoint.config.siteName === "lexexchange" ? "" : this.state.userConfig.billingCity, // "OR" suburb just in case city field is not being used on UI
          billingZip: this.state.userConfig.billingZip,
          phone: this.state.userConfig.telephone,
          billingFlatNumber: this.state.userConfig.billingFlatNumber,
          billingStreetNumber: this.state.userConfig.billingStreetNumber,
          billingStreetType: this.state.userConfig.billingStreetType,
          billingSuburb: this.state.userConfig.billingSuburb, // Australia specific
          salutation: '',
          // Temporary key names
          MerchAccountName: this.state.userConfig.passportNumber,
          MerchAccountTaxID: new Date(this.state.userConfig.passportExpiration),
          MerchPhone: this.state.userConfig.driverLicenseNumber,
          MerchFirstName: AlphaPoint.config.noDlVersionForGreenId ? "" : this.state.userConfig.driverLicenseVersion
        };

        // ==============================================
        // AlphaPoint.getUserConfig LOGIC
        // ==============================================
        // this.userConfiguration = AlphaPoint.getUserConfig.subscribe(data => {
        //   let configurations = [];

        //   if (data.length > 0) {
        //     configurations = data.reduce((item, i) => {
        //       item[i.Key] = i.Value; // eslint-disable-line no-param-reassign
        //       return item;
        //     }, {});

        //     configurations.UseNoAuth = JSON.parse(configurations.UseNoAuth || "true");
        //     configurations.UseGoogle2FA = JSON.parse(configurations.UseGoogle2FA || "false");
        //   }
        //   server = configurations;
        // });

        AlphaPoint.setUserConfig.subscribe(data => {

          if (data.result) {

            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.INFO_ACCEPTED') || 'Your information has been accepted',
              { ...growlerOptions, type: 'success' },
            );
          }
          if (!data.result && data.length > 0) {

            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.INFO_DENIED') || 'Your information has been denied',
              { ...growlerOptions, type: 'danger' },
            );
          }
          if (data.result)

            return true;
        });

        // Setting user config
        AlphaPoint.setUserCon(configs);


        // ==============================================
        // KYC VALIDATOR RESPONSE LOGIC
        // ==============================================
        const clientInfo = {
          alphaPointSessiontoken: AlphaPoint.session.value.SessionToken, // session token of the user to be validated, not used yet
          alphaPointUserID: JSON.stringify(AlphaPoint.userData.value.UserId),
          validationStage: 1, // validation stage from identityMind controlPanel
          validator: AlphaPoint.config.kycType,
        };

        const params = {
          requestIdentifier: AlphaPoint.config.kycClientId,
          clientInfo,
          userInfo,
        };

        this.verifcationLevelUpdate = AlphaPoint.verificationLevelUpdate.subscribe(res => {
          // console.log("level update event");
          if (res.VerificationStatus === 'Approved') {
            this.props.increaseLevel(res.VerificationLevel);
          }
        });

        this.validatorRes = AlphaPoint.validatorResponse.subscribe(res => {
          if (res.result === 'Unknown Validator Request') {
            // this.setState({ processing: false });
            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.UNKNOWN_VALIDATOR_REQUEST') || 'Unknown Validator Request',
              { ...growlerOptions, type: 'danger' },
            );

            if (res.ValidationAnswerData) {
              if (res.ValidationAnswerData.isAccepted) {
                // this.setState({ processing: false });
                $.bootstrapGrowl(
                  AlphaPoint.translation('KYC.INFO_ACCEPTED') || 'Your information has been accepted',
                  { ...growlerOptions, type: 'success' },
                );
              } if ((!res.ValidationAnswerData.isAccepted && res.NeedsManualReview)) { // eslint-disable-line max-len
                // this.setState({ processing: false });
                $.bootstrapGrowl(
                  AlphaPoint.translation('KYC.VERIFICATION_DENIED') || 'Verification Denied: Not Accepted',
                  { ...growlerOptions, type: 'danger' },
                );
              }
            }
            this.setState({ processing: false, confirmClose: true });
          }
        });

        this.verifyLevel = AlphaPoint.verifylevel.subscribe(res => {
          // TODO:::::: Add setState for validatorRespondedMesssage
          // CATCHING VALIDATOR ERRORS
          if (res === "Validator Not Connected") {
            this.setState({ processing: false, confirmClose: true });
            $.bootstrapGrowl(
              res,
              { ...growlerOptionsLongDelay, type: 'danger' },
            );
          } else if (res === "Unable to validate") {
            this.setState({ processing: false, confirmClose: true });
            $.bootstrapGrowl(
              res,
              { ...growlerOptionsLongDelay, type: 'danger' },
            );
          } else if (res === "Validator Call failed: The remote server returned an error: (500) Internal Server Error.") {
            this.setState({ processing: false, confirmClose: true });
            $.bootstrapGrowl(
              res,
              { ...growlerOptionsLongDelay, type: 'danger' },
            );
          } else if (res.ErrorMessage) {
            this.setState({ processing: false, confirmClose: true });
            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.VALIDATION_ERROR') || 'Validator Error',
              { ...growlerOptionsLongDelay, type: 'danger' },
            );
            if (res.ErrorMessage === 'SYSTEM: The remote server returned an error: (400) Bad Request.') {
              $.bootstrapGrowl(
                AlphaPoint.translation('KYC.TRY_AGAIN') || 'Please try again',
                { ...growlerOptions, type: 'info' },
              );
              $.bootstrapGrowl(
                AlphaPoint.translation('KYC.MISSING_BILLING_COUNTRY') || 'Check that you have entered Billing Country',
                { ...growlerOptions, type: 'info' },
              );
              this.setState({ processing: false, confirmClose: true });
            }
          } else if (res === false) {
            this.setState({ processing: false, confirmClose: true });
            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.VALIDATION_ERROR') || 'Validator Error',
              { ...growlerOptionsLongDelay, type: 'danger' },
            );
          }

          // IF VALIDATOR HAS A VALID RESPONSE WITH VALIDATION ANSWER DATA
          if (res.ValidationAnswerData) {
            // TODO:::::: Add setState for validatorRespondedMesssage
            if (res.ValidationAnswerData.isAccepted) {
              this.setState({ processing: false, confirmClose: true });
              $.bootstrapGrowl(
                AlphaPoint.translation('KYC.INFO_ACCEPTED') || 'Your information has been accepted',
                { ...growlerOptions, type: 'success' },
              );
            } else if ((!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.NeedsManualReview)) { // eslint-disable-line max-len
              this.setState({ processing: false, confirmClose: true });
              $.bootstrapGrowl(
                AlphaPoint.translation('KYC.INFO_MANUAL_REVIEW') || 'Your information requires manual review',
                { ...growlerOptions, type: 'info' },
              );
            } else if (!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.ApiErrorDescription) {
              this.setState({ processing: false, confirmClose: true });
              $.bootstrapGrowl(
                res.ValidationAnswerData.ApiErrorDescription,
                { ...growlerOptionsLongDelay, type: 'danger' },
              );
            } else if (!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.ApiError) {
              this.setState({ processing: false, confirmClose: true });
              $.bootstrapGrowl(
                res.ValidationAnswerData.ApiErrorDescription,
                { ...growlerOptionsLongDelay, type: 'danger' },
              );
            } else {
              this.setState({ processing: false, confirmClose: true });
              $.bootstrapGrowl(
                AlphaPoint.translation('KYC.RESPONSE', {answerData: res.ValidationAnswerData}) || `The response was ${res.ValidationAnswerData}`,
                { ...growlerOptionsLongDelay, type: 'info' },
              );
            }
          }
        });

        AlphaPoint.validateUserRegistration(params);

      } else { // If fields specified in isRequired() function are empty,
        e.preventDefault();
        return false;
      }
    }

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
            this.setState({ formIsValid, [key]: true });
          }
        }
      }
      return formIsValid;
    }

    render() {
      const countries = countriesCodes.map(country => (
        <option value={country.code} key={country.code} >{country.name}</option>
      ));

      if (AlphaPoint.config.onlyShowOneCountryKYC) {
        if (AlphaPoint.config.kycCountriesList.length > 1) {
          var listSpecificCountries = countriesCodes.filter(function (country) {
            return AlphaPoint.config.kycCountriesList.indexOf(country.name) > -1;
          }).map(theCountry => (
            <option value={theCountry.code} key={theCountry.code} >{theCountry.name}</option>
          ));
        } else {
          var listSpecificCountries = countriesCodes.filter(country => { return country.name === AlphaPoint.config.kycCountriesList }).map(theCountry => (
            <option value={theCountry.code} key={theCountry.code} >{theCountry.name}</option>
          ));
        }
      }

      const countryNow = countriesCodes.find(country => country.code === this.state.userConfig.billingCountry) || '';
      const statesOptions = states.map(state => <option value={state.code} key={state.code} >{state.name}</option>);

      return (
        <div>
          {this.state.processing && <div className="loader-container">
            <div className="loader">{AlphaPoint.translation('COMMON.LOADING') || 'Loading...'}</div>
          </div>}

          {this.state.confirmClose && <div className="loader-container-confirm">
            <span>{this.state.validatorRespondedMesssage}</span>
            <button className="confirm-close-btn blue-btn" onClick={() => window.location.reload()}>{AlphaPoint.translation('COMMON.OKAY') || 'Okay'}</button>
          </div>}

          <form onSubmit={this.submit} style={{ overflow: 'hidden' }}>
            <div className="pad-y" style={{ marginTop: '15px' }}>

              <ApInput
                name="firstName"
                value={this.state.userConfig.firstName}
                validations={AlphaPoint.config.kycFields.firstName && AlphaPoint.config.kycFields.firstName}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.FIRST_NAME') || 'First Name'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-6 col-sm-4 input-firstName"}
              />

              <ApInput
                name="middleName"
                value={this.state.userConfig.middleName}
                validations={AlphaPoint.config.kycFields.middleName && AlphaPoint.config.kycFields.middleName}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.MIDDLE_NAME') || 'Middle Name'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-6 col-sm-4 input-middleName"}
              />

              <ApInput
                name="lastName"
                value={this.state.userConfig.lastName}
                validations={AlphaPoint.config.kycFields.lastName && AlphaPoint.config.kycFields.lastName}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.LAST_NAME') || 'Last Name'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-6 col-sm-4 input-lastName"}
              />
              <ApDatepicker
                name="dob"
                dob
                onChange={this.dateChanged('dob')}
                value={this.state.userConfig.dob}
                throwError={this.state.requiredFields.dob}
                errorDescription={AlphaPoint.translation('VERIFY.REQUIRED_TEXT') || 'This field is required'}
                label={AlphaPoint.translation('VERIFY.DATE') || 'DOB'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-dob"}
              />

              <ApInput
                name="telephone"
                value={this.state.userConfig.telephone}
                validations={AlphaPoint.config.kycFields.telephone && AlphaPoint.config.kycFields.telephone}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.TELEPHONE') || 'Telephone'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-telephone"}
              />

              <ApSelect
                name="billingCountry"
                onChange={this.changed}
                className={this.state.requiredFields.billingCountry && "input-error"}
                throwError={this.state.requiredFields.billingCountry}
                value={this.state.userConfig.billingCountry}
                errorDescription={AlphaPoint.translation('VERIFY.REQUIRED_TEXT') || 'This field is required'}
                label={AlphaPoint.translation('VERIFY.COUNTRY') || 'Select Country'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-billingCountry"}
              >
                <option value={this.state.userConfig.billingCountry}>
                  {countryNow.name || AlphaPoint.translation('VERIFY.COUNTRY') || 'Select Country'}
                </option>
                {AlphaPoint.config.onlyShowOneCountryKYC ? listSpecificCountries : countries}
              </ApSelect>

              <ApInput
                name="billingFlatNumber"
                validations={AlphaPoint.config.kycFields.billingFlatNumber && AlphaPoint.config.kycFields.billingFlatNumber}
                value={this.state.userConfig.billingFlatNumber}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.FLAT_NUMBER') || 'Flat Number'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-2 kyc-input-inline" : "col-xs-6 col-sm-2 input-billingFlatNumber"}
              />

              <ApInput
                name="billingStreetNumber"
                validations={AlphaPoint.config.kycFields.billingStreetNumber && AlphaPoint.config.kycFields.billingStreetNumber}
                value={this.state.userConfig.billingStreetNumber}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.STREET_NUMBER') || 'Street Number'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-2 col-sm-2 kyc-input-inline" : "col-xs-6 col-sm-2 input-billingStreetNumber"}
              />

              <ApInput
                name="billingStreetAddress"
                validations={AlphaPoint.config.kycFields.billingStreetAddress && AlphaPoint.config.kycFields.billingStreetAddress}
                value={this.state.userConfig.billingStreetAddress}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.ADDRESS') || 'Street Name'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-2 kyc-input-inline" : "col-xs-6 col-sm-4 input-billingStreetAddress"}
              />

              <ApInput
                name="billingStreetType"
                validations={AlphaPoint.config.kycFields.billingStreetType && AlphaPoint.config.kycFields.billingStreetType}
                value={this.state.userConfig.billingStreetType}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.STREET_TYPE') || 'Street Type (Ave., St.)'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-2 kyc-input-inline" : "col-xs-6 col-sm-4 input-billingStreetType"}
              />

              {AlphaPoint.config.siteName === 'lexexchange' ? null :
              <ApInput
                  name="billingCity"
                  validations={AlphaPoint.config.kycFields.billingCity && AlphaPoint.config.kycFields.billingCity}
                  value={this.state.userConfig.billingCity}
                  onChange={this.changed}
                  label={AlphaPoint.translation('VERIFY.CITY') || 'City'}
                  wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-billingCity"}
              />}

              <ApInput
              name="billingSuburb"
              validations={AlphaPoint.config.kycFields.billingSuburb && AlphaPoint.config.kycFields.billingSuburb}
              value={this.state.userConfig.billingSuburb}
              onChange={this.changed}
              label={AlphaPoint.translation('VERIFY.SUBURB') || 'Suburb'}
              wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-3 kyc-input-inline" : "col-xs-4 input-billingSuburb"}
              />

              <ApInput
              name="billingZip"
              validations={AlphaPoint.config.kycFields.billingZip && AlphaPoint.config.kycFields.billingZip}
              value={this.state.userConfig.billingZip}
              onChange={this.changed}
              label={AlphaPoint.translation('VERIFY.ZIP') || 'Zipcode/Postcode'}
              wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-billingZip"}
              />

              <ApInput
              name="driverLicenseNumber"
              validations={AlphaPoint.config.kycFields.driverLicenseNumber && AlphaPoint.config.kycFields.driverLicenseNumber}
              value={this.state.userConfig.driverLicenseNumber}
              onChange={this.changed}
              label={AlphaPoint.translation('VERIFY.DRIVER_LICENSE_NUMBER') || 'DL Number'}
              wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-3 kyc-input-inline" : (AlphaPoint.config.siteName === "lexexchange" ? "col-xs-4" : "col-xs-3")}
              />

              {AlphaPoint.config.siteName === 'lexexchange' ? null :
              <ApInput
                  name="driverLicenseVersion"
                  validations={AlphaPoint.config.kycFields.driverLicenseVersion && AlphaPoint.config.kycFields.driverLicenseVersion}
                  value={this.state.userConfig.driverLicenseVersion}
                  onChange={this.changed}
                  label={AlphaPoint.translation('VERIFY.DRIVER_LICENSE_VERSION') || 'DL Version'}
                  wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-3"}
              />}

              <ApInput
              name="passportNumber"
              validations={AlphaPoint.config.kycFields.passportNumber && AlphaPoint.config.kycFields.passportNumber}
              value={this.state.userConfig.passportNumber}
              onChange={this.changed}
              label={AlphaPoint.translation('VERIFY.PASSPORT_NUMBER') || 'Passport Number'}
              wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-3"}
              />

              <ApDatepicker
                name="passportExpiration"
                value={this.state.userConfig.passportExpiration}
                onChange={this.dateChanged('passportExpiration')}
                throwError={this.state.requiredFields.passportExpiration}
                errorDescription={AlphaPoint.translation('VERIFY.REQUIRED_TEXT') || 'This field is required'}
                label={AlphaPoint.translation('VERIFY.PASSPORT_EXPIRATION') || 'Pspt Exp'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-3"}
              />
              {AlphaPoint.config.advancedUIKYC && <div style={{height:"50px"}} className="form-group col-xs-4 kyc-input-inline space-filler"></div>}

            </div>

            <div className="pad" style={{ paddingBottom: '10px' }}>
            <div className="col-xs-12 container-kyc-submit" style={{ margin: "10px 0 5px 0" }}>
                {false &&
                  <ProcessingButton
                    type="submit"
                    onClick={this.submit}
                    processing={this.state.processing}
                    className="btn btn-action input-verify"
                  >{AlphaPoint.translation('BUTTONS.TEXT_SUBMIT') || 'Verify'}</ProcessingButton>}

                <ProcessingButton
                  type="submit"
                  onClick={this.submit}
                  processing={this.state.processing}
                  disabled={!this.state.formIsValid}
                  className="btn btn-action input-verify"
                >{AlphaPoint.translation('BUTTONS.TEXT_SUBMIT') || 'Verify'}</ProcessingButton>

                {!this.state.formIsValid &&
                <span style={{ color: 'lightcoral', fontWeight: '600', fontSize: '13px', display: 'inline-block', marginLeft: '12px'}}>
                  {AlphaPoint.translation('VERIFY.FORM_INVALID_MESSAGE') ||
                  'Please check that each field is filled in correctly.'}
                </span>}
              </div>
            </div>
          </form>
        </div>
      );
    }
  }

  GreenId.defaultProps = {
    increaseLevel: () => { },
    setError: () => { },
    hideHeader: true,
  };

  GreenId.propTypes = {
    increaseLevel: React.PropTypes.func,
    setError: React.PropTypes.func,
  };
