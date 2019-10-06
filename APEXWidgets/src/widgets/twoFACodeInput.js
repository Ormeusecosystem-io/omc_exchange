/* global AlphaPoint */
import React from 'react';
// import QRCode from 'qrcode.react';

import WidgetBase from './base';
// import InputLabeled from '../misc/inputLabeled';
import InputLabeled from '../misc/inputNoLabel';

class TwoFACodeInput extends React.Component {
  constructor() {
    super();

    this.state = {
      data: {},
      dataHide: {},
      step: 1
    };
  }

  componentDidMount() {
    this.twoFAEnable = AlphaPoint.EnableGoogle2FA.subscribe(res => this.setState({ data: res }));

    AlphaPoint.enableGoogle2FA({});
    //if this is disable mode there is no need for step 1 and 2
    if(this.props.hold2FA){
      this.setState({...this.state, step: 3})
    }
  }

  componentWillUnmount() {
    this.twoFAEnable.dispose();
  }

  googleQRCode = () => this.setState({ data: this.state.dataHide });

  submit = () => this.props.submit(this.refs.code.value());

  copyToClipboard(e){
    var x = e.pageX,
    y = e.pageY;
    var textField = document.createElement('textarea');
    textField.innerText = this.state.data.ManualCode; //pass the value from state
    document.body.appendChild(textField)
    textField.select()
    document.execCommand('copy')
    textField.remove()
    var copied = document.createElement('span') // tooltip copied!
    copied.innerText = "Copied";
    copied.style = `
      position: absolute;
      top: ${Number(y)-50}px;
      left: ${Number(x)-40}px;
      font-size: 12px;
      background-image: linear-gradient(244deg, #2cbfdf, #2c9cdf);
      border-radius: 8px 4px 8px 0px;
      color: #fff;
      letter-spacing: 1px;
      font-family: book;
      padding: 5px 10px;
      z-index: 99999;
    `;
    document.body.appendChild(copied);
    setTimeout(()=>{copied.remove()},2000)
  }

  changeStep(step){
    this.setState({...this.state, step})
  }

  render() {
    let authName = '';

    if (this.props.requireGoogle2FA) authName = AlphaPoint.translation('2FA.GOOGLE_CODE') || 'Google';
    if (this.props.requireAuthy2FA) authName = AlphaPoint.translation('2FA.AUTHY_CODE') || 'Authy';
    if (this.props.requireSMS2FA) authName = AlphaPoint.translation('2FA.SMS_CODE') || 'SMS';
    return (
      <WidgetBase {...this.props} error={this.state.data.rejectReason}>
      
        <div className="twoFA-container-expanded">  
          <h3>{`${this.props.hold2FA ? "Disable" : "Enable"} Google authentication`}</h3>
          {
            !this.props.hold2FA &&  
            <div id="progress-bar">
                <div id="progress-bar-row">
                  <div>
                    <div className="circle" style={{background: this.state.step === 1 ? "#0091ff" : "#00d381", borderColor: this.state.step === 1 ? "rgb(35, 85, 145)" : "rgb(23, 126, 139)"}}>1</div>
                  </div>
                  <div className="stroke"></div>
                  <div>
                    <div className="circle" style={{background: this.state.step === 2 ? "#0091ff" : this.state.step === 1 ? "#50567c" : "#00d381", borderColor: this.state.step === 2 ? "rgb(35, 85, 145)" : this.state.step === 1 ? "transparent" : "rgb(23, 126, 139)"}}>2</div>
                  </div>
                  <div className="stroke"></div>
                  <div>
                    <div className="circle" style={{background: this.state.step === 3 ? "#0091ff" : this.state.step !== 3 ? "#50567c" : "#00d381", borderColor: this.state.step === 3 ? "rgb(35, 85, 145)" : this.state.step !== 3 ? "transparent" : "rgb(23, 126, 139)"}}>3</div>
                  </div>
                </div>
            </div>
          }
          <div>
          {
            this.state.step === 1 && !this.props.hold2FA &&
            <div className="step-box">
              <div className="step-title">Step 1:</div>
              <div className="step-description">Download and install the Google Authenticator app</div>
              <div className="app-buttons-wrapper">
              {navigator.userAgent.toLowerCase().indexOf("android") > -1 ? 
                <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en"><div className="google-play"></div></a> 
                : 
              <div className="google-play"></div>}
              {navigator.userAgent.toLowerCase().indexOf("iphone") > -1 ?
                <a href="https://itunes.apple.com/app/google-authenticator/id388497605?mt=8"><div className="app-store"></div></a> 
                :
                <div className="app-store"></div>}
              </div>
              <div className="next">
                  <p>I have installed the app</p>
                  <button onClick={() => this.changeStep(2)}>Next Step</button>
              </div>
            </div>
          }
          {
            this.state.step === 2 && !this.props.hold2FA &&
            <div className="step-box">
              <div className="step-title">Step 2:</div>
              <div className="step-description">Scan the QR code below</div>
              <div className="QR-wrapper">
                <img alt="" src={`data:image/jpg;base64,${this.state.data.GoogleQRCode}`} width="168px" height="168px"/>
                <div id="or-copy">Or copy</div>
                <InputLabeled value={this.state.data.ManualCode} twoFA/>
              </div>
              <div className="next">
                  <div className="previous" onClick={() => this.changeStep(1)}>Previous Step</div>
                  <button onClick={() => this.changeStep(3)}>Next Step</button>
              </div>
            </div>
          }
          {
            this.state.step === 3 &&
            <div className="twoFA-buttons step-box">
              {!this.props.hold2FA && <div className="step-title">Step 3:</div>}
              <div className="step-description">Enter the security details below</div>
              <InputLabeled ref="code" twoFAcode type="password"/>
              <div className="next">
                  {!this.props.hold2FA && <div className="previous" onClick={() => this.changeStep(2)}>Previous Step</div>}
                  <button onClick={this.submit} style={{backgroundColor: "#00d381"}}>{`${this.props.hold2FA ? "Disable" : "Enable"} Authentication`}</button>
              </div>
            </div>
          }
          </div>
        </div>
      </WidgetBase>
    );
  }
}

TwoFACodeInput.defaultProps = {
  close: () => { },
  submit: () => { },
  requireAuthy2FA: false,
  requireGoogle2FA: false,
  requireSMS2FA: false,
  useFaState: false,
  doNotShowQRCode: false,
  authProcessing: false,
};
TwoFACodeInput.propTypes = {
  close: React.PropTypes.func,
  submit: React.PropTypes.func,
  requireAuthy2FA: React.PropTypes.bool,
  requireGoogle2FA: React.PropTypes.bool,
  requireSMS2FA: React.PropTypes.bool,
  useFaState: React.PropTypes.bool,
  doNotShowQRCode: React.PropTypes.bool,
  authProcessing: React.PropTypes.bool,
};

export default TwoFACodeInput;
