/* global AlphaPoint, $ */
import React from 'react';

import WidgetBase from './base';
import InputLabeled from '../misc/inputLabeled';
import SelectLabeled from '../misc/selectLabeled';
import {
  ordersWidgetDidMount,
  ordersWidgetWillUnmount,
  getOrderFee,
} from '../misc/ordersWidgetsHelper';

class BuyAdvanced extends React.Component {
  constructor(props) {
    super(props);

    this.ordersWidgetDidMount = ordersWidgetDidMount.bind(this);
    this.ordersWidgetWillUnmount = ordersWidgetWillUnmount.bind(this);
    this.getOrderFee = getOrderFee;

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
      limit_offset: 1,
      trailing_amount: 1,
      display_quantity: 0,
      peg_price: 1,
      price: 0,
      amountLastChanged: true,
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
        { name: 'Fill Or Kill', value: 7 },
        { name: 'Reserve Order', value: 8 },
      ],
      orderTypesBtn: [
        { name: 'Market', value: 1 },
        { name: 'Limit', value: 2 },
        { name: 'Stop', value: 3 },
        { name: 'Stop Limit', value: 4 },
        { name: 'Trailing Stop Market', value: 5 },
        { name: 'Trailing Stop Limit', value: 6 },
        { name: 'Fill Or Kill', value: 7 },
        { name: 'Reserve Order', value: 8 },
      ],
      OrderType: 2,
      PegTypes: [
        { name: 'Last', value: 1 },
        { name: 'Bid', value: 2 },
        { name: 'Ask', value: 3 },
      ],
      Peg: 1,
      InstrumentId: 0,
      AccountId: null,
    };
  }

  componentDidMount() {
    if (this.state.OrderType === 2) this.setState({ market: false });
    this.ordersWidgetDidMount();
    AlphaPoint.sendorder.subscribe((res) => {
      const reject = res.RejectMessage || '';
      let success = '';

      if (res.Status) {
        success = res.Status === 'Processing' ?
          'Order sent, check Order History for results.' : res.Status;
      }

      this.setState({
        successMsg: success,
        errorMsg: reject,
        fee: res.fee,
      });
    });
  }

  componentWillUnmount() {
    this.ordersWidgetWillUnmount();
  }

  changeMode = (buy) => this.setState({ buy }, this.getOrderFee);

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

    // Turning off balance check for demo
    if (total > balance) {
      $.bootstrapGrowl(AlphaPoint.translation('BUY_SELL_ADV.INSUFFICIENT_FUNDS') || 'Insufficient Funds', {
        type: 'danger',
        allow_dismiss: true,
        align: 'right',
        delay: 10000,
      });
      return this.setState({ errorMsg: AlphaPoint.translation('BUY_SELL_ADV.INSUFFICIENT_FUNDS') || 'Insufficient Funds' });
    }

    this.setState({ total: this.refs.amount.value() * ((this.state.market) ? market : this.refs.value.value()) });

    const limitPrice = this.state.OrderType % 2 === 0 && this.refs.value.value();
    const stopPrice = (this.state.OrderType === 5 || this.state.OrderType === 6) ?
      market - this.refs.trailing_amount.value()
      :
      (this.refs.stop_price && this.refs.stop_price.value()) || 0;
    const commonPayload = {
      AccountId: this.state.AccountId,
      ClientOrderId: 0,
      Side: this.state.buy ? 0 : 1,
      Quantity: this.refs.amount.value(),
      OrderIdOCO: 0,
      OrderType: this.state.OrderType,
      InstrumentId: pair.InstrumentId,
      TimeInForce: 0,
      OMSId: AlphaPoint.oms.value,
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
          StopPrice: stopPrice,
          PegPriceType: 1,
        };
        break;
      }
      case 6:
      case 4: {
        payload = {
          ...commonPayload,
          LimitPrice: limitPrice,
          StopPrice: stopPrice,
          PegPriceType: 1,
        };
        break;
      }
      case 5: {
        payload = {
          ...commonPayload,
          StopPrice: stopPrice,
          PegPriceType: (this.refs.peg_price && this.refs.peg_price.value()) || 0,
        };
        break;
      }
      case 8: {
        payload = {
          ...commonPayload,
          LimitPrice: limitPrice,
          OrderType: 2,
          DisplayQuantity: this.refs.display_quantity.value(),
        };
        break;
      }
      case 1:
      case 7:
      default: {
        payload = commonPayload;
        break;
      }
    }

    return AlphaPoint.sendOrder(payload);
  };

  changePair = (e) => AlphaPoint.setProductPair(e.target.value);

  changeType = (e) => {
    this.setState({ OrderType: +e.target.value });

    if (e.target.value % 2 === 0) {
      this.changeMarket(false);
    } else {
      this.changeMarket(true);
    }
  };

  changePeg = (e) => this.setState({ Peg: +e.target.value });

  changeAmount = () => {
    const state = {};

    state.amount = this.refs.amount.value();
    state.amountLastChanged = true;

    if (this.state.market) {
      if (this.state.buy) {
        state.price = this.refs.amount.value() * this.state.marketSell;
      } else {
        state.price = this.refs.amount.value() * this.state.marketBuy;
      }
      state.total = state.price;
    } else {
      state.total = this.refs.amount.value() * this.refs.value.value();
    }

    return this.setState(state, this.getOrderFee);
  };

  changePrice = () => {
    const state = {};

    state.price = this.refs.value.value();
    state.amountLastChanged = false;

    if (this.state.market) {
      if (this.state.buy) {
        state.amount = this.refs.value.value() / this.state.marketSell;
      } else {
        state.amount = this.refs.value.value() / this.state.marketBuy;
      }
      state.total = state.price;
    } else {
      state.total = this.refs.amount.value() * this.refs.value.value();
    }

    if (this.state.OrderType === 6) {
      state.limit_offset = this.state.marketSell - this.refs.value.value();
    }

    return this.setState(state, this.getOrderFee);
  };

  changeStopPrice = () => {
    const state = {};

    state.stop_price = this.refs.stop_price.value();
    return this.setState(state, this.getOrderFee);
  };

  changeLimitOffset = () => {
    const state = {};
    const limitOffset = this.refs.limit_offset.value();

    state.limit_offset = limitOffset;
    state.amountLastChanged = true;

    if (!this.state.market) {
      if (this.state.buy) {
        state.total = this.state.marketSell - limitOffset;
      } else {
        state.total = this.state.marketBuy - limitOffset;
      }
    }

    return this.setState(state, this.getOrderFee);
  };

  changeTrailingAmount = () => {
    const state = {};

    state.trailing_amount = this.refs.trailing_amount.value();
    return this.setState(state, this.getOrderFee);
  };

  changeDisplayQuantity = () => {
    const state = {};

    state.display_quantity = this.refs.display_quantity.value();
    return this.setState(state, this.getOrderFee);
  }

  changeMarket = (market) => {
    const mPrice = this.state.buy ? this.state.marketSell : this.state.marketBuy;

    return this.setState({
      market,
      total: this.refs.amount.value() * ((market) ? mPrice : this.refs.value.value()),
      price: market ? mPrice : this.refs.value.value(),
    }, this.getOrderFee);
  }

  render() {
    const pair = this.state.pair;
    let product1;
    let product2;
    if (pair) {
      product1 = this.state.balances.find((prod) => pair.Product1Symbol === prod.ProductSymbol) || {};
      product2 = this.state.balances.find((prod) => pair.Product2Symbol === prod.ProductSymbol) || {};
    }
    const market = this.state.buy ? this.state.marketSell : this.state.marketBuy;
    const pegs = this.state.PegTypes.map((peg) => <option value={peg.value} key={peg.value}>{peg.name}</option>);
    const typesBtn3 = [];

    this.state.orderTypesBtn
      .filter((type, index) => index < 3)
      .forEach((type, index) => {
        typesBtn3.push(<input
          id={`tab${index}`}
          type="radio"
          value={type.value}
          key={type.value}
          onClick={this.changeType}
          readOnly
          checked={type.value === this.state.OrderType}
        />);
        typesBtn3.push(<label htmlFor={`tab${index}`}>{type.name}</label>);
      });

    const tabs2 = (
      <form className="d-select">
        <input id="select1" type="radio" readOnly checked={this.state.buy && true} />
        <label htmlFor="select1" onClick={() => this.changeMode(true)} >{AlphaPoint.translation('BUY_SELL_ADV.BUY') || 'Buy'}</label>
        <input id="select2" type="radio" readOnly checked={!this.state.buy && true} />
        <label onClick={() => this.changeMode(false)} htmlFor="select2">{AlphaPoint.translation('BUY_SELL_ADV.SELL') || 'Sell'}</label>
      </form>
    );

    const hide = this.state.OrderType === 2 ? '' : 'hide';

    return (
      <WidgetBase
        {...this.props}
        error={this.state.errorMsg}
        success={this.state.successMsg}
        headerTitle={AlphaPoint.translation('BUY_SELL_ADV.TITLE_TEXT') || 'Order Entry'}
        style={{ width: '600px' }}
      >
        <div className="rowclearfix">
          <div className="order-entry">
            <div className="module-head">
              <h2>{AlphaPoint.translation('BUY_SELL_ADV.TITLE_TEXT') || 'Order Entry'}</h2>
            </div>
            <div className="order-wrap">
              <div className="tabs">
                <div className="tab-bg" />
                {typesBtn3}
              </div>
            </div>
          </div>
          <div className="col-xs-12 pad">
            {tabs2}
          </div>
        </div>
        <div className="clearfix pad-y">
          {pair &&
            <InputLabeled
              value={this.state.amount}
              label={`${this.state.buy ? AlphaPoint.translation('BUY_SELL_ADV.BUY_AMOUNT') || 'Buy Amount' : AlphaPoint.translation('BUY_SELL_ADV.SELL_AMOUNT') || 'Sell Amount'} (${pair.Product1Symbol || ''})`}
              type="number"
              ref="amount"
              append={false && !this.state.amountLastChanged && this.state.market && 'Approximate'}
              onChange={this.changeAmount}
              wrapperClass="col-xs-12"
              style={{ backgroundColor: '#212427' }}
            />}

          {pair &&
            <InputLabeled
              value={this.state.price}
              label={`${this.state.market ? AlphaPoint.translation('BUY_SELL_ADV.VALUE') || 'Value' : AlphaPoint.translation('BUY_SELL_ADV.PRICE_PER') || 'Price Per'} (${pair.Product2Symbol || ''})`}
              type="number"
              ref="value"
              append={false && this.state.amountLastChanged && this.state.market && (AlphaPoint.translation('BUY_SELL_ADV.APPROXIMATE') || 'Approximate')}
              onChange={this.changePrice}
              wrapperClass={`col-xs-12 ${hide}`}
              style={{ backgroundColor: '#212427' }}
            />}

          {this.state.OrderType === 8 &&
            <InputLabeled
              value={this.state.display_quantity}
              label={AlphaPoint.translation('BUY_SELL_ADV.DISPLAY_QUANTITY') || 'Display Quantity'}
              type="number"
              ref="display_quantity"
              onChange={this.changeDisplayQuantity}
              wrapperClass="col-xs-3"
            />}

          {(this.state.OrderType === 3 || this.state.OrderType === 4) &&
            <InputLabeled
              value={this.state.stop_price}
              label={AlphaPoint.translation('BUY_SELL_ADV.STOP_PRICE') || 'Stop Price'}
              type="number"
              ref="stop_price"
              onChange={this.changeStopPrice}
              wrapperClass="col-xs-12"
              style={{ backgroundColor: '#212427' }}
            />}

          {(this.state.OrderType === 5 || this.state.OrderType === 6) &&
            <InputLabeled
              label={AlphaPoint.translation('BUY_SELL_ADV.TRAILING_AMOUNT') || 'Trailing Amount'}
              type="number"
              ref="trailing_amount"
              append={this.state.amountLastChanged && this.state.market}
              onChange={this.changeTrailingAmount}
              wrapperClass="col-xs-3"
            />}

          {this.state.OrderType === 6 &&
            <InputLabeled
              value={this.state.limit_offset}
              label={AlphaPoint.translation('BUY_SELL_ADV.LIMIT_OFFSET') || 'Limit Offset'}
              type="number"
              ref="limit_offset"
              append={false && !this.state.amountLastChanged && this.state.market && 'Approximate'}
              onChange={this.changeLimitOffset}
              wrapperClass="col-xs-3"
            />}

          {(this.state.OrderType === 5 || this.state.OrderType === 6) &&
            <SelectLabeled
              label={AlphaPoint.translation('BUY_SELL_ADV.PEG_PRICE') || 'Peg Price'}
              type="number"
              ref="peg_price"
              append={false && !this.state.amountLastChanged && this.state.market && 'Approximate'}
              onChange={this.changePeg}
              wrapperClass="col-xs-3"
            >
              {pegs}
            </SelectLabeled>}
        </div>

        {pair &&
          <div>
            <div className="summary-wrap">
              <div>
                <div>{AlphaPoint.translation('BUY_SELL_ADV.MARKET_PRICE') || 'Market Price'}</div>
                <div>{AlphaPoint.translation('BUY_SELL_ADV.FEES') || 'Fees'}({this.state.feeProduct}):</div>
                <div>{AlphaPoint.translation('BUY_SELL_ADV.ORDER_TOTAL') || 'Order Total'}</div>
              </div>
              <div>
                <div><b>{market.toFixed(AlphaPoint.config.decimalPlaces) || '-'}</b></div>
                <div>
                  <b>
                    {(parseFloat(this.state.fee) || 0)
                      .toFixed(product1.DecimalPlaces || AlphaPoint.config.decimalPlaces)}
                  </b>
                </div>
                <div>
                  <b>
                    {(parseFloat(this.state.total) || 0)
                      .toFixed(product2.DecimalPlaces || AlphaPoint.config.decimalPlaces)}
                  </b>
                </div>
              </div>
            </div>
          </div>}

        <div className="button-wrap pad">
          <button
            style={{ marginLeft: '35px' }}
            className="btn btn-action"
            onClick={this.order}
          >
            {AlphaPoint.translation('BUY_SELL_ADV.PLACE_ORDER') || 'Place Order'}
          </button>
        </div>
      </WidgetBase>
    );
  }
}

BuyAdvanced.defaultProps = {
  hideCloseLink: true,
};

export default BuyAdvanced;
