/* global AlphaPoint, $, window, JumioClient, alert, document */
/* eslint-disable react/no-multi-comp, no-alert */
import React from 'react';

import InputLabeled from '../misc/inputLabeled';
import ProcessingButton from '../misc/processingButton';

export default class VerifyPhone extends React.Component {
    constructor() {
      super();
  
      this.state = {
        processing: false,
        data: {},
        checkedData: {},
      };
    }
  
    componentDidMount() {
      this.session = AlphaPoint.session
        .where(data => data.sessionToken)
        .take(1) // subscribe until valid session
        .subscribe(() => {
          AlphaPoint.getUserInfo(null, res => {
            const billing = res.billing ? JSON.parse(res.billing) : {};
            this.refs.phone.setValue(billing.phone || '');
          });
        });
    }
  
    componentWillUnmount() {
      this.session.dispose();
    }
  
    close = (e) => {
      e.preventDefault();
      this.props.phonePassed();
    }
  
    submit = (e) => {
      const data = {};
      let userInfo;
  
      e.preventDefault();
      this.setState({ processing: true });
      this.props.setError('');
  
      if (this.props.userInformation.billing) {
        userInfo = this.props.userInformation.billing;
      } else {
        userInfo = {};
      }
      userInfo.phone = this.refs.phone.value();
      AlphaPoint.setUserInfo({ billing: userInfo });
  
      data.sessionToken = AlphaPoint.session.value.sessionToken;
      data.cellPhoneNumber = this.refs.phone.value();
      AlphaPoint.sendVerifyPhoneSMS(data, res => {
        // catch errors for translation
        if (!res.isAccepted && res.rejectReason) this.props.setError(res.rejectReason);
        this.setState({ data: res, processing: false });
      });
    }
  
    checkCode = (e) => {
      const data = {};
  
      e.preventDefault();
      this.setState({ processing: true });
      this.props.setError('');
  
      data.sessionToken = AlphaPoint.session.value.sessionToken;
      data.val2FaRequestCode = this.refs.code.value();
  
      AlphaPoint.verifyPhoneSMS(data, res => {
        // catch errors for translation
        if (res.rejectReason) {
          if (res.rejectReason.indexOf('invalid val2FaRequestCode') > -1) {
            this.props.setError(AlphaPoint.translation('VERIFY.PHONE_INVALID_CODE') ||
              'Incorrect code entered. Please try again.');
          } else {
            this.props.setError(res.rejectReason);
          }
        }
        this.setState({ checkedData: res, processing: false });
      });
    }
  
    render() {
      const checkedDataAccepted = !this.state.checkedData.isAccepted ?
        (<div className="pad">
          <h3>
            {AlphaPoint.translation('VERIFY.PHONE_CODE_HEADLINE') || 'Please enter the code that was sent to your phone.'}
          </h3>
          <InputLabeled
            placeholder={AlphaPoint.translation('VERIFY.PHONE_VERIFICATION_CODE') || 'Enter Code'}
            ref="code"
          />
  
          <div className="clearfix">
            <div className="pull-right">
              <button
                className="btn btn-action"
                onClick={this.checkCode}
              >{AlphaPoint.translation('BUTTONS.TEXT_SUBMIT') || 'Submit'}</button>
            </div>
          </div>
        </div>)
        :
        (<div className="pad">
          <h3>{AlphaPoint.translation('VERIFY.PHONE_CONFIRMED') || 'Your phone number has been confirmed.'}</h3>
          <div className="clearfix">
            <div className="pull-right">
              <button
                className="btn btn-action"
                onClick={this.close}
              >{AlphaPoint.translation('BUTTONS.TEXT_NEXT') || 'NEXT'}</button>
            </div>
          </div>
        </div>);
  
      return (
        <div>
          {!this.state.data.isAccepted ?
            <form onSubmit={this.submit}>
              <div className="pad">
                <h3>
                  {AlphaPoint.translation('VERIFY.PHONE_HEADLINE1') || 'Verify your phone number.'}
                  <br />
                  {AlphaPoint.translation('VERIFY.PHONE_HEADLINE2') ||
                    'Enter your phone number below and we will text you a code.'}
                </h3>
                <InputLabeled
                  placeholder={AlphaPoint.translation('VERIFY.PHONE_ENTER') || 'Please enter your phone number'}
                  ref="phone"
                  defaultValue={this.refs.phone}
                />
              </div>
              <div className="pad clearfix">
                <div className="pull-right">
                  <ProcessingButton
                    type="submit"
                    processing={this.state.processing}
                    className="btn btn-action"
                  >{AlphaPoint.translation('BUTTONS.TEXT_SUBMIT') || 'Submit'}</ProcessingButton>
                </div>
              </div>
            </form>
            :
            checkedDataAccepted}
        </div>
      );
    }
  }

  VerifyPhone.defaultProps = {
    phonePassed: () => { },
    setError: () => { },
    userInformation: {},
  };
  
  VerifyPhone.propTypes = {
    phonePassed: React.PropTypes.func,
    setError: React.PropTypes.func,
    userInformation: React.PropTypes.shape({
      billing: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number,
      ]),
    }),
  };