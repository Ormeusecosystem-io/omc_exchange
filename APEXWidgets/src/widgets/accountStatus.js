import React from 'react';
import axios from '../axios';
import { MoonLoader } from "react-spinners";

class AccountStatus extends React.Component{

    state = {
        accountStatus: "authorized",
        loading: true
    }

    async componentDidMount(){
        try {
            const {data} = await axios.get('/cps/account/status');
            if(data && data.code === 200 && data.accountStatus){
                this.setState({...this.state, accountStatus: data.accountStatus, loading: false})
            }
        } catch (e) {
            this.setState({...this.state, loading: false})
        }
    }
    
    render(){
        const isApproved = this.state.accountStatus === "approved";
        return (
            <div>
                {this.state.loading 
                 ? <div className="isLoading"><MoonLoader sizeUnit={"px"} size={90} color={'rgb(43,191,223)'} loading={true} /></div>
                 :
                    <div className="account-status">
                        <img src={`img/${isApproved ? 'verify-big.svg' : 'wait-icon.svg'}`}/>
                        <h2>{isApproved ? 'Your account has been verified.' : 'Your application is under review…'}</h2>
                        <h3>{isApproved ? 'You now have full access to all Veritex features.': 'Please be patient, it usually takes up to 5 days to verify your KYC information.'}</h3>
                    </div>
                 }
            </div>
        )
    }
} 

export default AccountStatus;