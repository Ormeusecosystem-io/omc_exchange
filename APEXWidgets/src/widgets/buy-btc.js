/* global $, AlphaPoint */
import React from 'react';
import WidgetBase from './base';
import InputLabeled from '../misc/inputLabeled';
import SelectLabeled from '../misc/selectLabeled';
import ProcessingButton from '../misc/processingButton';
import VerificationRequired from './verificationRequired';
import {
  ordersWidgetDidMount,
  ordersWidgetWillUnmount,
  getOrderFee,
  changeValueOnMarketChange,
  changeAmountOnMarketChange,
} from '../misc/ordersWidgetsHelper';
import {
  formatNumberToLocale,
  getPriceForFixedQuantity,
  getQuantityForFixedPrice,
  formatOrders,
  parseNumberToLocale,
  getDecimalPrecision,
} from './helper';
import orderbook from './orderbook';

class BUY_SELL extends React.Component {
  constructor() {
    super();

    this.ordersWidgetDidMount = ordersWidgetDidMount.bind(this);
    this.ordersWidgetWillUnmount = ordersWidgetWillUnmount.bind(this);
    this.getOrderFee = getOrderFee;
    this.changeValueOnMarketChangeFunc = changeValueOnMarketChange.bind(this);
    this.changeAmountOnMarketChangeFunc = changeAmountOnMarketChange.bind(this);

    this.defaultState = {
      amount: 0,
      amountString: '0',
      price: 0,
      priceString: '0',
      total: 0,
      fee: 0,

      stop_price: 0,
      stop_priceString: '0',
      ref_price: 0,
      limit_offset: 0,
      limit_offsetString: '0',
      trailing_amount: 1,
      trailing_amountString: '1',
      display_quantity: 0,
      display_quantityString: '0',
    };
    this.state = {
      ...this.defaultState,
      buy: true,
      market: true,
      marketBuy: 0,
      marketSell: 0,
      productPairs: [],
      feeProduct: '',
      productPair: '',

      decimalPlaces: {},
      Peg: 1,
      pegPrices: [0, 0, 0, 0],

      amountLastChanged: true,
      valueLastChanged: false,
      successMsg: '',
      errorMsg: '',
      balances: [],
      orderTypes: [
        {name: 'Market Order', value: 1, translationKey: 'BUY_SELL_MODAL.MARKET_ORDER'},
        {name: 'Limit Order', value: 2, translationKey: 'BUY_SELL_MODAL.LIMIT_ORDER'},
        {name: 'Stop Market', value: 3, translationKey: 'BUY_SELL_MODAL.STOP_MARKET'},
        {name: 'Stop Limit', value: 4, translationKey: 'BUY_SELL_MODAL.STOP_LIMIT'},
        {name: 'Trailing Stop Market', value: 5, translationKey: 'BUY_SELL_MODAL.TRAILING_STOP_MARKET'},
        {name: 'Trailing Stop Limit', value: 6, translationKey: 'BUY_SELL_MODAL.TRAILING_STOP_LIMIT'},
        {name: 'Fill Or Kill', value: 8, translationKey: 'BUY_SELL_MODAL.FILL_OR_KILL'},
        {name: 'IOC', value: 10, translationKey: 'BUY_SELL_MODAL.IOC'},
        {name: 'Reserve Order', value: 12, translationKey: 'BUY_SELL_MODAL.RESERVE_ORDER'},
      ],
      OrderType: 1,
      PegTypes: [{name: 'Last', value: 1}, {name: 'Bid', value: 2}, {name: 'Ask', value: 3}],
      InstrumentId: 1,
      AccountId: null,
      marketData: {},
      validNumber: false,
      validNumberMessage: '',
      bookBuys: [],
      bookSells: [],
    };
  }

  componentDidMount() {
    this.getOrderFee();
    this.ordersWidgetDidMount(false);

    if (AlphaPoint.config.templateStyle !== 'exchange' && !AlphaPoint.config.standardTemplateTradeUI) {
      this.productPairsSubscribe = AlphaPoint.instruments.subscribe(productPairs => {
        
        productPairs.forEach(pair => AlphaPoint.subscribeLvl1(pair.InstrumentId));
      });
    }
    this.level1 = AlphaPoint.Level1.filter(obj => Object.keys(obj).length).subscribe(marketData => {
      let { InstrumentId } = this.state;
      // Exchange templates ususally already have a preexisting L1 subscription
      // to the current instrument
      if (!marketData[InstrumentId]) {
        InstrumentId = Object.keys(marketData)[0];
        this.setState({ InstrumentId });
      }
      const market = marketData[InstrumentId];
      if (market) {
        this.setState({
          marketBuy: market.BestBid,
          marketSell: market.BestOffer,
          pegPrices: [
            0,
            market.LastTradedPx,
            market.BestBid,
            market.BestOffer,
          ],
        });
      } else {
        console.error(market);
      }
      if (this.marketDataReceived) {
        this.setState({ marketData });
      } else {
        this.setState({ marketData }, this.getOrderFee);
        this.marketDataReceived = true;
      }
    });
    this.sendOrder = AlphaPoint.sendorder.subscribe(res => {
      if (res) {
        this.setState({processing: false});

        if (res.result === false) {
          if (res.errorcode === 102) {
            this.setState({errorMsg: `Invalid ${this.state.buy ? 'buy' : 'sell'} request. Try entering a smaller amount.`});
          } else {
            this.setState({errorMsg: res.errormsg ? res.errormsg : `Invalid ${this.state.buy ? 'buy' : 'sell'} request`});
          }
        }
      }
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

    this.Level2UpdatesObservable = AlphaPoint.Level2Update
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
    this.products.dispose();
    this.ordersWidgetWillUnmount();
    this.level1.dispose();
    this.sendOrder.dispose();
    this.Level2.dispose();
    this.Level2UpdatesObservable.dispose(); // eslint-disable-line
    if (AlphaPoint.config.templateStyle !== 'exchange' && !AlphaPoint.config.standardTemplateTradeUI) {
      this.productPairsSubscribe.dispose();
    }
  }

  marketDataReceived = false;

  order = () => {
    this.setState({ processing: true });

    const { amount, price, buy } = this.state;

    const market = this.state.buy ? this.state.marketSell : this.state.marketBuy;
    const pair = this.state.pair;
    const product1 = this.state.balances.find(prod => pair.Product1Symbol === prod.ProductSymbol) || {};
    const product2 = this.state.balances.find(prod => pair.Product2Symbol === prod.ProductSymbol) || {};
    const balance = this.state.buy ? product2.Amount - product2.Hold || 0 : product1.Amount - product1.Hold || 0;
    let total;

    // check if they have enough money
    if (this.state.market) {
      total = buy ? price : amount;
    } else {
      total = buy ? price * amount : amount;
    }

    if (total > balance) {
      $.bootstrapGrowl(AlphaPoint.translation('BUY_SELL_MODAL.INSUFFICIENT_FUNDS') || 'Insufficient Funds', {
        type: 'danger',
        allow_dismiss: true,
        align: 'right',
        delay: AlphaPoint.config.growlwerDelay,
      });
      return this.setState({
        errorMsg: AlphaPoint.translation('BUY_SELL_MODAL.INSUFFICIENT_FUNDS') || 'Insufficient Funds',
        processing: false,
      });
    }

    this.setState({ errorMsg: '', total: amount * (this.state.market ? market : this.state.total) });

    const limitPrice = this.state.OrderType % 2 === 0 && this.state.price;
    const stopPrice = this.state.stop_price || 0;
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
        payload = { ...commonPayload, LimitPrice: +limitPrice };
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
      case 4: {
        payload = {
          ...commonPayload,
          LimitPrice: +this.state.price,
          StopPrice: +stopPrice,
          PegPriceType: this.state.buy ? 3 : 2,
        };
        break;
      }
      case 5: {
        payload = {
          ...commonPayload,
          PegPriceType: this.state.Peg || 0,
          TrailingAmount: this.state.trailing_amount,
        };
        break;
      }
      case 6: {
        payload = {
          ...commonPayload,
          TrailingAmount: this.state.trailing_amount,
          LimitOffset: this.state.limit_offset,
          PegPriceType: this.state.Peg || 0,
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
          DisplayQuantity: this.state.display_quantity,
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
      }
    }

    return AlphaPoint.sendOrder(payload);
  };

  changePair = e => {
    orderbook.doSelectIns(e.target.value);
    const selectedtInstrumentId = +e.target.value;
    const selectedPair = this.state.productPairs.find(prod => selectedtInstrumentId === prod.InstrumentId) || {};

    this.setState(
      {
        total: 0,
        fee: 0,
        amount: 0,
        amountString: '0',
        price: 0,
        priceString: '0',
        stop_price: 0,
        stop_priceString: '0',
        ref_price: 0,
        limit_offset: 0,
        limit_offsetString: '0',
        trailing_amount: 1,
        trailing_amountString: '1',
        productPair: selectedPair.Symbol,
        pair: selectedPair,
        marketBuy: this.state.marketData[e.target.value].BestBid,
        marketSell: this.state.marketData[e.target.value].BestOffer,
        InstrumentId: +e.target.value,
      },
      this.getOrderFee,
    );
  };

  changeType = e => {
    if (e.target.value % 2 === 0) {
      this.changeMarket(false);
      //   this.setState({
      //     price: this.state.buy ? this.state.marketSell : this.state.marketBuy,
      //     total: this.state.buy ? this.state.marketSell * this.state.amount : this.state.marketBuy * this.state.amount,
      //   });
    } else {
      this.changeMarket(true);
      //   this.setState({
      //     price: this.state.buy ? this.state.marketSell * this.state.amount : this.state.marketBuy * this.state.amount,
      //   });
    }

    this.resetValidNumber();
    this.setState({
      OrderType: +e.target.value,
      amount: 0,
      amountString: '0',
      price: 0,
      priceString: '0',
      total: 0,
      fee: 0,
      stop_price: 0,
      ref_price: 0,
      limit_offset: 0,
      trailing_amount: 1,
      trailing_amountString: '1',
      display_quantity: 0,
      display_quantityString: '0',
      Peg: 1,
    });
  };

  changePeg = e => this.setState({ Peg: +e.target.value }, this.trailingStopTotal);

  changeMode = buy => {
    if (this.state.OrderType === 5 || this.state.OrderType === 6) {
      return this.setState({ ...this.defaultState, buy, Peg: 1 }, this.trailingStopTotal);
    }
    return this.setState({ ...this.defaultState, buy }, this.getOrderFee);
  };

  validateNumberOnBlur = (e) => {
    const value = parseNumberToLocale(e.target.value);

    if (!value || value <= 0 || isNaN(value)) {
      this.setState({ validNumber: false, validNumberMessage: AlphaPoint.translation('BUY_SELL_MODAL.VALID_NUMBER') || 'Please enter a valid number' });
    } else {
      this.setState({ validNumber: true });
    }
  };

  resetValidNumber = () => {
    this.setState({
      validNumber: true,
      validNumberMessage: AlphaPoint.translation('BUY_SELL_MODAL.VALID_NUMBER') || 'Please enter a valid number',
    });
  };

  trailingStopTotal = () => {
    // This is a very, very rough estimate. It assumes that the conditions of
    // the trailing stop will happen immediately after the order is placed, and
    // uses the current market conditions as the peg price.
    const { pegPrices, buy, Peg, trailing_amount, limit_offset, amount } = this.state;
    const pegPrice = pegPrices[Peg || 1];
    const buyTotal = (pegPrice + trailing_amount) - limit_offset;
    const sellTotal = (pegPrice - trailing_amount) + limit_offset;
    
    this.setState({ total: amount * (buy ? buyTotal : sellTotal) }, this.getOrderFee);
  };

  changeAmount = (amountProductSymbol, priceProductSymbol, e) => {
    const { OrderType, decimalPlaces } = this.state;
    const amountString = e.target.value;
    const amount = parseNumberToLocale(amountString);
    const decimals = getDecimalPrecision(amount);
    const decimalsAllowed = decimalPlaces[amountProductSymbol];
    const decimalsAllowedPrice = decimalPlaces[priceProductSymbol];

    const msgInvalid = AlphaPoint.translation('BUY_SELL_MODAL.VALID_NUMBER') || 'Please enter a valid number';
    const msgDecimals = `${AlphaPoint.translation('BUY_SELL_MODAL.MAX_DECIMAL') || 'Max decimal places allowed is'} ${decimalsAllowed}`;

    if (decimals > decimalsAllowed) {
      this.setState({ validNumber: false, validNumberMessage: msgDecimals });
    } else if (isNaN(amount)) {
      this.setState({ validNumber: false, validNumberMessage: msgInvalid });
    } else if (this.state.market && OrderType === 1) {
      let total;

      if (this.state.buy) {
        total = getPriceForFixedQuantity(amount, 0, this.state.bookSells, true).Price;
      } else {
        total = getPriceForFixedQuantity(amount, 0, this.state.bookBuys, true).Price;
      }

      this.setState({
        validNumber: true,
        amount,
        amountString,
        priceString: formatNumberToLocale(total, decimalsAllowedPrice),
        price: total,
        total,
      }, this.getOrderFee);
    } else if (this.state.market && this.state.OrderType === 3) {
      const total = this.state.stop_price * amount;
      this.setState({
        validNumber: true,
        amount,
        amountString,
        price: total,
        total,
      }, this.getOrderFee);
    } else if (this.state.OrderType === 2) {
      this.setState({
        validNumber: true,
        amount,
        amountString,
        total: amount * this.state.price,
      }, this.getOrderFee);
    } else if (this.state.OrderType === 5 || this.state.OrderType === 6) {
      this.setState({
        validNumber: true,
        amount,
        amountString,
      }, this.trailingStopTotal);
    } else {
      this.setState({
        validNumber: true,
        amount,
        amountString,
      }, this.getOrderFee);
    }
    return true;
  };

  changePrice = (priceProductSymbol, amountProductSymbol, e) => {
    const priceString = e.target.value;
    const price = parseNumberToLocale(priceString);
    const decimals = getDecimalPrecision(price);
    const decimalsAllowed = this.state.decimalPlaces[priceProductSymbol];
    const decimalsAllowedAmount = this.state.decimalPlaces[amountProductSymbol];

    const msgInvalid = AlphaPoint.translation('BUY_SELL_MODAL.VALID_NUMBER') || 'Please enter a valid number';
    const msgDecimals = `${AlphaPoint.translation('BUY_SELL_MODAL.MAX_DECIMAL') || 'Max decimal places allowed is'} ${decimalsAllowed}`;
    const validNumber = true;

    if (decimals > decimalsAllowed) {
      this.setState({ validNumber: false, validNumberMessage: msgDecimals });
    } else if (isNaN(price)) {
      this.setState({ validNumber: false, validNumberMessage: msgInvalid });
    } else if (this.state.market) {
      let quantity;

      if (this.state.buy) {
        quantity = getQuantityForFixedPrice(price, 0, this.state.bookSells, true).Quantity;
      } else {
        quantity = getQuantityForFixedPrice(price, 0, this.state.bookBuys, true).Quantity;
      }

      if (this.state.OrderType !== 3) {
        this.setState(
          {
            validNumber,
            amountString: quantity === Infinity
              ? formatNumberToLocale(0, decimalsAllowedAmount)
              : formatNumberToLocale(quantity, decimalsAllowedAmount),
            amount: quantity === Infinity ? 0 : quantity,
            price,
            priceString,
            total: price,
          },
          this.getOrderFee,
        );
      } else {
        this.setState(
          {
            validNumber,
            priceString,
            price,
            stop_price: price,
            total: price,
          },
          this.getOrderFee,
        );
      }
    } else if (this.state.OrderType === 2) {
      this.setState({
        price,
        priceString,
        total: this.state.amount * price,
      }, this.getOrderFee);
    } else {
      this.setState({
        price,
        priceString,
        total: this.state.amount * price,
      }, this.getOrderFee);
    }
    return true;
  };

  changeStopPrice = e => {
    const stop_priceString = e.target.value;
    const stop_price = parseNumberToLocale(stop_priceString);
    const decimals = getDecimalPrecision(stop_price);
    const decimalsAllowed = this.state.decimalPlaces[this.state.pair.Product2Symbol];

    if (decimals <= decimalsAllowed && !isNaN(stop_price)) {
      const total = stop_price * this.state.amount;
      this.setState({ stop_price, stop_priceString, total }, this.getOrderFee);
    }
  }

  changeLimitOffset = e => {
    const limitOffsetString = e.target.value;
    const limitOffset = parseNumberToLocale(limitOffsetString);
    const decimals = getDecimalPrecision(limitOffset);
    const decimalsAllowed = this.state.decimalPlaces[this.state.pair.Product2Symbol];

    if (decimals <= decimalsAllowed && !isNaN(limitOffset)) {
      this.setState({
        limit_offset: limitOffset,
        limit_offsetString: limitOffsetString,
        amountLastChanged: true,
      }, this.trailingStopTotal);
    }
  };

  changeTrailingAmount = e => {
    const trailing_amountString = e.target.value;
    const trailing_amount = parseNumberToLocale(trailing_amountString);
    if (!isNaN(trailing_amount)) {
      this.setState({ trailing_amountString, trailing_amount }, this.trailingStopTotal);
    }
  }

  changeDisplayQuantity = e => {
    const display_quantityString = e.target.value;
    const display_quantity = parseNumberToLocale(display_quantityString);
    if (!isNaN(display_quantity)) {
      this.setState({ display_quantity, display_quantityString }, this.getOrderFee);
    }
  }

  changeMarket = market => {
    const mPrice = this.state.buy ? this.state.marketSell : this.state.marketBuy;

    this.setState(
      {
        market,
        total: this.state.amount * (market ? mPrice : this.state.price),
        price: market ? mPrice : this.state.price,
      },
      this.getOrderFee,
    );
  };

  formatNumber = (num, product) => formatNumberToLocale(num, this.state.decimalPlaces[product]);

  render() {
    const options = this.state.productPairs.filter(pair => pair.Symbol === "ETHBTC").map(pair => (
      <option value={pair.InstrumentId} key={pair.InstrumentId}>
        {pair.Symbol}
      </option>
    ));
    const types = this.state.orderTypes.map(type => (
      <option value={type.value} key={type.value}>
        {AlphaPoint.translation(type.translationKey) || type.name}
      </option>
    ));
    const pegs = this.state.PegTypes.map(peg => (
      <option value={peg.value} key={peg.value}>
        {peg.name}
      </option>
    ));
    const { pair, feeProduct, amount, total, fee } = this.state;
    const tabs = (
      <div id="tabs">
        <span className={`tab ${this.state.buy ? 'active' : ''}`} onClick={() => this.changeMode(true)}>
          {AlphaPoint.translation('BUY_SELL_MODAL.BUY') || 'Buy'}
        </span>
        <span className={`tab ${!this.state.buy ? 'active' : ''}`} onClick={() => this.changeMode(false)}>
          {AlphaPoint.translation('BUY_SELL_MODAL.SELL') || 'Sell'}
        </span>
      </div>
    );
    let product1;
    let product2;
    let product1symbol;
    let product2symbol;
    let product1decimals = 8;
    let product2decimals = 2;
    let feeDecimals = 2;
    let product1Balance;
    let product2Balance;
    if (pair) {
      product1 = this.state.balances.find(prod => pair.Product1Symbol === prod.ProductSymbol) || {};
      product2 = this.state.balances.find(prod => pair.Product2Symbol === prod.ProductSymbol) || {};

      product1symbol = pair.Product1Symbol;
      product2symbol = pair.Product2Symbol;

      product1decimals = this.state.decimalPlaces[pair.Product1Symbol];
      product2decimals = this.state.decimalPlaces[pair.Product2Symbol];

      product1Balance = (product1.Amount - product1.Hold);
      product1Balance = formatNumberToLocale(product1Balance, product1decimals || 2);
      product2Balance = (product2.Amount - product2.Hold);
      product2Balance = formatNumberToLocale(product2Balance, product2decimals || 2);

      feeDecimals = this.state.decimalPlaces[feeProduct];
    }

    const netProduct = this.state.buy ? product1symbol : product2symbol;
    const netAmountBought = netProduct === feeProduct ? Math.max(0, amount - fee) : amount;
    const netAmountSold = netProduct === feeProduct ? Math.max(0, total - fee) : total;
    return (

      <WidgetBase
        modalId="advancedOrdersModal"
        {...this.props}
        login
        error={this.state.errorMsg}
        success={this.state.successMsg}
        headerTitle="Advanced orders"
        materialIconTitle={AlphaPoint.translation('BUY_SELL_MODAL.MATERIAL_ICON_CODE') || ''}
        left={tabs}
        style={{ width: '600px' }}
        innerClassName="p-lr-15"
      >
        <VerificationRequired>
          {tabs}
          <div className="clearfix" style={{marginTop: '35px'}}>
            <div className="holder">
              {!this.props.hideSelect && (
                <div className="selcet-wrapper">
                  <img src="img/drop-copy.svg"/>
                  <select
                    value={this.state.InstrumentId}
                    onChange={this.changePair}
                  >
                    {options}
                  </select>
                </div>
              )}
             <div className="selcet-wrapper">
                <img src="img/drop-copy.svg"/>
                <select
                  value={this.state.OrderType}
                  onChange={this.changeType}
                >
                  {types}
                </select>
             </div>
              <div>
                {pair && (
                  <div className="to">
                    <strong>
                      {AlphaPoint.translation('BUY_SELL_MODAL.PRICE_PER') || 'Price Per'} {pair.Product1Symbol}
                    </strong>
                  </div>
                )}
                <div className="from">
                  {this.state.buy
                    ? this.state.marketSell && formatNumberToLocale(this.state.marketSell, product2decimals)
                    : (this.state.marketBuy && formatNumberToLocale(this.state.marketBuy, product2decimals)) || '-'} {pair && (pair.Product2Symbol)}
                </div>
              </div>
            </div>

            
          </div>

          <div className="clearfix inputs-row">
            {pair && (
              <InputLabeled
                name="amount"
                value={this.state.amountString}
                placeholder={this.state.amount === '∞' ? AlphaPoint.translation('BUY_SELL_MODAL.NO_MARKET') || 'No Market' : ''}
                label={`${
                  this.state.buy
                    ? AlphaPoint.translation('BUY_SELL_MODAL.BUY_AMNT') || 'Buy Amount'
                    : AlphaPoint.translation('BUY_SELL_MODAL.SELL_AMNT') || 'Sell Amount'
                } (${pair.Product1Symbol || ''})`}
                ref="amount"
                append={!this.state.amountLastChanged && this.state.market && 'Approx'}
                onChange={e => this.changeAmount(pair.Product1Symbol, pair.Product2Symbol, e)}
                onBlur={this.validateNumberOnBlur}
                className="amount-input"
              />
            )}

            {(this.state.OrderType === 5 || this.state.OrderType === 6) && (
              <InputLabeled
                value={this.state.trailing_amountString}
                label={AlphaPoint.translation('BUY_SELL_MODAL.TRAILING_AMOUNT') || 'Trailing Amount'}
                ref="trailing_amount"
                append={this.state.amountLastChanged && this.state.market}
                onChange={this.changeTrailingAmount}
                className="value-input"
              />
            )}

            {this.state.OrderType === 6 && (
              <InputLabeled
                value={this.state.limit_offsetString}
                label={AlphaPoint.translation('BUY_SELL_MODAL.LIMIT_OFFSET') || 'Limit Offset'}
                ref="limit_offset"
                append={!this.state.amountLastChanged && this.state.market && 'Approximate'}
                onChange={this.changeLimitOffset}
              />
            )}

            {pair &&
              this.state.OrderType !== 3 && this.state.OrderType !== 4 && (
                <InputLabeled
                  name="price"
                  value={this.state.priceString}
                  label={
                    this.state.OrderType === 5 || this.state.OrderType === 6
                      ? ''
                      : `${
                        this.state.buy
                          ? AlphaPoint.translation('BUY_SELL_MODAL.BUY') || 'Buy'
                          : AlphaPoint.translation('BUY_SELL_MODAL.SELL') || 'Sell'
                      } ${this.state.market
                        ? AlphaPoint.translation('BUY_SELL_MODAL.VALUE') || 'Value'
                        : AlphaPoint.translation('BUY_SELL_MODAL.PRICE_PER') || 'Price Per'
                      } (${pair.Product2Symbol || ''})`
                  }
                  ref="value"
                  append={
                    this.state.amountLastChanged &&
                    this.state.market &&
                    (AlphaPoint.translation('BUY_SELL_MODAL.APPROXIMATE') || 'Approximate')
                  }
                  onChange={e => this.changePrice(pair.Product2Symbol, pair.Product1Symbol, e)}
                  onBlur={this.validateNumberOnBlur}
                  wrapperClass={this.state.OrderType === 5 || this.state.OrderType === 6 ? 'hide' : ''}
                  style={{ display: this.state.OrderType === 5 || this.state.OrderType === 6 ? 'none' : 'block' }}
                />
              )
            }

            {pair &&
              this.state.OrderType === 4 && (
                <InputLabeled
                  name="price"
                  value={this.state.priceString}
                  label={AlphaPoint.translation('BUY_SELL_MODAL.LIMIT_PRICE') || 'Limit Price'}
                  ref="value"
                  append={
                    this.state.amountLastChanged &&
                    this.state.market &&
                    (AlphaPoint.translation('BUY_SELL_MODAL.APPROXIMATE') || 'Approximate')
                  }
                  onChange={e => this.changePrice(pair.Product2Symbol, pair.Product1Symbol, e)}
                  onBlur={this.validateNumberOnBlur}
                  style={{ display: 'block' }}
                />
              )
            }

            {this.state.OrderType === 12 && (
              <InputLabeled
                value={this.state.display_quantityString}
                label={AlphaPoint.translation('BUY_SELL_MODAL.DISPLAY_QUANTITY') || 'Display Quantity'}
                type="number"
                min="0"
                ref="display_quantity"
                onChange={this.changeDisplayQuantity}
              />
            )}

            {(this.state.OrderType === 3 || this.state.OrderType === 4) && (
              <InputLabeled
                value={this.state.stop_priceString}
                label={AlphaPoint.translation('BUY_SELL_MODAL.STOP_PRICE') || 'Stop Price'}
                ref="value"
                onChange={this.changeStopPrice}
              />
            )}

            

            

            {(this.state.OrderType === 5 || this.state.OrderType === 6) && (
              <div className="select-wrapper">
                <img src="img/drop-copy.svg"/>
                <SelectLabeled
                  value={this.state.Peg}
                  label={AlphaPoint.translation('BUY_SELL_MODAL.PEG_PRICE') || 'Peg Price'}
                  ref="peg_price"
                  append={!this.state.amountLastChanged && this.state.market && 'Approximate'}
                  onChange={this.changePeg}
                  wrapperClass={`$pad ${this.state.OrderType === 6 ? 'mt-neg35':''}`}
                  className="peg-price"
                >
                  {pegs}
                </SelectLabeled>
              </div>
            )}

            {pair &&
            <span className="approximation-note">
              { AlphaPoint.translation('BUY_SELL_MODAL.APPROX_MESSAGE') || 'The price shown here is an approximation.' }
            </span>}
            {(!this.state.validNumber && this.state.validNumberMessage) &&
            <span
              className={`${this.state.OrderType === 6 && 'btm-195'} ${AlphaPoint.config.templateStyle === 'exchange' && 'exchange-buy-sell-error-message'}`}
              style={{
                color: 'lightcoral',
                fontSize: '13px',
                fontWeight: '600',
                position: 'absolute',
                left: '20px',
                bottom: '115px',
              }}
            >{this.state.validNumberMessage}</span>}
          </div>
          <div className="clearfix summary">
            {pair && (
              <div className={`pad`}>

                <div >
                  { AlphaPoint.config.templateStyle === 'standard'
                    ? <div>
                      { AlphaPoint.translation('BUY_SELL_MODAL.SUM') || 'Sum:'} 
                    </div>
                    : <div>
                      { AlphaPoint.translation('BUY_SELL_MODAL.SUM') || 'Sum:'} 
                    </div>}
                  <div>
                    ~{`${formatNumberToLocale(this.state.total, product2decimals || 2)} ${pair.Product2Symbol}`}
                  </div>
                </div>

                <div>
                  {AlphaPoint.config.templateStyle === 'standard'
                    ? <div>
                      {AlphaPoint.translation('BUY_SELL_MODAL.FEE') || 'Fee:'} 
                    </div>
                    : <div>
                      {AlphaPoint.translation('BUY_SELL_MODAL.FEE') || 'Fee:'}
                    </div>}
                  <div>
                    ~{formatNumberToLocale(this.state.fee || 0, feeDecimals || 2)} {feeProduct}
                  </div>
                </div>

                <div>
                  {AlphaPoint.config.templateStyle === 'standard' ?
                    <div>
                      {AlphaPoint.translation('BUY_SELL_MODAL.RECEIVED') || 'Received:'}
                    </div> :
                    <div>
                      {AlphaPoint.translation('BUY_SELL_MODAL.RECEIVED') || 'Received:'}
                    </div>
                  }
                  <div>
                    ~
                    {this.state.buy
                      ? `${formatNumberToLocale(netAmountBought, product1decimals || 2)} ${netProduct}`
                      : `${formatNumberToLocale(netAmountSold, product2decimals || 2)} ${netProduct}`}
                  </div>
                </div>

              </div>
            )}

            {pair && (
              <div className="pad balances">
                <div className="products">
                  <div>
                    {pair.Product2Symbol} {AlphaPoint.translation('BUY_SELL_MODAL.BALANCE') || 'available'}
                  </div>
                  <div>
                      {product2Balance}
                  </div>
                  
                </div>
                <div className="products">
                    <div>
                      {pair.Product1Symbol} {AlphaPoint.translation('BUY_SELL_MODAL.BALANCE') || 'available'}
                    </div>
                    <div>
                      {product1Balance}
                    </div>
                </div>
              </div>
            )}
          </div>
          <div
            className={`pad buttons`}
          >
            <button id="cancel" onClick={() => this.props.close()}>
              Cancel
            </button>
            <ProcessingButton
              className="btn btn-action place-order-btn"
              processing={this.state.processing}
              onClick={this.order}
              disabled={!this.state.validNumber}
            >
              {AlphaPoint.translation('BUY_SELL_MODAL.PLACE_ORDER') || 'Place Order'}
            </ProcessingButton>
          </div>
        </VerificationRequired>
      </WidgetBase>
    );
  }
}

BUY_SELL.defaultProps = {
  hideSelect: false,
};

BUY_SELL.propTypes = {
  hideSelect: React.PropTypes.bool,
};

export default BUY_SELL;
