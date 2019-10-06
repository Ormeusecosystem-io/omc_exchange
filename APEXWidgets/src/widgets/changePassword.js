/* global AlphaPoint, $, atob, window */
import React from 'react';
import { checkValidity } from './helper';
import axios from '../axios';
import passwordValidator from 'password-validator';
import {getURLParameter, checkErrorCode} from './helper';

var schema = new passwordValidator();
schema
.is().min(8)                                    // Minimum length 8
.is().max(15)                                   // Maximum length 15
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits()                                 // Must have digits
.has().not().spaces()  

class ResetPassword extends React.Component {
  constructor() {
    super();

    this.state = {
        password: "",
        passworderr: false,
        confirmPassword: "",
        confirmerr: false,
        success: false,
        fail: false
    };
  }

    handleChange( value, name ) {
        this.setState({[name]: value});
    }

    checkSource(){
        const source = getURLParameter('source');
        return source ? source : false;
    }

    validate = ( event ) => {

        const state = {};
        let allowed = true;
        let failedPasswordRules = schema.validate(this.state.password,{ list: true});
        if(failedPasswordRules.length > 0) {
            state.failedPasswordString = failedPasswordRules;
            state.passworderr = true
            allowed = false;
        }else{
            state.failedPasswordString = failedPasswordRules;
            state.passworderr = false;
        }

        if(this.state.password !== this.state.confirmPassword) {
            state.confirmerr = true;
            allowed = false;
        }
        else{
            state.confirmerr = false;
        }
        this.setState({...this.state, ...state})

        if(allowed){
            this.changePassword()
        }
    }

    getVerificationToken() {
        const requestCode = getURLParameter('requestCode');
        return requestCode ? requestCode : false;
    }

    redirectToLogin(res){
        if(res && res.data && res.data.code === 201) {
            window.location.href = "/login.html?resetPassword=success"
        }
    }

    reResetPassword(error){
        if(error && error.response && error.response.status === 401){
            return checkErrorCode(error)
        }
        window.location.href = "/reset-password.html?resetPassword=fail"
    }

    changePassword(){
        if(this.checkSource()) {
            const requestCode = getURLParameter('requestCode');
            const UserId = getURLParameter('UserId');
            const d1 = getURLParameter('d1');
            if(requestCode && UserId && d1){
                return axios.put('/cps/password/exchange', {passwordRequestHash: requestCode, userId: UserId, encodedUrl: d1, password: this.state.password})
                        .then(res => this.redirectToLogin(res)).catch(error => this.reResetPassword(error))
            }
            return reResetPassword();

        }        
        const token = this.getVerificationToken();
        if(token){
            return axios.put('/cps/password', {"passwordRequestHash": token, "password": this.state.password})
                        .then(res => this.redirectToLogin(res)).catch(error => this.reResetPassword(error))
        }
        return this.reResetPassword()
    }

  render() {
    return (
      <div className="reset-container">
          <div className="inner-container">
              <h1>Change password</h1>
              {this.state.success && <div id="success">Password has been changed.</div>}
              {this.state.fail && <div id="fail">Error changing password.</div>}
              <div id="email-container">
                  <div>
                    <label>New password</label>
                    <input type="password" value={this.state.email} name="password" onChange={(e) => this.handleChange(e.target.value, e.target.name)}/>
                    {this.state.passworderr && <p>Select an 8-15 character password with one number, lowercase letter and uppercase letter.</p>}
                  </div>
                  <div>
                    <label>Confirm password</label>
                    <input type="password" value={this.state.email} name="confirmPassword" onChange={(e) => this.handleChange(e.target.value, e.target.name)}/>
                    {this.state.confirmerr && <p>The password and confirmation password do not match</p>}
                  </div>
                  <button onClick={() => this.validate()}>Change password</button>
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
