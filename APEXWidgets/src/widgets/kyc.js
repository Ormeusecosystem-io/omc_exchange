/* global AlphaPoint, $, alert */
/* eslint-disable react/no-multi-comp, no-alert */
import React from 'react';

import WidgetBase from './base';

// kycType Components
import IdentityMind from './kycIdentityMind';
import GreenId from './kycGreenId';
import IDVCheck from './kycIDVCheck';
import IDVCheckId from './kycIDVCheckId';
import Jumio from './kycJumio';
import ManualKyc from './kycManualKyc';
import Mitek from './kycMitek';
import VerifyPhone from './kycVerifyPhone';

class KYC extends React.Component {
  constructor() {
    super();

    this.state = {
      error: '',
      userInformation: {},
      level: 0,
      levelIncreaseStatus: ''
    };
  }

  componentDidMount() {
    this.accountInfo = AlphaPoint.accountInfo.subscribe(data => this.setState({ level: data.VerificationLevel }));
    this.userConfiguration = AlphaPoint.getUserConfig.subscribe(data => {
      let configurations = [];

      if (data.length > 0) {
        configurations = data.reduce((item, i) => {
          // Tells component what to render
          if (i.Key === "levelIncreaseStatus") {
            this.setState({ levelIncreaseStatus: i.Value });
          }
        }, {});
      }
    });
  }

  componentWillUnmount() {
    this.accountInfo && this.accountInfo.dispose();
    this.userConfiguration && this.userConfiguration.dispose();
  }

  setError = error => this.setState({ error });

  increaseLevel = level => this.setState({ level });

  phonePassed = () => {
    const response = this.state.userInformation;

    response.cellPhoneVerified = true;
    this.setState({ userInformation: response });
  }

  analyzeAnswer = data => {
    if (data.errorMessage) return false;

    const answer = data.validationAnswerData;
    const errors = [];

    if (!answer.isAccepted) { // find why it wasn't accepted
      if (answer.needsManualReview) {
        if (answer.processorData.sessionTokenError) {
          alert(`Could not get sessionToken. Error: ${answer.processorData.sessionTokenError}`);
          return false;
        }

        // const sessionToken = answer.processorData.sessionToken;
        // const accountId = answer.processorData.accountID;
        // const apiCode = answer.processorData.apiCode;

        this.setState({ level: 1 });
        return true;
      }

      if (answer.apiError) {
        errors.push(answer.apiError);
        errors.push(answer.apiErrorDescription);
      }

      // if (AlphaPoint.config.debugging) {
      // console.log(errors);
      this.setState({ error: `There was an error: ${answer.apiErrorDescription}` });
      // }

      const checks = answer.validationChecks;

      if (checks) {
        for (let i = 0; i < checks.length; i++) {
          const check = checks[i];
          if (!check.passed) errors.push(check.description);
        }
        alert(errors.join('\r\n'));
      }
    } else {
      if (!AlphaPoint.config.siteName === 'Bity Mundo') {
        alert('You have been verified');
        return this.setState({ level: 2 });
      }

      alert('You identity has been confirmed. Hit Ok to proceed to the next step.');
      return this.setState({ level: 1 });
    }

    return false;
  }

  // Closes the modal after level 1 form submission and updates user/account data without reloading page
  closeModalAfterSubmit = () => {
    AlphaPoint.getAccountInfo({AccountId:AlphaPoint.accountInfo.value.AccountId, OMSId:AlphaPoint.oms.value });
    AlphaPoint.getUserCon({ UserId: AlphaPoint.userData.value.UserId });
    this.props.close();
  }

  render() {
    const level = this.state.level;

    return (
      <WidgetBase
        {...this.props}
        login
        hideCloseLink={AlphaPoint.config.mitekDisabled && true}
        error={this.state.error}
        headerTitle={AlphaPoint.translation('VERIFY.TITLE_TEXT') || 'Account Verification'}
        subTitle={(level <= 1 && this.state.levelIncreaseStatus !== "underReview") && (AlphaPoint.translation('VERIFY.SUB_TEXT') || 'Complete these verification steps to raise your limits and enable instant buys.')}
      >
      { AlphaPoint.config.showVerifyExplanation &&
        <div className="verify-explanation">{AlphaPoint.translation('VERIFY.EXPLANATION') || 'Please fill in the form below.'}</div>
      }


      {/* ============================
              PROGRESS BARS
      ============================ */}
      {!AlphaPoint.config.hideKYCProgressBar && [
          AlphaPoint.config.kycType === "IM" && (
            <div style={{ paddingTop: '20px' }} className="progress-bar-container">
              <ul className="progressbar">
                <li className="pass-level">{AlphaPoint.translation('VERIFY.UNVERIFIED') || "Unverified"}</li>
                <li className={`${level === 1 && this.state.levelIncreaseStatus !== "pass" && "under-review-level"} ${level >= 1 && "pass-level"}`}>
                  {AlphaPoint.translation('VERIFY.ACCOUNT_VERIFIED') || "Account Verified"}
                </li>
                <li className={`${level === 1 && this.state.levelIncreaseStatus === "pass" && "under-review-level"} ${level === 2 && "under-review-level"} ${level === 3 && "pass-level"}`}>
                  {AlphaPoint.translation('VERIFY.IDENTITY_VERIFIED') || "Identity Verified"}
                </li>
                <li className={level === 3 && "pass-level"}>{AlphaPoint.translation('VERIFY.VERIFIED') || "Fully Verified"}</li>
              </ul>
            </div>),


        AlphaPoint.config.kycType === "ManualKYC" && AlphaPoint.config.sendDocsToEmail && (
        <div style={{ paddingTop: '20px'}} className="progress-bar-container">
          <ul className="progressbar">
            <li className="pass-level">{AlphaPoint.translation('VERIFY.UNVERIFIED') || "Unverified"}</li>
            <li className={`${level === 0 && this.state.levelIncreaseStatus === "underReview" && "under-review-level"} ${level >= 1 && "pass-level"}`}>
              {AlphaPoint.translation('VERIFY.ACCOUNT_VERIFIED') || "Account Verified"}
            </li>
            <li className={`${level === 2 && "under-review-level"} ${level > 2 && "pass-level"}`}>
              {AlphaPoint.translation('VERIFY.IDENTITY_VERIFIED') || "Identity Verified"}
            </li>
            <li className={level === 3 && "pass-level"}>
              {AlphaPoint.translation('VERIFY.VERIFIED') || "Fully Verified"}
            </li>
          </ul>
        </div>),


        AlphaPoint.config.kycType === "ManualKYC" && !AlphaPoint.config.sendDocsToEmail && (
          <div style={{ paddingTop: '20px' }} className="progress-bar-container">
            <ul className="progressbar">
              <li style={{ width: "calc(100% / 3)"}} className={level >= 0 && "pass-level"}>{AlphaPoint.translation('VERIFY.UNVERIFIED') || "Unverified"}</li>
              <li style={{ width: "calc(100% / 3)"}} className={`${level === 0 && this.state.levelIncreaseStatus === "underReview" && "under-review-level"} ${level === 1 && "pass-level"}`}>
                {AlphaPoint.translation('VERIFY.ACCOUNT_VERIFIED') || "Account Verified"}
              </li>
              <li style={{ width: "calc(100% / 3)"}} className={level >= 1 && "pass-level"}>{AlphaPoint.translation('VERIFY.VERIFIED') || "Fully Verified"}</li>
            </ul>
          </div>),


        AlphaPoint.config.kycType === "greenId" && (
          <div style={{ paddingTop: '20px' }} className="progress-bar-container">
            <ul className="progressbar">
              <li style={{ width: "calc(100% / 3)"}} className={level >= 0 && "pass-level"}>{AlphaPoint.translation('VERIFY.UNVERIFIED') || "Unverified"}</li>
              <li style={{ width: "calc(100% / 3)"}} className={`${level === AlphaPoint.config.UnderManualReviewLevel && "under-review-level"} ${(level > AlphaPoint.config.UnderManualReviewLevel || level === AlphaPoint.config.VerifiedLevel) && "pass-level"}`}>
                {AlphaPoint.translation('VERIFY.ACCOUNT_VERIFIED') || "Account Verified"}
              </li>
              <li style={{ width: "calc(100% / 3)"}} className={level >= AlphaPoint.config.VerifiedLevel && "pass-level"}>{AlphaPoint.translation('VERIFY.VERIFIED') || "Fully Verified"}</li>
            </ul>
          </div>)
      ]
      }


        {/* ============================
              For Bity Mundo site
          ============================ */}
        {/* For Bity Mundo site */}
        <div style={{ overflow: 'auto' }}>
          {level < 1 && (AlphaPoint.config.siteName === 'Bity Mundo') && !this.state.userInformation.cellPhoneVerified &&
            <VerifyPhone
              setError={this.setError}
              increaseLevel={this.increaseLevel}
              phonePassed={this.phonePassed}
              userInformation={this.state.userInformation}
            />
          }
        </div>

        {/* ============================
          IDENTITY MIND WITH MITEK
        ============================ */}

        {/* For IM: 0 Status */}
        {(level === 0) && (this.state.levelIncreaseStatus === '') && (AlphaPoint.config.kycType === 'IM') &&
          <IdentityMind
            close={this.props.close}
            setError={this.setError}
            analyzeAnswer={this.analyzeAnswer}
            increaseLevel={this.increaseLevel}
          />
        }

        {/* For IM: 0 FAIL status */}
        {(level === 0 && this.state.levelIncreaseStatus === "fail" && AlphaPoint.config.kycType === 'IM') &&
          <h4 className="text-center">{AlphaPoint.translation('VERIFY.IM_ZERO_FAIL') || "Account verification failed. Please contact the exchange for help or questions concering your account verification."}</h4>
        }

        {/* Right after IM level 1 form submitted, show this: */}
        {(level === 1) && (this.state.levelIncreaseStatus === '') && (AlphaPoint.config.kycType === 'IM') &&
          <div className="loader-container-confirm">
            {/* <span>{this.state.validatorRespondedMesssage}</span> */}
            <button className="confirm-close-btn blue-btn" onClick={this.closeModalAfterSubmit}>{AlphaPoint.translation('COMMON.OKAY') || 'Okay'}</button>
          </div>
        }

        {/* For IM */}
        {(level === 1 && this.state.levelIncreaseStatus === "fail" && AlphaPoint.config.kycType === 'IM') &&
          <IdentityMind
            close={this.props.close}
            setError={this.setError}
            analyzeAnswer={this.analyzeAnswer}
            increaseLevel={this.increaseLevel}
          />
        }

        {/* For IM: Level 1 status is underReview */}
        {(level === 1 && this.state.levelIncreaseStatus === "underReview" && AlphaPoint.config.kycType === 'IM') &&
            <h4 className="text-center">{AlphaPoint.translation('VERIFY.UNDER_REVIEW') || "Your account is currently under review."}</h4>
        }

        {/* For IM; after IM form submitted, display Mitek upload docs redirection */}
        {(level >= 1 && level < 3 && this.state.levelIncreaseStatus === "pass" && AlphaPoint.config.kycType === 'IM' && !AlphaPoint.config.customEmailDocs) &&
          <Mitek
            level={this.state.level}
            close={this.props.close}
            setError={this.setError}
            analyzeAnswer={this.analyzeAnswer}
            increaseLevel={this.increaseLevel}
          />
        }

        {/* For IM or ManualKYC with NO customEmailDocs configuration: account info under review */}
        {level === 2 && this.state.levelIncreaseStatus === "underReview" && !AlphaPoint.config.customEmailDocs &&
          <h3 className="text-center">{AlphaPoint.translation('VERIFY.DOCS_UNDER_REVIEW') || "Documents are submitted and are under review."}</h3>
        }

        {(level >= 1 && level < 3 && this.state.levelIncreaseStatus === "pass" && AlphaPoint.config.kycType === 'IM' && AlphaPoint.config.customEmailDocs) &&
          <div class="text-center">
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS13') || 'Congratulations! Your identity has been verified. (Level 2)'}</h5>
            <h4>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS14') || 'To verify your identity for Level 3, please state \"Level 3\" and email us'} <a href={`mailto:${AlphaPoint.config.sendDocsToEmail}?subject=${AlphaPoint.translation('VERIFY.EMAIL_SUBJECT') || AlphaPoint.accountInfo.value.AccountName}'s Docs&body=Hi ${AlphaPoint.config.siteTitle}, ${encodeURIComponent('\r\n\r\n')} ${AlphaPoint.translation('VERIFY.EMAIL_BODY') || 'Attached is a copy of my 1. drivers license (includes front and back) or 2. my passport or 3. another form of state identification. Also attached is a document providing proof of address.'}`}>{AlphaPoint.translation('VERIFY.EMAIL_US_HERE') || 'here'}.</a> {AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS11') || 'attached the below document(s)'} {AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS3') || 'with specify your email address and username.'}</h4>
            <br />
            <h4>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS15') || 'Next, Level 3'}</h4>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS16') || 'You need to order a letter of Purpose of Trade in advance, please contact us'}</h5>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS17') || 'Please provide your ID selfie, residence address proof and the purpose trade confirmation.'}</h5>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS12') || '(It usually takes 7~10 days until the ID validation completed since you send the email)'}</h5>
          </div>
        }

        {/* For IM: Level3/Documents rejected */}
        {level === 2 && this.state.levelIncreaseStatus === "fail" &&
          <div>
            <h4 className="text-center">{AlphaPoint.translation('VERIFY.DOCS_REJECTED') || "Your documents were rejected. You can try to upload your docs again."}</h4>
            <Mitek
              level={this.state.level}
              close={this.props.close}
              setError={this.setError}
              analyzeAnswer={this.analyzeAnswer}
              increaseLevel={this.increaseLevel}
            />
          </div>
        }

        {/* For IM: Fully Verified */}
        {level === 3 && AlphaPoint.config.kycType === 'IM' &&
          <h3 style={{ padding: '25px', width: '500px', margin: '0 auto', lineHeight: '2.5rem' }} className="cngrt-msg text-center">{AlphaPoint.translation('VERIFY.FULLY_VERIFIED') || 'Congratulations! You are fully verified.'}</h3>
        }

        {/* ============================
                    GREENID
        ============================ */}

        {level === 0 && AlphaPoint.config.kycType === 'greenId' &&
          <GreenId
            close={this.props.close}
            setError={this.setError}
            analyzeAnswer={this.analyzeAnswer}
            increaseLevel={this.increaseLevel}
          />
        }

        {(level === AlphaPoint.config.UnderManualReviewLevel && AlphaPoint.config.kycType === 'greenId') &&
          <h3 className="text-center">{AlphaPoint.translation('VERIFY.UNDER_REVIEW') || 'Your information has been submitted and is under review.'}</h3>
        }

        {(level === AlphaPoint.config.VerifiedLevel && AlphaPoint.config.kycType === 'greenId') &&
          <h3 style={{ padding: '25px', width: '500px', margin: '0 auto', lineHeight: '2.5rem' }} className="cngrt-msg text-center">{AlphaPoint.translation('VERIFY.FULLY_VERIFIED') || `Congratulations! You are level ${AlphaPoint.config.VerifiedLevel} verified.`}</h3>
        }

        {/* ============================
                    MANUALKYC
        ============================ */}

        {(level === 0 && this.state.levelIncreaseStatus === '' && AlphaPoint.config.kycType === 'ManualKYC') &&
          <ManualKyc
            close={this.props.close}
            setError={this.setError}
            analyzeAnswer={this.analyzeAnswer}
            increaseLevel={this.increaseLevel}
          />
        }

        {/* For MANUALKYC: underReview */}
        {level === 0 && this.state.levelIncreaseStatus === "underReview" && !AlphaPoint.config.sendDocsToEmail && AlphaPoint.config.kycType === 'ManualKYC' &&
          <h3 className="text-center">{AlphaPoint.translation('VERIFY.UNDER_REVIEW') || 'Your information has been submitted and is under review.'}</h3>
        }


        {/* For MANUALKYC with sendDocsToEmail: underReview */}
        {level === 0 && AlphaPoint.config.sendDocsToEmail && this.state.levelIncreaseStatus === "underReview" && !AlphaPoint.config.customEmailDocs &&
          <div>
            <h4>{AlphaPoint.translation('VERIFY.EMAIL_DOCS') || 'Your account information has been submitted and is under review. In the mean time, you can also verify your identity. Please email us'} <a href={`mailto:${AlphaPoint.config.sendDocsToEmail}?subject=${AlphaPoint.translation('VERIFY.EMAIL_SUBJECT') || AlphaPoint.accountInfo.value.AccountName}'s Docs&body=Hi ${AlphaPoint.config.siteTitle}, ${encodeURIComponent('\r\n\r\n')} ${AlphaPoint.translation('VERIFY.EMAIL_BODY') || 'Attached is a copy of my 1. drivers license (includes front and back) or 2. my passport or 3. another form of state identification. Also attached is a document providing proof of address.'}`}>{AlphaPoint.translation('VERIFY.EMAIL_US_HERE') || 'here'}.</a></h4>
            <br />
            <h5>{AlphaPoint.translation('VERIFY.PLEASE_ATTACH') || 'Please attach a copy of your:'}</h5>
            <ol>
              <li>{AlphaPoint.translation('VERIFY.EMAIL_DOCS1') || "Driver's License (front and back), Passport, or State Identification Card"}</li>
              <li>{AlphaPoint.translation('VERIFY.EMAIL_DOCS2') || "and a copy of a document with proof of address (e.g. government issued mail, bank statement"}</li>
            </ol>
          </div>
        }

        {level === 0 && AlphaPoint.config.sendDocsToEmail && this.state.levelIncreaseStatus === "underReview" && AlphaPoint.config.customEmailDocs &&
          <div>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS1') || 'Your account information has been submitted and is under review.(Level 0)'}</h5>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS2') || 'To verify your account information for Level1, please state \"Level1\" and email us'} <a href={`mailto:${AlphaPoint.config.sendDocsToEmail}?subject=${AlphaPoint.translation('VERIFY.EMAIL_SUBJECT') || AlphaPoint.accountInfo.value.AccountName}'s Docs&body=Hi ${AlphaPoint.config.siteTitle}, ${encodeURIComponent('\r\n\r\n')} ${AlphaPoint.translation('VERIFY.EMAIL_BODY') || 'Attached is a copy of my 1. drivers license (includes front and back) or 2. my passport or 3. another form of state identification. Also attached is a document providing proof of address.'}`}>{AlphaPoint.translation('VERIFY.EMAIL_US_HERE') || 'here'}.</a> {AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS3') || 'with specify your email address and username.'}</h5>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS4') || '(It usually takes 1~5 days until the Account reivew is completed since you send the email)'}</h5>
            <br />
            <h4>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS5') || 'Next, Level 2'}</h4>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS6') || 'Please provide your ID proof as an email attachment.'}</h5>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS7') || 'Accept ID proof: Passport, Driver\'s license, National Identity card.'}</h5>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS8') || '(It usually takes 1~7 days until the ID validation completed since you send the email)'}</h5>
          </div>
        }

        {/* For MANUALKYC with sendDocsToEmail: Level 1 verified */}
        {(level === 1 && AlphaPoint.config.sendDocsToEmail && AlphaPoint.config.kycType === 'ManualKYC' && !AlphaPoint.config.customEmailDocs ) &&
          <div>
            <h4>{AlphaPoint.translation('VERIFY.VERIFIED_NOW_EMAIL_DOCS') || 'Congratulations! Your account information has been verified. To verify your identity, please email us'} <a href={`mailto:${AlphaPoint.config.sendDocsToEmail}?subject=${AlphaPoint.translation('VERIFY.EMAIL_SUBJECT') || AlphaPoint.accountInfo.value.AccountName}'s Docs&body=Hi ${AlphaPoint.config.siteTitle}, ${encodeURIComponent('\r\n\r\n')} ${AlphaPoint.translation('VERIFY.EMAIL_BODY') || 'Attached is a copy of my 1. drivers license (includes front and back) or 2. my passport or 3. another form of state identification. Also attached is a document providing proof of address.'}`}>{AlphaPoint.translation('VERIFY.EMAIL_US_HERE') || 'here'}.</a></h4>
            <br />
            <h5>{AlphaPoint.translation('VERIFY.PLEASE_ATTACH') || 'Please attach a copy of your:'}</h5>
            <ol>
              <li>{AlphaPoint.translation('VERIFY.EMAIL_DOCS1') || 'Driver\'s License (front and back), Passport, or State Identification Card'}</li>
              <li>{AlphaPoint.translation('VERIFY.EMAIL_DOCS2') || 'and a copy of a document with proof of address (e.g. government issued mail, bank statement'}</li>
            </ol>
          </div>
        }

        {(level === 1 && AlphaPoint.config.sendDocsToEmail && AlphaPoint.config.kycType === 'ManualKYC' && AlphaPoint.config.customEmailDocs ) &&
          <div>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS9') || 'Congratulations! Your account information has been verified.(Level1)'}</h5>
            <h4>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS10') || 'To verify your identity for Level 2, please state \"Level2\" and email us'} <a href={`mailto:${AlphaPoint.config.sendDocsToEmail}?subject=${AlphaPoint.translation('VERIFY.EMAIL_SUBJECT') || AlphaPoint.accountInfo.value.AccountName}'s Docs&body=Hi ${AlphaPoint.config.siteTitle}, ${encodeURIComponent('\r\n\r\n')} ${AlphaPoint.translation('VERIFY.EMAIL_BODY') || 'Attached is a copy of my 1. drivers license (includes front and back) or 2. my passport or 3. another form of state identification. Also attached is a document providing proof of address.'}`}>{AlphaPoint.translation('VERIFY.EMAIL_US_HERE') || 'here'}.</a> {AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS11') || 'attached the below document(s)'} {AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS3') || 'with specify your email address and username.'}</h4>
            <br />
            <h4>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS5') || 'Next, Level 2'}</h4>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS6') || 'Please provide your ID proof as an email attachment.'}</h5>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS7') || 'Accept ID proof: Passport, Driver\'s license, National Identity card.'}</h5>
            <h5>{AlphaPoint.translation('VERIFY.CUSTOM_EMAIL_DOCS12') || '(It usually takes 7~10 days until the ID validation completed since you send the email)'}</h5>
          </div>
        }

        {/* For MANUALKYC without sendDocsToEmail: Fully (Level 1) Verified */}
        {level === 1 && !AlphaPoint.config.sendDocsToEmail && AlphaPoint.config.kycType === 'ManualKYC' &&
          <div>
            <h3 style={{ padding: '25px', width: '500px', margin: '0 auto', lineHeight: '2.5rem' }} className="cngrt-msg text-center">{AlphaPoint.translation('VERIFY.UNDER_REVIEW') || `Congratulations! You are fully verified. Now you can utilize all the features of ${AlphaPoint.config.siteTitle}.`}</h3>
          </div>}

        {/* For MANUALKYC with sendDocsToEmail: Fully (level 2) Verified */}
        {level === 3 && AlphaPoint.config.sendDocsToEmail && AlphaPoint.config.kycType === 'ManualKYC' &&
          <div>
            <h3 style={{ padding: '25px', width: '500px', margin: '0 auto', lineHeight: '2.5rem' }} className="cngrt-msg text-center">{AlphaPoint.translation('VERIFY.UNDER_REVIEW') || `Congratulations! You are fully verified. Now you can utilize all the features of ${AlphaPoint.config.siteTitle}.`}</h3>
          </div>
        }

        {/* ============================
                      IDV
        ============================ */}

        {/* For IDVCheck: Level 0 Verified */}
        {(level === 0) && (this.state.levelIncreaseStatus === '') && (AlphaPoint.config.kycType === 'IDV') &&
          <IDVCheck 
            close={this.props.close}
            setError={this.setError}
          />
        }

        {/* For IDV: Level 1 status is underReview */}
        {(level === 0 && this.state.levelIncreaseStatus === "underReview" && AlphaPoint.config.kycType === 'IDV') &&
          <h4 className="text-center">{AlphaPoint.translation('VERIFY.UNDER_REVIEW') || "Your account is currently under review."}</h4>
        }

        {/* For IDVCheck: 0 FAIL status */}
        {(level === 0 && this.state.levelIncreaseStatus === "fail" && AlphaPoint.config.kycType === 'IDV') &&
          <div>
            <h4></h4>
            <IDVCheck 
              close={this.props.close}
              setError={this.setError}
            />
          </div>
        }

        {/* For IDV; after IDV form submitted, display IDVCheckId upload docs */}
        {(level === 1 && this.state.levelIncreaseStatus !== "fail" && this.state.levelIncreaseStatus !== "underReview" && AlphaPoint.config.kycType === 'IDV') &&
          <IDVCheckId
            close={this.props.close}
            setError={this.setError}
          />
        }

        {/* For IDV: Level2/Documents rejected */}
        {level === 1 && this.state.levelIncreaseStatus === "fail" && AlphaPoint.config.kycType === 'IDV' &&
          <div>
            <h4 className="text-center">{AlphaPoint.translation('VERIFY.DOCS_REJECTED') || "Your documents were rejected. You can try to upload your docs again."}</h4>
            <IDVCheckId
            close={this.props.close}
            setError={this.setError}
          />
          </div>
        }

        {/* For IDV: Level2/Documents rejected */}
        {level === 1 && this.state.levelIncreaseStatus === "underReview" && AlphaPoint.config.kycType === 'IDV' &&
          <div>
            <h4 className="text-center">{AlphaPoint.translation('VERIFY.DOCS_UNDER_REVIEW') || "Your documents have been submitted and are under review."}</h4>
          </div>
        }

        {/* For IDV: Fully Verified */}
        {level === 2 && AlphaPoint.config.kycType === 'IDV' &&
          <h3 style={{ padding: '25px', width: '500px', margin: '0 auto', lineHeight: '2.5rem' }} className="cngrt-msg text-center">{AlphaPoint.translation('VERIFY.FULLY_VERIFIED') || 'Congratulations! You are fully verified.'}</h3>
        }

      </WidgetBase>
    );
  }
}


export default KYC;
