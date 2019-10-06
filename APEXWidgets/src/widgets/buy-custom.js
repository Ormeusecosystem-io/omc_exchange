/* global $, AlphaPoint, window */
import React from 'react';
import uuidV4 from 'uuid/v4';
import WidgetBase from './base';
import InputNoLabel from '../misc/inputNoLabel';
import VerificationRequired from './verificationRequired';
import Modal from './modal';
import {
  ordersWidgetDidMount,
  ordersWidgetWillUnmount,
  getOrderFee,
  getRetailInstruments,
} from '../misc/ordersWidgetsHelper';
import {
  formatNumberToLocale,
  truncateToDecimals,
  getQuantityForFixedPrice,
  getPriceForFixedQuantity,
  formatOrders,
  parseNumberToLocale,
  getDecimalPrecision,
} from './helper';

class BuyCustom extends React.Component {
  constructor(props) {
    super(props);
    this.ordersWidgetDidMount = ordersWidgetDidMount.bind(this);
    this.ordersWidgetWillUnmount = ordersWidgetWillUnmount.bind(this);
    this.getOrderFee = getOrderFee;

    this.defaultState = {
      amount: 0,
      price: 0,
      total: 0,
      fee: 0,
      priceString: '0',
      amountString: '0',
      errorMessage: '',
      status: '',
      invalidNumber: true,
    };
    this.state = {
      ...this.defaultState,
      buy: true,
      market: true,
      marketBuy: 0,
      marketSell: 0,
      productPairs: [],
      decimalPlaces: {},
      productPair: '',
      pair: {},
      OrderId: null,

      balances: [],
      OrderType: 2, // limit order
      InstrumentId: 0,
      AccountId: AlphaPoint.userAccounts.value[0],

      noMarket: false,
      bookBuys: [],
      bookSells: [],
    };
  }

  componentDidMount() {
    this.ordersWidgetDidMount(true, true);
    this.selectedAccount = AlphaPoint.selectedAccount.subscribe(AccountId => this.setState({ AccountId }));
    this.sendOrder = AlphaPoint.sendorder.subscribe(res => this.setState({ OrderId: res.OrderId }));
    this.orderStateEvent = AlphaPoint.accountBalances
      .filter(order => (
        order.OrderId === this.state.OrderId
        && order.ChangeReason === 'SystemCanceled_NoMoreMarket'
      ))
      .subscribe(() => this.setState({
        errorMessage: AlphaPoint.translation('BUY_SELL_CUSTOM.CHANGED_MARKET') ||
        'The market has changed and your order could not be filled. Please review the new market values and resubmit your order.',
        status: 'killed'
      }));

    this.orderTradeEvent = AlphaPoint.accountTrades
      .subscribe(trades => {
        const orderWasFilled = trades.some(trade => trade.OrderId === this.state.OrderId);

        if (orderWasFilled) this.setState({ status: 'filled' });
      });

    this.Level2 = AlphaPoint.Level2
      .filter(orders => orders.length)
      .map(formatOrders)
      .subscribe(orders => {
        const bookBuys = orders.filter(order => order.Side === 0).sort((a, b) => {
          if (a.Price < b.Price) return 1;
          if (a.Price > b.Price) return -1;
          return 0;
        });
        const bookSells = orders.filter(order => order.Side === 1).sort((a, b) => {
          if (a.Price > b.Price) return 1;
          if (a.Price < b.Price) return -1;
          return 0;
        });

        this.setState({ bookBuys, bookSells });
      });

    this.Level2Updates = AlphaPoint.Level2Update
      .filter(orders => orders.length)
      .map(formatOrders)
      .subscribe((orders) => {
        const buys = orders.filter(order => order.Side === 0);
        const sells = orders.filter(order => order.Side === 1);

        let { bookBuys, bookSells } = this.state;
        if (buys.length && sells.length) {
          buys.forEach((obj) => {
            const newBuys = this.state.bookBuys.filter(lev => lev.Price !== obj.Price);
            bookBuys = (obj.Quantity ? newBuys.concat(obj) : newBuys).sort((a, b) => b.Price - a.Price);
          });
          sells.forEach((obj) => {
            const newSells = this.state.bookSells.filter(lev => lev.Price !== obj.Price);
            bookSells = (obj.Quantity ? newSells.concat(obj) : newSells).sort((a, b) => a.Price - b.Price);
          });
        }
        this.setState({ bookBuys, bookSells });
      });
  }

  componentWillUnmount() {
    this.ordersWidgetWillUnmount();
    this.sendOrder.dispose();
    this.selectedAccount.dispose();
    this.orderStateEvent.dispose();
    this.orderTradeEvent.dispose();
    this.Level2.dispose();
    this.Level2Updates.dispose();
  }

  order = () => {
    const market = this.state.buy ? this.state.marketSell : this.state.marketBuy;
    const pair = this.state.pair;
    const product1 = this.state.balances.find((prod) => pair.Product1Symbol === prod.ProductSymbol) || {};
    const product2 = this.state.balances.find((prod) => pair.Product2Symbol === prod.ProductSymbol) || {};
    const balance = this.state.buy ? (product2.Amount - product2.Hold || 0) : (product1.Amount - product1.Hold || 0);
    const product1DecimalPlaces = this.state.decimalPlaces[this.state.pair.Product1Symbol];
    let total;
    console.log('IN ORDER 2');
    // check if they have enough money
    if (this.state.market) {
      total = this.state.buy ? this.state.price : this.state.amount;
    } else {
      total = this.state.buy ? (this.state.price * this.state.amount) : this.state.amount;
    }
    console.log('IN ORDER 3');

    if (total > balance) {
      $.bootstrapGrowl(AlphaPoint.translation('BUY_SELL_CUSTOM.INSUFFICIENT_FUNDS') || 'Insufficient Funds', {
        type: 'danger',
        allow_dismiss: true,
        align: 'right',
        delay: AlphaPoint.config.growlwerDelay,
      });
      return this.setState({ errorMessage: AlphaPoint.translation('BUY_SELL_CUSTOM.INSUFFICIENT_FUNDS') || 'Insufficient Funds' });
    }
    console.log('IN ORDER 4');

    this.setState({ total: this.state.amount * ((this.state.market) ? market : this.state.price) });

    const payload = {
      AccountId: this.state.AccountId,
      ClientOrderId: 0,
      Side: this.props.buy ? 0 : 1,
      Quantity: truncateToDecimals(this.state.amount, product1DecimalPlaces),
      OrderIdOCO: 0,
      OrderType: this.state.OrderType,
      InstrumentId: pair.InstrumentId,
      TimeInForce: 4,
      OMSId: AlphaPoint.oms.value,
      UseDisplayQuantity: false,
      LimitPrice: this.state.LimitPrice,
    };
    console.log(payload, "payload custom amount" , this.props.sell ,"this.props.sell");
    // return AlphaPoint.sendOrder(payload);
  };

  changePairId = (e) => window.doSelectIns(e);

  changeInstrument = (e) => {
    this.setState({ amount: 0, amountString: '0', priceString: '0', price: 0, total: 0, invalidNumber: true, errorMessage: '' }, this.getOrderFee);
    const myInstrument = (this.state.productPairs.filter((pair) => pair.Symbol === e.target.value)[0] || {});
    this.changePairId(myInstrument.InstrumentId);
  }

  changeMode = buy => this.setState({ ...this.defaultState, buy }, this.getOrderFee);

  changeAmount = (product1Symbol, product2Symbol, e) => {
    const { decimalPlaces, buy, bookSells, bookBuys } = this.state;
    const amountString = e.target.value;
    const amount = parseNumberToLocale(amountString);
    const decimals = getDecimalPrecision(amount);
    const decimalsAllowed = decimalPlaces[product1Symbol];
    const decimalsAllowedPrice = decimalPlaces[product2Symbol];

    if (decimals <= decimalsAllowed && !isNaN(amount)) {
      const invalidNumber = false;
      const noMarket = false;
      const book = buy ? bookSells : bookBuys;
      const { Price, LimitPrice } = getPriceForFixedQuantity(amount, 0, book, false, decimalsAllowedPrice);
      if (isNaN(Price)) {
        return this.setState({
          invalidNumber: true,
          noMarket: true,
          errorMessage: this.state.buy
            ? AlphaPoint.translation('BUY_SELL_CUSTOM.NO_QUANTITY_MARKET_BUY') ||
              'There\'s no market for the quantity you wish to buy, please try a lower quantity.'
            : AlphaPoint.translation('BUY_SELL_CUSTOM.NO_QUANTITY_MARKET_SELL') ||
            'There\'s no market for the quantity you wish to sell, please try a lower quantity.',
          LimitPrice,
        });
      } else if (this.state.market) {
        this.setState(
          {
            invalidNumber,
            noMarket: false,
            errorMessage: '',
            status: '',
            amount,
            amountString,
            price: Price,
            priceString: formatNumberToLocale(Price, this.state.decimalPlaces[product2Symbol]),
            total: Price,
            LimitPrice,
          },
          this.getOrderFee,
        );
      } else {
        this.setState({
          invalidNumber,
          noMarket: false,
          errorMessage: '',
          status: '',
          amount,
          amountString: amount,
          price: Price,
          priceString: formatNumberToLocale(this.state.price, this.state.decimalPlaces[product2Symbol]),
          total: amount * this.state.price,
          LimitPrice,
        }, this.getOrderFee);
      }
    }
    return true;
  };

  closeModal = () => this.setState({ status: '' });

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
      const { Quantity: amount, LimitPrice } = getQuantityForFixedPrice(
        price,
        AlphaPoint.config.fixedOrdersMargin,
        book,
        false,
        decimalsAllowed,
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
          LimitPrice,
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
          LimitPrice,
          errorMessage: ''
        }, this.getOrderFee);
      } else {
        this.setState({
          invalidNumber,
          noMarket,
          status: '',
          amountString,
          amount,
          price,
          priceString,
          LimitPrice,
          errorMessage: '',
          total: amount * price
        }, this.getOrderFee);
      }
    }
    return true;
  };

  validateNumberOnBlur = (product1Symbol, product2Symbol, e) => {
    const value = e.target.value;

    if (!value || value <= 0) {
      this.setState({ invalidNumber: true, errorMessage: AlphaPoint.translation('BUY_SELL_CUSTOM.VALID_NUMBER') || 'Please enter a valid number' });
    } else if (e.target.name === 'price' && this.state.amount <= 0) {
      this.setState({ invalidNumber: true, errorMessage: AlphaPoint.translation('BUY_SELL_CUSTOM.VALID_NUMBER') || 'Please enter a valid number' });
    } else if (e.target.name === 'amount' && this.state.price <= 0) {
      this.setState({ invalidNumber: true, errorMessage: AlphaPoint.translation('BUY_SELL_CUSTOM.VALID_NUMBER') || 'Please enter a valid number' });
    } else if (this.state.buy) {
      if (this.state.fee >= this.state.amount) {
        this.setState({
          invalidNumber: true,
          errorMessage: (AlphaPoint.translation('BUY_SELL_CUSTOM.GREATER_THAN_FEE_BUY') ||
        `The amount you're buying must be greater than the transaction fee `) +
        `(${formatNumberToLocale(this.state.fee, this.state.decimalPlaces[this.state.feeProduct])}).`
        });
      }
    } else if (!this.state.buy) {
      if (this.state.fee >= this.state.total) {
        this.setState({
          invalidNumber: true,
          errorMessage: (AlphaPoint.translation('BUY_SELL_CUSTOM.GREATER_THAN_FEE_SELL') ||
        `The price at which you're selling must be greater than the transaction fee `) +
          `(${formatNumberToLocale(this.state.fee, this.state.decimalPlaces[this.state.feeProduct])}).`
        });
      }
    } else {
      this.setState({ invalidNumber: false });
    }
  };

  render() {
    const inputsRadio = [];
    const labelsRadio = [];
    let options = [];

    const checkPair = getRetailInstruments(this.state.productPairs, this.state.balances);

    if (checkPair.length > 0) {
      options = checkPair.map(pair => (
        <option
          value={pair.Symbol}
          key={pair.InstrumentId}
          onChange={() => this.changePairId(pair.InstrumentId)}
        >
          {AlphaPoint.config.reversePairs ? (pair.Product2Symbol + pair.Product1Symbol) : pair.Symbol}
        </option>
      ));

      for (let i = 0; i < checkPair.length; i++) {
        inputsRadio.push(
          <input
            type="radio"
            value={checkPair[i].Symbol}
            name="sc-1-1"
            id={`sc-1-1-${i + 1}`}
            readOnly
            onClick={() => this.changePairId(checkPair[i].InstrumentId)}
            key={i}
            checked={(checkPair[i].Symbol === this.state.productPair && true) || false}
          />,
        );
        labelsRadio.push(
          <label
            htmlFor={`sc-1-1-${i + 1}`}
            data-value={checkPair[i].Symbol}
          >{checkPair[i].Symbol}</label>,
        );
      }
    }

    const pair = this.state.productPairs.find((prod) => this.state.productPair === prod.Symbol) || {};
    const product1 = this.state.balances.find((prod) => pair.Product1Symbol === prod.ProductSymbol) || {};
    const product2 = this.state.balances.find((prod) => pair.Product2Symbol === prod.ProductSymbol) || {};
    const market = this.state.buy ?
      formatNumberToLocale(this.state.marketSell, this.state.decimalPlaces[product2.ProductSymbol])
      : formatNumberToLocale(this.state.marketBuy, this.state.decimalPlaces[product2.ProductSymbol]);

    const { amount, total, fee, feeProduct } = this.state;
    const netProduct = this.state.buy ? product1.ProductSymbol : product2.ProductSymbol;
    const netAmountBought = netProduct === feeProduct ? Math.max(0, amount - fee) : amount;
    const netAmountSold = netProduct === feeProduct ? Math.max(0, total - fee) : total;

    const BuyOrSellSideSymbol = this.state.buy ? product1.ProductSymbol : product2.ProductSymbol;
    const transaction_fee = formatNumberToLocale(this.state.fee, this.state.decimalPlaces[BuyOrSellSideSymbol]);

    const tabs = (
      <div>
        <span
          className={`tab tab-first ${this.state.buy ? 'active' : ''}`}
          onClick={() => this.changeMode(true)}
        >{AlphaPoint.translation('BUY_SELL_CUSTOM.BUY') || 'Buy'} {product1.fullName}</span>
        <span
          className={`tab tab-second ${!this.state.buy ? 'active' : ''}`}
          onClick={() => this.changeMode(false)}
        >{AlphaPoint.translation('BUY_SELL_CUSTOM.SELL') || 'Sell'} {product1.fullName}</span>

        <span className="blue-line" />
      </div>
    );
    // const orderTotal = this.state.total + this.state.fee;


    const net = this.state.buy ? netAmountBought : netAmountSold;

    return (
          <div className="buy-sell-boxes">
            <VerificationRequired>

              <div className=" buy-sell-boxes-custom pricing-deal-container">
                <div className="row">
                  <div>
                  <div className="pricing-table-content">
                    <p className="pricing-table-price">Custom Amount</p>
                  </div>
                    <div className="input-group">
                      <span className="action">{this.props.sell ?  "Buy" : "Sell"}</span>
                      <InputNoLabel
                        placeholder={formatNumberToLocale(0, this.state.decimalPlaces[product1.ProductSymbol])}
                        type="text"
                        value={this.state.amountString}
                        onChange={e => this.changeAmount(product1.ProductSymbol, product2.ProductSymbol, e)}
                        onBlur={() => this.setState({ errorMessage: '' })}
                        name="amount"
                      />
                        <div className="input-group-addon" >{product1.ProductSymbol}</div>
                    </div>
                    <div className="input-group">
                      <span className="action">For</span>
                      <InputNoLabel
                        placeholder={formatNumberToLocale(0, this.state.decimalPlaces[product2.ProductSymbol])}
                        type="text"
                        value={this.state.priceString}
                        onChange={e => this.changePrice(product1.ProductSymbol, product2.ProductSymbol, e)}
                        onBlur={() => this.setState({ errorMessage: '' })}
                        name="price"
                      />
                      <div className="input-group-addon" >{product2.ProductSymbol}</div>
                    </div>
                    <div className="input-group">
                      <span className="action">Fee</span>
                      <span className="pull-right">{transaction_fee} {this.state.feeProduct}</span>
                    </div>                    

                  </div>
                  {/* <div className="col-sm-6">
                    <h3 className="title-blue-bg">{AlphaPoint.translation('BUY_SELL_CUSTOM.CURRENT_MESSAGE') || 'Current Price Per'} {product1.ProductSymbol}</h3>
                    <table className="table table-bordered">
                      <tbody>
                        <tr>
                          <td>1 {product1.fullName} =</td>
                          <td className="text-right">{market && market + pair.Product2Symbol}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div> */}
                </div>
                <div className="row">
                  <div className="error-container">
                    {/* <p>{AlphaPoint.translation('BUY_SELL_CUSTOM.TOTAL_AMOUNT_TEXT') || 'Total Amount'} ≈
                      <span className="pull-right">
                        {
                          // To stay visually symmetrical here, used formatNumberToLocale helper
                          // and this.state.amountUnformatted (because this.state.amount is already formatted - so would break this if used)
                          !this.state.buy ?
                            formatNumberToLocale(
                              this.state.amount,
                              this.state.decimalPlaces[product1.ProductSymbol],
                            ) :
                            formatNumberToLocale(
                              this.state.total,
                              this.state.decimalPlaces[product2.ProductSymbol],
                            )
                        } {!this.state.buy ? product1.ProductSymbol : product2.ProductSymbol}
                      </span>
                    </p>

                    <p className="fs13 mb30">{AlphaPoint.translation('BUY_SELL_CUSTOM.TRANSACTION_FEE') || 'Transaction Fee'} ≈
                      <span className="pull-right">{transaction_fee} {this.state.feeProduct}
                      </span>
                    </p>

                    <p className="fs13 mb15">{AlphaPoint.translation('BUY_SELL_CUSTOM.NET_AMOUNT') || 'Net Amount Received'} ≈<span className="pull-right">
                      {`${
                        formatNumberToLocale(net, this.state.decimalPlaces[netProduct] || 2)
                      } ${netProduct}`}
                    </span>
                    </p> */}
                    {this.state.errorMessage && (this.state.invalidNumber || this.state.noMarket || this.state.status === 'killed') &&
                  <div
                    className="custom-amount-error-container"
                  >{this.state.errorMessage}</div>}
                    <div className="text-center">
                      <a
                        className="btn btn-orange"
                        disabled={this.state.invalidNumber || this.state.noMarket}
                        onClick={this.order}
                      ><div className="confirm-transaction-submit-icon"></div>
                      <div className="confirm-transaction-button-text">{this.props.sell ?
                        (AlphaPoint.translation('BUY_SELL_CUSTOM.BUY') || 'BUY NOW') :
                        (AlphaPoint.translation('BUY_SELL_CUSTOM.SELL') || 'SELL NOW')} {product1.fullName}</div></a>
                    </div>
                  </div>
                </div>
              </div>
            </VerificationRequired>
          </div>
    );
  }
}

export default BuyCustom;
