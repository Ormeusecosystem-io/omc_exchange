/* global AlphaPoint $ */
import React from 'react';

import WidgetBase from './base';
import {
  ordersWidgetDidMount,
  ordersWidgetWillUnmount,
  getOrderFee,
} from '../misc/ordersWidgetsHelper';
import { parseNumberToLocale, formatNumberToLocale } from './helper';

class BlockTrade extends React.Component {
  constructor() {
    super();

    this.ordersWidgetDidMount = ordersWidgetDidMount.bind(this);
    this.ordersWidgetWillUnmount = ordersWidgetWillUnmount.bind(this);
    this.getOrderFee = getOrderFee;

    this.initialState = {
      bought: true,
      market: true,
      marketSell: 0,
      marketBuy: 0,
      productPairs: [],
      total: 0,
      amount: 0,
      amountString: '0',
      value: 0,
      valueString: '0',
      received: 0,
      counterparty: '',
      feeProduct: '',
      productPair: '',
      success: false,
      errorMsg: '',
      balances: [],
      OrderType: 7,
      LockedIn: false,
      AccountId: null,
      product2DecimalPlaces: 2,
    };

    this.state = this.initialState;
  }

  componentDidMount() {
    this.submitBlockTradeEvent = AlphaPoint.submitBlockTradeEvent
      .filter(res => Object.keys(res).length)
      .subscribe((res) => {
        if (res.errormsg) {
          $.bootstrapGrowl(
            `${res.detail ? res.detail : res.errormsg}`,
            { ...AlphaPoint.config.growlerDefaultOptions, type: 'danger' },
          );
          return this.setState({ errorMsg: (res.detail ? res.detail : res.errormsg) || '' });
        }

        if (AlphaPoint.userPermissions.value.includes('getopentradereports') ||
          AlphaPoint.userPermissions.value.includes('superuser')) {
          AlphaPoint.getOpenTradeReports({
            OMSId: AlphaPoint.oms.value,
            AccountId: AlphaPoint.selectedAccount.value,
          });
        }

        return this.setState({
          success: true,
          errorMsg: '',
          amount: 0,
          amountString: '0',
          value: 0,
          valueString: '0',
          total: 0,
        });
      });

    this.ordersWidgetDidMount();
    this.setState({
      success: false,
      errorMsg: '',
      amount: 0,
      amountString: '0',
      value: 0,
      valueString: '0',
      total: 0,
    }, this.getOrderFee);
  }

  componentWillUnmount() {
    this.ordersWidgetWillUnmount();
    this.submitBlockTradeEvent.dispose();
  }

  changeMode = (bought) => this.setState({ bought }, this.setTotal);

  submitBlockTrade = () => {
    const { bought, amount, value } = this.state;
    const accountId = this.state.AccountId;
    const pair = this.state.pair;
    const product1 = this.state.balances.find((prod) => pair.Product1 === prod.ProductId) || {};
    const product2 = this.state.balances.find((prod) => pair.Product2 === prod.ProductId) || {};
    const balance = bought ? (product2.Amount - product2.Hold || 0) : (product1.Amount - product1.Hold || 0);
    const total = bought ? +value : +amount;
    const payload = {
      AccountId: accountId,
      InstrumentId: pair.InstrumentId,
      Side: bought ? 0 : 1,
      counterPartyId: this.state.counterparty,
      Quantity: amount,
      LimitPrice: (value / amount).toFixed(2),
      OMSId: AlphaPoint.oms.value,
      LockedIn: this.state.LockedIn,
      Timestamp: Date.now(),
    };

    if (!amount || !value) {
      return $.bootstrapGrowl(
        AlphaPoint.translation('BUY_SELL_MODAL.NOT_ZERO') || 'Product Bought and Product Sold can\'t be 0',
        { ...AlphaPoint.config.growlerDefaultOptions, type: 'danger' },
      );
    }

    if (total > balance) {
      const insufficientFunds = AlphaPoint.translation('BUY_SELL_MODAL.INSUFFICIENT_FUNDS') || 'Insufficient Funds';
      $.bootstrapGrowl(
        insufficientFunds,
        { ...AlphaPoint.config.growlerDefaultOptions, type: 'danger' },
      );
      return this.setState({ errorMsg: insufficientFunds });
    }

    return AlphaPoint.submitBlockTrade(payload);
  };

  changePair = e => {
    const selectedtInstrumentId = +e.target.value;
    const selectedPair = this.state.productPairs.find(prod => selectedtInstrumentId === prod.InstrumentId) || {};

    AlphaPoint.subscribeLvl1(selectedtInstrumentId);

    this.setState(
      {
        total: 0,
        fee: 0,
        amount: 0,
        amountString: '0',
        price: 0,
        stop_price: 0,
        ref_price: 0,
        limit_offset: 0,
        trailing_amount: 0,
        productPair: selectedPair.Symbol,
        pair: selectedPair,
        InstrumentId: +e.target.value,
      },
      this.getOrderFee,
    );
  };

  changeCounterparty = e => this.setState({ counterparty: e.target.value });

  changeLockedIn = e => this.setState({ LockedIn: e.target.checked });

  changeAmount = e => {
    const amountString = e.target.value;
    const amount = parseNumberToLocale(amountString);
    if (!isNaN(amount)) {
      this.setState({ amount, amountString }, this.setTotal);
    }
  };

  changeValue = e => {
    const valueString = e.target.value;
    const value = parseNumberToLocale(valueString);
    if (!isNaN(value)) {
      this.setState({ value, valueString }, this.setTotal);
    }
  };

  setTotal = () => this.setState({total: this.state.value}, this.getOrderFee);

  getBalance = (product) => formatNumberToLocale(
    Math.floor((product.Amount - product.Hold) * 100) / 100, 2
  );

  render() {
    const { bought, amount, value, fee, feeProduct } = this.state;
    const options = this.state.productPairs.map((pair, idx) => (
      <option value={pair.InstrumentId} key={idx}>
        {pair.Symbol}
      </option>
    ));
    const pair = this.state.pair;
    let product1;
    let product2;
    let symbol1;
    let symbol2;
    if (pair) {
      symbol1 = pair.Product1Symbol;
      symbol2 = pair.Product2Symbol;
      product1 = this.state.balances.find((prod) => symbol1 === prod.ProductSymbol) || {};
      product2 = this.state.balances.find((prod) => symbol2 === prod.ProductSymbol) || {};
    }
    const tabs = (
      <div>
        <span className={`tab ${this.state.bought ? 'active' : ''}`} onClick={() => this.changeMode(true)}>
          {AlphaPoint.translation('BLOCK_TRADE_MODAL.BOUGHT') || 'Bought'}
        </span>
        <span className={`tab ${!this.state.bought ? 'active' : ''}`} onClick={() => this.changeMode(false)}>
          {AlphaPoint.translation('BLOCK_TRADE_MODAL.SOLD') || 'Sold'}
        </span>
      </div>
    );

    if (this.state.success) {
      return (
        <WidgetBase
          {...this.props}
          login
          headerTitle={AlphaPoint.translation('BLOCK_TRADE_MODAL.SUBMIT_TRADE_REPORT') || 'Submit Trade Report'}
          style={{ width: '600px' }}
        >
          <div className="pad">
            <h3 className="text-center">{AlphaPoint.translation('BLOCK_TRADE_MODAL.CONFIRM') || 'Trade report submitted.'}</h3>
            <div className="clearfix">
              <div className="pull-right" style={AlphaPoint.config.siteName === 'aztec' ? { width: '100%' } : null}>
                <button className="btn btn-action" onClick={this.props.close}>{AlphaPoint.translation('BUTTONS.TEXT_CLOSE') || 'Close'}</button>
              </div>
            </div>
          </div>
        </WidgetBase>
      );
    }

    return (
      <WidgetBase
        {...this.props}
        login
        error={this.state.errorMsg}
        success={this.state.successMsg}
        headerTitle={AlphaPoint.translation('BLOCK_TRADE_MODAL.SUBMIT_TRADE_REPORT') || 'Submit Trade Report'}
        left={tabs}
        style={{ width: '600px' }}
      >
        <div className="clearfix block-trade">
          <div className="col-xs-12 flex-row">
            <div className="col-xs-4 flex-row">
              <label htmlFor="instrumentSelect">Instrument:</label>
              <div className="select-container">
                <select id="instrumentSelect" value={this.state.InstrumentId} onChange={this.changePair}>{options}</select>
              </div>
            </div>
            <div className="col-xs-4 flex-row">
              <label htmlFor="counterParty">Counterparty:</label>
              <input id="counterParty" type="text" value={this.state.counterparty} onChange={this.changeCounterparty} />
            </div>
            <div className="col-xs-4">
              <label htmlFor="lockedIn">
                <input type="checkbox" id="lockedIn" checked={this.state.LockedIn} onChange={this.changeLockedIn} />
                <span style={{ fontWeight: this.state.LockedIn ? 'bold' : 'normal' }}>Locked In</span>
              </label>
            </div>
          </div>

          <div className="col-xs-12 flex-row">
            <div className="col-xs-4">
              <label htmlFor="product1">{bought ? 'Product Bought' : 'Product Sold'}</label>
              <div className="flex-row">
                {pair && <label htmlFor="product1">{symbol1}</label>}
                <input id="product1" value={this.state.amountString} onChange={this.changeAmount} />
              </div>
            </div>
            <div className="col-xs-4">
              <label htmlFor="product2">{bought ? 'Product Sold' : 'Product Bought'}</label>
              <div className="flex-row">
                {pair && <label htmlFor="product2">{symbol2}</label>}
                <input id="product2" value={this.state.valueString} onChange={this.changeValue} />
              </div>
            </div>
            <div className="col-xs-4 hide">
              <label htmlFor="timeOfTrade">Time of Trade</label>
              <div className="flex-row">
                <input
                  id="timeOfTrade"
                  type="text"
                  placeholder="MM/DD/YY HH:MM"
                  style={{ width: '100%', textAlign: 'center' }}
                />
              </div>
            </div>
          </div>

          <div className="col-xs-12">
            <div className="col-xs-4">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'inline-block', width: '150px' }}>
                  <div>{AlphaPoint.translation('BLOCK_TRADE_MODAL.TOTAL') || 'Total'} ({ bought ? symbol2 : symbol1 }):</div>
                  <div>Fee Amount ({ feeProduct }):</div>
                  <div>
                    {AlphaPoint.translation('BUY_SELL_MODAL.RECEIVED') || 'Received'} ({ bought ? symbol1 : symbol2 }):
                  </div>
                </div>
                {pair &&
                  <div style={{ display: 'inline-block', textAlign: 'right' }}>
                    <div>
                      <b>{formatNumberToLocale(bought ? value : amount || 0, 2)}</b>
                    </div>
                    <div>
                      <b>{formatNumberToLocale(fee || 0, 2)}</b>
                    </div>
                    <div>
                      <b>
                        {formatNumberToLocale((bought ? amount : value) - fee || 0, 2)}
                      </b>
                    </div>
                  </div>}
              </div>
            </div>
            <div className="col-xs-4">
              {pair &&
                <div>
                  <div style={{ display: 'inline-block', width: '120px' }}>
                    <div>{symbol2} {AlphaPoint.translation('BALANCES.BALANCE') || 'balance'}:</div>
                    <div>{symbol1} {AlphaPoint.translation('BALANCES.BALANCE') || 'balance'}:</div>
                  </div>
                  <div style={{ display: 'inline-block', textAlign: 'right' }}>
                    <div>
                      <b>{this.getBalance(product2)}</b>
                    </div>
                    <div>
                      <b>{this.getBalance(product1)}</b>
                    </div>
                  </div>
                </div>}
            </div>
            <div className="col-xs-4 pad">
              <button className="btn btn-action pull-right" onClick={this.submitBlockTrade}>
                {AlphaPoint.translation('BLOCK_TRADE_MODAL.SUBMIT_REPORT') || 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

BlockTrade.defaultProps = {
  close: () => {},
};

BlockTrade.propTypes = {
  close: React.PropTypes.func,
};

export default BlockTrade;
