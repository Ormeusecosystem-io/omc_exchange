/* global AlphaPoint, document, $ */
import React from 'react';

import WidgetBase from './base';

class QuoteEntry extends React.Component {
  constructor() {
    super();

    this.state = {
      reference: 'inside',
      lastSentQuote: null,
      currentBid: null,
      currentAsk: null,
      BidDistance: '',
      BidQty: '',
      AskDistance: '',
      AskQty: '',
      productPairs: [],
      productPair: '',
      tickerData: {},
    };
  }

  componentDidMount() {
    this.openQuotes = AlphaPoint.openquotes
      .filter(data => data.length)
      .subscribe((data) => {
        const orders = data.filter((order) => order.Account === AlphaPoint.selectedAccount.value);

        this.setState({
          currentBid: orders.length ? orders.find((order) => order.Side === 'Buy') : null,
          currentAsk: orders.length ? orders.find((order) => order.Side === 'Sell') : null,
        });
      });

    this.accountChangedEvent = AlphaPoint.selectedAccount.subscribe((accountId) => {
      const orders = AlphaPoint.openquotes.value.filter((order) => order.Account === accountId);

      this.setState({
        accountId,
        currentBid: orders.length ? orders.find((order) => order.Side === 'Buy') : null,
        currentAsk: orders.length ? orders.find((order) => order.Side === 'Sell') : null,
      });
    });

    this.productPairs = AlphaPoint.instruments.subscribe((data) => this.setState({productPairs: data}));

    this.productPair = AlphaPoint.prodPair.subscribe((data) => this.setState({productPair: data}));

    this.tickerData = AlphaPoint.tickerBook.subscribe(tickerData => this.setState({tickerData}));

    document.APAPI.SubscribeToEvent('OrderStateEvent', (order) => {
      if (order.IsQuote) {
        if (order.OrderState === 'Canceled') return this.getOpenQuotes();
        if (order.Side === 'Buy') return this.setState({currentBid: order});
        if (order.Side === 'Sell') return this.setState({currentAsk: order});
      }
      return false;
    });
  }

  componentWillUnmount() {
    this.openQuotes.dispose();
    this.accountChangedEvent.dispose();
    this.productPairs.dispose();
    this.productPair.dispose();
    this.tickerData.dispose();
  }

  getOpenQuotes = () => {
    const requestPayload = {
      OMSId: AlphaPoint.oms.value,
      AccountId: AlphaPoint.selectedAccount.value,
      InstrumentId: +AlphaPoint.instrumentChange.value,
    };

    document.APAPI.RPCCall('GetOpenQuotes', requestPayload, (rv) => {
      const orders = Object.keys(rv)
        .map((side) => rv[side])
        .filter((order) => order !== null);

      // This is an object with latest open bid quote and open ask quote
      if (orders.length) {
        AlphaPoint.openquotes.onNext(orders);
      } else {
        this.setState({
          currentAsk: null,
          currentBid: null,
        });
      }
    });
  }

  changeReference = (reference) => this.setState({reference});

  calculatePrice = (side) => {
    const bestSellPrice = this.state.tickerData.BestOffer;
    const bestBuyPrice = this.state.tickerData.BestBid;
    const midpoint = (bestBuyPrice + bestSellPrice) / 2;
    const BidDistance = +this.state.BidDistance;
    const AskDistance = +this.state.AskDistance;

    switch (this.state.reference) {
      case 'inside': {
        if (side === 'buy') return bestBuyPrice - BidDistance;
        if (side === 'sell') return bestSellPrice + AskDistance;
        break;
      }
      case 'midpoint': {
        if (side === 'buy') return midpoint - BidDistance;
        if (side === 'sell') return midpoint + AskDistance;
        break;
      }
      case 'price': {
        if (side === 'buy') return BidDistance;
        if (side === 'sell') return AskDistance;
        break;
      }
      default: {
        break;
      }
    }

    return false;
  }

  validate = () => {
    const bidDistance = +this.state.BidDistance;
    const askDistance = +this.state.AskDistance;
    const bidQty = +this.state.BidQty;
    const askQty = +this.state.AskQty;

    if (!bidQty && !askQty) {
      $.bootstrapGrowl(
        AlphaPoint.translation('QUOTE.SET_BID_QUANTITY') || 'You must set Bid and/or Ask quantity to create a quote',
        {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'},
      );
      return false;
    }

    if (bidQty && !bidDistance) {
      $.bootstrapGrowl(
        AlphaPoint.translation('QUOTE.SET_BID_SET_PRICE') || 'If you set bid quantity, you have to set bid price',
        {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'},
      );
      return false;
    }

    if (!bidQty && bidDistance) {
      $.bootstrapGrowl(
        AlphaPoint.translation('QUOTE.SET_PRICE_SET_QUANTITY') || 'If you set bid price, you have to set bid quantity',
        {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'},
      );
      return false;
    }

    if (askQty && !askDistance) {
      $.bootstrapGrowl(
        AlphaPoint.translation('QUOTE.SET_ASK_QTY_SET_ASK_PRICE') || 'If you set ask quantity, you have to set ask price',
        {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'},
      );
      return false;
    }

    if (!askQty && askDistance) {
      $.bootstrapGrowl(
        AlphaPoint.translation('QUOTE.SET_ASK_PRICE_SET_ASK_QTY') || 'If you set ask price, you have to set ask quantity',
        {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'},
      );
      return false;
    }

    if (this.state.reference === 'midpoint') {
      if (!bidDistance && !askDistance) {
        $.bootstrapGrowl(
          AlphaPoint.translation('QUOTE.SET_BID_SET_DISTANCE') || 'You must set Bid and/or Ask distance to create a quote with midpoint reference',
          {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'},
        );
        return false;
      }
    }

    if (this.state.reference === 'price') {
      if ((askQty && askDistance === 0) || (bidQty && bidDistance === 0)) {
        $.bootstrapGrowl(
          AlphaPoint.translation('QUOTE.GREATER_THAN_ZERO') || 'Price must be greater than zero',
          {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'},
        );
        return false;
      }

      if ((askQty && askDistance) && (bidQty && bidDistance)) {
        if (bidDistance >= askDistance) {
          $.bootstrapGrowl(
            AlphaPoint.translation('QUOTE.ASK_PRICE_GREATER_THAN_BID') || 'Ask price must be greater than Bid price.',
            {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'},
          );
          return false;
        }
      }
    }

    return this.createQuote();
  }

  createQuote = () => {
    const bidDistance = +this.state.BidDistance;
    const askDistance = +this.state.AskDistance;
    const bidQty = +this.state.BidQty;
    const askQty = +this.state.AskQty;

    const payload = {
      OMSId: AlphaPoint.oms.value,
      AccountId: this.state.accountId,
      InstrumentId: +AlphaPoint.instrumentChange.value,
    };

    if (bidQty > 0) {
      payload.Bid = (bidQty && (this.calculatePrice('buy')).toFixed(4)) || 0;
      payload.BidQty = bidQty;
    }

    if (askQty > 0) {
      payload.Ask = (askQty && (this.calculatePrice('sell')).toFixed(4)) || 0;
      payload.AskQty = askQty;
    }

    return document.APAPI.RPCCall('CreateQuote', payload, () => {
      this.setState({
        lastSentQuote: {
          BidDistance: bidDistance,
          BidQty: payload.BidQty,
          Bid: payload.Bid,
          AskDistance: askDistance,
          AskQty: payload.AskQty,
          Ask: payload.Ask,
        },
        BidDistance: '',
        BidQty: '',
        AskDistance: '',
        AskQty: '',
      });
    });
  }

  updateQuote = () => {
    const payload = {
      OMSId: AlphaPoint.oms.value,
      AccountId: AlphaPoint.selectedAccount.value,
      InstrumentId: +AlphaPoint.instrumentChange.value,
      BidQuoteId: null,
      Bid: 0,
      BidQty: 0,
      AskQuoteId: null,
      Ask: 0,
      AskQty: 0,
    };

    document.APAPI.RPCCall('UpdateQuote', payload);
  }

  refreshQuote = (e) => {
    if (e.target.id === 'bid') {
      this.setState({
        BidQty: this.state.lastSentQuote.BidQty,
        BidDistance: this.state.lastSentQuote.BidDistance,
      });
    }
    if (e.target.id === 'ask') {
      this.setState({
        AskQty: this.state.lastSentQuote.AskQty,
        AskDistance: this.state.lastSentQuote.AskDistance,
      });
    }
  }

  prefillWithLastQuote = () => {
    if (this.state.lastSentQuote) {
      this.setState({
        BidQty: this.state.lastSentQuote.BidQty || '',
        BidDistance: this.state.lastSentQuote.BidDistance || '',
        AskQty: this.state.lastSentQuote.AskQty || '',
        AskDistance: this.state.lastSentQuote.AskDistance || '',
      });
    }
  }

  clearOpenQuotes = () => {
    if (this.state.currentBid || this.state.currentAsk) {
      const payload = {
        BidQuoteId: (this.state.currentBid && this.state.currentBid.OrderId) || null,
        AskQuoteId: (this.state.currentAsk && this.state.currentAsk.OrderId) || null,
      };

      this.cancelQuote(payload);
    }
  }

  cancelQuote = (payload) => {
    const growlerOpts = {...AlphaPoint.config.growlerDefaultOptions, type: 'success'};
    const requetPayload = {
      OMSId: AlphaPoint.oms.value,
      AccountId: AlphaPoint.selectedAccount.value,
      InstrumentId: +AlphaPoint.instrumentChange.value,
      BidQuoteId: payload.BidQuoteId,
      AskQuoteId: payload.AskQuoteId,
    };

    document.APAPI.RPCCall('CancelQuote', requetPayload, (data) => {
      if (payload.BidQuoteId && JSON.parse(data.BidResult).result) {
        $.bootstrapGrowl(
          AlphaPoint.translation('QUOTE.CLEARED_BID_QUOTE') || 'Bid quote successfully cleared',
          growlerOpts);
      }
      if (payload.AskQuoteId && JSON.parse(data.AskResult).result) {
        $.bootstrapGrowl(
          AlphaPoint.translation('QUOTE.CLEARED_ASK_QUOTE') || 'Ask quote successfully cleared',
          growlerOpts);
      }
      this.getOpenQuotes();
    });
  }

  handleInputChange = (e) => {
    const {name, value} = e.target;

    this.setState({[name]: value});
  }

  validateInput = (e) => {
    const test = (e.charCode >= 48 && e.charCode <= 57) || e.charCode === 46;
    if (!test) e.preventDefault();
  }


  render() {
    const pair = this.state.productPairs.find((prod) => this.state.productPair === prod.Symbol) || null;
    const Product1Symbol = pair && pair.Product1Symbol;
    const Product2Symbol = pair && pair.Product2Symbol;
    const referenceTexts = {
      inside: AlphaPoint.translation('QUOTE.OFFSET_INSIDE') || 'Offset From Inside',
      midpoint: AlphaPoint.translation('QUOTE.OFFSET_MIDPOINT') || 'Offset From Midpoint',
      price: AlphaPoint.translation('QUOTE.ACTUAL_PRICE') || 'Actual Price',
    };

    return (
      <WidgetBase
        {...this.props}
        headerTitle="Order Entry"
        style={{width: '600px'}}
      >
        <div className="rowclearfix">
          <div className="quote-entry">
            <div className="open-quotes-wrap">
              <h3>{AlphaPoint.translation('QUOTE.TITLE') || 'Open Quotes'}</h3>
              <table>
                <tbody>
                <tr>
                  <td />
                  <td>{AlphaPoint.translation('QUOTE.SIZE') || 'Size'} ({Product1Symbol})</td>
                  <td>{AlphaPoint.translation('QUOTE.PRICE') || 'Price'} ({Product2Symbol})</td>
                </tr>
                <tr>
                  <td style={{padding: '5px 15px 5px 0'}}>
                    {AlphaPoint.translation('QUOTE.BID') || 'BID'}
                  </td>
                  {this.state.currentBid &&
                  <td className="bold">
                    {this.state.currentBid.Quantity !== 0 ?
                      this.state.currentBid.Quantity.toFixed(2)
                      :
                      <button className="btn-action refresh-button" name="bid" onClick={this.refreshQuote}>
                        <svg
                          style={{pointerEvents: 'none'}}
                          fill="#000000"
                          height="20"
                          viewBox="0 0 24 24"
                          width="20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M0 0h24v24H0z" fill="none"/>
                          <path
                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        <span id="bid" style={{textShadow: 'none', paddingLeft: '0.2rem'}}>Refresh</span>
                      </button>}
                  </td>}
                  {this.state.currentBid && <td className="bold">{this.state.currentBid.Price.toFixed(2)}</td>}
                </tr>
                <tr>
                  <td style={{padding: '5px 15px 5px 0'}}>
                    ASK
                  </td>
                  {this.state.currentAsk &&
                  <td className="bold">
                    {this.state.currentAsk.Quantity !== 0 ?
                      this.state.currentAsk.Quantity.toFixed(2)
                      :
                      <button className="btn-action refresh-button" name="ask" onClick={this.refreshQuote}>
                        <svg
                          style={{pointerEvents: 'none'}}
                          fill="#000000"
                          height="20"
                          viewBox="0 0 24 24"
                          width="20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M0 0h24v24H0z" fill="none"/>
                          <path
                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                        </svg>
                        <span id="ask" style={{textShadow: 'none', paddingLeft: '0.2rem'}}>
                          Refresh
                        </span>
                      </button>}
                  </td>}
                  {this.state.currentAsk && <td className="bold">{this.state.currentAsk.Price.toFixed(2)}</td>}
                </tr>
                </tbody>
              </table>
              <div className="button-wrapper">
                <button className="btn-action clear-quotes" onClick={this.clearOpenQuotes}>
                  Clear Open Quotes
                </button>
              </div>
            </div>
            <div className="refresh-quotes-wrap">
              <h3>
                {AlphaPoint.translation('QUOTE.REFRESH_QUOTES') || 'Refresh Quotes'}
              </h3>
              <table>
                <tbody>
                <tr>
                  <td>
                    <button className="btn-action" onClick={this.prefillWithLastQuote}>
                      {AlphaPoint.translation('QUOTE.PREVIOUS') || 'Previous'}
                    </button>
                  </td>
                  <td>
                    <table>
                      <tbody>
                      <tr>
                        <td>
                          {AlphaPoint.translation('QUOTE.BID') || 'BID'}
                          </td>
                        <td className="bold text-right">
                          {(this.state.lastSentQuote &&
                          this.state.lastSentQuote.Bid &&
                          (+this.state.lastSentQuote.Bid).toFixed(2)) || 0.00}
                        </td>
                      </tr>
                      <tr>
                        <td>ASK</td>
                        <td className="bold text-right">
                          {(this.state.lastSentQuote &&
                          this.state.lastSentQuote.Ask &&
                          (+this.state.lastSentQuote.Ask).toFixed(2)) || 0.00}
                        </td>
                      </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
            <div className="quote-settings-wrap">
              <div className="quote-settings-inner-wrap">
                <h3>{AlphaPoint.translation('QUOTE.QUOTE_SIZES') || 'Quote Sizes'}</h3>
                <div className="flex-row">
                  <label htmlFor="bid">{AlphaPoint.translation('QUOTE.BID') || 'BID'} ({Product1Symbol})</label>
                  <input
                    id="bid"
                    value={this.state.BidQty}
                    name="BidQty"
                    onKeyPress={this.validateInput}
                    type="text"
                    onChange={this.handleInputChange}
                  />
                </div>
                <div className="flex-row">
                  <label htmlFor="ask">{AlphaPoint.translation('QUOTE.ASK') || 'ASK'} ({Product1Symbol})</label>
                  <input
                    id="ask"
                    value={this.state.AskQty}
                    name="AskQty"
                    onKeyPress={this.validateInput}
                    type="text"
                    onChange={this.handleInputChange}
                  />
                </div>

                <h3 style={{marginTop: '10px'}}>
                  {AlphaPoint.translation('QUOTE.QUOTE_PRICES') || 'Quote Prices'}
                </h3>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <div className="dropdown" style={{cursor: 'pointer'}}>
                    <span
                      className="dropdown-toggle"
                      style={{borderBottom: '1px solid #fff'}}
                      id="referenceDropdown"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <span style={{textTransform: 'capitalize'}}>{referenceTexts[this.state.reference]}</span>
                      <span className="caret"/>
                    </span>
                    <ul
                      className="dropdown-menu"
                      aria-labelledby="referenceDropdown"
                      style={{backgroundColor: AlphaPoint.config.siteName === 'aztec' ? '#fff' : '#212427'}}
                    >
                      <li style={{padding: '1rem'}} onClick={() => this.changeReference('inside')}>
                        {referenceTexts.inside}
                      </li>
                      <li style={{padding: '1rem'}} onClick={() => this.changeReference('midpoint')}>
                        {referenceTexts.midpoint}
                      </li>
                      <li style={{padding: '1rem'}} onClick={() => this.changeReference('price')}>
                        {referenceTexts.price}
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex-row">
                  <label htmlFor="bid2">{AlphaPoint.translation('QUOTE.BID') || 'BID'} ({Product2Symbol})</label>
                  <input
                    id="bid2"
                    value={this.state.BidDistance}
                    name="BidDistance"
                    onKeyPress={this.validateInput}
                    type="text"
                    onChange={this.handleInputChange}
                  />
                </div>
                <div className="flex-row">
                  <label htmlFor="ask2">{AlphaPoint.translation('QUOTE.ASK') || 'ASK'} ({Product2Symbol})</label>
                  <input
                    id="ask2"
                    value={this.state.AskDistance}
                    name="AskDistance"
                    onKeyPress={this.validateInput}
                    type="text"
                    onChange={this.handleInputChange}
                  />
                </div>
              </div>
              <button onClick={this.validate} className="btn-action">
                {AlphaPoint.translation('QUOTE.SEND_QUOTE') || 'Send Quote'}
              </button>
            </div>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

export default QuoteEntry;
