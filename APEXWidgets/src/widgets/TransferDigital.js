/* global AlphaPoint, document, location $ */
import React from 'react';
import ScrollLock from 'react-scrolllock';
import axios from '../axios';
import QRCode from 'qrcode.react';
import WidgetBase from './base';
import SelectLabeled from '../misc/selectLabeled';
import InputLabeled from '../misc/inputLabeled';
import InputNoLabel from '../misc/inputNoLabel';
import Spinner from '../misc/spinner';
import Modal from './modal';
import merchants from '../merchants.json';
import Validate from '../misc/form/validators';
import {
    formatNumberToLocale,
    customFixed
} from './helper';

class TransferDigital extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            session: {},
            address: "",
            amount: "",
            success: false,
            fail: false,
            addressErr: false,
            amountErr: false
        };
    }

    componentWillMount(){
        const amount = formatNumberToLocale(this.props.balance, 8);
        const merchant = localStorage.getItem("ccxMerchant");
        const address = merchants[merchant];
        this.setState({
            ...this.state,
            amount: amount,
            address: address ? address : ""
        })
    }

    componentDidMount() {
        this.session = AlphaPoint.getUser.subscribe(session => this.setState({ session }));
        const props = this.props;
        this.transferFunds = AlphaPoint.transfunds
        .filter(data => Object.keys(data).length)
        .subscribe(data => {
            console.log("cb data::  ", data)
            const growlerOpts = AlphaPoint.config.growlerDefaultOptions;
            if (data && data.result) {
               this.setState({...this.state, success: true})
            } 
            else if(data && data.result !== undefined && data.detail !== 'Waiting for 2FA'){
                this.setState({...this.state, success: true})
            }
            else if (data && !data.result) {
                console.log(data)
                console.log("!data.result: ", !data.result)
                this.setState({...this.state, fail: true})
            }
            });
    }


    transferValid(){
        return true
    }

    formValidation(){
        let invalidAddress = !this.validateAddress('submit', this.state.address);
        let invalidAmount = this.state.amount <= 0 || this.state.amount > this.props.balance || this.state.amount === "";
        this.setState({amountErr: invalidAmount, addressErr: invalidAddress});
        return invalidAmount || invalidAddress;
    }

    async transferNow(){
    
        if(this.formValidation()){
            return
        }
        if(!this.state.session || !this.transferValid){
            return alert('no session or not valid')
        }

        let data = {
            OMSId: this.state.session.OMSId,
            ProductId: this.props.productId,
            SenderAccountId: this.state.session.AccountId,
            Notes: 'transfer',
            ReceiverUsername: '',
            Amount: this.state.amount,
          };

        let res;

        if(Validate.email(this.state.address)){
            data.ReceiverUsername = this.state.address;
        }
        else{
            try {
                let ccxMerchant;

                for(let key in merchants){
                    if(merchants[key] === this.state.address){
                        ccxMerchant = key;
                    }
                }
    
                const payload = {
                    "source":ccxMerchant || "",
                    "userId":this.state.session.AccountId,
                    "hash": this.state.address || "",
                }
    
                res = await axios.post(`/exchange/getEmailFromHash`, payload)
                console.log('res: ', res)
                
                data = {
                    ...data,
                    ReceiverUsername: res.data.email
                }
    
            }catch(e){
                console.log('error:: ', e)
            }
        }
        
        
        console.log('payload sent', data);
        AlphaPoint.transferFunds(data);
    }

    onChange = ({target, type}) => {
        const {name, value} = target;
        let invalidAddress = this.state.addressErr;
        let invalidAmount = this.state.amountErr;
        if(name === 'amount'){
            if(isNaN(value))return;
            invalidAmount = value <= 0 || value > this.props.balance || value === "";
        }
        else{
            invalidAddress = !this.validateAddress(type, value);
        }
        this.setState({
            ...this.state, 
            [name]: value, 
            addressErr: invalidAddress, 
            amountErr: invalidAmount
        });
    }

    validateAddress(eventType, value){
        if(value.length >= 32 && !value.includes("@")){
            let address;
            for(let key in merchants){
                if(merchants[key] === value){
                    address = merchants[key];
                }
            }
            return address;
        }
        else if(value.includes("@")){
            return Validate.email(value);
        }
        else{
            if(eventType === 'blur' || eventType === 'submit'){
                return this.setState({ addressErr: true })
            }
            return true;
        }
    }

    displayAvailableBalance(){
        if(this.props.balance > 0){
            if(customFixed(this.props.balance, 8) > 0){
                return customFixed(this.props.balance, 8)
            }
            return formatNumberToLocale(this.props.balance, 2)
        }
        return formatNumberToLocale(this.props.balance, 2)
    }

    close(){
        this.setState({success: false})
        this.props.close();
    }

    render() {
        if(this.state.success){
            return (
                <Modal idModal="filledOrder">
                    <div>
                        <div>
                        <div className="ap-widget successPopup">
                            <div>
                            <div id="close-success-btn">
                                <div>Success</div>
                                <span onClick={()=>this.close()}>+</span>
                            </div>
                            </div>
                            <div  className="ap-body">
                            <div className="inner">
                                <div className="pad pad-success">
                                <div className="successIcon"></div>
                                <h1 className="text-center success">Your transfer request was successful!</h1>
                                <button className="btn btn-action" id="close" onClick={()=>this.close()}>
                                    <div id="deposit-close-button-icon"></div>
                                    <div>CLOSE</div>
                                </button>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </Modal>
            )
        }
        else if(this.state.fail){
            return (
                <Modal idModal="buysell-error-modal" close={() => this.close()}>
                    <div div className="ap-widget">
                    <div className="ap-header">
                        <div style={{ float: 'right' }} className="ap-header-actions">
                        <div>
                            <div className="ap-header-actions-btn-close" onClick={() => this.close()}>×</div>
                        </div>
                        </div>
                    </div>
                    <div id="closeBtn" onClick={()=>this.close()}>
                        <div>+</div>
                    </div>
                    <div className="modal-body">
                        Your transfer could not be processed, please check the recipient's email and try again.
                        <button className="btn btn-action" id="close" onClick={()=>this.close()}>
                        <div id="deposit-close-button-icon"></div>
                        <div>CLOSE</div>
                        </button>
                    </div>
                    </div>
                </Modal>
            )
        }

        return (
           
            <WidgetBase
                {...this.props}
                login
                headerTitle='Transfer details'
                customClass="transfer"
                withCloseButton={true}
            >
                <div className="pad">
                    <div className="transfer-inputs-wrapper">
                        {this.props.isBalanceChange && <div className="successIcon thankyou"></div>}
                        {this.props.isBalanceChange && <p id="thankyou">Thank you for your purchase!</p>}
                        {!this.props.isBalanceChange && <p>Please insert a valid recipient email address.</p>}
                        <p className={this.props.isBalanceChange && 'center'}>You have <strong>{this.displayAvailableBalance()}</strong> available for transfer</p>
                        {this.props.isBalanceChange && <p className={this.props.isBalanceChange && 'center'}>Please approve the recipient address and amount in order to complete the transfer</p>}
                        <div className="transfer-input-holder">
                            <label>Recipient address</label>
                            <input value={this.state.address} name="address" onChange={this.onChange} onBlur={(e) => this.validateAddress(e.type, e.target.value)} placeholder="Email address to send" className={this.state.addressErr && 'invalidInput'}/>
                            {this.state.addressErr && <p>Invalid address</p>}
                        </div>
                        <div className="transfer-input-holder">
                            <label>Transfer amount</label>
                            <input value={this.state.amount} name="amount" onChange={this.onChange} placeholder="Amount to send" className={this.state.amountErr && 'invalidInput'}/>
                            {this.state.amountErr && <p>Invalid transfer amount</p>}
                        </div>
                        <div className='transfer-button-wrapper'>
                            <button id="no" onClick={() => this.props.close()}>Cancel</button>
                            <button id="yes" onClick={()=>this.transferNow()}>Transfer now</button>
                        </div>
                    </div>
                    
                </div>
            </WidgetBase>
        );
    }
}

TransferDigital.defaultProps = {
  close: () => {
  },
  Product: '',
  ProductId: null,
};

TransferDigital.propTypes = {
  close: React.PropTypes.func,
  Product: React.PropTypes.string,
  ProductId: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
  ]),
};

export default TransferDigital;
