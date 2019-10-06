/* global AlphaPoint, document, localStorage, APConfig */
import React from 'react';
import axios from '../axios';
import { DateTimePicker } from 'react-widgets';
import 'react-widgets/lib/less/react-widgets.less';

import moment from 'moment';
import momentLocalizer from 'react-widgets-moment';

import Checkbox from 'rc-checkbox';
import 'rc-checkbox/assets/index.css';

import ReactFlagsSelect from 'react-flags-select';
import Recaptcha from 'react-recaptcha';
import { checkValidity, checkErrorCode } from './helper';
import passwordValidator from 'password-validator';
// import Popup from './popupPersonal';
import { MoonLoader } from "react-spinners";
import {getURLParameter} from './helper';

var schema = new passwordValidator();
schema
.is().min(8)                                    // Minimum length 8
.is().max(15)                                   // Maximum length 15
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits()                                 // Must have digits
.has().not().spaces()  

const failedPasswordString = "Select an 8-15 character password with one number, lowercase letter and uppercase letter.";
class Signup extends React.Component {
  
    constructor(props) {
        super(props);
        this.state = {
            email: "",
            emailerr: false,
            password: "",
            passworderr: false,
            confirmPassword: "",
            confirmerr: false,
            country: "",
            countryerr: false,
            countryblocked: false,
            terms: false,
            errors: {},
            fail: false,
            submitWasAttempted: false,
            showCaptcha: false,
            showVerificationMessage: false,
            resendResponseSuccess: false,
            resendResponseFail: false
        }
    }

    componentDidMount() {
        axios.get(`cps/country`).then(res => {
            const blockedCountries = res.data.countries.filter(c => c.block).map(c => c.iso);
            this.setState({...this.state, blockedCountries: blockedCountries});
        }).catch(error => {
            checkErrorCode(error)
        })  
        const email = getURLParameter('usermail');
        if(email){
            this.setState({...this.state, showVerificationMessage: true, email})
        }
    }

    inputChanged = (name,val) => {
        this.setState({
            ...this.state,
            [name]: val,
        });
        if(name==="country"){
            this.isBlockedCountry(val)
        }
    }

    handleChange = (date) => {
        this.setState({
          ...this.state,
          birthdate: date
        });

    }

    toggle = () => {
        this.setState({terms: !this.state.terms});
    }


    toggleUsCitizen(id){
        this.setState({...this.state, isUSCitizen: id==='yes'})
    }

    showLearn(){
        this.setState({popup: !this.state.popup})
    }

    verifyCallback() {
        this.submitHandler()
    };

    callback() {
        // console.log('Done!!!!');
    };

    async submitHandler(e){
        const {email, password, country} = this.state;
        const payload = {
            email,
            password,
            country,
            requestSource: "veritex"
        }
        
        try {
            const {data} = await axios.put(`cps/signup`, payload)
            if(data.code === 201){
                this.setState({...this.state, showVerificationMessage: true, showCaptcha: false});
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;
            }
            
        }catch(err){    
            if(err && err.response && err.response.data && err.response.data.errorMessage){

                this.setState({...this.state, fail: err.response.data.errorMessage, showCaptcha: false});
                console.log("err: ", err.response)
            }
            checkErrorCode(err)
            // show error
        }
    }

    isValidateForm(){
        let failedPasswordRules = schema.validate(this.state.password,{ list: true});
        let proceedToAuth = true;

        let newState = {...this.state};
        
        if(!checkValidity(this.state.email, {isEmail:true})) {
            newState.emailerr = "Invalid email address";
            proceedToAuth = false;
        }else{
            newState.emailerr = false;
        }

        if(failedPasswordRules.length > 0) {
            newState.passworderr = failedPasswordString;
            proceedToAuth = false;
        }else{
            newState.passworderr = false;
        }
        
        if(this.state.password !== this.state.confirmPassword) {
            newState.confirmerr = true;
            proceedToAuth = false;
        }else{
            newState.confirmerr = false;
        }
        
        if(this.state.country === ""){ 
            newState.countryerr = true;
            proceedToAuth = false;
        }
        else{    
            newState.countryerr = false;
        }
        if(this.state.blockedCountries.includes(this.state.country)) {
            newState.countryblocked = true;
            proceedToAuth = false;
        }
        else{
            newState.countryblocked = false;
        }

        if(!this.state.terms) {
            newState.submitWasAttempted = true;
            proceedToAuth = false;
        }else{
            newState.submitWasAttempted = true;
        }
        this.setState({...this.state, ...newState})
        return proceedToAuth;
    }

    isBlockedCountry(country) {

        country = country || this.state.country

        if(country === ""){ 
            this.setState({countryerr: true});
            return true
        }
        else{    
            this.setState({countryerr: false});
        }
        if(this.state.blockedCountries.includes(country)) {
            this.setState({countryblocked: true});
            return true
        }
        else{
            this.setState({countryblocked: false});
        }
    }


      onClickOutside(e){
        const popup = document.getElementsByClassName("captcha-holder")[0];
        if(e.target == popup){
          this.setState({
            ...this.state,
            showCaptcha: false
          });
        }
      }

      createAccount(e){
          e.preventDefault();
          if(this.isValidateForm()){
              this.setState({...this.state, showCaptcha: true})
          }
      }

      resend(){

        const { email } = this.state || "" ;

        if(email) {
            axios.put('/cps/email/resend', {email})
            .then(res => {

                let resendResponse = res.data.status;
                if(resendResponse === 'Success') {
                    resendResponse = 'Verification email was resent.'
                    return this.setState({...this.state, resendResponseSuccess: true});
                }
                return this.setState({...this.state, resendResponseFail: true});
            }) 
            .catch(err => {
                if(err && err.response && err.response.status === 401){
                    return checkErrorCode(err)
                }
                return this.setState({...this.state, resendResponseFail: true});
            }) 
        }
    }

  render() {
    const servers = APConfig.serversList.concat(['Custom server']);
    const minDate = moment().subtract(100, "years")._d;
    const maxDate = moment().subtract(18, "years")._d;
    const Day = moment(maxDate).day()
    const Month = moment(maxDate).month()
    const Year = moment(maxDate).year()

        
    moment.locale('en')
    momentLocalizer();

    return (
        this.state.showVerificationMessage 
        ?
            <section id="emailVerification">
                <div className="container">
                    <h1>Email verification</h1>
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
                        <div>
                            <button onClick={() => this.resend()}>Resend Email</button>
                        </div>
                        {this.state.resendResponseSuccess && <p id="email-sent"><img src="img/email-resent.svg"/>Email has been sent successfully.</p>}
                    </div>
                </div>
            </section>
        :
        <div className="signup-container">
            <h1>Register</h1>
            {this.state.fail && <div id="fail">{this.state.fail}</div>}
            <form>
                <div className="inputWrapper">
                    <p className="label">Email</p>
                    <input type="text" className={this.state.emailerr ? "input-err" : ""} name="email" value={this.state.email} onChange={(e)=> this.inputChanged(e.target.name, e.target.value)}/>
                    {this.state.emailerr &&
                        <p className="error">{this.state.emailerr}</p>
                    }
                </div>
                <div className="inputWrapper">
                    <p className="label">Password</p>
                    <input type="password" className={this.state.passworderr ? "input-err" : ""} name="password" value={this.state.password} onChange={(e)=> this.inputChanged(e.target.name, e.target.value)}/>
                    <p className="error" style={{color: this.state.passworderr ? '#b40404' : '#333758'}}>Between 8-15 characters, must include UPPER and lower case letters and numbers</p>
                </div>
                <div className="inputWrapper">
                    <p className="label">Confirm password</p>
                    <input type="password" className={this.state.confirmerr ? "input-err" : ""} name="confirmPassword" value={this.state.confirmPassword} onChange={(e)=> this.inputChanged(e.target.name, e.target.value)}/>
                    {this.state.confirmerr &&
                        <p className="error">Passwords do not match</p>
                    }
                </div>
                <div className={this.state.countryblocked || this.state.countryerr || (this.state.errors && this.state.errors.country) ? "country-err dropDownCountries" : "dropDownCountries"}>
                    <ReactFlagsSelect placeholder="Country of Residence" searchable={true} onSelect={c => this.inputChanged('country', c)}/>
                    {this.state.countryblocked && <p className="error">We currently cannot accept clients from your country.</p>}
                    {this.state.countryerr && <p className="error">Field is required</p>}
                    {this.state.errors && this.state.errors.country && <p className="error">{this.state.errors.country}</p>}
                </div>
                <div className="CheckboxContainer" >
                    <label className={!this.state.terms && this.state.submitWasAttempted ? "checkbox-err" : ""}>
                        <Checkbox onChange={() => this.toggle()} />
                        <p style={{color: !this.state.terms && this.state.submitWasAttempted ? '#c90000f2' : ' #000'}}>
                        I confirm my acceptance of the,&nbsp;
                                <a href={`/terms.html`} target="_blank" rel="noopener noreferrer">Terms of Use</a>, &nbsp;
                                <a href={`/privacy.html`} target="_blank" rel="noopener noreferrer">Privacy Policy</a>, and&nbsp;
                                <a href={`/aml.html`} target="_blank" rel="noopener noreferrer">AML Policy</a>
                        </p>
                    </label>
                </div>
                <div style={{textAlign: 'center'}}>
                    <button id="create-account" onClick={event => this.createAccount(event)}>Create Account</button>
                </div>
                <p id="login-redirect">
                    Already registered? <a href="/login.html">Log In.</a>
                </p>
            </form>
            {
                this.state.showCaptcha && 
                <div className="clearfix captcha-holder" onClick={(e) => this.onClickOutside(e)}>
                    <div className="text-center">
                        <div className="re-captcha-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '24px auto 14px',width: '340px'}}>
                            <Recaptcha
                                    sitekey="6Lc9yrsUAAAAAELIegIzlEpsOkaauXbxBUejmFCq"
                                    render="explicit"
                                    verifyCallback={() => this.verifyCallback()}
                                    onloadCallback={this.callback}
                                    badge
                                />
                        </div>
                    </div>
                </div>

            }
        </div>
    );
  }
}

export default Signup;