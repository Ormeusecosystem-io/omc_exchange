/* global AlphaPoint, $, atob, window */
import React from 'react';
import { checkValidity, checkErrorCode } from './helper';
import axios from 'axios';

class ResetPassword extends React.Component {
  constructor() {
    super();

    this.state = {
      email: "",
      emailErr: false,
      error: false,
      success: false,
      errorChangingPassword: false
    };
  }

  resetPassword(){
    if(!checkValidity(this.state.email, {isEmail: true})) {
      return this.setState({...this.state, emailErr: true})
    }
   
    axios.put(`${process.env.ON_BOADRDING_URL}/cps/password/request`, {email: this.state.email})
    .then( res => this.setState({...this.state, success: true}))
    .catch(err => {
      if(err && err.response && err.response.status === 401){
          return checkErrorCode(err)
      }
      this.setState({...this.state, error: true})
    })
  }

  componentDidMount(){
    if(this.getQueryVariable('resetPassword') === 'fail'){
      this.setState({...this.state, errorChangingPassword: true})
    }
  }

  getQueryVariable = (variable) => {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return false
  }

  render() {
    return (
      this.state.success 
      ? 
      <section id="emailVerification">
        <div className="container">
            <h1>Reset password</h1>
            <img src="/img/verify-email.svg"/>
            <p>We have sent an email to your registered email <span>{this.state.email}</span></p>
            <p>Follow the included instrucions to get started!</p>
            <div id="box">
                <p>If you have not received the email, please try the following:</p>
                <ul>
                    <li>- Make sure the email address you provided is correct.</li>
                    <li>- Check your Spam or Junk folders.</li>
                    <li>- Make sure your email account is functioning properly.</li>
                </ul>
            </div>
        </div>
    </section>
    :
      <div className="reset-container">
          <div className="inner-container">
              {this.state.error && <div id="fail">Error sending email.</div>}
              {this.state.errorChangingPassword && <div id="fail">Error changing password</div>}
              <h1>Reset password</h1>
              <p>Fill in your email address below and we will send you a link to reset your password.</p>
              <div id="email-container">
                  <label>Email</label>
                  <input value={this.state.email} onChange={(e) => this.setState({...this.state, email: e.target.value})}/>
                  {this.state.emailErr && <p>Invalid email address</p>}
                  <button onClick={() => this.resetPassword()}>Send link</button>
                  <a href="/login.html">Back to Login</a>
              </div>
          </div>
      </div>
    );
  }
}

ResetPassword.defaultProps = {
  close: () => {},
};

ResetPassword.propTypes = {
  close: React.PropTypes.func,
};

export default ResetPassword;
