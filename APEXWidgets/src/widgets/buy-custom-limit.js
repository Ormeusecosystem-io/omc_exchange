/* global $, AlphaPoint, window */
import React from 'react';
import WidgetBase from './base';
import InputNoLabel from '../misc/inputNoLabel';
import OpenOrders2 from './openOrders-2';
import {
  ordersWidgetDidMount,
  ordersWidgetWillUnmount,
  getOrderFee,
  changeValueOnMarketChange,
  changeAmountOnMarketChange,
} from '../misc/ordersWidgetsHelper';

class BuyCustomLimit extends React.Component {
  constructor(props) {
    super(props);

    this.ordersWidgetDidMount = ordersWidgetDidMount.bind(this);
    this.ordersWidgetWillUnmount = ordersWidgetWillUnmount.bind(this);
    this.getOrderFee = getOrderFee;
    this.changeValueOnMarketChangeFunc = changeValueOnMarketChange.bind(this);
    this.changeAmountOnMarketChangeFunc = changeAmountOnMarketChange.bind(this);

    this.state = {
      buy: true,
      market: true,
      marketBuy: 0,
      marketSell: 0,
      productPairs: [],
      total: 0,
      fee: 0,
      feeProduct: '',
      productPair: '',
      amount: 1,
      stop_price: 0,
      ref_price: 0,
      limit_offset: 0,
      trailing_amount: 1,
      display_quantity: 0,
      peg_price: 1,
      price: 0,
      amountLastChanged: true,
      valueLastChanged: false,
      successMsg: '',
      errorMsg: '',
      balances: [],
      orderTypes: [
        { name: 'Market Order', value: 1 },
        { name: 'Limit Order', value: 2 },
        { name: 'Stop Market', value: 3 },
        { name: 'Stop Limit', value: 4 },
        { name: 'Trailing Stop Market', value: 5 },
        { name: 'Trailing Stop Limit', value: 6 },
        { name: 'Fill Or Kill', value: 8 },
        { name: 'IOC', value: 10 },
        { name: 'Reserve Order', value: 12 },
      ],
      OrderType: 1,
      Peg: 3,
      InstrumentId: 0,
      AccountId: AlphaPoint.userAccounts.value[0],
    };
  }

  componentDidMount() {
    // this.getOrderFee();
    this.ordersWidgetDidMount();
  }

  componentWillUnmount() {
    this.ordersWidgetWillUnmount();
  }

  order = () => {
    const market = this.state.buy ? this.state.marketSell : this.state.marketBuy;
    const pair = this.state.pair;
    const product1 = this.state.balances.find((prod) => pair.Product1Symbol === prod.ProductSymbol) || {};
    const product2 = this.state.balances.find((prod) => pair.Product2Symbol === prod.ProductSymbol) || {};
    const balance = this.state.buy ? (product2.Amount - product2.Hold || 0) : (product1.Amount - product1.Hold || 0);
    let total;

    // check if they have enough money
    if (this.state.market) {
      total = this.state.buy ? this.refs.value.value() : this.refs.amount.value();
    } else {
      total = this.state.buy ? (this.refs.value.value() * this.refs.amount.value()) : this.refs.amount.value();
    }

    if (total > balance) {
      $.bootstrapGrowl(AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.INSUFFICIENT_FUNDS') || 'Insufficient Funds', {
        type: 'danger',
        allow_dismiss: true,
        align: 'right',
        delay: AlphaPoint.config.growlwerDelay,
      });
      return this.setState({ errorMsg: AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.INSUFFICIENT_FUNDS') || 'Insufficient Funds' });
    }

    this.setState({ total: this.refs.amount.value() * ((this.state.market) ? market : this.refs.value.value()) });

    const limitPrice = this.state.OrderType % 2 === 0 && this.state.price;
    const stopPrice = (this.state.OrderType === 5 || this.state.OrderType === 6) ?
      market - this.refs.trailing_amount.value()
      :
      (this.refs.value && this.refs.value.value()) || 0;

    const commonPayload = {
      AccountId: AlphaPoint.userAccounts.value[0],
      ClientOrderId: 0,
      Side: this.state.buy ? 0 : 1,
      Quantity: this.refs.amount.value(),
      OrderIdOCO: 0,
      OrderType: this.state.OrderType,
      InstrumentId: pair.InstrumentId,
      TimeInForce: 0,
      OMSId: AlphaPoint.oms.value,
      UseDisplayQuantity: false,
    };
    let payload;

    switch (this.state.OrderType) {
      case 2: {
        payload = { ...commonPayload, LimitPrice: limitPrice };
        break;
      }
      case 3: {
        payload = {
          ...commonPayload,
          StopPrice: +stopPrice,
          PegPriceType: this.state.buy ? 3 : 2,
        };
        break;
      }

      default: {
        payload = commonPayload;
      }
    }

    return AlphaPoint.sendOrder(payload);
  };

  changePair = (e) => AlphaPoint.setProductPair(e.target.value);

  changePairId = (e) => window.doSelectIns(e);

  changeInstrument = (e) => {
    this.setState({ amount: 0, price: 0 });
    const myInstrument = (this.state.productPairs.filter((pair) => pair.Symbol === e.target.value)[0] || {});
    this.changePairId(myInstrument.InstrumentId);
  }

  changeMode = (state) => {
    const peg = state ? 3 : 2;
    const total = (state ? this.state.marketSell : this.state.marketBuy) * this.state.amount;

    if (this.state.market) {
      return this.setState({
        buy: state,
        Peg: peg,
        price: total,
        total,
      }, this.getOrderFee);
    }

    return this.setState({
      buy: state,
      Peg: peg,
      price: this.state.buy ? this.state.marketBuy : this.state.marketSell,
      total: this.state.buy ? (this.state.marketBuy * this.state.amount) : (this.state.marketSell * this.state.amount),
    }, this.getOrderFee);
  };

  changeAmount = (e) => {
    const amount = e.target.value;
    const value = amount * (this.state.buy ? this.state.marketSell : this.state.marketBuy);

    if (this.state.market) {
      if (this.changeAmountOnMarketChange) {
        this.changeAmountOnMarketChange.dispose(); // Unsubscribe amount change
        this.changeAmountOnMarketChange = null;
        this.changeValueOnMarketChangeFunc(); // Subscribe to value change
      }

      return this.setState({
        amount,
        price: value,
        total: value,
      }, this.getOrderFee);
    }
    return this.setState({
      amount,
      price: this.state.price,
      total: amount * this.state.price,
    }, this.getOrderFee);
  };

  changePrice = (e) => {
    const value = e.target.value;
    let amount = (value / (this.state.buy ? this.state.marketSell : this.state.marketBuy)).toFixed(8);

    if (this.state.market) {
      if (this.changeValueOnMarketChange) {
        this.changeValueOnMarketChange.dispose(); // Unsubscribe value change
        this.changeValueOnMarketChange = null;
        this.changeAmountOnMarketChangeFunc(); // Subscribe to amount change
      }

      this.setState({
        amount,
        price: value,
        total: value,
        limit_offset: this.state.OrderType === 6 ? this.state.marketSell - value : 0,
      }, this.getOrderFee);
    } else {
      if (this.state.orderType === 2) {
        return this.setState({
          amount: this.state.amount,
          price: value,
          total: this.state.amount * value,
          limit_offset: this.state.OrderType === 6 ? this.state.marketSell - value : 0,
          limitPrice: value,
        }, this.getOrderFee);
      }
      this.setState({
        amount: this.state.amount,
        price: value,
        total: this.state.amount * value,
        limit_offset: this.state.OrderType === 6 ? this.state.marketSell - value : 0,
      }, this.getOrderFee);
    }
  };

  changeDisplayQuantity = () => {
    const state = {};

    state.display_quantity = this.refs.display_quantity.value();
    this.setState(state, this.getOrderFee);
  };

  changeMarket = (market) => {
    const mPrice = this.state.buy ? this.state.marketSell : this.state.marketBuy;

    this.setState({
      market,
      total: this.state.amount * (market ? mPrice : this.state.price),
      price: market ? mPrice : this.state.price,
    }, this.getOrderFee);
  };

  changeOrderType = orderTypeValue => {
    const OrderType = orderTypeValue;

    if (OrderType === 2) {
      this.setState({ market: false });
    }
    if (OrderType === 1) {
      this.setState({ market: true });
    }
    return this.setState({ OrderType });
  }

  render() {
    const inputsRadio = [];
    const labelsRadio = [];
    let options = [];
    let fiats = [];
    let fiatProds = [];

    if (AlphaPoint.config.allowCryptoPairs) {
      fiatProds = this.state.balances;
    } else {
      fiatProds = this.state.balances.filter((prod) => prod.ProductType === 'NationalCurrency');
    }

    // const fiatProds = this.state.balances.filter((prod) => prod.ProductType === 'NationalCurrency');
    const fiatPairs = fiatProds.map((fiatProduct) => {
      const temp = this.state.productPairs.filter(pair => pair.Product2Symbol === fiatProduct.ProductSymbol);
      return temp;
    }) || {};

    if (fiatPairs.length > 0) {
      for (let i = 0; i < fiatPairs.length; i++) {
        fiats = fiats.concat(fiatPairs[i]);
      }
    }

    const checkPair = fiats;

    if (checkPair.length > 0) {

      options = checkPair.map((pair) => (
        <option value={pair.Symbol} key={pair.Symbol} onChange={() => this.changePairId(pair.InstrumentId)}>{AlphaPoint.config.reversePairs ? (pair.Product2Symbol + pair.Product1Symbol) : pair.Symbol}</option> // eslint-disable-line max-len
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
    const market = this.state.buy ? this.state.marketSell : this.state.marketBuy;

    const tabs = (
      <div className="tabs-container">
        <span
          className={`tab tab-first ${this.state.buy ? 'active' : ''}`}
          onClick={() => this.changeMode(true)}
        >{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.BUY') || `Buy ${product1.fullName}`}</span>
        <span
          className={`tab tab-second ${!this.state.buy ? 'active' : ''}`}
          onClick={() => this.changeMode(false)}
        >{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.SELL') || ` Sell ${product1.fullName}`}</span>
        <span className="blue-line" />
      </div>
    );
    const orderTypes = (
      <div className="tabs-container">
        <span
          className={`tab tab-first ${this.state.OrderType === 1 ? 'active' : ''}`}
          onClick={() => this.changeOrderType(1)}
        >{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.MARKET_ORDER') || 'Market Order'}</span>
        <span
          className={`tab tab-second ${this.state.OrderType === 2 ? 'active' : ''}`}
          onClick={() => this.changeOrderType(2)}
        >{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.LIMIT_ORDER') || 'Limit Order'}</span>
        <span className="blue-line" />
      </div>
    );

    return (
      <WidgetBase {...this.props}>
        <div className="col-md-9 col-xs-12">
          <div className="content buy-sell-custom-content">
            {/* <h2 className="section-title">{AlphaPoint.translation("BUY_SELL_CUSTOM_LIMIT.TITLE_TEXT") || 'Buy / Sell a Custom Amount'}</h2> */}
            <div className="buy-sell-custom-page inner">

              <div className="row options-row" style={{ "margin-bottom": "15px" }}>
                <div className="tabs-main col-sm-6">
                  {tabs}
                </div>

                <div className="col-sm-6">
                  {/* <span className="directions-label choose-inst">Choose an Instrument</span> */}
                  {!AlphaPoint.config.usePairDropdown ?
                    <div className="segmented-control pull-right">
                      {inputsRadio}
                      {labelsRadio}
                    </div>
                    :
                    options.length < 2 ? null :
                      <select className="form-control pull-right pair-select-dropdown" value={this.state.productPair} onChange={this.changeInstrument}>
                        {options}
                      </select>
                  }
                </div>

              </div>

              {/* <div className="pull-left directions-container">
                <span className="directions-label">{this.state.buy ? `Buy ${product1.fullName} with ${product2.fullName}` : `Sell ${product1.fullName} for ${product2.fullName}`}</span>
              </div> */}


              <div className="row options-row">
                {/* <span className="directions-label sel-ord-type">Select an Order Type</span> */}
                <div className="tabs-main col-sm-6">
                  {orderTypes}
                </div>


              </div>




              <div className="clearfix" />
              <div className="row mt50">
                <div className="col-sm-6">
                  <h3 className={`title-blue-bg`}>{this.state.buy ? `Enter Amount of ${product1.fullName} to Buy` : `Enter Amount of ${product1.fullName} to Sell`}</h3>
                  {/* {this.state.OrderType === 2 && <label style={{ marginTop: "5px", fontWeight: "600" }}>{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.AMOUNT_TO_BUY_LABEL') || `Amount of ${product1.fullName} you want to `}{this.state.buy ? 'buy' : 'sell'}</label>} */}
                  <div className="input-group">
                    <span className="input-group-addon" id="sizing-addon3">{product1.ProductSymbol}</span>
                    <InputNoLabel placeholder={0.00000000} type="number" min="0" value={this.state.amount} onChange={this.changeAmount} ref="amount" />
                  </div>
                  {this.state.OrderType === 2 && <label style={{ marginTop: "10px", fontWeight: "600" }}>{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.LIMIT_PRICE_LABEL') || 'Set a Limit Price'}</label>}
                  <div className="input-group">
                    <span className="input-group-addon" id="sizing-addon3">{product2.ProductSymbol}</span>
                    <InputNoLabel placeholder={0.00000000} type="number" min="0" value={this.state.price} onChange={this.changePrice} ref="value" />
                  </div>
                  <p className="send-receive-text">{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.INPUT_MESSAGE') || `Enter the amount of ${product1.ProductSymbol} you wish to ${this.state.buy ? "buy" : "sell"}. You may enter the amount either directly in ${product1.ProductSymbol} units, or in the equivalent amount of ${product2.ProductSymbol}.`}</p>
                </div>
                <div className="col-sm-6">
                  <h3 className="title-blue-bg">{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.CURRENT_MESSAGE') || 'Current Price Per'} {product1.ProductSymbol}</h3>
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <td>1 {product1.fullName} =</td>
                        <td className="text-right">{market && market.toFixed(AlphaPoint.config.decimalPlaces) + this.state.pair.Product2Symbol}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h3 className="title-bottom-border mt85">{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.SUMMARY_TITLE') || 'Transaction Summary'}</h3>

                  <p className="fs13 mb30">{this.state.buy ? (AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.TOTAL_COST') || 'Total Cost') : (AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.TOTAL_SOLD') || 'Total Sold')}
                    <span className="pull-right">{this.state.buy ?
                      (parseFloat(this.state.total) || 0).toFixed(AlphaPoint.config.decimalPlaces || 2)
                      : (parseFloat(this.state.amount) || 0).toFixed(AlphaPoint.config.decimalPlaces || 2)} {this.state.buy ? product2.ProductSymbol : product1.ProductSymbol}
                    </span>
                  </p>

                  <p className="fs13 mb30">{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.TOTAL_RECEIVED') || 'Total Received'}
                    <span className="pull-right">{this.state.buy ?
                      (parseFloat(this.state.amount) || 0).toFixed(AlphaPoint.config.decimalPlaces || 2)
                      : (parseFloat(this.state.total) || 0).toFixed(AlphaPoint.config.decimalPlaces || 2)} {this.state.buy ? product1.ProductSymbol : product2.ProductSymbol}
                    </span>
                  </p>

                  <p className="fs13 mb30">{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.TRANSACTION_FEE') || 'Transaction Fee'}
                    <span className="pull-right">{(parseFloat(this.state.fee) || 0).toFixed(AlphaPoint.config.decimalPlaces || 2)} {this.state.buy ? product1.ProductSymbol : product2.ProductSymbol}
                    </span>
                  </p>

                  <p className="fs13 mb30">{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.NET_AMOUNT') || 'Net Amount Received'} <span className="pull-right">
                    {this.state.buy ? (parseFloat(this.state.amount) - (parseFloat(this.state.fee) || 0)).toFixed(AlphaPoint.config.decimalPlaces) :
                      ((parseFloat(this.state.total) || 0) - parseFloat(this.state.fee)).toFixed(AlphaPoint.config.decimalPlaces)} {this.state.buy ? product1.ProductSymbol : product2.ProductSymbol}
                  </span>
                  </p>


                  <div className="text-center">
                    <a className="btn btn-orange" onClick={this.order}>{this.state.buy ? `Buy ${product1.fullName}` : `Sell ${product1.fullName}`}</a>
                  </div>

                </div>
              </div>
              {/* <div className="row mt30">
                <div className="col-sm-6 xs-mt-20">
                  <h3 className="title-bottom-border">Transaction Summary</h3>

                  <p className="fs13 mb30">{this.state.buy ? "Total Cost" : "Total Sold"}
                    <span className="pull-right">{this.state.buy ?
                      (parseFloat(this.state.total) || 0).toFixed(AlphaPoint.config.decimalPlaces || 2)
                      : (parseFloat(this.state.amount) || 0).toFixed(AlphaPoint.config.decimalPlaces || 2)} {this.state.buy ? product2.ProductSymbol : product1.ProductSymbol}
                    </span>
                  </p>

                  <p className="fs13 mb30">Total Received
                    <span className="pull-right">{this.state.buy ?
                      (parseFloat(this.state.amount) || 0).toFixed(AlphaPoint.config.decimalPlaces || 2)
                      : (parseFloat(this.state.total) || 0).toFixed(AlphaPoint.config.decimalPlaces || 2)} {this.state.buy ? product1.ProductSymbol : product2.ProductSymbol}
                    </span>
                  </p>

                  <p className="fs13 mb30">{AlphaPoint.translation('BUY_SELL_CUSTOM.TRANSACTION_FEE') || 'Transaction Fee'}
                    <span className="pull-right">{(parseFloat(this.state.fee) || 0).toFixed(AlphaPoint.config.decimalPlaces || 2)} {this.state.buy ? product1.ProductSymbol : product2.ProductSymbol}
                    </span>
                  </p>

                  <p className="fs13 mb15">Net Amount Received <span className="pull-right">
                    {this.state.buy ? (parseFloat(this.state.amount) - (parseFloat(this.state.fee) || 0)).toFixed(AlphaPoint.config.decimalPlaces) :
                      ((parseFloat(this.state.total) || 0) - parseFloat(this.state.fee)).toFixed(AlphaPoint.config.decimalPlaces)} {this.state.buy ? product1.ProductSymbol : product2.ProductSymbol}
                  </span>
                  </p>


                  <div className="text-center">
                    <a className="btn btn-orange" onClick={this.order}>{this.state.buy ? `Buy ${product1.fullName}` : `Sell ${product1.fullName}`}</a>
                  </div>
                </div>
              </div> */}
              {this.state.OrderType === 2 &&
                <div className="row mt-30">
                  <div className="col-sm-12">
                    <OpenOrders2 />
                  </div>
                </div>
              }
            </div>
            <p className="mt85">{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.OR') || 'Or'} <a className="orange-link" href="buy-sell.html">{AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.CLICK_HERE') || 'click here'}</a> {AlphaPoint.translation('BUY_SELL_CUSTOM_LIMIT.FIXED_LINK_MSG') || 'to buy or sell a fixed value amount of'} {product1.fullName}.</p>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

export default BuyCustomLimit;
