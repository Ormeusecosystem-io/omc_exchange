import React, { Component } from 'react';
import ethereum_address from "./checkErc20";
import moment from 'moment';
import { formatNumberToLocale } from './helper';
import socketIOClient from 'socket.io-client';
import sailsIOClient from 'sails.io.js';
import axios from '../axios';
import Modal from './modal';
import {noExponents, customFixed} from './helper';
import HighchartsContainer from './highcharts';
import { MoonLoader } from "react-spinners";
import debounce from 'debounce';
const hash = require('object-hash');
const sockerUrl = 'https://tickers.ccx.io';

export default class Otc extends Component {
    
    state = {
        selectedCurrency: 'btc',
        amount: '',
        userConfig: {},
        accountInfo: {},
        productsInformation: [],
        address: '',
        ORMEUS_ETH: 0,
        ORMEUS_BTC: 0,
        volume: 0,
        discountRates: {},
        discountRatesHash: [],
        history: [],
        invalidAddress: false,
        invalidAmount: false,
        success: false,
        error: false,
        isLoading: false,
        converting: false
    }
    

    onChangeHandler(name, value){
        if(name === 'amount'){
            if(isNaN(value)){
                return;
            }
            this.setState({...this.state, [name]: value, converting: true, invalidAmount: false})
        }
        else if(name === 'selectedCurrency'){
            this.setState({...this.state, invalidAmount: false, [name]: value, amount: ''})
        }
        else{
            this.setState({...this.state, [name]: value})
        }
    }

    componentDidUpdate(prevProps, prevState) {
        
    }

    onKeyUpDebounce = debounce(this.turnOffConvertingMode, 300)

    turnOffConvertingMode(){
        this.setState({...this.state, converting: false})
    }
    
    componentDidMount() {
        
        this.accountInformation = AlphaPoint.accountPositions.subscribe(accountInformation => {
          if (accountInformation && accountInformation.length){
              accountInformation = accountInformation
                  .filter(({ProductSymbol}) => ProductSymbol === 'BTC' || ProductSymbol === 'ETH')
                  .map(({Amount, Hold, ProductId, ProductSymbol}) => ({Amount: Number(formatNumberToLocale(Amount, 8)), Hold, ProductId, ProductSymbol }));
                  this.setState({ ...this.state, productsInformation: accountInformation });
              }
          });
   
        this.accountInformation2 = AlphaPoint.accountInfo.subscribe(data => {
          this.setState({ ...this.state, accountInfo: data });
        });
        this.userConfiguration = AlphaPoint.getUserConfig.subscribe(data => {
          this.setState({ ...this.state, userConfig: data });
        });

        let io = sailsIOClient(socketIOClient);
        
        io.sails.url = sockerUrl; //TODO : change with enviroment variable
        
        io.socket.get('/api/ws/ticker?pair=ORMEUS_BTC', (body, JWR) => {
            if(JWR.statusCode == 201){
                this.setState({...this.state, ORMEUS_BTC: body.last})
            }
        });

        io.socket.get('/api/ws/ticker?pair=ORMEUS_ETH', (body, JWR) => {
            if(JWR.statusCode == 201){
                this.setState({...this.state, ORMEUS_ETH: body.last})
            }
        });

        io.socket.on('message', ({pair, last}) => {
            this.setState({ ...this.state, [pair]: last });
        });

        io.socket.on('error', (body) => {
            this.setState({...this.state, error: true});
        });

        axios.get(`/otc/transactionHistory`)
        .then((res) => {
          if(res.status === 200){
              if(res.data && res.data.length > 0){
                this.setState({...this.state, history: res.data})
              }
          }
        }).catch(err => {
            if(err.response.status === 401){
                return window.location.href = "/?login=true"
            }
        });

        axios.get(`/otc/discountRates`)
        .then((res) => {
            if(res.status === 200){
                if(res.data){
                    this.setState({...this.state, discountRates: res.data})
                }
            }
            }).catch(err => {
                if(err.response.status === 401){
                    return window.location.href = "/?login=true"
                }
            });
        
    }

      
    getAvailableAmount(){
        const {selectedCurrency} = this.state;
        if(this.state.productsInformation.length > 0){
            const currencyData = this.state.productsInformation.filter(info => info.ProductSymbol === selectedCurrency.toLocaleUpperCase())
            if(currencyData.length > 0){
                const availableAmount = currencyData[0].Amount - currencyData[0].Hold;
                if(availableAmount > 0){
                    if(customFixed(availableAmount, 8) > 0){
                        return customFixed(availableAmount, 8)
                    }
                    return customFixed(availableAmount, 2)
                }
                return customFixed(availableAmount, 2)
            }
        }
    }

    validateAmount(){
        const isValidAmount = Number(this.state.amount) <= this.getAvailableAmount() && Number(this.state.amount) > 0 && this.state.amount !== '';
        this.setState({...this.state, invalidAmount: !isValidAmount})
        return isValidAmount;
    }

    getPurchasedQuanity(){
        return this.state.discountRates.rateOverride || this.getDiscount(true) > 0
                ? Number(this.getAfterDiscount())
                : Number(customFixed(this.state.amount / this.state[`ORMEUS_${this.state.selectedCurrency.toUpperCase()}`], 4))

    }

    buyNow(){
        if(!this.validateAmount() || !this.validateAddress()){
           return;
        }
       
        this.setState({...this.state, isLoading: true})
        const payload = {
            paidQuantity: Number(this.state.amount),
            purchasedQuantity: this.getPurchasedQuanity(),
            rate: Number(this.state[`ORMEUS_${this.state.selectedCurrency.toUpperCase()}`]),
            pair: `ORMEUS_${this.state.selectedCurrency.toUpperCase()}`,
            discountHash: hash.MD5(this.state.discountRates),
            walletAddress: this.state.address,
            discount: this.state.discountRates.rateOverride ? this.state.discountRates.rateOverride : this.getDiscount() / 100
        }
        
        axios.post(`/otc/purchase`, payload)
        .then((res) => {
            if(res.status === 201){
                return this.setState({...this.state, success: true, isLoading: false})
            }
            return this.setState({...this.state, error: true, isLoading: false})
        }).catch(err => {
            this.setState({...this.state,error: true, isLoading: false})
            console.log(err)
            //TODO :: open faild popup with message
        })
    }

    validateAddress(){
        const isValidAddress = ethereum_address.isAddress(this.state.address);
        this.setState({...this.state, invalidAddress: !isValidAddress})
        return isValidAddress;
    }

    closeModal(){
        this.setState({...this.state, error: false, success: false})
    }

    getDiscountList(isVolume, getDiscount) {
        if(Object.keys(this.state.discountRates).length && Object.keys(this.state.discountRates.rates).length){
            const discountObj = this.state.discountRates.rates[`ORMEUS_${this.state.selectedCurrency.toUpperCase()}`];
            let [keys, values] = [Object.keys(discountObj), Object.values(discountObj)];
            if(isVolume){
                keys.unshift('0');
                return getDiscount? keys.map(k=>Number(k)) : keys.map((key, idx) => 
                (<li key={idx}> 
                    <span>{idx < 1 ? keys[idx +1 ] + " - " : idx !== keys.length-1 ? keys[idx] + " - " + keys[keys.length-1] : keys[keys.length-1] + " +"}</span>
                    <span>{this.state.selectedCurrency.toLocaleUpperCase()}</span>
                </li>));
            }
            values.unshift('0');
            return getDiscount? values : values.map((value, idx) => (<li key={idx}> {(value * 100) + '%'}  </li>));
        }
    }

    getDiscount(getIndex){
        const amount = Number(this.state.amount);
        const [volumeList, discountList] = [this.getDiscountList(true, true), this.getDiscountList(false, true)];
        if(discountList && volumeList){
            const idx = amount < volumeList[1] ? 0 : amount >= volumeList[2] ? 2 : 1;
            return getIndex ? idx : (discountList[idx] * 100)
        }
    }

    getAfterDiscount() {
        const rate = this.state[`ORMEUS_${this.state.selectedCurrency.toUpperCase()}`];
        const discount = this.state.discountRates.rateOverride ? this.state.discountRates.rateOverride * 100 : this.getDiscount();
        const reduce = discount / 100 * rate;
        const newRate = rate - reduce;
        const afterDiscount = Number(this.state.amount) / newRate
        return customFixed(afterDiscount, 4);
    }
    
    render() {
        return (
            <div>
                <HighchartsContainer pair={`ORMEUS_${this.state.selectedCurrency.toUpperCase()}`} url={sockerUrl} /> 
                <div id="otc-container">
                    <h1 className="otc-title">Purchase Ormeus Coins</h1>
                    <div id="inputes-wrapper">
                        <div className="inner-left">
                            <div className="inner-title">You Send {this.state.selectedCurrency === 'btc' ? 'Bitcoin' : 'Ethereum'}</div>
                            <div className={this.state.invalidAmount ? 'invalidAmountInput currency-input' : 'currency-input'}>
                                <input type="text" value={this.state.amount} name="amount" onChange={(e) => this.onChangeHandler(e.target.name, e.target.value)} onBlur={() => this.validateAmount()} onKeyUp={() => this.onKeyUpDebounce()}/>
                                <div className="select-wrapper">
                                    <div className={`${this.state.selectedCurrency}-icon`}></div>
                                    <select defaultValue={this.state.selectedCurrency} name="selectedCurrency" onChange={(e) => this.onChangeHandler(e.target.name, e.target.value)}>
                                        <option value="btc">BTC</option>
                                        <option value="eth">ETH</option>
                                    </select>
                                    <div id="select-currency-arrow"></div>
                                </div>
                            </div>
                            <p>Available {this.state.selectedCurrency.toLocaleUpperCase()} amount: {this.getAvailableAmount()}</p>
                            {this.state.invalidAmount && <p id="invalid-amount">Invalid amount</p>}
                        </div>
                        <div id="convert-icon" className={this.state.converting ? 'rotate': ''}></div>
                        <div className="inner-right">
                            <div className="inner-title">You Get Ormeus</div>
                            <div className="currency-input">
                                <input type="text" value={customFixed(this.state.amount / this.state[`ORMEUS_${this.state.selectedCurrency.toUpperCase()}`], 4)} disabled/>
                                <div className="orme-currency"><div className="orme-icon"></div>Orme</div>
                            </div>
                            <p>Rate 1 {this.state.selectedCurrency.toLocaleUpperCase()} = {customFixed(1 / this.state[`ORMEUS_${this.state.selectedCurrency.toUpperCase()}`], 4)} ORME</p>
                        </div>
                    </div>
                    <div id="volume-section">
                        <h2>Discount: {this.state.discountRates.rateOverride ? this.state.discountRates.rateOverride * 100 : this.getDiscount()}%</h2>
                        <div id="volume-table">
                            <div className="left-column">
                                <h3>Volume</h3>
                                <ul className='range-list'>
                                    {
                                        this.getDiscountList(true)
                                    }
                                </ul>
                            </div>
                            <div className="right-column">
                                <h3>Ormeus coin discount</h3>
                                <ul>
                                    {
                                        this.getDiscountList(false)
                                    }
                                </ul>
                            </div>
                        </div>
                    </div>
                    {(this.state.discountRates.rateOverride || this.getDiscount(true) > 0) && 
                    <div>

                        <h2>Amount received after discount</h2>
                        <div className="currency-input discount">
                            <input type="text" value={this.getAfterDiscount()} disabled/>
                            <div className="orme-currency"><div className="orme-icon"></div>Orme</div>
                        </div>
                    </div>}
                    <div className="wallet-address">
                        <p>Please provide your destination ERC - 20 Ethereum wallet address to receive ORME tokens</p>
                        <input type="text" value={this.state.address} name="address" onChange={(e) => this.onChangeHandler(e.target.name, e.target.value)} onBlur={() => this.validateAddress()}/>
                        {this.state.invalidAddress && <span>Invalid address</span>}
                    </div>
                    <button onClick={() => this.buyNow()}>Buy Now</button>
                </div>
                <div className="table-wrapper">
                    <h3 className="otc-purchase-history">Purchase history</h3>
                    <table className="history-table">
                        <thead>
                            <tr id="top-table">
                                <th scope="col">Date</th>
                                <th scope="col">Sent</th>
                                <th scope="col">Received</th>
                                <th scope="col">Discount</th>
                                <th scope="col">Rate</th>
                                <th scope="col">Destination wallet</th>
                                <th scope="col">Status</th>
                            </tr>
                        </thead>
                        {this.state.history.length > 0 && 
                        <tbody>
                            {this.state.history.map((h, i) => (
                                <tr key={i}>
                                    <td scope="row" data-label="Date">{moment(h.date).format('LLLL')}</td>
                                    <td data-label="Sent">{h.sent} {h.pair.split("_")[1]}</td>
                                    <td data-label="Received">{h.received} {h.pair.split("_")[0]}</td>
                                    <td data-label="Discount">{h.discount}</td>
                                    <td data-label="Rate">{h.rate}</td>
                                    <td data-label="Destination wallet"><div className="destinationWallet">{h.destinationWallet}</div></td>
                                    <td data-label="Status">{h.status}</td>
                                </tr>
                            ))}
                        </tbody>}
                    </table>
                </div>
                {this.state.success && 
                <Modal idModal="filledOrder">
                    <div>
                        <div>
                            <div className="ap-widget buy successPopup">
                                <div>
                                    <div id="close-success-btn">
                                    <div>Success</div>
                                    <span onClick={()=>this.closeModal()}>+</span>
                                    </div>
                                </div>
                                <div  className="ap-body">
                                    <div className="inner">
                                    <div className="pad pad-success">
                                        <div className="successIcon"></div>
                                        <h1 className="text-center success" style={{textAlign: 'center', 'lineHeight': '1.3'}}>Thank you for your purchase. You should receive your Ormeus coins shortly.</h1>
                                        <button className="btn btn-action" id="close" onClick={()=>this.closeModal()}>
                                            <div id="deposit-close-button-icon"></div>
                                            <div>CLOSE</div>
                                        </button>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>}
                {this.state.error &&
                <Modal idModal="buysell-error-modal" close={()=>this.closeModal()}>
                    <div div className="ap-widget">
                        <div className="ap-header">
                            <div style={{ float: 'right' }} className="ap-header-actions">
                            <div>
                                <div className="ap-header-actions-btn-close" onClick={()=>this.closeModal()}>×</div>
                            </div>
                            </div>
                        </div>
                        <div id="closeBtn" onClick={()=>this.closeModal()}>
                            <div>+</div>
                        </div>
                        <div className="modal-body">
                            Your transaction could not be completed.  For assistance, contact EXCHANGE_NAME support at <a href="mailto:EXCHANGE_EMAIL" style={{color: '#2bbfdf'}}>EXCHANGE_EMAIL</a>
                            <button className="btn btn-action" id="close" onClick={()=>this.closeModal()}>
                                <div id="deposit-close-button-icon"></div>
                                <div>CLOSE</div>
                            </button>
                        </div>
                    </div>
                </Modal>}
                {this.state.isLoading && <div className="isLoading"><MoonLoader sizeUnit={"px"} size={90} color={'rgb(43,191,223)'} loading={true} /></div>}
            </div>
            
        )
    }
}


