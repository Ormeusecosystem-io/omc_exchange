/* global AlphaPoint, $, window */
/* eslint-disable react/no-multi-comp */
import React from 'react';

import ProcessingButton from '../misc/processingButton';

export default class IDVCheckId extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      userConfig: {},
      AdditionalValidation: [],
      processing: false,
      regexMatch: true,
      confirmClose: false,
      verificationLevel: 0,
      formIsValid: true,
    };
    this.isRequired = this.isRequired.bind(this);
    this.handleOnChangeFileInput = this.handleOnChangeFileInput.bind(this);

  }

  componentDidMount() {
    const AdditionalValidation = [];
    const requiredIDs = AlphaPoint.config.idvRequiredIDs || ['Drivers License or Passport','Utility Bills'];
    requiredIDs.map(data => {
      AdditionalValidation.push({});
      this.setState({ AdditionalValidation });
    });

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
      this.setState({verificationLevel: data.VerificationLevel});
    });

    AlphaPoint.getUserCon({UserId: AlphaPoint.userData.value.UserId});
  };

  componentWillUnmount() {
    /* eslint-disable no-unused-expressions */
    this.userConfiguration && this.userConfiguration.dispose();
    this.verifyLevel && this.verifyLevel.dispose();
    this.verifcationLevelUpdate && this.verifcationLevelUpdate.dispose();
    this.getUser && this.getUser.dispose();
    /* eslint-enable no-unused-expressions */
  };

  encodeImageFileAsURL = (target, callback) => {
    var file = target.files[0];
    var reader = new FileReader();
    reader.onloadend = () => {
      // console.log('RESULT', reader.result)
      callback(reader.result);
    }
    reader.readAsDataURL(file);
  }
  
  createFileInputs = () => {
    const requiredIDs = AlphaPoint.config.idvRequiredIDs || ['Drivers License or Passport','Utility Bill'];
    const inputs = [];
    requiredIDs.map((data, idx) => {
      inputs.push(
        <div key={idx} className="file-drop-area">
        <span className="choose-file-btn">Choose file</span>
        <span className="file-msg">{(this.state.AdditionalValidation[idx] && this.state.AdditionalValidation[idx].ImageName) || data}</span>
        <input 
          name={idx}
          type="file" 
          onChange={this.handleOnChangeFileInput}
          multiple={false}
          className="file-input"
          key={idx}
          accept=".jpg, .jpeg, .png"
        />
        {this.state.AdditionalValidation[idx] && this.state.AdditionalValidation[idx].ImageInString && 
          <img 
            src={this.state.AdditionalValidation[idx].ImageInString}
            width="75px"
            style={{ position: 'absolute', right: '25px'}}
          />
        }
      </div>);
    });
    return inputs;
  }

  handleOnChangeFileInput = e => {
    const target = e.target;
    const key = e.target.name;
    const AdditionalValidation = this.state.AdditionalValidation;
    // console.log(e.target);
    this.encodeImageFileAsURL(target, dataUrl => {
      AdditionalValidation[key].ImageInString = dataUrl;
      AdditionalValidation[key].ImageName= target.files[0].name
      this.setState({ AdditionalValidation, formIsValid: true });
      // console.log(AdditionalValidation)
    });
    // console.log(dataUrl)
  }

  // Required Fields validation
  isRequired() {
    let formIsValid = true;

    this.state.AdditionalValidation.map(data => {
      if (!Object.keys(data).length) {
        // console.log("Data", data);
        // console.log("DataLength", Object.keys(data).length);
        formIsValid = false;
        this.setState({ formIsValid });
      }
    });
    return formIsValid;
  };


  submit = (e) => {

    if (this.isRequired()) { // Checking for required fields; returns submit as false if any kycRequiredFields are empty
      e.preventDefault();
      this.props.setError('');

      const userInfo = this.state.userConfig;
      const AdditionalValidation = this.state.AdditionalValidation;
      const clientInfo = {
        alphaPointSessiontoken: AlphaPoint.session.value.SessionToken,
        alphaPointUserID: JSON.stringify(AlphaPoint.userData.value.UserId),
        validationStage: 2,
        validator: AlphaPoint.config.kycType,
      };
      const params = {
        clientInfo,
        userInfo,
        AdditionalValidation
      };

      this.verifyLevel = AlphaPoint.verifylevel.subscribe(res => {

        if (res.result === 'Unknown Validator Request') {
          
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

          this.setState({ processing: false, confirmClose: true });

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
              validatorErrorMesssage: AlphaPoint.translation('KYC.RESPONSE', {answerData: res.ValidationAnswerData}) || `The response was ${res.ValidationAnswerData}`,
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
    const confirmMessageStyle = this.state.validatorErrorMesssage ?
    {
      width: '50%',
      margin: '0 auto',
      marginTop: '40px',
      padding: '15px 5px',
      border: '1px solid lightcoral',
      minHeight: '70px'
    } 
    : {
      width: '50%',
      margin: '0 auto',
      marginTop: '40px',
      padding: '15px 5px',
      border: '1px solid #0ea920',
      minHeight: '70px'
      };

    const confirmBtnStyle = this.state.validatorErrorMesssage ?
      { 
        position: 'relative',
        display: 'block',
        padding: '15px 20px',
        background: 'lightcoral',
        color: 'white',
        borderRadius: '2px',
        border: '1px solid white',
        width: 'auto',
        textAlign: 'center',
        margin: '0 auto',
        marginTop: '25px',
        WebkitTransition: 'all .15s ease-in',
        MozTransition: 'all .15s ease-in',
        transition: 'all .15s ease-in',
        left: '50%',
        transform: 'translateX(-50%)'
      }
      : {
        position: 'relative',
        padding: '15px 20px',
        background: '#0ea920',
        color: 'white',
        borderRadius: '2px',
        border: '1px solid white',
        width: 'auto',
        textAlign: 'center',
        margin: '0 auto',
        marginTop: '25px',
        WebkitTransition: 'all .15s ease-in',
        MozTransition: 'all .15s ease-in',
        transition: 'all .15s ease-in',
        left: '50%',
        transform: 'translateX(-50%)'
      };

    const confirmIconStyle = this.state.validatorErrorMesssage ?
      {float: 'left', fontSize: '45px', color: 'lightcoral'}
      : {float: 'left', fontSize: '45px', color: '#0ea920'};

    return (
      <div>
        {this.state.processing &&
          <div className="loader-container">
            <div className="loader">{AlphaPoint.translation('COMMON.LOADING') || 'Loading...'}</div>
          </div>
        }

        {this.state.confirmClose && 
          <div className="loader-container-confirm">
            <div style={confirmMessageStyle}>
                <i className="material-icons" style={confirmIconStyle}>{this.state.validatorErrorMesssage ? 'warning' : 'check_circle'}</i>
                <span style={{position: 'relative', left: '10px', top: '5px'}}>{this.state.validatorErrorMesssage || this.state.validatorRespondedMesssage}</span>
              </div>

            <button 
              style={confirmBtnStyle}
              onClick={() => window.location.reload()}
            >{this.state.validatorErrorMesssage ? 
              (AlphaPoint.translation('COMMON.TRY_AGAIN') || 'Try again') 
              : (AlphaPoint.translation('COMMON.CONTINUE') || 'Continue')}</button>
          </div>
        }

        <form onSubmit={this.submit} style={{overflow: 'hidden'}}>
          <div className="pad-y" style={{ marginTop: '15px', maxHeight: '367px', overflowY: 'auto' }}>

        {this.createFileInputs()}

          </div>
          {!this.state.formIsValid && <span style={{
                color: 'lightcoral',
                fontWeight: '600',
                fontSize: '13px',
                marginLeft: '12px'
              }}>{AlphaPoint.translation('VERIFY.IDVCHECK_FORM_INVALID_MESSAGE') || 'Please include all forms of identification required.'}</span>}

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
                processing={this.state.processing}
                disabled={!this.state.formIsValid}
                className="btn btn-action input-verify"
              >{AlphaPoint.translation('BUTTONS.TEXT_SUBMIT') || 'Verify'}</ProcessingButton>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

IDVCheckId.defaultProps = {
  increaseLevel: () => {},
  setError: () => {},
  hideHeader: true,
};

IDVCheckId.propTypes = {
  increaseLevel: React.PropTypes.func,
  setError: React.PropTypes.func,
};
