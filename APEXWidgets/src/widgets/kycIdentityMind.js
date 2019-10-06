/* global AlphaPoint, $, window */
/* eslint-disable react/no-multi-comp */
import React from 'react';

import ProcessingButton from '../misc/processingButton';
import ApDatepicker from '../misc/form/apDatepicker';
import ApSelect from '../misc/form/apSelect';
import ApInput from '../misc/form/apInput';
import {states, countriesCodes} from '../common';

export default class IdentityMind extends React.Component {
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
        // billingStreetNumber: '',
        billingStreetAddress: '',
        // billingStreetType: '',
        billingCountry: '',
        billingState: '',
        billingCity: '',
        billingZip: '',
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
      let configs = this.state.userConfig;

      if (data.length > 0) {

        data.reduce((item, i) => {

          return configs[i.Key] = i.Value; // eslint-disable-line no-param-reassign

        }, {});

        configs.UseNoAuth = configs.UseNoAuth && (configs.UseNoAuth.toString() || "true");
        configs.UseGoogle2FA = configs.UseGoogle2FA && (configs.UseGoogle2FA.toString() || "false");

        this.setState({userConfig: configs});
      }

    });

    this.accountInfo = AlphaPoint.accountInfo.subscribe(data => {
      this.setState({verificationLevel: data.VerificationLevel})
    })

    AlphaPoint.getUserCon({UserId: AlphaPoint.userData.value.UserId});
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
    const {userConfig} = this.state;
    userConfig[field] = date;
    this.setState({userConfig});
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
    this.setState({userConfig, formIsValid});
  }

  submit = (e) => {
    if (this.isRequired()) { // Checking for required fields; returns submit as false if any kycRequiredFields are empty
      e.preventDefault();
      const configIn = [];
      let configs = {};
      let userInfo = {};

      this.props.setError('');
      this.setState({processing: true});

      const growlerOptions = {
        allow_dismiss: AlphaPoint.config.growlerDismiss || true,
        align: "center",
        delay: AlphaPoint.config.growlerDelay,
        offset: {from: 'top', amount: 30},
        left: '60%',
      };
      const growlerOptionsLongDelay = {
        allow_dismiss: AlphaPoint.config.growlerDismiss || true,
        align: "center",
        delay: 20000,
        offset: {from: 'top', amount: 30},
        left: '60%',
      };

      Object.keys(this.state.userConfig).forEach(key => {
        let entry,
          value = this.state.userConfig[key];

        entry = {
          Key: key,
          Value: value,
        };

        configIn.push(entry);
      });

      configs = {
        UserId: AlphaPoint.userData.value.UserId,
        Config: configIn,
      };

      let email;
      this.getUser = AlphaPoint.getUser.subscribe(user => {
        email = user.Email
      });

      // Declaring userInfo object for ValidateUserRegistration payload
      userInfo = {
        firstName: this.state.userConfig.firstName,
        middleName: this.state.userConfig.middleName,
        lastName: this.state.userConfig.lastName,
        dob: this.state.userConfig.dob,
        accountName: JSON.stringify(AlphaPoint.userData.value.UserId),
        email,
        billingStreetAddress: this.state.userConfig.billingStreetAddress,
        billingCountry: this.state.userConfig.billingCountry,
        billingCity: this.state.userConfig.billingCity,
        billingState: this.state.userConfig.billingState,
        billingZip: this.state.userConfig.billingZip,
        phone: this.state.userConfig.telephone,
        state: this.state.userConfig.billingState,
        billingFlatNumber: '',
        // billingStreetNumber: this.state.userConfig.billingStreetNumber,
        // billingStreetType: this.state.userConfig.billingStreetType,
        salutation: '',
      };

      AlphaPoint.setUserConfig.subscribe(data => {

        if (data.result) {

          $.bootstrapGrowl(
            AlphaPoint.translation('KYC.INFO_ACCEPTED') || 'Your information has been accepted',
            {...growlerOptions, type: 'success'},
          );
        }
        if (!data.result && data.length > 0) {

          $.bootstrapGrowl(
            AlphaPoint.translation('KYC.INFO_DENIED') || 'Your information has been denied',
            {...growlerOptions, type: 'danger'},
          );
        }
        if (data.result)

          return true;
      });

      // Setting user config
      AlphaPoint.setUserCon(configs);

      const clientInfo = {
        alphaPointSessiontoken: AlphaPoint.session.value.SessionToken, // session token of the user to be validated, not used yet
        alphaPointUserID: JSON.stringify(AlphaPoint.userData.value.UserId),
        validationStage: 1, // validation stage from identityMind controlPanel
        validator: AlphaPoint.config.kycType,
      };

      const params = {
        requestIdentifier: AlphaPoint.config.kycClientId, // TODO: Do we need this in the params anymore with new backend IDM flow update update?
        clientInfo,
        userInfo,
      };

      this.verifcationLevelUpdate = AlphaPoint.verificationLevelUpdate.subscribe(res => {
        // console.log("level update event");
        if (res.VerificationStatus === 'Approved') {
          this.props.increaseLevel(res.VerificationLevel);
        }
      });

      // ==============================================
      // KYC VALIDATOR RESPONSE LOGIC
      // ==============================================
      this.validatorRes = AlphaPoint.validatorResponse.subscribe(res => {
        if (res.result === 'Unknown Validator Request') {
          // this.setState({ processing: false });
          $.bootstrapGrowl(
            AlphaPoint.translation('KYC.UNKNOWN_VALIDATOR_REQUEST') || 'Unknown Validator Request',
            {...growlerOptions, type: 'danger'},
          );

          if (res.ValidationAnswerData) {
            if (res.ValidationAnswerData.isAccepted) {
              // this.setState({ processing: false });
              $.bootstrapGrowl(
                AlphaPoint.translation('KYC.INFO_ACCEPTED') || 'Your information has been accepted',
                {...growlerOptions, type: 'success'},
              );
            }
            if ((!res.ValidationAnswerData.isAccepted && res.NeedsManualReview)) { // eslint-disable-line max-len
              // this.setState({ processing: false });
              $.bootstrapGrowl(
                AlphaPoint.translation('KYC.VERIFICATION_DENIED') || 'Verification Denied: Not Accepted',
                {...growlerOptions, type: 'danger'},
              );
            }
          }
          this.setState({processing: false, confirmClose: true});
        }
      });

      this.verifyLevel = AlphaPoint.verifylevel.subscribe(res => {
        // TODO 2/16/2018: Add setState for validatorRespondedMesssage/setMsgWhenValidatorResponds
        // CATCHING VALIDATOR ERRORS
        if (res === "Validator Not Connected") {
          this.setState({processing: false, confirmClose: true});
          $.bootstrapGrowl(
            res,
            {...growlerOptionsLongDelay, type: 'danger'},
          );
        } else if (res === null) {
          this.setState({processing: false, confirmClose: true});
          $.bootstrapGrowl(
            AlphaPoint.translation('KYC.VALIDATOR_NO_SETUP') || "Validator may not be setup yet. Please contact the site administrator.",
            {...growlerOptionsLongDelay, type: 'danger'},
          );
        } else if (res === "Unable to validate") {
          this.setState({processing: false, confirmClose: true});
          $.bootstrapGrowl(
            res,
            {...growlerOptionsLongDelay, type: 'danger'},
          );
        } else if (res === "Validator Call failed: The remote server returned an error: (500) Internal Server Error.") {
          this.setState({processing: false, confirmClose: true});
          $.bootstrapGrowl(
            res,
            {...growlerOptionsLongDelay, type: 'danger'},
          );
        } else if (res === "Validator Call failed: Unable to connect to the remote server") {
          this.setState({processing: false, confirmClose: true});
          $.bootstrapGrowl(
            res,
            {...growlerOptionsLongDelay, type: 'danger'},
          );
        } else if (res.ErrorMessage) {
          this.setState({processing: false, confirmClose: true});
          $.bootstrapGrowl(
            AlphaPoint.translation('KYC.VALIDATION_ERROR') || 'Validator Error',
            {...growlerOptionsLongDelay, type: 'danger'},
          );
          if (res.ErrorMessage === 'SYSTEM: The remote server returned an error: (400) Bad Request.') {
            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.TRY_AGAIN') || 'Please try again',
              {...growlerOptions, type: 'info'},
            );
            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.MISSING_BILLING_COUNTRY') || 'Check that you have entered Billing Country',
              {...growlerOptions, type: 'info'},
            );
            this.setState({processing: false, confirmClose: true});
          }
        } else if (res === false) {
          this.setState({processing: false, confirmClose: true});
          $.bootstrapGrowl(
            AlphaPoint.translation('KYC.VALIDATION_ERROR') || 'Validator Error',
            {...growlerOptionsLongDelay, type: 'danger'},
          );
        }

        // IF VALIDATOR HAS A VALID RESPONSE WITH VALIDATION ANSWER DATA
        if (res.ValidationAnswerData) {
          // TODO:::::: Add setState for validatorRespondedMesssage
          if (res.ValidationAnswerData.isAccepted) {
            this.setState({ processing: false, confirmClose: true });
            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.INFO_ACCEPTED') || 'Your information has been accepted',
              {...growlerOptions, type: 'success'},
            );
          } else if ((!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.NeedsManualReview)) { // eslint-disable-line max-len
            this.setState({ processing: false, confirmClose: true });
            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.INFO_MANUAL_REVIEW') || 'Your information requires manual review',
              {...growlerOptions, type: 'info'},
            );
          } else if (!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.ApiErrorDescription) {
            this.setState({processing: false, confirmClose: true});
            $.bootstrapGrowl(
              res.ValidationAnswerData.ApiErrorDescription,
              {...growlerOptionsLongDelay, type: 'danger'},
            );
          } else if (!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.ApiError) {
            this.setState({processing: false, confirmClose: true});
            $.bootstrapGrowl(
              res.ValidationAnswerData.ApiErrorDescription,
              {...growlerOptionsLongDelay, type: 'danger'},
            );
          } else {
            this.setState({processing: false, confirmClose: true});
            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.RESPONSE', {answerData: res.ValidationAnswerData}) || `The response was ${res.ValidationAnswerData}`,
              {...growlerOptionsLongDelay, type: 'info'},
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
          this.setState({formIsValid: false, [key]: true});
        }
      } else {
        this.setState({[key]: false});
      }
    }
    return formIsValid;
  }

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

    if (AlphaPoint.config.filterKycCountriesList) {
      var listSpecificCountries = countriesCodes.filter(function (country) {
         return !(AlphaPoint.config.kycCountriesList.includes(country.name));
      }).map(theCountry => (
        <option value={theCountry.code} key={theCountry.code}>{theCountry.name}</option>
      ));
    }

    const countryNow = countriesCodes.find(country => country.code === this.state.userConfig.billingCountry) || '';
    const statesOptions = states.map(state => <option value={state.code} key={state.code}>{state.name}</option>);

    return (
      <div>
        {this.state.processing &&
        <div className="loader-container">
          <div className="loader">{AlphaPoint.translation('COMMON.LOADING') || 'Loading...'}</div>
        </div>
        }

        {this.state.confirmClose && <div className="loader-container-confirm">
          <span>{this.state.validatorRespondedMesssage}</span>
          <button className="confirm-close-btn blue-btn"
                  onClick={() => window.location.reload()}>{AlphaPoint.translation('COMMON.CONTINUE') || 'Continue'}</button>
        </div>}

        <form onSubmit={this.submit} style={{overflow: 'hidden'}}>
          <div className="pad-y" style={{marginTop: '15px'}}>
            <ApInput
              name="firstName"
              value={this.state.userConfig.firstName}
              validations={AlphaPoint.config.kycFields.firstName && AlphaPoint.config.kycFields.firstName}
              onChange={this.changed}
              label={AlphaPoint.translation('VERIFY.FIRSTNAME') || 'First Name'}
              wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-6 col-sm-4 input-fname"}
            />

            <ApInput
              name="middleName"
              value={this.state.userConfig.middleName}
              validations={AlphaPoint.config.kycFields.middleName && AlphaPoint.config.kycFields.middleName}
              onChange={this.changed}
              label={AlphaPoint.translation('VERIFY.MIDDLENAME') || 'Middle Name'}
              wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-6 col-sm-4 input-middleName"}
            />

            <ApInput
              name="lastName"
              value={this.state.userConfig.lastName}
              validations={AlphaPoint.config.kycFields.lastName && AlphaPoint.config.kycFields.lastName}
              onChange={this.changed}
              label={AlphaPoint.translation('VERIFY.LASTNAME') || 'Last Name'}
              wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-6 col-sm-4 input-lname"}
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
              name="billingStreetAddress"
              value={this.state.userConfig.billingStreetAddress}
              validations={AlphaPoint.config.kycFields.billingStreetAddress && AlphaPoint.config.kycFields.billingStreetAddress}
              onChange={this.changed}
              label={AlphaPoint.translation('VERIFY.ADDRESS') || 'Street Name'}
              wrapperClass={AlphaPoint.config.advancedUIKYC ? "col-xs-4 kyc-input-inline" : "col-xs-6 col-sm-4 input-billingStreetAddress"}
            />

            <ApInput
              name="billingState"
              value={this.state.userConfig.billingState}
              validations={AlphaPoint.config.kycFields.billingState && AlphaPoint.config.kycFields.billingState}
              onChange={this.changed}
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


          <div className="pad row" style={{paddingBottom: '10px'}}>
            <div className="col-xs-12 pull-left container-kyc-submit" style={{paddingTop: '5px'}}>
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

IdentityMind.defaultProps = {
  increaseLevel: () => {
  },
  setError: () => {
  },
  hideHeader: true,
};

IdentityMind.propTypes = {
  increaseLevel: React.PropTypes.func,
  setError: React.PropTypes.func,
};
