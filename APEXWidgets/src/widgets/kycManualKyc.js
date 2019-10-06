/* global AlphaPoint, $, window, alert, document */
/* eslint-disable react/no-multi-comp, no-alert */
import React from 'react';

import ProcessingButton from '../misc/processingButton';
import ApInput from '../misc/form/apInput';
import ApSelect from '../misc/form/apSelect';
import ApDatepicker from '../misc/form/apDatepicker';
import { states, countriesCodes } from '../common';

export default class ManualKyc extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        // throwError booleans
        requiredFields: {
          dob: false,
          billingCountry: false,
        },

        userConfig: {
          firstName: '',
          middleName: '',
          lastName: '',
          dob: '',
          telephone: '',
          email: '',
          billingStreetNumber: '',
          billingStreetAddress: '',
          billingStreetType: '',
          billingCountry: '',
          billingState: '',
          billingCity: '',
          billingZip: '',
        },
        processing: false,
        confirmClose: false,
        verificationLevel: 0,
        formIsValid: true,
      };
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

      this.getUser = AlphaPoint.getUser.subscribe(user => {
        let configs = this.state.userConfig;
        configs.email = user.Email

        this.setState({ userConfig: configs });
      });

      AlphaPoint.getUserCon({ UserId: AlphaPoint.userData.value.UserId });
    }

    componentWillUnmount() {
      /* eslint-disable no-unused-expressions */
      this.userConfiguration && this.userConfiguration.dispose();
      this.verifyLevel && this.verifyLevel.dispose();
      this.verifcationLevelUpdate && this.verifcationLevelUpdate.dispose();
      this.validatorRes && this.validatorRes.dispose();
      this.getUser && this.getUser.dispose();
      /* eslint-enable no-unused-expressions */
    }

    dateChanged = field => date => {
      const { userConfig } = this.state;
      userConfig[field] = date;
      this.setState({ userConfig });
    }

    // changed = (e) => {
    //   e.preventDefault();
    //   const userConfig = this.state.userConfig,
    //   value = e.target.value;

    //   userConfig[e.target.name] = value;

    //   this.setState({ userConfig });
    // }

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
          allow_dismiss: AlphaPoint.config.growlerDismiss || true,
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
            };

            configIn.push(entry);
        });

        let manualKYCFormSubmitted = {
        Key: "levelIncreaseStatus",
        value: "underReview"
        }

        configIn.push(manualKYCFormSubmitted);

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
          email: this.state.userConfig.email,
          billingStreetAddress: this.state.userConfig.billingStreetAddress,
          billingCountry: this.state.userConfig.billingCountry,
          billingCity: this.state.userConfig.billingCity,
          billingState: this.state.userConfig.billingState,
          billingZip: this.state.userConfig.billingZip,
          phone: this.state.userConfig.telephone,
          state: this.state.userConfig.billingState,
          billingFlatNumber: '',
          billingStreetNumber: this.state.userConfig.billingStreetNumber, // greenId has it separated from streetName
          billingStreetType: this.state.userConfig.billingStreetType, // greenId specific, shall not be included in streetName
          salutation: '',
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

        //     configurations.UseNoAuth = JSON.parse(configurations.UseNoAuth || 'true');
        //     configurations.UseGoogle2FA = JSON.parse(configurations.UseGoogle2FA || 'false');
        //   }
        //   server = configurations;
        // });

        AlphaPoint.setUserConfig.subscribe(data => {

          if (data.result) {

            $.bootstrapGrowl(
            AlphaPoint.translation('KYC.INFO_ACCEPTED') || 'Your information has been accepted',
              { ...growlerOptions, type: 'success' },
            );
            if (AlphaPoint.config.kycType === "ManualKYC") {
              this.setState({ processing: false, confirmClose: true });
            }
          }
          if (!data.result && data.length > 0) {

            $.bootstrapGrowl(
            AlphaPoint.translation('KYC.INFO_DENIED') || 'Your information has been denied',
              { ...growlerOptions, type: 'danger' },
            );

            if (AlphaPoint.config.kycType === "ManualKYC") {
              this.setState({ processing: false, confirmClose: true });
            }
          }
          if (data.result)

            return true;
        });

        // Setting user config
        AlphaPoint.setUserCon(configs);

      } else { // If fields specified in isRequired() function are empty,
        e.preventDefault();
        return false;
      }
    }

    // Required Fields validation
    // isRequired() {
    //   const kycRequiredFields = AlphaPoint.config.kycRequiredFields || [];
    //   const userConfig = this.state.userConfig;
    //   let formIsValid = true;

    //   for (const key in userConfig) {
    //     if (!userConfig[key]) {
    //       if (kycRequiredFields.indexOf(key) > -1) {
    //         formIsValid = false;
    //         this.setState({ [key]: false });
    //       }
    //     } else {
    //       this.setState({ [key]: true });
    //     }
    //   }
    //   return formIsValid;
    // }

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
            this.setState({ formIsValid: false, [key]: true });
          }
        } else {
          this.setState({ [key]: false });
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
          {this.state.processing && <div className="loader-container"><div className="loader">Loading...</div></div>}

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
                label={AlphaPoint.translation('VERIFY.FIRSTNAME') || 'First Name'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-12 col-sm-4 input-fname"}
              />

              <ApInput
                name="middleName"
                value={this.state.userConfig.middleName}
                validations={AlphaPoint.config.kycFields.middleName && AlphaPoint.config.kycFields.middleName}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.MIDDLENAME') || 'Middle Name'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-12 col-sm-4 input-middleName"}
              />

              <ApInput
                name="lastName"
                value={this.state.userConfig.lastName}
                validations={AlphaPoint.config.kycFields.lastName && AlphaPoint.config.kycFields.lastName}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.LASTNAME') || 'Last Name'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-12 col-sm-4 input-lname"}
              />
              <ApDatepicker
                name="dob"
                dob
                value={this.state.userConfig.dob}
                onChange={this.dateChanged('dob')}
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
                label={AlphaPoint.translation('VERIFY.PHONE') || 'Phone Number'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-telephone"}
              />

              <ApSelect
                name="billingCountry"
                onChange={this.changed}
                value={this.state.userConfig.billingCountry}
                throwError={this.state.requiredFields.billingCountry}
                errorDescription={AlphaPoint.translation('VERIFY.REQUIRED_TEXT') || 'This field is required'}
                label={AlphaPoint.translation('VERIFY.COUNTRY') || 'Country'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-billingCountry"}
              >
                <option value={this.state.userConfig.billingCountry}>
                  {countryNow.name || AlphaPoint.translation('VERIFY.COUNTRY') || 'Select Country'}
                </option>
                {AlphaPoint.config.onlyShowOneCountryKYC ? listSpecificCountries : countries}
              </ApSelect>

              <ApInput
                name="billingStreetNumber"
                value={this.state.userConfig.billingStreetNumber}
                validations={AlphaPoint.config.kycFields.billingStreetNumber && AlphaPoint.config.kycFields.billingStreetNumber}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.STREET_NUMBER') || 'Street Number'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-billingStreetNumber"}
              />

              <ApInput
                name="billingStreetAddress"
                value={this.state.userConfig.billingStreetAddress}
                validations={AlphaPoint.config.kycFields.billingStreetAddress && AlphaPoint.config.kycFields.billingStreetAddress}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.ADDRESS') || 'Street Name'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-billingStreetAddress"}
              />

              <ApInput
                name="billingStreetType"
                onChange={this.changed}value={this.state.userConfig.billingStreetType}
                validations={AlphaPoint.config.kycFields.billingStreetType && AlphaPoint.config.kycFields.billingStreetType}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.STREET_TYPE') || 'Street Type (Ave., St.)'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-billingStreetType"}
              />

              <ApInput
                name="billingState"
                value={this.state.userConfig.billingState}
                validations={AlphaPoint.config.kycFields.billingState && AlphaPoint.config.kycFields.billingState}
                onChange={this.changed}
                length="2"
                label={AlphaPoint.translation('VERIFY.STATE') || 'State'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-billingState"}
              />
                <ApInput
                name="billingCity"
                value={this.state.userConfig.billingCity}
                validations={AlphaPoint.config.kycFields.billingCity && AlphaPoint.config.kycFields.billingCity}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.CITY') || 'City'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-billingCity"}
                />
                <ApInput
                name="billingZip"
                value={this.state.userConfig.billingZip}
                validations={AlphaPoint.config.kycFields.billingZip && AlphaPoint.config.kycFields.billingZip}
                onChange={this.changed}
                label={AlphaPoint.translation('VERIFY.ZIP') || 'Zip/Post Code'}
                wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-4 input-billingZip"}
                />
            </div>

            <div className="pad row" style={{ paddingBottom: '10px' }}>
              <div className="col-xs-12 pull-left container-kyc-submit" style={{ paddingTop: '5px' }}>
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
                >{AlphaPoint.translation('BUTTONS.TEXT_SUBMIT') || 'Send Verification Form'}</ProcessingButton>

                {!this.state.formIsValid && <span style={{ color: 'lightcoral', fontWeight: '600', fontSize: '13px', display: 'inline-block', marginLeft: '12px'}}>{AlphaPoint.translation('VERIFY.FORM_INVALID_MESSAGE') || 'Please check that each field is filled in correctly.'}</span>}
              </div>
            </div>
          </form>
        </div>
      );
    }
  }

  ManualKyc.defaultProps = {
    increaseLevel: () => { },
    setError: () => { },
    hideHeader: true,
  };

  ManualKyc.propTypes = {
    increaseLevel: React.PropTypes.func,
    setError: React.PropTypes.func,
  };
