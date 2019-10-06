/* global AlphaPoint, localStorage, document, window */
import React from 'react';
import throttle from 'lodash.throttle';

import WidgetBase from './base';
import InputLabeled from '../misc/inputLabeled';
import orderbook from './orderbook';

class BuyAndSell extends React.Component {
  constructor() {
    super();

    this.state = {
      buy: true,
      market: 1,
      marketBuy: 0,
      marketSell: 0,
      productPairs: [],
      total: 0,
      fee: 0,
      feeProduct: '',
      productPair: '',
      amount: 1,
      value: 0,
      amountLastChanged: true,
      successMsg: '',
      errorMsg: '',
      balances: [],
      AccountId: AlphaPoint.userAccounts.value,
      InstrumentId: 0,
    };
  }

  componentDidMount() {
    this.productPairs = AlphaPoint.instruments.subscribe(productPairs => this.setState({ productPairs }));
    this.productPair = AlphaPoint.prodPair.subscribe(productPair => this.setState({ productPair }));
    this.accountInformation = AlphaPoint.accountPositions.subscribe(balances => this.setState({ balances }));
    this.sellOrders = AlphaPoint.sellOrders
      .filter(data => data[0])
      .map(data => data[0].Price || 0)
      .distinctUntilChanged()
      .sample(100)
      .subscribe(marketSell => {
        this.setState({ marketSell });
        if (!this.state.buy && this.state.market && this.refs.value) {
          if (this.state.amountLastChanged) {
            this.changeAmount();
          } else {
            this.changeValue();
          }
          this.getOrderFee();
        }
      });

    this.buyOrders = AlphaPoint.buyOrders
      .filter(data => data[0])
      .map(data => data[0].Price || 0)
      .distinctUntilChanged()
      .sample(100)
      .subscribe(marketBuy => {
        this.setState({ marketBuy });
        if (this.state.buy && this.state.market && this.refs.value) {
          if (this.state.amountLastChanged) {
            this.changeAmount();
          } else {
            this.changeValue();
          }
          this.getOrderFee();
        }
      });

    this.sendOrder = AlphaPoint.sendorder.subscribe(res => {
      this.setState({
        successMsg: res.Status ? 'Your Order has been sent' : '',
        errorMsg: res.rejectReason ? res.rejectReason : '',
        fee: res.fee,
        feeProduct: res.feeProduct,
      });
    });
  }

  componentWillUnmount() {
    this.productPairs.dispose();
    this.productPair.dispose();
    this.accountInformation.dispose();
    this.buyOrders.dispose();
    this.sellOrders.dispose();
    this.sendOrder.dispose();
    AlphaPoint.unsubscribeLvl2();
  }

  getOrderFee = throttle(() => {
    if (!this.isMounted()) return false;
    const market = this.state.buy ? this.state.marketSell : this.state.marketBuy;

    this.setState({
      total: this.refs.amount.value() * (this.state.market ? market : this.refs.value.value()),
    });

    return AlphaPoint.getOrderFee({
      Side: this.state.buy ? 'buy' : 'sell',
      Quantity: this.refs.amount.value(),
      orderType: this.state.market ? 1 : 2,
      Price: this.state.market ? market : this.refs.value.value(),
    }, res => this.setState({
      fee: (res.fee * this.refs.amount.value() * ((this.state.market) ? market : this.refs.value.value())) || 0,
      feeProduct: res.feeProduct,
    }));
  }, 2000, true);

  changeMode = (buy) => this.setState({ buy }, this.getOrderFee);

  order = (e) => {
    const market = this.state.buy ? this.state.marketSell : this.state.marketBuy;
    let total;

    // check if they have enough money
    if (this.state.market) {
      total = this.state.buy ? this.refs.value.value() : this.refs.amount.value();
    } else {
      total = this.state.buy ? (this.refs.value.value() * this.refs.amount.value()) : this.refs.amount.value();
    }

    const pair = this.state.productPairs.find(prod => this.state.productPair === prod.Symbol) || {};
    const product1 = this.state.balances.find(prod => pair.Product1Symbol === prod.ProductSymbol) || {};
    const product2 = this.state.balances.find(prod => pair.product2Symbol === prod.ProductSymbol) || {};
    const balance = this.state.buy ? (product2.Amount - product2.Hold || 0) : (product1.Amont - product1.Hold || 0);

    this.setState({
      total: this.refs.amount.value() * ((this.state.market) ? market : this.refs.value.value()),
    });

    const payload = {
      Side: this.state.buy ? 0 : 1,
      AccountId: this.state.AccountId,
      SubAccount: 1,
      ClientOrderId: 0,
      Quantity: this.refs.amount.value(),
      LimitPrice: this.state.OrderType % 2 === 0 && this.refs.value.value(),
      OrderIdOCO: 0,
      OrderType: this.state.market ? 1 : 2,
      PegPriceType: 1,
      InstrumentId: this.state.InstrumentId,
      RefPrice: 0,
      StopPrice: 0,
      TimeInForce: 0,
      OMSId: AlphaPoint.oms.value,
    };

    AlphaPoint.sendOrder(payload);
  }

  changePair = (e) => orderbook.doSelectIns(e.target.value);

  changeAmount = () => {
    const state = {};

    state.amount = this.refs.amount.value();
    state.amountLastChanged = true;

    if (this.state.market) {
      if (this.state.buy) {
        state.value = this.refs.amount.value() * this.state.marketSell;
      } else {
        state.value = this.refs.amount.value() * this.state.marketBuy;
      }
      state.total = state.value;
    } else {
      state.total = this.refs.amount.value() * this.refs.value.value();
    }

    this.setState(state, this.getOrderFee);
  };

  changeValue = () => {
    const state = {};

    state.value = this.refs.value.value();
    state.amountLastChanged = false;

    if (this.state.market) {
      if (this.state.buy) {
        state.amount = this.refs.value.value() / this.state.marketSell;
      } else {
        state.amount = this.refs.value.value() / this.state.marketBuy;
      }
      state.total = state.value;
    } else {
      state.total = this.refs.amount.value() * this.refs.value.value();
    }

    this.setState(state, this.getOrderFee);
  };

  changeMarket = (market) => {
    const mPrice = this.state.buy ? this.state.marketSell : this.state.marketBuy;
    this.setState({
      market,
      total: this.refs.amount.value() * (market ? mPrice : this.refs.value.value()),
      value: market ? mPrice : this.refs.value.value(),
    }, this.getOrderFee);
  };

  render() {
    const market = this.state.buy ? this.state.marketSell : this.state.marketBuy;
    const pair = this.state.productPairs.find(prod => this.state.productPair === prod.Symbol) || {};
    const product1 = this.state.balances.find(prod => pair.Product1Symbol === prod.ProductSymbol) || {};
    const product2 = this.state.balances.find(prod => pair.Product2Symbol === prod.ProductSymbol) || {};
    const options = this.state.productPairs.map(prod => (
      <option value={prod.Symbol} key={prod.Symbol}>{prod.Symbol}</option>
    ));
    const tabs = (
      <div>
        <span className={`tab ${this.state.buy ? 'active' : ''}`} onClick={() => this.changeMode(true)}>{AlphaPoint.translation('BUY_SELL_MODAL.BUY') || 'Buy'}</span>
        <span className={`tab ${!this.state.buy ? 'active' : ''}`} onClick={() => this.changeMode(false)}>{AlphaPoint.translation('BUY_SELL_MODAL.SELL') || 'Sell'}</span>
      </div>
    );

    return (
      <WidgetBase
        {...this.props}
        login
        error={this.state.errorMsg}
        success={this.state.successMsg}
        headerTitle={AlphaPoint.translation('BUY_SELL_MODAL.BUY_SELL') || 'Trade'}
        left={tabs}
      >
        <div className="clearfix" style={{ borderBottom: '1px solid #CCC' }}>
          <div className="col-xs-8 pad">
            {!this.props.hideSelect &&
              <select
                className="form-control pull-left"
                style={{ width: '130px' }}
                value={this.state.productPair}
                onChange={this.changePair}
              >
                {options}
              </select>
            }
            <div className="pull-right">
              <button className={`btn btn-radio ${this.state.market ? 'active' : ''}`} onClick={() => this.changeMarket(true)}>{AlphaPoint.translation('BUY_SELL_MODAL.MARKET') || 'Market'}</button>
              {' '}
              <button className={`btn btn-radio ${!this.state.market ? 'active' : ''}`} onClick={() => this.changeMarket(false)}>{AlphaPoint.translation('BUY_SELL_MODAL.LIMIT') || 'Limit'}</button>
            </div>
          </div>
          <div className="col-xs-4 pad" style={{ borderLeft: '1px solid #CCC' }}>
            <div><strong>{AlphaPoint.translation('BUY_SELL_MODAL.PRICE_PER') || 'Price Per'} {pair.Product1Symbol} ({pair.Product2Symbol})</strong></div>
            <div>{market || '-'}</div>
          </div>
        </div>
        <div className="clearfix pad-y">
          <InputLabeled
            value={this.state.amount}
            label={`${this.state.buy ? AlphaPoint.translation('BUY_SELL_MODAL.BUY_AMNT') || 'Buy Amount' : AlphaPoint.translation('BUY_SELL_MODAL.SELL_AMNT') || 'Sell Amount'} (${pair.Product1Symbol || ''})`}
            type="number"
            ref="amount"
            append={!this.state.amountLastChanged && this.state.market && (AlphaPoint.translation('BUY_SELL_MODAL.APPROXIMATE') || 'Approximate')}
            onChange={this.changeAmount}
            wrapperClass="col-xs-6"
          />
          <InputLabeled
            value={this.state.value}
            label={`${this.state.buy ? AlphaPoint.translation('BUY_SELL_MODAL.BUY') || 'Buy' : AlphaPoint.translation('BUY_SELL_MODAL.SELL') || 'Sell'} ${this.state.market ? AlphaPoint.translation('BUY_SELL_MODAL.VALUE') || 'Value' : AlphaPoint.translation('BUY_SELL_MODAL.PRICE_PER') || 'Price Per'} (${pair.Product2Symbol || ''})`}
            type="number"
            ref="value"
            append={this.state.amountLastChanged && this.state.market && (AlphaPoint.translation('BUY_SELL_MODAL.APPROXIMATE') || 'Approximate')}
            onChange={this.changeValue}
            wrapperClass="col-xs-6"
          />
        </div>
        <div style={{ borderTop: '1px solid #ccc' }}>
          <div className="pull-right pad" style={{ borderLeft: '1px solid #ccc', minHeight: '72px' }}>
            <button className="btn btn-action pull-right" onClick={this.order}>{AlphaPoint.translation('BUY_SELL_MODAL.PLACE_ORDER') || 'Place Order'}</button>
          </div>

          <div className="pad pull-left">
            <div style={{ display: 'inline-block', width: '100px' }}>
              <div>{AlphaPoint.translation('BUY_SELL_MODAL.TOTAL') || 'Total:'}</div>
              <div>{AlphaPoint.translation('BUY_SELL_MODAL.FEE_AMNT') || 'Fee Amount:'}</div>
            </div>
            <div style={{ display: 'inline-block', textAlign: 'right' }}>
              <div><b>{(parseFloat(this.state.total) || 0).toFixed(product2.decimalPlaces || 2)}</b></div>
              <div><b>{(parseFloat(this.state.fee) || 0).toFixed(product1.decimalPlaces || 2)}</b></div>
            </div>
          </div>

          <div className="pad pull-left" style={{ borderLeft: '1px solid #ccc', minHeight: '72px' }}>
            <div style={{ display: 'inline-block', width: '120px' }}>
              <div>{product2.ProductSymbol} {AlphaPoint.translation('BALANCES.BALANCE') || 'balance'}:</div>
              <div>{product1.ProductSymbol} {AlphaPoint.translation('BALANCES.BALANCE') || 'balance'}:</div>
            </div>
            <div style={{ display: 'inline-block', textAlign: 'right' }}>
              <div><b>{(product2.Amount - product2.Hold || 0).toFixed(product2.decimalPlaces || 2)}</b></div>
              <div><b>{(product1.Amount - product1.Hold || 0).toFixed(product1.decimalPlaces || 2)}</b></div>
            </div>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

BuyAndSell.defaultProps = {
  hideSelect: false,
};

BuyAndSell.propTypes = {
  hideSelect: React.PropTypes.bool,
};

export default BuyAndSell;
