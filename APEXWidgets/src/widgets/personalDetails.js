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
import { checkValidity } from './helper';
import passwordValidator from 'password-validator';
import Popup from './popupPersonal';
import { MoonLoader } from "react-spinners";

var schema = new passwordValidator();
schema
.is().min(8)                                    // Minimum length 8
.is().max(15)                                   // Maximum length 15
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits()                                 // Must have digits
.has().not().spaces()  

const failedPasswordString = "Select an 8-15 character password with one number, lowercase letter and uppercase letter.";
class PersonalDetails extends React.Component {
  
    constructor(props) {
        super(props);
        this.state = {
            firstname: undefined,
            lastname: undefined,
            country: undefined,
            street: undefined,
            buildingNumber: undefined,
            middlename: undefined,
            city: undefined,
            zipcode: undefined,
            birthdate: undefined,
            isUSCitizen: false,
            state: undefined,
            errorOnEmptyFields: false,
            isLoading: true,
            popup: false,
            country: ''
        }
    }

    async componentDidMount() {
        // console.log("this.props.details: ", this.props.details)
        let res;
        try {
            res = await axios.get('/cps/details');
        } catch (e) {
            console.log("personal error: ", e)
            return {};   
        }

        var details = res.data.details;
        details.isUSCitizen = details.isUSCitizen === 1;
        details.birthdate = details.birthdate === null ? undefined : moment(details.birthdate);
        details.isLoading = false;

        let newState = { ...this.state }
        Object.keys(details).forEach(key => {
            if(details[key]!==null){
                newState[key] = details[key];
            }
        })
        this.setState({...newState})
    }

    toggleCheckbox = () => {
        this.setState({...this.state, isUSCitizen: !this.state.isUSCitizen});
    }

    handleChange = (date) => {
        // console.log(date)
        this.setState({
          ...this.state,
          birthdate: date
        });

    }

    inputChanged = (name,val) => {
        
        this.setState({
            ...this.state,
            [name]: val
          });
    }

    toggleUsCitizen(id){
        this.setState({...this.state, isUSCitizen: id==='yes'})
    }

    async onSubmit(e) {
        e.preventDefault()
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        Object.keys(this.state);
        const fieldsToValidate = ['firstname','lastname','country','street','city', 'zipcode', 'birthdate'];

        let validationPassed = fieldsToValidate.filter(key => this.validate(key, true)).length == 0;

        if(!validationPassed) {
            this.setState({...this.state,errorOnEmptyFields:true});
            return;
        }
        try {
            const isUSCitizen = this.state.isUSCitizen ? 1 : 0;
            const payload = {...this.state, birthdate: moment(this.state.birthdate), isUSCitizen}
            const res = await axios.put('/cps/details', payload);
            if(res.status === 201) {
                this.props.changeStep(2)
            }
          } catch (e) {
                console.log(e);
          }
    }


    validate(field, errorOnEmptyFields) {

        // Optionally allow to enforce error on empty fields
        const errOnEmpty = errorOnEmptyFields || this.state.errorOnEmptyFields;

        // Return true on validation error!
        if(errOnEmpty && !this.state[field]) {  return true; }
        if(this.state[field] != undefined && this.state[field].length == 0 ) {  return true; }

 
        return false;
    }

    showLearn(){
        this.setState({popup: !this.state.popup})
    }



  render() {
    const maxDate = moment().subtract(18, "years")._d;

    const Day = moment(maxDate).day()
    const Month = moment(maxDate).month()
    const Year = moment(maxDate).year()

    const minDate = moment().subtract(100, "years")._d;
    // const birthdate = this.state.birthdate !== null ? this.state.birthdate.toDate() : "";
    
    moment.locale('en')
    momentLocalizer()
    return (
        <div className="personal-details">
            <h2>Personal details</h2>
            <h3>Please fill in your personal information below</h3>
            {this.state.submmited && (<div className="loader" style={{display: 'flex', justifyContent: 'center'}}><MoonLoader sizeUnit={"px"} size={90} color={'#637cc5'} loading={true} /></div> )}
            <form>
                {this.state.popup && <Popup onClick={() => this.showLearn()}/>} 
                <div className="inputWrapper">
                    <p className="label">First name</p>
                    <input type="text" placeholder="First name" name="firstname" value={this.state.firstname} onChange={(e)=> this.inputChanged(e.target.name, e.target.value)}/>
                    {this.validate("firstname") &&
                        <p className="error">Field is required</p>
                    }
                </div>
                <div className="inputWrapper">
                    <p className="label">Middle name (optional)</p>
                    <input type="text" placeholder="Middle name" name="middlename" value={this.state.middlename} onChange={(e)=> this.inputChanged(e.target.name, e.target.value)}/>
                    {this.props.error &&
                        <p className="error">Field is required</p>
                    }
                </div>
                <div className="inputWrapper">
                    <p className="label">Last name</p>
                    <input type="text" placeholder="Last name" name="lastname" value={this.state.lastname} onChange={(e)=> this.inputChanged(e.target.name, e.target.value)}/>
                    {this.validate("lastname") &&
                        <p className="error">Field is required</p>
                    }
                </div>
                <div className="inputWrapper">
                    <DateTimePicker 
                        id="datePicker"
                        placeholder={'Date of birth' + " MM/DD/YYYY"}
                        time={false}
                        min={minDate} 
                        value={this.state.birthdate ? new Date(this.state.birthdate) : null}
                        defaultCurrentDate={new Date(Year,Month,Day)}
                        max={new Date(Year,Month,Day)}// disable 18 years back
                        onChange={(date) => this.handleChange(date)}
                    />
                    {this.validate('birthdate') && <p className="error">Field is required</p>} 
                </div>
                <div className="inputWrapper">
                    <p className="label">Building number (optional)</p>
                    <input type="text" placeholder="Building number" name="buildingNumber" value={this.state.buildingNumber} onChange={(e)=> this.inputChanged(e.target.name, e.target.value)}/>
                </div>
                <div className="inputWrapper">
                    <p className="label">street</p>
                    <input type="text" placeholder="Street" name="street" value={this.state.street} onChange={(e)=> this.inputChanged(e.target.name, e.target.value)}/>
                    {this.validate("street") && <p className="error">Field is required</p>}
                </div>
                <div className="inputWrapper">
                    <p className="label">City</p>
                    <input type="text" placeholder="City" name="city" value={this.state.city} onChange={(e)=> this.inputChanged(e.target.name, e.target.value)}/>
                    {this.validate("city") && <p className="error">Field is required</p>}
                </div>
                <div className="inputWrapper">
                    <p className="label">Zip/Postal code</p>
                    <input type="text" placeholder="Zip/Postal code" name="zipcode" value={this.state.zipcode} onChange={(e)=> this.inputChanged(e.target.name, e.target.value)}/>
                    {this.validate("zipcode") && <p className="error">Field is required</p>}
                </div>

                <div className="inputWrapper">
                    <input type="text" disabled placeholder="Country" id="country" name="country" value={this.state.country}/>
                </div>
               
               <div style={{display: 'flex'}}>
                    <p className="ConfirmText">Are you U.S. reportable for tax purposes and/or hold U.S. citizenship?<span id="learn" onClick={() => this.showLearn()}>&nbsp;Learn more</span></p>
                    <div className="RadiosContainer">
                        <label htmlFor="yes" className="yesNoLabel">
                            <div className="radioButton" style={{borderColor: this.state.isUSCitizen ? "#0091ff" : "#cad4e3"}}><div className="RadioButtonChecked" style={{opacity: this.state.isUSCitizen ? '1' : '0'}}></div></div>
                            <span className="CitizenText" style={{fontWeight: this.state.isUSCitizen ? 'bold' : 'normal'}}>Yes</span>
                        </label>
                        <label htmlFor="no" className="yesNoLabel">
                            <div className="radioButton" style={{borderColor: !this.state.isUSCitizen ? "#0091ff" : "#cad4e3"}}><div className="RadioButtonChecked" style={{opacity: !this.state.isUSCitizen ? '1' : '0'}}></div></div>
                            <span className="CitizenText" style={{fontWeight: !this.state.isUSCitizen ? 'bold' : 'normal'}}>No</span>
                        </label>
                        <input style={{display: 'none'}} onClick={e => this.toggleUsCitizen(e.target.id)} name="usCitizen" type="radio" id="yes"/>
                        <input style={{display: 'none'}} onClick={e => this.toggleUsCitizen(e.target.id)} name="usCitizen" type="radio" id="no"/>
                    </div> 
               </div>   
                
            </form>
            <div style={{textAlign: 'right', width: "100%", marginTop: "35px"}}>
                <button id="submit" onClick={event => this.onSubmit(event)}>Next Step</button>
            </div>
        </div>
    );
  }
}

export default PersonalDetails;