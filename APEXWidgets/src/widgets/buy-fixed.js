/* eslint react/no-multi-comp:0 */
/* global AlphaPoint, $, window, localStorage */
import React from 'react';
import { MoonLoader } from "react-spinners";
import Rx from 'rx-lite';
import WidgetBase from './base';
import Modal from './modal';
import VerificationRequired from './verificationRequired';
import Praxis from './praxis';
import axios from 'axios';
import TransferDigital from './TransferDigital';
import merchants from '../merchants.json';
import ErrorPopup from './errorPopup';
import ConfirmOrderPopup from './confirmOrderPopup';

import { getRetailInstruments } from '../misc/ordersWidgetsHelper';
import {
  formatNumberToLocale,
  truncateToDecimals,
  getQuantityForFixedPrice,
  getPriceForFixedQuantity,
  formatOrders,
  parseNumberToLocale,
  getDecimalPrecision,
  customFixed,
  noExponents,
  getAccountStatus,
  getQuantityForFixedPrice_test,
  getPriceForFixedQuantity_test
} from './helper';
import ProcessingButton from '../misc/processingButton';
import InputNoLabel from '../misc/inputNoLabel';



class CustomAmountBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }  

  render() {

    const productFee = this.props.feeProduct ? this.props.feeProduct : this.props.product1.ProductSymbol;
    const transaction_fee = isNaN(this.props.fee) ? 0 : this.props.fee;
    let priceString = this.props.product2.ProductSymbol === 'ETH' || this.props.product2.ProductSymbol === 'BTC' 
                        ? customFixed(this.props.priceString, 8) 
                        : customFixed(this.props.priceString, 4);
    priceString = priceString ? priceString : ''
    let amountString = this.props.product1.ProductSymbol === 'ETH' || this.props.product1.ProductSymbol === 'BTC'
                          ? customFixed(this.props.amountString, 8)
                          : customFixed(this.props.amountString, 4);
    amountString = amountString ? amountString : ''
    return (

      <div className="buy-sell-boxes">
        <VerificationRequired>
        
          <div className=" buy-sell-boxes-custom pricing-deal-container">
            <div className="pricing-table pricing-table-popular">
              <div className="pricing-deal-container">
                  <div className="pricing-table-content">Custom Amount</div>
                  <div className="bottom-box">
                      <div>
                        <InputNoLabel
                          placeholder={formatNumberToLocale(0, this.props.decimalPlaces[this.props.product1.ProductSymbol])}
                          type="text"
                          value={amountString}
                          onChange={e => this.props.changeAmount(this.props.product1.ProductSymbol, this.props.product2.ProductSymbol, e)}
                          onBlur={() => this.setState({ errorMessage: '' })}
                          name="amount"
                        />
                        <div className="input-group-addon">{this.props.product1.ProductSymbol}</div>
                      </div>
                      <div>
                          <InputNoLabel
                            placeholder={formatNumberToLocale(0, this.props.decimalPlaces[this.props.product2.ProductSymbol])}
                            type="text"
                            value={priceString}
                            onChange={e => this.props.changePrice(this.props.product1.ProductSymbol, this.props.product2.ProductSymbol, e)}
                            onBlur={() => this.setState({ errorMessage: '' })}
                            name="price"
                          />
                          <div className="input-group-addon" >{this.props.product2.ProductSymbol}</div>
                          {this.props.minAmountErr && <div className="error">Minimum 250 {this.props.product2.ProductSymbol}</div>}
                      </div>
                      <button
                        disabled={this.props.invalidNumber || this.props.noMarket}
                        onClick={() => this.props.checkAccountStatus() && !this.props.invalidNumber && !this.props.noMarket && this.props.openConfirmPopup()}
                      >
                      {this.props.buy ? "Buy" : "Sell"}
                      </button>
                  </div>
              </div>
            </div>
          </div>
        </VerificationRequired>
      </div>
    );
  }
}

CustomAmountBox.defaultProps = {
  decimalPlaces: [],
  fee: 0,
  buy: '',
  product1: '',
  product2: '',
  amountString: '',
  priceString: '',
  feeProduct: '',
  invalidNumber: '',
  noMarket: '',
  errorMessage: '',
  status: '',
  changeAmount: false,
  changePrice: false,
  order: false,
  onError: false,
};

CustomAmountBox.propTypes = {
  changeAmount: React.PropTypes.func,
  changePrice: React.PropTypes.func,
  order: React.PropTypes.func,
  decimalPlaces: React.PropTypes.object,
  buy: React.PropTypes.bool,
  product1: React.PropTypes.instanceOf(Object),
  product2: React.PropTypes.instanceOf(Object),
  amountString: React.PropTypes.string,
  priceString: React.PropTypes.string,
  feeProduct: React.PropTypes.string,
  invalidNumber: React.PropTypes.bool,
  noMarket: React.PropTypes.bool,
  errorMessage: React.PropTypes.string,
  status: React.PropTypes.string,
  onError: React.PropTypes.func
};

class Buy_Fixed extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      invalidNumber: false,
      noMarket: false,
      customAmount: false,
      buy: true,
      market: true,
      marketBuy: 0,
      marketSell: 0,
      productPairs: [],
      total: 0,
      fee: 0,
      custom_amount_fee: 0,
      feeProduct: '',
      productPair: '',
      amountOfCryptoBeingOrdered: "",
      amount: 0,
      price: 0,
      priceString: "",
      amountString: "",
      successMsg: '',
      errorModal: false,
      errorMsg: '',
      balances: [],
      OrderType: 2,
      InstrumentId: 0,
      AccountId: AlphaPoint.userAccounts.value[0],
      openConfirm: false,
      session: {},
      index: 0,
      decimalPlaces: {},
      OrderId: null,
      status: '',
      bookSells: [],
      bookBuys: [],
      productsArray: [],
      fromCurrency: null,
      toCurrency: null,
      dropDownOne: [],
      dropDownTwo: [],
      praxis: false,
      reqCode: "",
      custome: false,
      reSendDeposit: 0,
      spinner: false,
      minAmountErr: false,
      isBalanceChange: false,
      accountInfo: null,
      userConfig: null,
      accountStatus: "",
      deposits: [],
      cryptoDropdown: false,
      fiatDropdown: false,
      openConfirmCustom: false,
      BestBid: {
        BTCUSD: '',
        BTCEUR: '',
        BTCGBP: '',
        ETHUSD: "",
        ETHEUR: ""
      },
      BestOffer: {
        BTCUSD: '',
        BTCEUR: '',
        BTCGBP: '',
        BTCAUD: '',
        BTCCAD: '',
        ETHUSD: "",
        ETHEUR: ""
      },
    };
    
  }

  findCurrency(currency, currenciesArray){
    return currenciesArray.find(c => c === currency)
  }

  async componentDidMount() {
    const {code, accountStatus} = await getAccountStatus();
    if(code === 200 && accountStatus){
        this.setState({...this.state, accountStatus})
    }
    else{
        console.log(code);
    }
    this.selectedAccount = AlphaPoint.selectedAccount.subscribe(AccountId => this.setState({ AccountId }));

    this.session = AlphaPoint.getUser.subscribe(session => this.setState({ session }));

    this.products = AlphaPoint.products.subscribe(productsArray => {
      const currencies = productsArray.map(item => item.Product);
      const newState = {};
      const fromCurrency = this.findCurrency('BTC', currencies)
      const toCurrency = this.findCurrency('EUR', currencies)
      newState.fromCurrency = fromCurrency;
      newState.toCurrency = toCurrency
      newState.productPair = `${fromCurrency + toCurrency}`;
      newState.productsArray = productsArray;
      const decimalPlaces = {};
      productsArray.forEach(product => {
        decimalPlaces[product.Product] = product.DecimalPlaces;
      });

      newState.decimalPlaces = decimalPlaces;
      this.setState({...this.state, ...newState});
    });
    

    this.accountInformation = AlphaPoint.accountPositions
      .subscribe(balances => {
        if(balances && balances.length){
          balances = balances.map(balance => {
            if(balance.ProductSymbol === 'BTC' || balance.ProductSymbol === 'ETH'){
              return {...balance, Amount: Number(formatNumberToLocale(balance.Amount, 8))}
            }
            return {...balance, Amount: Number(formatNumberToLocale(balance.Amount, 4))}
          })
          this.checkBalances(balances);
        }
      });


    this.senderOrder = AlphaPoint.sendorder.subscribe(res => {
      const success = '';
      const reject = '';

      this.setState({
        successMsg: success,
        errorMsg: reject,
        fee: res.fee,
        feeProduct: res.feeProduct,
        OrderId: res.OrderId,
      });
    });

    this.orderStateEvent = AlphaPoint.accountBalances.filter(order => (
        order.OrderId === this.state.OrderId
        && order.ChangeReason === 'SystemCanceled_NoMoreMarket'
      )).subscribe(() => {
        this.setState({status: 'killed', errorModal: true, errorMessage: 'The market has changed and your order could not be filled. Please review the new market values and resubmit your order.' })
      });

      this.createDeposit = AlphaPoint.createDeposit.subscribe((res) => {
        this.checkSession();
        
        
        if(res.success){
          this.setState({spinner: true})
          const obj = {
            userId: this.state.session.UserId, 
            accountId: AlphaPoint.selectedAccount.value,
            requestCode: res.requestcode,
            estimatedAmount: Number(this.totalReceived),
            purchasedAsset: this.state.productPair.substring(0,3),
            fiatAmount: this.state.price,
            feeAmount: Number(this.transactionFee),
            fiatCurrency: this.state.productPair.substring(3,6),
            frontendName: process.env.FRONTEND_NAME.toLowerCase()
          }
          
          axios.post(`${process.env.PRAXIS_REQUEST}/api/praxis/exchange/preProcessDepositTicket`, obj)
          .then((res) => {
            if(res.status === 200){
              this.setState({ status: 'openPraxis', praxis: res.data.token, reqCode: obj.requestCode});
            }
          }).catch(err => {
            if(err){
              // this.setState({...this.state, status: 'killed'});
            }
          })
        }
      });


      this.accountInformation2 = AlphaPoint.accountInfo.subscribe(data => {
        this.setState({...this.state,accountInfo: data})
      })
      this.userConfiguration = AlphaPoint.getUserConfig.subscribe(data => {
        this.setState({...this.state,userConfig: data})
      })

      this.accountTransactions = AlphaPoint.accountTransactions.subscribe((data) => {
        const actions = Object.values(data)
          .map(account => account)
          .reduce((a, b) => a.concat(b), [])
          .filter((transaction) => transaction.ReferenceType === 'Deposit')
 
        this.setState({ deposits: actions });
      });

      this.SubscribeLevel1 = ExchangeApi.SubscribeLevel1.subscribe(res => {
        if((res.InstrumentId == this.state.productPair && this.state.BestOffer[res.InstrumentId] !== res.BestOffer) || this.state.BestOffer[res.InstrumentId] == "") {
          this.setState({
              BestOffer:{
                ...this.state.BestOffer,
                [res.InstrumentId]: res.BestOffer 
              }
            });
          }
      });
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevState.productsArray.length !== this.state.productsArray.length){
      this.productPairs = AlphaPoint.instruments
      .filter(instruments => instruments.length)
      .subscribe(productPairs => {
        // Set product pairs
        productPairs = productPairs.filter(pairs => ExchangeApiConfig.SubscribeLevel1.data.includes(pairs.Symbol));
        this.setState({ productPairs });

        // Find AlphaPoint.prodPair in availablePairs for buy-fixed
        const availablePairs = getRetailInstruments(productPairs, this.state.productsArray);
        const checkForProdPair = !availablePairs.find(pair => pair.Symbol === AlphaPoint.prodPair.value);
        
        
        // If AlphaPoint.prodPair isn't available
        if (checkForProdPair) {
          // Set productPair to first available pair
          this.setState({ productPair: availablePairs[0].Symbol });
          // And set Instrument
          this.initInstrumentId();
        } else{
          this.initInstrumentId();
          this.productPair = AlphaPoint.prodPair.subscribe(productPair => this.setState({ productPair }));
        }
      });
    }
  }

  checkBalances(balances){
    const prevBalances = [...this.state.balances];
    if(prevBalances.length > 0 && this.state.amountOfCryptoBeingOrdered){
      for(let i = 0; i < balances.length; i++){
        if(balances[i].ProductSymbol === 'BTC' || balances[i].ProductSymbol === 'ETH'){
          const range = 0.0005;
          const max = this.state.amountOfCryptoBeingOrdered + range;
          const min = this.state.amountOfCryptoBeingOrdered - range;
          const difference = balances[i].Amount - prevBalances[i].Amount;
          if(min <= difference && difference <= max && difference > 0){
            const merchant = localStorage.getItem("ccxMerchant");
            const address = merchants[merchant];
            if(address){
              return this.setState({...this.state, isBalanceChange: true, balances, praxis: false, openConfirm: false})
            }
          }
        }
      }
    }
    this.setState({ balances })
  }

  initInstrumentId(){
    if(this.state.productPairs.findIndex(pair => pair.InstrumentId === Number(localStorage.getItem('SessionInstrumentId'))) > -1){
      this.changePairId(Number(localStorage.getItem('SessionInstrumentId')))
    }
    else if(this.state.productPairs.findIndex(pair => pair.InstrumentId === 4) > -1){
      // BTC-EUR pair
      this.changePairId(4);
    }
    else if(this.state.productPairs && this.state.productPairs > 0){
      this.changePairId(this.state.productPairs[0].InstrumentId);
    }
    // should handle error?
  }

  checkSession(){
    
    if(!this.state.session.UserId){
      this.getUser = AlphaPoint.getUser.subscribe(session =>{
         this.setState({ session })
      });
    }
    
  }
  sendDeposit () {
    this.checkSession()
    const data = {};
    const amount = this.state.price;
    const pair = this.state.productPairs.find(prod => this.state.productPair === prod.Symbol) || {};
    data.productId = this.state.balances.find(prod => pair.Product2Symbol === prod.ProductSymbol).ProductId;
    data.accountId = AlphaPoint.selectedAccount.value;
    data.status = 'New';
    data.currencyCode = this.state.toCurrency;
    data.amount = amount;
    data.imageB64 = '';
    if (this.state.data_uri) data.imageB64 = this.state.data_uri;

    // setup the depositInfo
    data.language = (localStorage && localStorage.lang) ? localStorage.lang : AlphaPoint.config.defaultLanguage;
    if (AlphaPoint.config.useCoinsPHDepositTemplate) {
      data.bankName = '';
      data.referenceNumber = '';
      data.depositInfo = JSON.stringify({
        language: data.language,
        'Bank Name': data.bankName,
        'Reference Number': data.referenceNumber,
      });
    } else {
      data.fullName = '';
      data.depositInfo = JSON.stringify({
        'Full Name': data.fullName,
        language: data.language,
      });
    }
    
    AlphaPoint.createDepositTicket(data);
  }

  componentWillUnmount() {
    const that = this;
    const keys = Object.keys(that);
    keys.filter(key => that[key].dispose ).forEach(key => that[key].dispose());
  }

  onError(error) {
    this.setState({ errorModal:true , errorMsg: error })
  }

  onChangeDropdown = e => {
    const targetId = e.target.id.slice(-4);
    let updateState = {};
    if (targetId === 'one') {
      const dropDownOneValue = e.target.value;
      updateState = {
        dropDownOneValue: e.target.value,
        dropDownTwoValue: this.state.dropDownTwoValue,
      };

      if (dropDownOneValue === this.state.dropDownTwoValue) {
        const dropDownTwoValue = this.state.dropDownOneValue;
        updateState.dropDownTwoValue = dropDownTwoValue;
      }
    } else {
      const dropDownTwoValue = e.target.value;
      updateState = {
        dropDownOneValue: this.state.dropDownOneValue,
        dropDownTwoValue: e.target.value,
      };
      if (dropDownTwoValue === this.state.dropDownOneValue) {
        const dropDownOneValue = this.state.dropDownTwoValue;
        updateState.dropDownOneValue = dropDownOneValue;
      }
    }

    this.setState({
      ...this.state,
      dropDownOneValue: updateState.dropDownOneValue,
      dropDownTwoValue: updateState.dropDownTwoValue });
  };

  onChangeCurrencies = e => {
    const { name, value } = e.target;
    this.setState({
      ...this.state,
      [name]: value,
    }, () => {
      this.setState({ productPair: this.state.fromCurrency + this.state.toCurrency });
    });
  }

  getOrderFee = (Amount) => {
    const pair = this.state.productPairs.find(prod => this.state.productPair === prod.Symbol) || {};
    const product1 = this.state.balances.find(prod => pair.Product1Symbol === prod.ProductSymbol) || {};
    const product2 = this.state.balances.find(prod => pair.Product2Symbol === prod.ProductSymbol) || {};
    const buy = this.state.buy;
    const sell = !this.state.buy;
    const insideBid = this.state.marketBuy;
    const insideAsk = this.state.marketSell;
    const price = +this.state.price;
    let MakerTaker = '';

    if (buy) MakerTaker = price < insideAsk || insideAsk === 0 ? 'Maker' : 'Taker';
    if (sell) MakerTaker = price > insideBid || insideBid === 0 ? 'Maker' : 'Taker';
    if (this.state.OrderType === 1) MakerTaker = 'Taker'; // Market Order Taker

    const payload = {
      OMSId: AlphaPoint.oms.value,
      AccountId: this.state.AccountId,
      InstrumentId: pair.InstrumentId || 0,
      ProductId: this.state.buy ? product1.ProductId : product2.ProductId,
      Amount, // If buy, this will be amount of product1. If sell, this will be amount of product2
      OrderType: this.state.OrderType,
      MakerTaker,
      Side: this.state.buy ? 0 : 1,
      Quantity: Amount,
    };

    AlphaPoint.getOrderFee(payload);
  };


  getPricesDeal = () => {
    return process.env.NODE_ENV === 'development' 
    ? [1, 2, 5, 0] 
    : [50, 250, 1000, 0];
  }
    
    
  onChangePair(product, side, event){
    event.stopPropagation();
    let currentPair = this.state.productPair;
    if(side === "crypto"){
      currentPair = product + currentPair.substr(3,3)
    }
    else{
      currentPair = currentPair.substr(0,3) + product
    }
    const myInstrument = this.state.productPairs.filter((pair) => pair.Symbol === currentPair)[0] || this.state.productPairs.filter((pair) => pair.Symbol === `${product}EUR`)[0];
    this.setState({productPair: myInstrument.Symbol || `${product}EUR`, amountString: '', priceString: '', custom_amount_fee: '', feeProduct: '', price: 0, amount: 0, fiatDropdown: false, cryptoDropdown: false, minAmountErr: false});
    this.changePairId(myInstrument.InstrumentId);
  }

  changeInstrument = e => {
    this.setState({amountString: '', priceString: '', custom_amount_fee: '', feeProduct: '', price: 0, amount: 0});
    const myInstrument = this.state.productPairs.filter((pair) => pair.Symbol === e.target.value)[0] || {};
    this.changePairId(myInstrument.InstrumentId);
  };

  changePairId = instrumentId => {
    this.setState({ bookBuys: [], bookSells: [] });
    window.doSelectIns(instrumentId);
  };

  fixedOrder = (amountOfCryptoBeingOrdered, amountToPayForABuy, LimitPrice) => {

    this.setState({
      custome: false,
      amountOfCryptoBeingOrdered
    });

    const pair = this.state.productPairs.find((prod) => this.state.productPair === prod.Symbol) || {};
    const product1 = this.state.balances.find((prod) => pair.Product1Symbol === prod.ProductSymbol) || {};
    const product2 = this.state.balances.find((prod) => pair.Product2Symbol === prod.ProductSymbol) || {};
    const balance = this.state.buy ? (product2.Amount - product2.Hold || 0) : (product1.Amount - product1.Hold || 0);
    const amountToBuyOrSell = this.state.buy ? amountToPayForABuy : amountOfCryptoBeingOrdered;
    const quantityOfCrypto = +amountOfCryptoBeingOrdered;
    const decimalPlaces = this.state.productsArray.find(prod => prod.ProductId === pair.Product1).DecimalPlaces || 2;
    const insufficientFunds = AlphaPoint.translation('BUY_SELL_FIXED.INSUFFICIENT_FUNDS') || 'Insufficient Funds';

    // check if they have enough money
    // if (amountToBuyOrSell > balance) {
    //   return this.setState({ errorMessage: insufficientFunds , errorModal: true});
    // }

    this.setState({ status: 'processing'});

    const payload = {
      AccountId: this.state.AccountId,
      ClientOrderId: 0,
      Side: this.state.buy ? 0 : 1,
      Quantity: truncateToDecimals(quantityOfCrypto, decimalPlaces),
      OrderIdOCO: 0,
      OrderType: 2,
      InstrumentId: pair.InstrumentId,
      TimeInForce: 4,
      OMSId: AlphaPoint.oms.value,
      UseDisplayQuantity: false,
      LimitPrice,
    };
    this.sendDeposit();
    // return AlphaPoint.sendOrder(payload);
  };

  closeModal = (isDealPrice) => {
    if(this.state.status === 'killed'){
      this.setState({ custom_amount_fee: 0 });
    }
    const newState = {
      ...this.state, 
      openConfirm: false, 
      status: '', 
      errorModal: false, 
      openConfirmCustom: false
    }
    if(isDealPrice){
      newState.price = 0;
      newState.amount = 0;
      newState.amountString = "";
      newState.priceString = "";
    }
    this.setState(newState);
    document.body.classList.remove('touchMode');
  };

  checkAccountStatus(){
    const {allowedToProceed, errorMessage} = this.props.checkPurchasePermission();
    if(!allowedToProceed){
      this.setState({...this.state, errorModal: true, errorMessage})
    }
    return allowedToProceed
  }

  openConfirmPopup(){
    if(this.state.price < 1){
      return this.setState({...this.state, minAmountErr: this.state.price < 1})
    }
    return this.setState({...this.state, openConfirmCustom: true, minAmountErr: this.state.price < 1})
  }

  openModal = (indexOfDealPriceToMatch, amountOfCryptoBeingOrdered, price, estimatedQuantity) => {
    
    let feeSend = 0;
    this.setState({
      openConfirm: true,
      index: indexOfDealPriceToMatch,
      price,
      ['estimatedQuantity' + indexOfDealPriceToMatch]:  estimatedQuantity
    });

    document.body.classList.add('touchMode');

    feeSend = this.state.buy ? amountOfCryptoBeingOrdered : price;
    this.getOrderFee(feeSend);
  };

  changeMode = (buy) => this.setState({ buy, amountString: "", priceString: "", fee: 0, custom_amount_fee: 0 }, this.getOrderFee);

  changeAmount = (product1Symbol, product2Symbol, e) => {
    const { decimalPlaces, buy, bookSells, bookBuys } = this.state;
    const amountString = e.target.value;
    const amount = parseNumberToLocale(amountString);
    const decimals = getDecimalPrecision(amount);
    const decimalsAllowed = decimalPlaces[product1Symbol];
    const decimalsAllowedPrice = decimalPlaces[product2Symbol];
    if (decimals <= decimalsAllowed && !isNaN(amount)) {
      const invalidNumber = false;
      const book = buy ? bookSells : bookBuys;
      const { Price, transaction_fee: custom_amount_fee } = getPriceForFixedQuantity_test(
        amount,
        this.state.BestOffer[product1Symbol+product2Symbol]
      );
      if (isNaN(Price)) {
        // this.changePairId(e);
        return this.setState({
          invalidNumber: true,
          noMarket: true,
          errorMessage: this.state.buy
            ? AlphaPoint.translation('BUY_SELL_CUSTOM.NO_QUANTITY_MARKET_BUY') ||
              'There is no market for the quantity you wish to buy, please try a lower quantity.'
            : AlphaPoint.translation('BUY_SELL_CUSTOM.NO_QUANTITY_MARKET_SELL') ||
            'There\'s no market for the quantity you wish to sell, please try a lower quantity.',
        });
      } else if (this.state.market) {
        this.setState({
            invalidNumber,
            noMarket: false,
            errorMessage: '',
            status: '',
            amount,
            amountString,
            price: Price,
            priceString: Price,
            total: Price,
            custom_amount_fee,
          });
      } else {
        this.setState({
          invalidNumber,
          noMarket: false,
          errorMessage: '',
          status: '',
          amount,
          amountString: amount,
          price: Price,
          priceString: this.state.price,
          total: amount * this.state.price,
          custom_amount_fee,
        });
      }
    }
    return true;
  };


  // Create modal with transaction details
  createModal = (indexOfDealPriceToMatch, product1symbol, productFullname, product2symbol) => {

    // buy or sell
    const action = this.state.buy ?
      (AlphaPoint.translation('BUY_SELL_FIXED.GET') || 'GET') :
      (AlphaPoint.translation('BUY_SELL_FIXED.SELL') || 'Sell');

    // array of fixed prices
    const prices_deal = this.getPricesDeal(); 

    // Amount in FIAT
    const priceUnformatted = this.state.openConfirmCustom ? this.state.price : prices_deal[indexOfDealPriceToMatch];

    // Crypto amount  
    const dealsQuantity = getQuantityForFixedPrice_test(priceUnformatted, this.state.BestOffer[product1symbol+product2symbol])

    

    // Transaction fee
    const transaction_fee = this.state.openConfirmCustom ? this.state.custom_amount_fee : dealsQuantity.transaction_fee;

    const cryptoQuantity = this.state.openConfirmCustom ? this.state.amount : dealsQuantity.cryptoQuantity;
    
    // Fee product 
    const feeProduct = this.state.buy ? product1symbol : product2symbol;

    const netAmountProduct = action === 'Get' ? product1symbol : product2symbol;
    
    const custom_net_amount_boughtUnformatted = Math.max(0, this.state.amount - this.state.custom_amount_fee);


    const net_amount_boughtUnformatted = Math.max(0, cryptoQuantity - transaction_fee);
    const net_amount_soldUnformatted = Math.max(0, priceUnformatted - transaction_fee);

    const custom_net_amount_bought = isNaN(custom_net_amount_boughtUnformatted)
      ? '-'
      : formatNumberToLocale(custom_net_amount_boughtUnformatted, this.state.decimalPlaces[product1symbol]);
    
    const net_amount_bought = isNaN(net_amount_boughtUnformatted)
      ? '-'
      : formatNumberToLocale(net_amount_boughtUnformatted, this.state.decimalPlaces[product1symbol]);
    const net_amount_sold = isNaN(net_amount_soldUnformatted)
      ? '-'
      : formatNumberToLocale(net_amount_soldUnformatted, this.state.decimalPlaces[product2symbol]);
    const price = formatNumberToLocale(priceUnformatted, this.state.decimalPlaces[product2symbol]);
    
    this.totalReceived = formatNumberToLocale(cryptoQuantity, this.state.decimalPlaces[product1symbol]);
    this.net_amount_bought = net_amount_bought;
    this.transactionFee = formatNumberToLocale(transaction_fee, this.state.decimalPlaces[this.state.buy ? product1symbol : product2symbol]);

    let confirmModal = ((this.state.openConfirm || this.state.openConfirmCustom ) && 
        <ConfirmOrderPopup 
          fixedOrder={() => this.state.openConfirm ? this.sendDeposit() : this.order() }
          net_amount_bought={this.state.openConfirm ? net_amount_bought : custom_net_amount_bought} 
          fee={this.transactionFee}
          product2symbol={product2symbol} 
          price={price} 
          product1symbol={product1symbol} 
          received={this.totalReceived}
          close={this.closeModal}
          user={this.state.session.UserName}
          />
      );
  
    return confirmModal;
  };

  order = () => {
    if(this.state.minAmountErr){
      return
    }
    this.setState({
      custome: true
    });
    const market = this.state.buy ? this.state.marketSell : this.state.marketBuy;

    const pair = this.state.productPairs.find(prod => this.state.productPair === prod.Symbol) || {};

    const product1 = this.state.balances.find((prod) => pair.Product1Symbol === prod.ProductSymbol) || {};
    const product2 = this.state.balances.find((prod) => pair.Product2Symbol === prod.ProductSymbol) || {};
    const balance = this.state.buy ? (product2.Amount - product2.Hold || 0) : (product1.Amount - product1.Hold || 0);
    const product1DecimalPlaces = this.state.decimalPlaces[pair.Product1Symbol];
    let total;
    // check if they have enough money
    if (this.state.market) {
      total = this.state.buy ? this.state.price : this.state.amount;
    } else {
      total = this.state.buy ? (this.state.price * this.state.amount) : this.state.amount;
    }

    // if (total > balance) {
      // $.bootstrapGrowl(AlphaPoint.translation('BUY_SELL_CUSTOM.INSUFFICIENT_FUNDS') || 'Insufficient Funds', {
      //   type: 'danger',
      //   allow_dismiss: true,
      //   align: 'right',
      //   delay: AlphaPoint.config.growlwerDelay,
      // });
    //   return this.setState({ errorMessage: AlphaPoint.translation('BUY_SELL_CUSTOM.INSUFFICIENT_FUNDS') || 'Insufficient Funds' , errorModal: true });
    // }

    this.setState({ total: this.state.amount * ((this.state.market) ? market : this.state.price) });

    const payload = {
      AccountId: this.state.AccountId,
      ClientOrderId: 0,
      Side: (this.state.buy === true) ? 0 : 1,
      Quantity: truncateToDecimals(this.state.amount, product1DecimalPlaces),
      OrderIdOCO: 0,
      OrderType: this.state.OrderType,
      InstrumentId: pair.InstrumentId,
      TimeInForce: 4,
      OMSId: AlphaPoint.oms.value,
      UseDisplayQuantity: false,
      LimitPrice: this.state.LimitPrice,
    };
    return this.sendDeposit();
    // return AlphaPoint.sendOrder(payload);
  };


  toggleCustom = (e) => {
    e.preventDefault();
    this.setState({ customAmount: !this.state.customAmount });
  };

  changePrice = (product1Symbol, product2Symbol, e) => {
    const { decimalPlaces, buy, bookSells, bookBuys } = this.state;
    const priceString = e.target.value;
    const price = parseNumberToLocale(priceString);
    const decimals = getDecimalPrecision(price);
    const decimalsAllowed = decimalPlaces[product2Symbol];
    const decimalsAllowedAmount = decimalPlaces[product1Symbol];

    if (decimals <= decimalsAllowed && !isNaN(price)) {
      const invalidNumber = false;
      const noMarket = false;
      const book = buy ? bookSells : bookBuys;
      const { cryptoQuantity: amount, transaction_fee: custom_amount_fee } = getQuantityForFixedPrice_test(
        price,
        this.state.BestOffer[product1Symbol+product2Symbol]
      );
      const amountString = formatNumberToLocale(amount, decimalsAllowedAmount);
      if (isNaN(amount)) {
        return this.setState({
          invalidNumber: true,
          noMarket: true,
          errorMessage: this.state.buy
            ? AlphaPoint.translation('BUY_SELL_CUSTOM.NO_PRICE_MARKET_BUY') ||
              'There\'s no market for the price you wish to offer, please try a lower price.'
            : AlphaPoint.translation('BUY_SELL_CUSTOM.NO_PRICE_MARKET_SELL') ||
              'There\'s no market for the price you wish to bid, please try a lower price.',
          errorModal:true,
        });
      } else if (this.state.market) {
        this.setState({
          invalidNumber,
          noMarket,
          status: '',
          amountString,
          amount,
          price,
          priceString,
          total: price,
          errorMessage: '',
          minAmountErr: price < 1,
          custom_amount_fee
        });
      } else {
        this.setState({
          invalidNumber,
          noMarket,
          status: '',
          amountString,
          amount,
          price,
          priceString,
          errorMessage: '',
          total: amount * price,
          minAmountErr: price < 1,
          custom_amount_fee
        });
      }
    }
    return true;
  };

  closeTransferModal(){
    this.setState({ isBalanceChange: false})
  }

  onClickVerifyAccunt(){
    document.location.href = "/settings.html#account-verification"
  }

  checkSource(){
    const ccxMerchant = localStorage.getItem("ccxMerchant")
    return Object.keys(merchants).filter(m => m === ccxMerchant).length > 0
  }

  toggleDropdown(type, flag){
    this.setState({...this.state, [type]: flag})
  }

  onMouseLeave(){
    this.setState({...this.state, fiatDropdown: false, cryptoDropdown: false})
  }

  render() {
    const inputsRadio = [];
    const labelsRadio = [];
    const prices_deal = this.getPricesDeal();
    const availablePairs = getRetailInstruments(this.state.productPairs, this.state.productsArray);
    const cryptoCurrencies = ["BTC", "ETH"];
    const fiatCurrencies = this.state.productPair.substr(0,3) === 'ETH' ? ["USD", "EUR"] : ["USD", "EUR", "GBP", "CAD", "AUD"];
    const cryptoOptions = cryptoCurrencies.map(c => (
      <li key={c} value={c} onClick={(e) => this.onChangePair(c, "crypto", e)}><img src={`img/${c.toLocaleLowerCase()}.png`}/>{c}</li>
    ))
    const fiatOptios = fiatCurrencies.map(c => (
      <li key={c} value={c} onClick={(e) => this.onChangePair(c, "fiat", e)}><img src={`img/${c.toLocaleLowerCase()}.svg`}/>{c}</li>
    ))
    const options = availablePairs.map(pair => (
      <option
        key={pair.InstrumentId}
        value={pair.Symbol}
        // onChange={() => this.changePairId(pair.InstrumentId)}
      >
        {AlphaPoint.config.reversePairs ? (pair.Product2Symbol + '/' + pair.Product1Symbol) : (pair.Product1Symbol + '/' + pair.Product2Symbol)}
      </option>
    ));

    if (availablePairs.length > 0) {
      for (let i = 0; i < availablePairs.length; i++) {
        inputsRadio.push(
          <input
            type="radio"
            value={availablePairs[i].Symbol}
            name="sc-1-1"
            id={`sc-1-1-${i + 1}`}
            readOnly
            onClick={() => this.changePairId(availablePairs[i].InstrumentId)}
            key={i}
            checked={(availablePairs[i].Symbol === this.state.productPair && true) || false}
          />,
        );
        labelsRadio.push(
          <label
            htmlFor={`sc-1-1-${i + 1}`}
            data-value={availablePairs[i].Symbol}
          >{availablePairs[i].Symbol}</label>,
        );
      }
    }
    const pair = this.state.productPairs.find(prod => this.state.productPair === prod.Symbol) || {};
    const product1 = this.state.balances && this.state.balances.length > 0 ? this.state.balances.find(prod => pair.Product1Symbol === prod.ProductSymbol) : null;
    const product2 = this.state.balances && this.state.balances.length > 0 ? this.state.balances.find(prod => pair.Product2Symbol === prod.ProductSymbol) : null;
    let product1Fullname = product1 && product1.ProductSymbol === "BTC" ? "Bitcoin" : "Ethereum";
    if(product1 == null || product2 == null){
      return null // when no products
    }
    // const market = this.state.buy ? this.state.marketBuy : this.state.marketSell;
    const buyText = AlphaPoint.translation('BUY_SELL_FIXED.BUY') || 'Buy';
    const sellText = AlphaPoint.translation('BUY_SELL_FIXED.SELL') || 'Sell';
    const tabs = (
      <div>
        <span
          className={`tab tab-first ${this.state.buy ? 'active' : ''}`}
          onClick={() => this.changeMode(true)}
        >{buyText} {product1.fullName}</span>
        {/* <span
          className={`tab tab-second ${!this.state.buy ? 'active' : ''}`}
          onClick={() => this.changeMode(false)}
        >{sellText} {product1.fullName}</span> */}
        <span className="blue-line" />
      </div>
    );
    const action = this.state.buy ? buyText : sellText;
    const dealsQuantity = prices_deal
      .map(price => getQuantityForFixedPrice_test(
        price,
        this.state.BestOffer[product1.ProductSymbol+product2.ProductSymbol]
      ));
    const fromCurrencySymbol = product2.ProductSymbol ? product2.ProductSymbol : "";
    const deals = prices_deal.map((price, index) => {      
      const dealQuantity = dealsQuantity.find(deal => deal.Price === +price);
      const amountOfCryptoBeingOrdered = dealQuantity.cryptoQuantity;
      const noMarketForDeal = undefined;
      /* eslint-disable no-else-return */
      if (index !== 3) {
        return (
          <div
            className="buy-sell-boxes"
            key={`${price}-deal`}
            style={noMarketForDeal ? { opacity: 0.7, pointerEvents: 'none' } : {}}
          >             
            <div className="pricing-table pricing-table-popular">
              <div className="popoular-placeholder">
                {index === 1 ? <div className="pricing-table-popular-heading">{AlphaPoint.translation('BUY_SELL_FIXED.POPULAR') || 'Popular'}</div> : <div className="pricing-table-popular-heading-placeholder">&nbsp;</div>}
              </div>
              <div className="pricing-deal-container">
                <div className="pricing-table-content">
                  {price} {product2.ProductSymbol}
                </div>
                <div className="bottom-box">
                    <p>{this.state.buy ? "Get" : "Sell"}</p>
                    <p className="get">{customFixed(dealQuantity.cryptoQuantity, 4)} {product1.ProductSymbol}</p>
                    <button onClick={() => this.checkAccountStatus(price) && this.openModal(index, amountOfCryptoBeingOrdered, price)}>{this.state.buy ? "Buy" : "Sell"}</button>
                </div>
              </div>
            </div>
            
          </div>);
      } else {
        return (
        <CustomAmountBox
          key={index}
          amountOfCryptoBeingOrdered={amountOfCryptoBeingOrdered}
          price={price}
          buy={this.state.buy}
          fee={this.state.custom_amount_fee}
          getOrderFee={this.getOrderFee}
          decimalPlaces={this.state.decimalPlaces}
          product1={product1}
          product2={product2}
          amountString={this.state.amountString}
          priceString={this.state.priceString}
          feeProduct={this.state.feeProduct}
          invalidNumber={this.state.invalidNumber}
          noMarket={this.state.noMarket}
          errorMessage={this.state.errorMessage}
          status={this.state.status}
          changeAmount={this.changeAmount}
          changePrice={this.changePrice}
          order={this.order}
          onError={this.onError}
          minAmountErr={this.state.minAmountErr}
          checkAccountStatus={() => this.checkAccountStatus()}
          openConfirmPopup={() => this.openConfirmPopup()}
        />
        );
      }
    });
    
    return (
      <WidgetBase
        {...this.props}
        login
        error={this.state.errorMsg}
        success={this.state.successMsg}
        style={{ width: '600px' }}
        customClass="buysell"
        withCloseButton={true}
      >
        <h1>Buy {product1Fullname} with VISA and Mastercard in {product2.ProductSymbol}</h1>
        <VerificationRequired>
          <div className="clearfix">
            {!this.props.hideSelect && <div className="tabs-main pull-left">
              Buy
              <div className="pull-right currency-alt-select" onClick={() => this.toggleDropdown("cryptoDropdown", true)}>
                <div id="currency-alt-select-container">
                  <span><img src={`img/${this.state.productPair.substr(0,3).toLowerCase()}.png`}/>{this.state.productPair.substr(0,3)}</span>
                  {
                    this.state.cryptoDropdown &&
                    <ul onMouseLeave={() => this.onMouseLeave()}>
                      {cryptoOptions}
                    </ul>
                  }
                  {/* <select
                    className="form-control pull-left"
                    style={{ borderRadius: '10px' }}
                    value={this.state.productPair}
                    onChange={this.changeInstrument}
                  >
                    {cryptoOptions}
                  </select> */}
                  <div id="select-currency-submit-arrow" onClick={this.clickDropdown} />
                </div>
              </div>
              For
              <div className="pull-right currency-alt-select" onClick={() => this.toggleDropdown("fiatDropdown", true)}>
                <div id="currency-alt-select-container">
                <span><img src={`img/${this.state.productPair.substr(3,3).toLowerCase()}.svg`}/>{this.state.productPair.substr(3,3)}</span>
                  {
                    this.state.fiatDropdown &&
                    <ul onMouseLeave={() => this.onMouseLeave()}>
                      {fiatOptios}
                    </ul>
                  }
                  {/* <select
                    className="form-control pull-left"
                    style={{ borderRadius: '10px' }}
                    value={this.state.productPair}
                    onChange={this.changeInstrument}
                  >
                    {fiatOptios}
                  </select> */}
                  <div id="select-currency-submit-arrow" onClick={this.clickDropdown} />
                </div>
              </div>
            </div>}
          </div>
          <div className="row">
            {deals}
          </div>

          {this.createModal(this.state.index, product1.ProductSymbol, product1.fullName, product2.ProductSymbol)}      

          <div className="sep" />
          {(this.state.isBalanceChange && this.checkSource()) && (
            <Modal close={() => this.closeTransferModal()}>
              <VerificationRequired>
                <TransferDigital
                  isBalanceChange={this.state.isBalanceChange}
                  productId={product1.ProductId}
                  product={product1.ProductSymbol}
                  amount={product1.Amount}
                  hold={product1.Hold}
                  close={() => this.closeTransferModal()}
                  balance={product1.Amount - product1.Hold}
                />
              </VerificationRequired>
            </Modal>
          )}
          {this.state.status === 'openPraxis' && this.state.praxis && 
          <Modal idModal="praxisIframe" close={this.closeModal}>
            <Praxis currency={fromCurrencySymbol} userId={this.state.session.UserId} password={this.state.reqCode} 
                amount={this.state.price} token={this.state.praxis} onLoad={() => this.setState({...this.state, spinner: false})}/>
          </Modal>}
          {this.state.spinner && <div className="isLoading"><MoonLoader sizeUnit={"px"} size={90} color={'rgb(43,191,223)'} loading={true} /></div>}
          {this.state.status === 'filled' && 
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
                        <h1 className="text-center success">Your order will be processed once you complete the payment</h1>
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
          {this.state.errorModal && 
            <ErrorPopup fixedOrder={() => this.fixedOrder(cryptoQuantity, price, dealObject.LimitPrice)} close={() => this.closeModal()} verify={() => this.onClickVerifyAccunt()} errorMessage={this.state.errorMessage}/>}

        </VerificationRequired>
      </WidgetBase>);
  }
}

Buy_Fixed.defaultProps = {
  hideSelect: false,
  hideCloseLink: true,
  sell: false,
  buy: false,
};

Buy_Fixed.propTypes = {
  hideSelect: React.PropTypes.bool,
  sell: React.PropTypes.bool,
  buy: React.PropTypes.bool,
};

export default Buy_Fixed;
