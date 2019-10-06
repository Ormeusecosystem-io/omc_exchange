/* global AlphaPoint, document, localStorage, APConfig */
import React from 'react';
import axios from 'axios';
import InputLabeled from '../misc/inputLabeled';
import { checkValidity } from './helper';


class ContactForm extends React.Component {
  
    state = {
        name: "",
        email: "",
        message: "",
        name_err: false,
        email_err: false,
        message_err: false,
        success: false,
        fail: false
    }

    validate(){
        let isValid = true;
        const state = {};
        const mandatoryFields= ["name", "email", "message"];
        mandatoryFields.forEach(field => {
            if(this.state[field] === ""){
                state[`${field}_err`] = "Required field";
                isValid = isValid && false;
            }
        })
        if(this.state.email !== "" && !checkValidity(this.state.email, {isEmail:true})) {
            state.email_err = "Invalid email address";
            isValid = false;
        }

        this.setState({...this.state, ...state})
        return isValid;
    }

    async onSubmit(e){
        e.preventDefault();
        if(this.validate()){
            const payload = {...this.state};
            Object.keys(payload).forEach(field => (field.includes("err") || field.includes("success") || field.includes("fail")) && delete payload[field]);
            try{

                const res = await axios.put(`${process.env.ON_BOADRDING_URL}/contact-us`, payload);
                if(res.status === 204){
                    this.setState({...this.state, success: true, email: "", message: "", name: "", fail: false})
                    this.refs.email.setValue("")
                    this.refs.name.setValue("")
                    setTimeout(() => {
                        this.setState({...this.state, success: false})
                    }, 4000)
                }
            }
            catch(e){
                this.setState({...this.state, fail: true})
            }
        }
    }

    
    onChange(e){
        this.setState({...this.state, [e.target.name]: e.target.value, [`${e.target.name}_err`]: false})
    }

    closeTooltip(){
        this.setState({...this.state, fail: false})
    }

    render() {
        return (
        <form onSubmit={(e) => this.onSubmit(e)} id="contactForm">
            {this.state.success && <div id="success">Thank you for contacting us. We will get back to you soon.</div>}
            {this.state.fail && <div id="fail">There was an error submitting your request.<span onClick={() => this.closeTooltip()}>+</span></div>}
            <InputLabeled
                placeholder="Full Name*"
                label="Full Name*"
                className={`input-field form-control`}
                name="name"
                onChange={(e) => this.onChange(e)}
                throwError={this.state.name_err}
                errorDescription={this.state.name_err}
                ref="name"
            />
            <InputLabeled
                placeholder="E-mail"
                label="E-mail*"
                className={`input-field form-control`}
                name="email"
                onChange={(e) => this.onChange(e)}
                throwError={this.state.email_err}
                errorDescription={this.state.email_err}
                ref="email"
            />
            <div className={`form-group`}>
                <label>Message*</label>
                <div className="input-group">
                    <textarea name="message" onChange={(e) => this.onChange(e)} className={this.state.message_err ? "invalidInput" : ""} value={this.state.message}/>
                    {this.state.message_err && <label htmlFor={this._rootNodeID} className="error">{this.state.message_err}</label>}
                </div>
            </div>
            <button type="submit" class="btn btn-lg submit underline">SUBMIT</button>
        </form>
        );
    }
}

export default ContactForm;