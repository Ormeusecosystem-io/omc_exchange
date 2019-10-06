/* global AlphaPoint, $ */
import React from 'react';
import uuidV4 from 'uuid/v4';

import WidgetBase from './base';
import InputLabeled from './../misc/inputLabeled';
import SelectLabeled from './../misc/selectLabeled';
import Modal from './modal';
import BuySell from './buy-btc';
import BlockTrade from './block-trade';
import VerificationRequired from './verificationRequired';
import { ordersWidgetDidMount, ordersWidgetWillUnmount, getOrderFee } from './../misc/ordersWidgetsHelper';
import {
  formatNumberToLocale,
  formatOrders,
  getPriceForFixedQuantity,
  parseNumberToLocale,
  getDecimalPrecision,
} from './helper';

class OrderEntry extends React.Component {
  constructor(props) {
    super(props);

    this.ordersWidgetDidMount = ordersWidgetDidMount.bind(this);
    this.ordersWidgetWillUnmount = ordersWidgetWillUnmount.bind(this);
    this.getOrderFee = getOrderFee;

    this.defaultState = {
      total: 0,
      fee: 0,
      feeProduct: null,
      amount: 0,
      amountString: '0',
      stop_price: 0,
      stop_priceString: '0',
      ref_price: 0,
      limit_offset: 0,
      trailing_amount: 1,
      display_quantity: 0,
      peg_price: 1,
      price: 0,
      priceString: '0',
    }
    this.state = {
      ...this.defaultState,
      buy: true,
      market: true,
      marketBuy: 0,
      marketSell: 0,
      productPairs: [],
      pair: null,
      productPair: '',
      amountLastChanged: true,
      successMsg: '',
      errorMsg: '',
      balances: [],
      orderTypes: [],
      orderTypesBtn: [],
      OrderType: 2,
      PegTypes: [
        { name: 'Last', value: 1 },
        { name: 'Bid', value: 2 },
        { name: 'Ask', value: 3 },
        { name: 'Mid Point', value: 4 },
      ],
      Peg: 3,
      InstrumentId: 0,
      AccountId: null,
      showAdvanced: false,
      showBlockTrade: false,
      decimalPlaces: {},
      bookBuys: [],
      bookSells: [],
      products: {},
    };

    // Moved these two props content to be filled later due to a race condition of the translation not being available.
    setTimeout(() => {
      this.setState({
        orderTypes: [
          {name: AlphaPoint.translation('BUY_SELL_MODAL.MARKET_ORDER') || 'Market Order', value: 1},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.LIMIT_ORDER') || 'Limit Order', value: 2},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.STOP_MARKET') || 'Stop Market', value: 3},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.STOP_LIMIT') || 'Stop Limit', value: 4},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.TRAILING_STOP_MARKET') || 'Trailing Stop Market', value: 5},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.TRAILING_STOP_LIMIT') || 'Trailing Stop Limit', value: 6},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.FILL_OR_KILL') || 'Fill Or Kill', value: 8},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.IOC') || 'IOC', value: 10},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.RESERVE_ORDER') || 'Reserve Order', value: 12},
        ],
        orderTypesBtn: [
          {name: AlphaPoint.translation('BUY_SELL_MODAL.MARKET') || 'Market', value: 1},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.LIMIT') || 'Limit', value: 2},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.STOP') || 'Stop', value: 3},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.STOP_LIMIT') || 'Stop Limit', value: 4},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.TRAILING_STOP_MARKET') || 'Trailing Stop Market', value: 5},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.TRAILING_STOP_LIMIT') || 'Trailing Stop Limit', value: 6},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.FILL_OR_KILL') || 'Fill Or Kill', value: 8},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.IOC') || 'IOC', value: 10},
          {name: AlphaPoint.translation('BUY_SELL_MODAL.RESERVE_ORDER') || 'Reserve Order', value: 12},
        ]
      });
    });
  }

  componentDidMount() {
    if (this.state.OrderType === 2) this.setState({ market: false });

    this.ordersWidgetDidMount();

    this.orderPrefillPrice = AlphaPoint.orderPrefillPrice.subscribe(data => {
      const productPair = this.state.productPairs.find(pair => pair.Symbol === this.state.productPair);
      const product2 = this.state.products[productPair ? productPair.Product2 : 1];

      const priceString = formatNumberToLocale(data.price, (product2 && product2.DecimalPlaces) || 2);
      if (data.price && this.state.OrderType !== 1) {
        this.setState(
          {
            price: data.price,
            priceString,
            stop_price: data.price,
            stop_priceString: priceString,
            buy: this.state.OrderType === 3 ? data.side !== 1 : data.side === 0, // 3 === STOP ORDER
            total: data.price * this.state.amount,
          },
          () => {
            if (AlphaPoint.selectedAccount.value) this.getOrderFee();
          },
        );
      }
    });
    this.instrumentCheck = AlphaPoint.instrumentChange.subscribe(() => this.setState(this.defaultState));

    this.getOrderFeeProduct = AlphaPoint.selectedAccount.subscribe(id => id && this.getOrderFee());

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
        const bookBuys = orders.filter(order => order.Side === 0);
        const bookSells = orders.filter(order => order.Side === 1);

        if (bookBuys.length) {
          bookBuys.forEach((obj) => {
            const newBuys = this.state.bookBuys.filter(lev => lev.Price !== obj.Price);

            this.setState({ bookBuys: obj.Quantity ? newBuys.concat(obj) : newBuys });
          });
        }

        if (bookSells.length) {
          bookSells.forEach((obj) => {
            const newSells = this.state.bookSells.filter(lev => lev.Price !== obj.Price);

            this.setState({ bookSells: obj.Quantity ? newSells.concat(obj) : newSells });
          });
        }
      });
  }

  componentWillUnmount() {
    this.ordersWidgetWillUnmount();
    this.orderPrefillPrice.dispose();
    this.Level2.dispose();
    this.Level2Updates.dispose();
    AlphaPoint.instrumentChange.dispose();
  }

  changeMode = buy => this.setState({ ...this.defaultState, buy }, this.getOrderFee);

  order = e => {
    const market = this.state.buy ? this.state.marketSell : this.state.marketBuy;
    const pair = this.state.pair;
    const product1 = this.state.balances.find(prod => pair.Product1Symbol === prod.ProductSymbol) || {};
    const product2 = this.state.balances.find(prod => pair.Product2Symbol === prod.ProductSymbol) || {};
    const balance = this.state.buy ? product2.Amount - product2.Hold || 0 : product1.Amount - product1.Hold || 0;
    const total = this.state.buy ? this.state.total : this.state.amount;

    e.preventDefault();

    // Check if they have enough money
    if (total > balance) {
      return $.bootstrapGrowl(AlphaPoint.translation('BUY_SELL_MODAL.INSUFFICIENT_FUNDS') || 'Insufficient Funds', {
        ...AlphaPoint.config.growlerDefaultOptions,
        type: 'danger',
      });
    }

    const limitPrice = this.state.OrderType % 2 === 0 && this.state.price;
    const stopPrice =
      this.state.OrderType === 5 || this.state.OrderType === 6
        ? market - this.state.trailing_amount
        : this.state.stop_price || 0;
    const commonPayload = {
      AccountId: this.state.AccountId,
      ClientOrderId: 0,
      Side: this.state.buy ? 0 : 1,
      Quantity: this.state.amount,
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
      case 5:
      case 6:
      case 8:
      case 10:
      case 12: {
        // Unsupported
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

  changePair = e => AlphaPoint.setProductPair(e.target.value);

  changeType = e => {
    const type = +e.target.value;
    const buy = this.state.buy;
    let total = 0;

    this.setState({amount: 0, amountString: '0', price: 0, priceString: '0'});

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
  };

  changePeg = e => this.setState({ Peg: +e.target.value });

  changeAmount = e => {
    const productPair = this.state.productPairs.find(pair => pair.Symbol === this.state.productPair);
    const product1 = this.state.products[productPair ? productPair.Product1 : 1];
    const state = { amountString: e.target.value, amount: parseNumberToLocale(e.target.value) };
    const decimals = getDecimalPrecision(state.amount);
    const decimalsAllowed = product1.DecimalPlaces;

    if (decimals <= decimalsAllowed && !isNaN(state.amount)) {
      if (this.state.market) {
        if (this.state.buy) {
          state.total = this.state.OrderType === 1 && this.state.bookSells.length
            ? getPriceForFixedQuantity(state.amount, 0, this.state.bookSells, true).Price
            : state.amount * this.state.marketSell;
        } else {
          state.total = this.state.OrderType === 1 && this.state.bookBuys.length
            ? getPriceForFixedQuantity(state.amount, 0, this.state.bookBuys, true).Price
            : state.amount * this.state.marketBuy;
        }
      } else {
        state.total = state.amount * this.state.price;
      }

      this.setState(state, this.getOrderFee);
    }
  };

  changePrice = e => {
    const productPair = this.state.productPairs.find(pair => pair.Symbol === this.state.productPair);
    const product2 = this.state.products[productPair ? productPair.Product2 : 1];

    const state = { priceString: e.target.value, price: parseNumberToLocale(e.target.value) };
    const decimals = getDecimalPrecision(state.price);
    const decimalsAllowed = product2.DecimalPlaces;

    if (decimals <= decimalsAllowed && !isNaN(state.price)) {
      if (this.state.market) {
        if (this.state.buy) {
          state.amount = state.price / this.state.marketSell;
        } else {
          state.amount = state.price / this.state.marketBuy;
        }
        state.total = state.price;
      } else {
        state.total = this.state.amount * state.price;
      }

      if (this.state.OrderType === 6) {
        state.limit_offset = this.state.marketSell - state.price;
      }
      this.setState(state, this.getOrderFee);
    }
  };

  changeStopPrice = e => {
    const productPair = this.state.productPairs.find(pair => pair.Symbol === this.state.productPair);
    const product2 = this.state.products[productPair ? productPair.Product2 : 1];
    const state = { stop_priceString: e.target.value, stop_price: parseNumberToLocale(e.target.value) };

    const decimals = getDecimalPrecision(state.stop_price);
    const decimalsAllowed = product2.DecimalPlaces;

    if (decimals <= decimalsAllowed && !isNaN(state.stop_price)) {
      state.total = this.state.amount * state.stop_price;
      this.setState(state, this.getOrderFee);
    }
  };

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
  };

  changeTrailingAmount = () => {
    const state = {};

    state.trailing_amount = this.refs.trailing_amount.value();
    this.setState(state, this.getOrderFee);
  };

  changeDisplayQuantity = () => {
    const state = {};

    state.display_quantity = this.refs.display_quantity.value();
    this.setState(state, this.getOrderFee);
  };

  changeMarket = market => this.setState({market}, this.getOrderFee);

  showAdvancedOrders = () => this.setState({showAdvanced: true});

  closeAdvancedOrders = () => this.setState({showAdvanced: false});

  showBlockTrade = () => this.setState({showBlockTrade: true});

  closeBlockTrade = () => this.setState({showBlockTrade: false});

  render() {
    const { amount, buy, fee, feeProduct, total } = this.state;
    const pair = this.state.pair || { Product1Symbol: '', Product2Symbol: '' };
    const market = this.state.buy ? this.state.marketSell : this.state.marketBuy;
    const netProduct = this.state.buy ? pair.Product1Symbol : pair.Product2Symbol;
    const netAmountBought = netProduct === feeProduct ? Math.max(0, amount - fee) : amount;
    const netAmountSold = netProduct === feeProduct ? Math.max(0, total - fee) : total;
    const net = buy ? netAmountBought : netAmountSold;

    const pegs = this.state.PegTypes.map(peg => (
      <option value={peg.value} key={uuidV4}>
        {peg.name}
      </option>
    ));
    const typesBtn3 = [];
    const tabs2 = (
      <form className="d-select">
        <input id="select1" type="radio" readOnly checked={this.state.buy && true}/>
        <label htmlFor="select1" onClick={() => this.changeMode(true)}>
          {AlphaPoint.translation('BUY_SELL_MODAL.BUY') || 'Buy'}
        </label>
        <input id="select2" type="radio" readOnly checked={!this.state.buy && true}/>
        <label onClick={() => this.changeMode(false)} htmlFor="select2">
          {AlphaPoint.translation('BUY_SELL_MODAL.SELL') || 'Sell'}
        </label>
        <span className="greyLine"/>
      </form>
    );
    const hide = this.state.OrderType === 2 ? '' : 'hide';

    this.state.orderTypesBtn.filter((type, index) => index < 3).forEach(type => {
      typesBtn3.push(
        <input
          id={`tab${type.value}`}
          type="radio"
          value={type.value}
          key={`tab${type.value}`}
          onClick={this.changeType}
          readOnly
          checked={type.value === this.state.OrderType}
        />,
      );
      typesBtn3.push(
        <label htmlFor={`tab${type.value}`} key={`label${type.value}`}>
          {type.name}
        </label>,
      );
    });
    return (
      <WidgetBase
        {...this.props}
        error={this.state.errorMsg}
        success={this.state.successMsg}
        headerTitle="Order Entry"
        style={{width: '600px'}}
      >
        <VerificationRequired>
          <div className="rowclearfix">
            <div className="order-entry">
              <div className="order-wrap" style={{paddingTop: '21px'}}>
                <div className="tabs" style={{marginTop: 0}}>
                  <div className="tab-bg"/>
                  {typesBtn3}
                </div>
              </div>
            </div>
            <div>{tabs2}</div>
          </div>

          <div className="clearfix pad-y">
            {pair && (
              <InputLabeled
                value={this.state.amountString}
                label={`${
                  this.state.buy
                    ? AlphaPoint.translation('BUY_SELL_MODAL.BUY_AMNT') || 'Buy Amount'
                    : AlphaPoint.translation('BUY_SELL_MODAL.SELL_AMNT') || 'Sell Amount'
                  } (${pair.Product1Symbol || ''})`}
                ref="amount"
                append={false && !this.state.amountLastChanged && this.state.market && 'Approximate'}
                onChange={this.changeAmount}
                wrapperClass="col-xs-12"
                style={{backgroundColor: '#212427'}}
              />
            )}

            {pair && (
              <InputLabeled
                value={this.state.priceString}
                label={`${
                  this.state.market
                    ? AlphaPoint.translation('BUY_SELL_MODAL.VALUE') || 'Value'
                    : AlphaPoint.translation('BUY_SELL_MODAL.PRICE_PER') || 'Price Per'
                  } (${pair.Product2Symbol || ''})`}
                ref="price"
                append={
                  false &&
                  this.state.amountLastChanged &&
                  this.state.market &&
                  (AlphaPoint.translation('BUY_SELL_MODAL.APPROXIMATE') || 'Approximate')
                }
                onChange={this.changePrice}
                wrapperClass={`col-xs-12 ${hide}`}
                style={{backgroundColor: '#212427'}}
              />
            )}

            {this.state.OrderType === 8 && (
              <InputLabeled
                value={this.state.display_quantity}
                label="Display Quantity"
                ref="display_quantity"
                min="0"
                onChange={this.changeDisplayQuantity}
                wrapperClass="col-xs-3"
              />
            )}

            {(this.state.OrderType === 3 || this.state.OrderType === 4) && (
              <InputLabeled
                value={this.state.stop_priceString}
                label={AlphaPoint.translation('BUY_SELL_ADV.STOP_PRICE') || 'Stop Price'}
                ref="stop_price"
                min="0"
                onChange={this.changeStopPrice}
                wrapperClass="col-xs-12"
                style={{backgroundColor: '#212427'}}
              />
            )}

            {(this.state.OrderType === 5 || this.state.OrderType === 6) && (
              <InputLabeled
                label="Trailing Amount"
                ref="trailing_amount"
                append={this.state.amountLastChanged && this.state.market}
                onChange={this.changeTrailingAmount}
                wrapperClass="col-xs-3"
              />
            )}

            {this.state.OrderType === 6 && (
              <InputLabeled
                value={this.state.limit_offset}
                label="Limit Offset"
                ref="limit_offset"
                append={false && !this.state.amountLastChanged && this.state.market && 'Approximate'}
                onChange={this.changeLimitOffset}
                wrapperClass="col-xs-3"
              />
            )}

            {(this.state.OrderType === 5 || this.state.OrderType === 6) && (
              <SelectLabeled
                label="Peg Price"
                ref="peg_price"
                append={false && !this.state.amountLastChanged && this.state.market && 'Approximate'}
                onChange={this.changePeg}
                wrapperClass="col-xs-3"
              >
                {pegs}
              </SelectLabeled>
            )}
          </div>
          <div>
            <div className="summary-wrap">
              <div>
                <div>
                  {AlphaPoint.translation('BUY_SELL_ADV.MARKET_PRICE') || 'Market Price'}:
                </div>
                <div>{AlphaPoint.translation('BUY_SELL_ADV.ORDER_TOTAL') || 'Order Total'}:</div>
                <div>{AlphaPoint.translation('BUY_SELL_ADV.FEES') || 'Fee'}:</div>
                <div>{AlphaPoint.translation('BUY_SELL_ADV.NET_TOTAL') || 'Net'}:</div>
              </div>
              {pair && (
                <div>
                  <div>
                      {(market && formatNumberToLocale(market, this.state.decimalPlaces[pair.Product2Symbol] || 2)) ||
                      '-'}&nbsp;
                    {pair.Product2Symbol}
                  </div>
                  <div>
                      {this.state.market
                        ? `≈ ${formatNumberToLocale(total || 0, this.state.decimalPlaces[pair.Product2Symbol])}`
                        : formatNumberToLocale(total || 0, this.state.decimalPlaces[pair.Product2Symbol])}&nbsp;
                    {pair.Product2Symbol}
                  </div>
                  <div>
                      {this.state.market ? '≈ ' : ''}
                      {formatNumberToLocale(
                        this.state.fee,
                        this.state.decimalPlaces[this.state.feeProduct || this.state.buy ? 'ETH' : 'BTC'],
                      ) || 0}&nbsp;{this.state.feeProduct || this.state.buy ? 'ETH' : 'BTC'}
                  </div>
                  <div>

                      {this.state.market ? '≈ ' : ''}
                      {formatNumberToLocale(net, this.state.decimalPlaces[netProduct]) || 0}&nbsp;
                    {this.state.buy ? pair.Product1Symbol : pair.Product2Symbol}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="button-wrap pad" style={{ marginTop: '22px', marginBottom: this.props.session ? "7px" : "0" }}>
            {
              this.props.session
              ? <button className="btn btn-action" onClick={this.order}>Place Order</button>
              : <div className="logged-out">
                  <img src="img/account-img.svg"/>
                  <div>To start trading on ORME, please <a href="/login.html" style={{color: "#0091ff"}}>log in</a></div>
                </div>
            }
            
            {this.props.session &&
              <a className="order-entry-text" onClick={this.showAdvancedOrders} title="profile">
                {AlphaPoint.translation('BUY_SELL_MODAL.ADVANCED_ORDER') || 'Advanced Orders'}
              </a>}
            {(AlphaPoint.config.showBlockTradeUI &&
            (AlphaPoint.userPermissions.value.includes('submitblocktrade') ||
            AlphaPoint.userPermissions.value.includes('superuser'))) &&
            (
              <a className="block-trade-text" onClick={this.showBlockTrade} title="profile">
                {AlphaPoint.translation('BUY_SELL_MODAL.REPORT_BLOCK_TRADE') || 'Report Block Trade'}
              </a>
            )
            }
            {this.state.showAdvanced && (
              <Modal close={this.closeAdvancedOrders}>
                <BuySell close={this.closeAdvancedOrders}/>
              </Modal>
            )}
            {this.state.showBlockTrade && (
              <Modal close={this.closeBlockTrade}>
                <BlockTrade />
              </Modal>
            )}
          </div>
        </VerificationRequired>
      </WidgetBase>
    );
  }
}

OrderEntry.defaultProps = {
  hideCloseLink: true,
};

export
default
OrderEntry;
