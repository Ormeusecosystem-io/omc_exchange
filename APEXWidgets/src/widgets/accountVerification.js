/* global AlphaPoint */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import PersonalDetails from './personalDetails';
import KycUpload from './kycUpload';
import CcProof from './ccProof';
import AccountStatus from './accountStatus';
import {ProgressBar} from './progressBar';
import axios from '../axios';
import { MoonLoader } from "react-spinners";
import {checkErrorCode} from './helper';

class AccountVerification extends React.Component {
  constructor() {
    super();
    this.state = {
        step: 0,
        isLoading: true
    }
  }

    changeStep(step){
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        this.setState({...this.state, step})
    }


    async checkStep(reqStep) {
        let opt = {}
        try {
            if(reqStep) {
                opt = {step: reqStep}
            }
            const {data} = await axios.post('cps/step', opt);
            if(data.code === 200){
                return data.step
            }
        } catch (error) {
            checkErrorCode(error)
        }
    }

    async componentDidMount(){
        const serverStep = await this.checkStep();
        if(serverStep !== this.state.step) {
            this.setState({step: serverStep, isLoading: false})
        }
    }
    
    async componentDidUpdate(prevProps, prevState){
        if(this.state.step !== prevState.step){
            const serverStep = await this.checkStep(this.state.step) 
            if(this.state.step > serverStep || this.state.step == 0 || serverStep == 5 && this.state.step < 5) {
                return this.setState({step: serverStep, isLoading: false})
            }
        }
        if(this.state.isLoading && !prevState.isLoading){
            return this.setState({...this.state, isLoading: false})
        }
    }

    getView() {
        if(!this.state.isLoading) {
            switch (this.state.step) {
                case 1: return <PersonalDetails changeStep={(step) => this.changeStep(step)}/>
                
                case 2: return <KycUpload isPoi changeStep={(step) => this.changeStep(step)}/>        
                
                case 3: return <KycUpload changeStep={(step) => this.changeStep(step)}/>        
                
                case 4: return <CcProof changeStep={(step) => this.changeStep(step)}/>
                
                case 5: return <AccountStatus/>
                
                default: return false
            }
        }
        return false
    }

    getWidth(){
        if(this.state.step === 1){
            return "720px"
        }
        else if(this.state.step === 2 || this.state.step ===3 || this.state.step === 4){
            return "555px"
        }
        else{
            return "480px"
        }
    }

    render(){
        const view = this.getView();
        if(view) {
            return (
                    <div style={{width :"100%", marginBottom: "45px", display: "flex", justifyContent: "center"}} id="account-verification-container">
                        <div style={{width: '100%', maxWidth: this.getWidth()}}>
                            <h1 id="verification-title">Account verification</h1>
                            { this.state.step !== 5 && <ProgressBar step={this.state.step}/> }
                            { view }
                        </div>
                    </div>
                )
        }
        return (
            <div className="isLoading"><MoonLoader sizeUnit={"px"} size={90} color={'rgb(43,191,223)'} loading={true} /></div>
        )
    }
}


export default AccountVerification;
