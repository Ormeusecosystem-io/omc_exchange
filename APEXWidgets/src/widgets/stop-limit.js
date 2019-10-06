import React from 'react';
import WidgetBase from './base';
import InputLabeled from '../misc/inputLabeled';
import SelectLabeled from '../misc/selectLabeled';
import _ from 'lodash';
import ordersWidgetsHelper from '../misc/ordersWidgetsHelper';
import ReactTooltip from 'react-tooltip'

var StopLimit = React.createClass({
  getDefaultProps: function () {
    return {
      hideCloseLink: true
    }
  },
  getInitialState: function () {
    return {
      buy: true,
      market: false,
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
        {name: 'Market Order', value: 1},
        {name: 'Limit Order', value: 2},
        {name: 'Stop Market', value: 3},
        {name: 'Stop Limit', value: 4},
        {name: 'Trailing Stop Market', value: 5},
        {name: 'Trailing Stop Limit', value: 6},
        {name: 'Fill Or Kill', value: 8},
        {name: 'IOC', value: 10},
        {name: 'Reserve Order', value: 12},
      ],
      OrderType: 4,
      PegTypes: [
        {name: 'Last', value: 1},
        {name: 'Bid', value: 2},
        {name: 'Ask', value: 3},
        // { name: 'Mid Point', value: 4 }
      ],
      Peg: 3,
      InstrumentId: 0,
      AccountId: null,
      verificationLevel: 0,
    };
  },

  componentDidMount: function () {
    // this.getOrderFee();

    ordersWidgetsHelper.ordersWidgetDidMount.bind(this)();
    this.accountInfo = AlphaPoint.accountInfo.subscribe(data => this.setState({verificationLevel: data.VerificationLevel}));
  },

  componentWillUnmount: function () {
    ordersWidgetsHelper.ordersWidgetWillUnmount.bind(this)();
    this.accountInfo.dispose();
  },

  getOrderFee: ordersWidgetsHelper.getOrderFee,

  order: function (e) {
    var market = this.state.buy ? this.state.marketSell : this.state.marketBuy;
    var pair = this.state.pair;
    var product1 = this.state.balances.filter(function (prod) {
        return pair.Product1Symbol == prod.ProductSymbol;
      })[0] || {};
    var product2 = this.state.balances.filter(function (prod) {
        return pair.Product2Symbol == prod.ProductSymbol;
      })[0] || {};
    var balance = this.state.buy ? (product2.Amount - product2.Hold || 0) : (product1.Amount - product1.Hold || 0);

    //check if they have enough money
    if (this.state.market) {
      var total = this.state.buy ? this.refs.value.value() : this.refs.amount.value();
    } else {
      var total = this.state.buy ? (this.refs.value.value() * this.refs.amount.value()) : this.refs.amount.value();
    }

    // console.log('total: ' + total + ' balance: ' + balance);

    // Turning off balance check for demo
    // if (total > balance) {
    //   // console.log('insufficient funds');
    //   return this.setState({ errorMsg: AlphaPoint.translation('BUY_SELL_MODAL.INSUFFICIENT_FUNDS') || 'Insufficient Funds' });
    // }

    this.setState({total: this.refs.amount.value() * ((this.state.market) ? market : this.refs.value.value())});

    var limitPrice = this.state.OrderType % 2 === 0 && this.refs.value.value();
    var stopPrice = (this.state.OrderType === 5 || this.state.OrderType === 6) ? market - this.refs.trailing_amount.value() : ( this.refs.value && this.refs.value.value() ) || 0;
    var payload = {
      AccountId: AlphaPoint.selectedAccount.value,
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

    switch (this.state.OrderType) {
      case 2: {
        payload = Object.assign(payload, {LimitPrice: limitPrice});
        break;
      }
      case 3: {
        payload = Object.assign(payload, {
          StopPrice: +stopPrice,
          PegPriceType: this.state.buy ? 3 : 2,
        });
        break;
      }
      case 4: {
        payload = Object.assign(payload, {
          LimitPrice: limitPrice,
          StopPrice: stopPrice,
          PegPriceType: this.state.buy ? 3 : 2,
        });
        break;
      }
      case 5: {
        payload = Object.assign(payload, {
          PegPriceType: (this.refs.peg_price && this.refs.peg_price.value()) || 0,
          TrailingAmount: this.refs.trailing_amount.value(),
        });
        break;
      }
      case 6: {
        payload = Object.assign(payload, {
          TrailingAmount: this.refs.trailing_amount.value(),
          LimitOffset: this.refs.limit_offset.value(),
          PegPriceType: (this.refs.peg_price && this.refs.peg_price.value()) || 0,
        });
        break;
      }
      case 8: {
        payload = Object.assign(payload, {
          LimitPrice: limitPrice,
          OrderType: 2,
          TimeInForce: 4,
        });
        break;
      }
      case 10: {
        payload = Object.assign(payload, {
          LimitPrice: limitPrice,
          OrderType: 2,
          TimeInForce: 3,
        });
        break;
      }
      case 12: {
        payload = Object.assign(payload, {
          DisplayQuantity: this.refs.display_quantity.value(),
          LimitPrice: limitPrice,
          OrderType: 2,
          UseDisplayQuantity: true,
        });
        break;
      }
      case 1:
      case 7:
      default: {
        break;
      }
    }

    AlphaPoint.sendOrder(payload)
  },

  changePair: function (e) {
    AlphaPoint.setProductPair(e.target.value);
  },

  changeType: function (e) {
    this.setState({OrderType: +e.target.value});
    if (e.target.value % 2 === 0) {
      this.changeMarket(false);
      this.setState({
        price: this.state.buy ? this.state.marketSell : this.state.marketBuy,
        total: this.state.buy ? this.state.marketSell * this.state.amount : this.state.marketBuy * this.state.amount
      });
    } else {
      this.changeMarket(true);
      this.setState({price: this.state.buy ? this.state.marketSell * this.state.amount : this.state.marketBuy * this.state.amount});
    }
  },

  changePeg: function (e) {
    this.setState({Peg: +e.target.value});
  },

  changeMode: function (state) {
    var peg = state ? 3 : 2;
    var total = (state ? this.state.marketSell : this.state.marketBuy) * this.state.amount;

    if (this.state.market) {
      this.setState({
        buy: state,
        Peg: peg,
        price: total,
        total: total
      }, this.getOrderFee);
    } else {
      this.setState({
        buy: state,
        Peg: peg,
        price: this.state.buy ? this.state.marketBuy : this.state.marketSell,
        total: this.state.buy ? (this.state.marketBuy * this.state.amount) : (this.state.marketSell * this.state.amount)
      }, this.getOrderFee);
    }
  },

  changeAmount: function (e) {
    var amount = e.target.value;
    var value = amount * (this.state.buy ? this.state.marketSell : this.state.marketBuy);

    if (this.state.market) {
      if (this.changeAmountOnMarketChange) {
        this.changeAmountOnMarketChange.dispose(); // Unsubscribe amount change
        this.changeAmountOnMarketChange = null;
        ordersWidgetsHelper.changeValueOnMarketChange.bind(this)(); // Subscribe to value change
      }

      this.setState({
        amount: amount,
        price: value,
        total: value
      }, this.getOrderFee);
    } else {
      this.setState({
        amount: amount,
        price: this.state.price,
        total: amount * this.state.price
      }, this.getOrderFee);
    }
  },

  changePrice: function (e) {
    var value = e.target.value;
    var amount = value / (this.state.buy ? this.state.marketSell : this.state.marketBuy);

    if (this.state.market) {
      if (this.changeValueOnMarketChange) {
        this.changeValueOnMarketChange.dispose(); // Unsubscribe value change
        this.changeValueOnMarketChange = null;
        ordersWidgetsHelper.changeAmountOnMarketChange.bind(this)(); // Subscribe to amount change
      }

      this.setState({
        amount: amount,
        price: value,
        total: value,
        limit_offset: this.state.OrderType === 6 ? this.state.marketSell - value : 0
      }, this.getOrderFee);
    } else {
      this.setState({
        amount: this.state.amount,
        price: value,
        total: this.state.amount * value,
        limit_offset: this.state.OrderType === 6 ? this.state.marketSell - value : 0
      }, this.getOrderFee);
    }
  },

  changeStopPrice: function () {
    var state = {};

    state.stop_price = this.refs.value.value();
    this.setState(state, this.getOrderFee);
  },

  changeLimitOffset: function () {
    var state = {};
    var limit_offset = this.refs.limit_offset.value();

    state.limit_offset = limit_offset;
    state.amountLastChanged = true;

    if (!this.state.market) {
      if (this.state.buy) {
        state.total = this.state.marketSell - limit_offset;
      } else {
        state.total = this.state.marketBuy - limit_offset;
      }
    }

    this.setState(state, this.getOrderFee);
  },

  changeTrailingAmount: function () {
    var state = {};

    state.trailing_amount = this.refs.trailing_amount.value();
    this.setState(state, this.getOrderFee);
  },

  changeDisplayQuantity: function () {
    var state = {};

    state.display_quantity = this.refs.display_quantity.value();
    this.setState(state, this.getOrderFee);
  },

  changeMarket: function (market) {
    var mPrice = this.state.buy ? this.state.marketSell : this.state.marketBuy;

    this.setState({
      market: market,
      total: this.state.amount * (market ? mPrice : this.state.price),
      price: market ? mPrice : this.state.price,
    }, this.getOrderFee);
  },

  render: function () {
    var options = this.state.productPairs.map(function (pair) {
      return <option value={pair.Symbol} key={pair.Symbol}>{pair.Symbol}</option>;
    });
    var types = this.state.orderTypes.map(function (type) {
      return <option value={type.value} key={type.value}>{type.name}</option>;
    });
    var pegs = this.state.PegTypes.map(function (peg) {
      return <option value={peg.value} key={peg.value}>{peg.name}</option>;
    });
    var pair = this.state.pair;
    var tabs = (
      <div>
        <span className={'tab ' + (this.state.buy ? 'active' : '') }
              onClick={this.changeMode.bind(this, true)}>{AlphaPoint.translation('BUY_SELL_MODAL.BUY') || "Buy"}</span>
        <span className={'tab ' + (!this.state.buy ? 'active' : '') }
              onClick={this.changeMode.bind(this, false)}>{AlphaPoint.translation('BUY_SELL_MODAL.SELL') || "Sell"}</span>
      </div>
    );
    if (pair) {
      var product1 = this.state.balances.filter(function (prod) {
          return pair.Product1Symbol == prod.ProductSymbol;
        })[0] || {};
      var product2 = this.state.balances.filter(function (prod) {
          return pair.Product2Symbol == prod.ProductSymbol;
        })[0] || {};
    }

    return (
      <WidgetBase
        modalId="advancedOrdersModal" {...this.props}
        login
        error={this.state.errorMsg}
        success={this.state.successMsg}
        headerTitle={AlphaPoint.translation('BUY_SELL_MODAL.STOP_LIMIT') || 'Stop Limit'}
        style={{width: '600px'}}
      >

        <div className='clearfix pad-y'>
          {pair &&
          <InputLabeled
            value={this.state.amount}
            label={(this.state.buy ? AlphaPoint.translation('BUY_SELL_MODAL.BUY_AMNT') || 'Buy Amount' : AlphaPoint.translation('BUY_SELL_MODAL.SELL_AMNT') || 'Sell Amount') + ' (' + (pair.Product1Symbol || '') + ') '}
            type="number"
            ref="amount"
            append={false && !this.state.amountLastChanged && this.state.market && 'Approximate'}
            onChange={this.changeAmount}
            wrapperClass="col-xs-12"
          />}

          {pair &&
          <InputLabeled
            value={this.state.price}
            label={(this.state.market ? AlphaPoint.translation('BUY_SELL_MODAL.VALUE') || 'Value' : AlphaPoint.translation('BUY_SELL_MODAL.PRICE_PER') || 'Price Per') + ' (' + (pair.Product2Symbol || '') + ') '}
            type='number'
            ref='value'
            append={false && this.state.amountLastChanged && this.state.market && (AlphaPoint.translation('BUY_SELL_MODAL.APPROXIMATE') || 'Approximate')}
            onChange={this.changePrice}
            wrapperClass='col-xs-12 '
          />}

          {this.state.OrderType === 4
          &&
          <InputLabeled
            value={this.state.stop_price}
            label={AlphaPoint.translation('BUY_SELL_ADV.STOP_PRICE') || 'Stop Price'}
            type='number' ref='value'
            onChange={this.changeStopPrice}
            wrapperClass='col-xs-12 pad'
          />}
          <InputLabeled
            value={this.state.total}
            label="Total"
            type='number'
            wrapperClass='col-xs-6 '
          />
          <div className='button-wrap pad col-xs-6'>
            <button
              className="btn btn-action"
              style={{marginTop: '11px'}}
              onClick={this.order}
              disabled={this.state.verificationLevel <= AlphaPoint.config.UnderManualReviewLevel}
              data-tip={AlphaPoint.translation('VERIFY.TOOLTIP') || 'Complete account verification to use this feature.'}
              data-tip-disable={this.state.verificationLevel > AlphaPoint.config.UnderManualReviewLevel}
            >{AlphaPoint.translation('BUY_SELL_MODAL.PLACE_ORDER') || "Place Order"}</button>
            <ReactTooltip place="top" type="info" effect="solid"/>
          </div>
          <div className='button-wrap pad col-xs-6'>
            {tabs}
          </div>


        </div>


      </WidgetBase>
    );
  }
});

module.exports = StopLimit;
