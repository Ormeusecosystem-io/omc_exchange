/* global AlphaPoint, $ */
import React from 'react';
import uuidV4 from 'uuid/v4';

import WidgetBase from './base';
import InputLabeled from './../misc/inputLabeled';
import SelectLabeled from './../misc/selectLabeled';
import Modal from './modal';
import BuySell from './buy-btc';
import BlockTrade from './block-trade';
import {
  ordersWidgetDidMount,
  ordersWidgetWillUnmount,
  getOrderFee,
} from './../misc/ordersWidgetsHelper';

class OrderEntryAztec extends React.Component {
  constructor() {
    super();

    this.ordersWidgetDidMount = ordersWidgetDidMount.bind(this);
    this.ordersWidgetWillUnmount = ordersWidgetWillUnmount.bind(this);
    this.getOrderFee = getOrderFee;

    this.state = {
      buy: true,
      market: true,
      marketBuy: 0,
      marketSell: 0,
      productPairs: [],
      pair: null,
      total: 0,
      fee: 0,
      feeProduct: '',
      productPair: '',
      amount: 0,
      stop_price: 0,
      ref_price: 0,
      limit_offset: 0,
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
        { name: 'Fill Or Kill', value: 8 },
        { name: 'IOC', value: 10 },
        { name: 'Reserve Order', value: 12 },
      ],
      orderTypesBtn: [
        { name: 'Market', value: 1 },
        { name: 'Limit', value: 2 },
        { name: 'Stop', value: 3 },
        { name: 'Stop Limit', value: 4 },
        { name: 'Trailing Stop Market', value: 5 },
        { name: 'Trailing Stop Limit', value: 6 },
        { name: 'Fill Or Kill', value: 8 },
        { name: 'IOC', value: 10 },
        { name: 'Reserve Order', value: 12 },
      ],
      OrderType: 2,
      PegTypes: [
        { name: 'Last', value: 1 },
        { name: 'Bid', value: 2 },
        { name: 'Ask', value: 3 },
        { name: 'Mid Point', value: 4 },
      ],
      Peg: 1,
      InstrumentId: 0,
      AccountId: null,
      showAdvanced: false,
      showBlockTrade: false,
    };
  }

  componentDidMount() {
    if (this.state.OrderType === 2) this.setState({ market: false });

    this.ordersWidgetDidMount();

    this.orderPrefillPrice = AlphaPoint.orderPrefillPrice.subscribe((data) => {
      if (data.price && this.state.OrderType !== 1) {
        this.setState({
          price: data.price,
          stop_price: data.price,
          buy: this.state.OrderType === 3 ? data.side !== 1 : data.side === 0, 
          total: data.price * this.state.amount,
        }, () => {
          if (AlphaPoint.selectedAccount.value) this.getOrderFee();
        });
      }
    });

    this.sendOrderSubscribe = AlphaPoint.sendorder.subscribe(() => this.setState({ amount: 0 }));
  }

  componentWillUnmount() {
    this.ordersWidgetWillUnmount();
    this.orderPrefillPrice.dispose();
    this.sendOrderSubscribe.dispose();
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
      return $.bootstrapGrowl(
        AlphaPoint.translation('BUY_SELL_MODAL.INSUFFICIENT_FUNDS') || 'Insufficient Funds',
        { ...AlphaPoint.config.growlerDefaultOptions, type: 'danger' },
      );
    }

    const limitPrice = this.state.OrderType % 2 === 0 && this.refs.value.value();
    const stopPrice = (this.state.OrderType === 5 || this.state.OrderType === 6) ?
      market - this.refs.trailing_amount.value()
      :
      (this.refs.stop_price && this.refs.stop_price.value()) || 0;
    const commonPayload = {
      AccountId: this.state.AccountId,
      ClientOrderId: 0,
      Side: this.state.buy ? 0 : 1,
      Quantity: +this.refs.amount.value(),
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
        payload = {
          ...commonPayload,
          LimitPrice: +limitPrice,
        };
        break;
      }
      case 3: {
        payload = {
          ...commonPayload,
          StopPrice: stopPrice,
          PegPriceType: this.state.buy ? 3 : 2,
        };
        break;
      }
      case 4: {
        payload = {
          ...commonPayload,
          LimitPrice: +limitPrice,
          StopPrice: stopPrice,
          PegPriceType: this.state.buy ? 3 : 2,
        };
        break;
      }
      case 5: {
        payload = {
          ...commonPayload,
          PegPriceType: (this.refs.peg_price && this.refs.peg_price.value()) || 0,
          TrailingAmount: this.refs.trailing_amount.value(),
        };
        break;
      }
      case 6: {
        payload = {
          ...commonPayload,
          TrailingAmount: this.refs.trailing_amount.value(),
          LimitOffset: this.refs.limit_offset.value(),
          PegPriceType: (this.refs.peg_price && this.refs.peg_price.value()) || 0,
        };
        break;
      }
      case 8: {
        payload = {
          ...commonPayload,
          LimitPrice: +limitPrice,
          OrderType: 2,
          TimeInForce: 4,
        };
        break;
      }
      case 10: {
        payload = {
          ...commonPayload,
          LimitPrice: +limitPrice,
          OrderType: 2,
          TimeInForce: 3,
        };
        break;
      }
      case 12: {
        payload = {
          ...commonPayload,
          DisplayQuantity: this.refs.display_quantity.value(),
          LimitPrice: +limitPrice,
          OrderType: 2,
          UseDisplayQuantity: true,
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
  }

  changePair = (e) => AlphaPoint.setProductPair(e.target.value);

  changeType = (e) => {
    const type = +e.target.value;
    const buy = this.state.buy;
    let total = 0;

    if (e.target.value % 2 === 0) {
      this.changeMarket(false);
    } else {
      this.changeMarket(true);
    }

    if (type === 1) {
      total = this.state.amount * (buy ? this.state.marketSell : this.state.marketBuy);
    } else if (type === 2) {
      total = this.state.amount * this.state.price;
    } else if (type === 3) {
      total = this.state.amount * this.state.stop_price;
    }

    return this.setState({
      total,
      OrderType: type,
    });
  }

  changeSide = (e) => {
    const buy = e.target.value === 'buy';

    if (this.state.OrderType === 1) {
      return this.setState({
        buy,
        total: this.state.amount * (buy ? this.state.marketSell : this.state.marketBuy),
      }, this.getOrderFee);
    }

    return this.setState({ buy }, this.getOrderFee);
  }

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

    this.setState(state, this.getOrderFee);
  }

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

    this.setState(state, this.getOrderFee);
  }

  changeStopPrice = () => {
    const state = {};

    state.stop_price = this.refs.stop_price.value();
    this.setState(state, this.getOrderFee);
  }

  changeLimitOffset = () => {
    const state = {};
    const limit_offset = this.refs.limit_offset.value();

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
  }

  changeTrailingAmount = () => {
    const state = {};

    state.trailing_amount = this.refs.trailing_amount.value();
    this.setState(state, this.getOrderFee);
  }

  changeDisplayQuantity = () => {
    const state = {};

    state.display_quantity = this.refs.display_quantity.value();
    this.setState(state, this.getOrderFee);
  }

  changeMarket = (market) => this.setState({ market }, this.getOrderFee);

  showAdvancedOrders = () => this.setState({ showAdvanced: true });

  closeAdvancedOrders = () => this.setState({ showAdvanced: false });

  showBlockTrade = () => this.setState({ showBlockTrade: true });

  closeBlockTrade = () => this.setState({ showBlockTrade: false });

  render() {
    const pair = this.state.pair;
    const market = this.state.buy ? this.state.marketSell : this.state.marketBuy;
    const types = this.state.orderTypes
      .filter((type, index) => index < 3)
      .map((type) => <option value={type.value} key={uuidV4()}>{type.name}</option>);
    const sides = [
      <option value="buy" key="buy">Buy</option>,
      <option value="sell" key="sell">Sell</option>,
    ];
    const pegs = this.state.PegTypes.map((peg) => <option value={peg.value} key={uuidV4()}>{peg.name}</option>);
    const hide = this.state.OrderType === 2 ? '' : 'hide';
    const orderTotal = this.state.total + this.state.fee;
    let product2;

    if (pair) product2 = this.state.balances.find((prod) => pair.Product2Symbol === prod.ProductSymbol) || {};

    return (
      <WidgetBase {...this.props} error={this.state.errorMsg} success={this.state.successMsg} headerTitle="Order Entry" style={{ width: '600px' }}>
        <div className="rowclearfix">
          <div className="order-entry">
            <div className="order-wrap" style={{ paddingTop: '21px' }}>
              <p>Order Type</p>
              <select onChange={this.changeType} value={this.state.OrderType}>{types}</select>
              <select onChange={this.changeSide} value={this.state.buy ? 'buy' : 'sell'}>{sides}</select>

              <div style={{ paddingTop: '25px' }} className="clearfix">
                {pair &&
                  <InputLabeled
                    value={this.state.amount}
                    label={`${this.state.buy ? AlphaPoint.translation('BUY_SELL_MODAL.BUY_AMNT') || 'Buy Amount' : AlphaPoint.translation('BUY_SELL_MODAL.SELL_AMNT') || 'Sell Amount'} (${pair.Product1Symbol || ''})`}
                    type="number"
                    ref="amount"
                    min="0"
                    append={false && !this.state.amountLastChanged && this.state.market && 'Approximate'}
                    onChange={this.changeAmount}
                  />}

                {pair &&
                  <InputLabeled
                    value={this.state.price}
                    label={`${this.state.market ? AlphaPoint.translation('BUY_SELL_MODAL.VALUE') || 'Value' : AlphaPoint.translation('BUY_SELL_MODAL.PRICE_PER') || 'Price Per'} (${pair.Product2Symbol || ''})`}
                    type="number"
                    ref="value"
                    min="0"
                    append={false && this.state.amountLastChanged && this.state.market && (AlphaPoint.translation('BUY_SELL_MODAL.APPROXIMATE') || 'Approximate')}
                    onChange={this.changePrice}
                    wrapperClass={hide}
                  />}

                {this.state.OrderType === 8 &&
                  <InputLabeled
                    value={this.state.display_quantity}
                    label="Display Quantity"
                    type="number"
                    ref="display_quantity"
                    min="0"
                    onChange={this.changeDisplayQuantity}
                  />}

                {(this.state.OrderType === 3 || this.state.OrderType === 4) &&
                  <InputLabeled
                    value={this.state.stop_price}
                    label={`Stop Price (${pair.Product2Symbol || ''})`}
                    type="number"
                    ref="stop_price"
                    min="0"
                    onChange={this.changeStopPrice}
                  />
                }

                {(this.state.OrderType === 5 || this.state.OrderType === 6) &&
                  <InputLabeled
                    label="Trailing Amount"
                    type="number"
                    ref="trailing_amount"
                    min="0"
                    append={this.state.amountLastChanged && this.state.market}
                    onChange={this.changeTrailingAmount}
                  />}

                {this.state.OrderType === 6 &&
                  <InputLabeled
                    value={this.state.limit_offset}
                    label="Limit Offset"
                    type="number"
                    ref="limit_offset"
                    min="0"
                    append={false && !this.state.amountLastChanged && this.state.market && 'Approximate'}
                    onChange={this.changeLimitOffset}
                  />}

                {(this.state.OrderType === 5 || this.state.OrderType === 6) &&
                  <SelectLabeled
                    label="Peg Price"
                    type="number"
                    ref="peg_price"
                    min="0"
                    append={false && !this.state.amountLastChanged && this.state.market && 'Approximate'}
                    onChange={this.changePeg}
                  >{pegs}</SelectLabeled>}
              </div>
              <div className="button-wrap pad">
                <button onClick={this.order}>{AlphaPoint.translation('BUY_SELL_MODAL.PLACE_ORDER') || 'Place Order'}</button>
                <a className="order-entry-text" onClick={this.showAdvancedOrders} title="profile">{AlphaPoint.translation('BUY_SELL_MODAL.ADVANCED_ORDER') || 'Advanced Orders'}</a>
                {AlphaPoint.config.showBlockTradeUI && <a className="block-trade-text" onClick={this.showBlockTrade} title="profile">Submit Trade Report</a>}
                {this.state.showAdvanced && <Modal close={this.closeAdvancedOrders}><BuySell /></Modal>}
                {this.state.showBlockTrade && <Modal close={this.closeBlockTrade}><BlockTrade /></Modal>}
              </div>
              <div>
                <div className="summary-wrap">
                  {pair && <div>
                    <p>{AlphaPoint.translation('BUY_SELL_ADV.MARKET_PRICE') || 'Market Price'}</p>
                    <p>
                      <span>{(market && market.toFixed(AlphaPoint.config.decimalPlaces)) || '-'}</span>
                      &nbsp;
                      <span>{pair.Product2Symbol}</span>
                    </p>
                  </div>}
                  {pair && <div>
                    <p>{AlphaPoint.translation('BUY_SELL_ADV.FEES') || 'Fees'}</p>
                    <p>
                      <span>
                        {(parseFloat(this.state.fee) || 0)
                          .toFixed(product2.DecimalPlaces || AlphaPoint.config.decimalPlaces)}
                      </span>
                      &nbsp;
                      <span>{pair.Product2Symbol}</span>
                    </p>
                  </div>}
                  {pair && <div>
                    <p>{AlphaPoint.translation('BUY_SELL_ADV.ORDER_TOTAL') || 'Order Total'}</p>
                    <p>
                      <span>
                        {(parseFloat(orderTotal) || 0)
                          .toFixed(product2.DecimalPlaces || AlphaPoint.config.decimalPlaces)}
                      </span>
                      &nbsp;
                      <span>{pair.Product2Symbol}</span>
                    </p>
                  </div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

export default OrderEntryAztec;
