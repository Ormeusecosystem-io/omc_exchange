/* global AlphaPoint, $, window */
/* eslint-disable react/no-multi-comp */
import React from 'react';

import ProcessingButton from '../misc/processingButton';

export default class Mitek extends React.Component {
    constructor() {
      super();

      this.state = {
        processing: false,
        configMitek: {},
        countryName: '',
      };
    }

    componentDidMount() {
      this.userConfiguration = AlphaPoint.getUserConfig.subscribe(data => {
        let configs = [];

        if (data.length > 0) {
          configs = data.reduce((item, i) => {
            item[i.Key] = i.Value; // eslint-disable-line no-param-reassign
            return item;
          }, {});

          configs.UseNoAuth = JSON.parse(configs.UseNoAuth || 'true');
          configs.UseGoogle2FA = JSON.parse(configs.UseGoogle2FA || 'false');
        }

        this.setState({ configMitek: configs });
      });

      AlphaPoint.getUserCon({ UserId: AlphaPoint.userData.value.UserId });
    }

    componentWillUnmount() {
      this.userConfiguration.dispose();
    }

    submit = (e) => {
      e.preventDefault();
      this.setState({ processing: true });
      this.props.setError('');

      const configIn = [];
      const growlerOptions = {
        allow_dismiss: true,
        align: 'center',
        delay: AlphaPoint.config.growlerDelay,
        offset: { from: 'top', amount: 60 }
      };
      
      const userInfo = {
        firstName: this.state.configMitek.fname,
        middleName: this.state.configMitek.middleName,
        lastName: this.state.configMitek.lname,
        dob: this.state.configMitek.dob,
        accountName: JSON.stringify(AlphaPoint.userData.value.UserId),
        email: this.state.configMitek.email,
        billingStreetAddress: this.state.configMitek.billingStreetAddress,
        billingCountry: this.state.configMitek.billingCountry,
        billingCity: this.state.configMitek.billingCity,
        billingState: this.state.configMitek.billingState,
        billingZip: this.state.configMitek.billingZip,
        phone: this.state.configMitek.telephone,
        state: this.state.configMitek.billingState,
        billingFlatNumber: '',
        billingStreetNumber: this.state.configMitek.billingStreetNumber, // greenId has it separated from streetName
        billingStreetType: this.state.configMitek.billingStreetType, // greenId specific, shall not be included in streetName
        billingSuburb: this.state.configMitek.billingCity, // Australia specific
        salutation: '',
      };

      const clientInfo = {
        alphaPointSessiontoken: AlphaPoint.session.value.sessionToken, // session token of the user to be validated, not used yet
        alphaPointUserID: AlphaPoint.session.value.userId,
        validationStage: 2, // validation stage from identityMind controlPanel
        validator: AlphaPoint.config.kycType,
      };

      const params = {
        requestIdentifier: AlphaPoint.config.kycClientId,
        clientInfo,
        userInfo,
      };

      this.verifcationLevelUpdate = AlphaPoint.verificationLevelUpdate.subscribe(res => {
        if (res.VerificationStatus === 'Approved') {
          this.props.increaseLevel(res.VerificationLevel);
        }
      });

      this.verifyLevel = AlphaPoint.verifylevel.subscribe(res => {
        let link;

        if (res.result === 'Unknown Validator Request') {
          this.setState({ processing: false });
          $.bootstrapGrowl(
            AlphaPoint.translation('KYC.UNKNOWN_VALIDATOR_REQUEST') || 'Unknown Validator Request',
            { ...growlerOptions, type: 'danger' },
          );
        }

        if (res.ValidationAnswerData) {
          link = res.ValidationAnswerData.RedirectUrl;
          if (res.ErrorMessage === 'SYSTEM: The remote server returned an error: (400) Bad Request.') {
            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.TRY_AGAIN') || 'Please try again',
              growlerOptions,
            );
            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.MISSING_BILLING_COUNTRY') || 'Check that you have entered Billing Country',
              growlerOptions,
            );
          }
          if (res.ValidationAnswerData.RedirectUrl) {
            window.location.href = `mitek.html${link}`;
          }
          if (!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.NeedsManualReview) { // eslint-disable-line max-len
            this.setState({ processing: false });
            $.bootstrapGrowl(
              AlphaPoint.translation('KYC.REVIEWING_VERIFICATION_DOCS') || 'We are currently reviewing your verification document(s).',
              { ...growlerOptions, type: 'danger' },
            );
            // close modal after growler notification
            this.props.close();

          }
          if (!res.ValidationAnswerData.isAccepted && res.ValidationAnswerData.ApiErrorDescription) { // eslint-disable-line max-len
            this.setState({ processing: false });
            $.bootstrapGrowl(
              res.ValidationAnswerData.ApiErrorDescription,
              { ...growlerOptions, type: 'danger', delay: 10000 },
            );
            // close modal after growler notification
            this.props.close();

          }
        }
      });

      // Make validateUserRegistration call to get redirectURL to lead to mitek page...
      // Need this redirectURL so url parameters are set in the html page this redirect will lead to
      AlphaPoint.validateUserRegistration(params);

    }

    render() {
      return (
      <div>
          <div className="pad">
            <span className="text-center mitek-redirect-container">
              <ProcessingButton
                type="submit"
                onClick={this.submit}
                processing={this.state.processing}
                className="btn btn-action mitek-redirect-btn"
              >
                {AlphaPoint.translation('BUTTONS.TEXT_SUBMIT_UPLOAD_DOCS') || 'Upload Your Documents'}
              </ProcessingButton>
            <p className="mitek-redirect-text">{AlphaPoint.translation('VERIFY.UPLOAD_DOCS2') || 'You will be redirected.'}</p>
            </span>
          </div>
          <div className="pad clearfix">
            <div className="pull-right">

            </div>
          </div>
      </div>
      );
    }
  }

  Mitek.defaultProps = {
    setError: () => { },
    increaseLevel: () => { },
  };

  Mitek.propTypes = {
    setError: React.PropTypes.func,
    increaseLevel: React.PropTypes.func,
  };
