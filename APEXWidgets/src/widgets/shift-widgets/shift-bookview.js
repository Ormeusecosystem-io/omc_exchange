/* global $, document, SHIFTApp, APConfig */
import React from 'react';
import Rx from 'rx-lite';
import uuidV4 from 'uuid/v4';
import { formatOrders } from '../helper';
import Popup from '../popup';

// DIFFERENCE FROM DEFAULT WIDGET:
// USES AlphaPoint.config.DecimalPerInstrument
// SWITCHES ORDER OF this.Level2 AND this.Level2Updates IN componentDidMount
//   TO AVOID INITINALLY EMPTY ROWS WHEN REMOUNTING COMPONENT

class ShiftOrderBook extends React.Component {
  constructor() {
    super();

    this.state = {
      bids: [],
      asks: [],
      openOrders: [],
      spread: '',
      spreadSymbol: '',
      instrument: 1,
      currentInstrument: {},
      decimalPlaces: 2,
      quantityIncrement: 2,
      scrollTop: 260,
    };
  }

  componentDidMount() {
    this.currentInstrument = Rx.Observable.combineLatest(
      AlphaPoint.instrumentChange,
      AlphaPoint.instruments,
      (selected, instruments) => {

        if (instruments.length === 0) {
          instruments = AlphaPoint.instruments.value;
        }

        const instrument = instruments.find((inst) => inst.InstrumentId === +selected);

        return instrument;
      },
    )
      .filter(instrument => instrument)
      .subscribe((instrument) => this.setState({
        bids: [],
        asks: [],
        instrument: instrument.InstrumentId,
        currentInstrument: instrument,
        quantityIncrement: `${instrument.QuantityIncrement}`.includes('-') ? // eslint-disable-line no-nested-ternary
          `${instrument.QuantityIncrement}`.split('-')[1] // eslint-disable-line indent
          :
          `${instrument.QuantityIncrement}`.includes('.') ?
            `${instrument.QuantityIncrement}`.split('.')[1].length
            :
            0,
        spreadSymbol: instrument.Product2Symbol,
        decimalPlaces: 8, 

          // AlphaPoint.config.DecimalPerInstrument[instrument.Symbol] 
          // || AlphaPoint.products.value.find(prod => prod.ProductId === instrument.Product2).DecimalPlaces,
      }));

    this.Level2Updates = AlphaPoint.Level2Update
      .filter(orders => orders.length)
      .map(formatOrders)
      .subscribe((orders) => {
        
        let newBidsArr = [];
        let newAsksArr = [];

        const bids = orders.filter(order => order.Side === 0);
        const asks = orders.filter(order => order.Side === 1);

        if (bids.length) {
          bids.forEach((obj) => {
            const newBids = this.state.bids.filter(lev => lev.Price !== obj.Price);
            newBidsArr = obj.Quantity ? newBidsArr.concat(obj) : newBids;
              
          });
          this.setState({bids: newBidsArr});
        }
        
        if (asks.length) {
          asks.forEach((obj) => {
            const newAsks = this.state.asks.filter(lev => lev.Price !== obj.Price);
            newAsksArr = obj.Quantity ? newAsksArr.concat(obj) : newAsks;
          });
          this.setState({asks: newAsksArr});
        }
      });
      
    this.Level2 = AlphaPoint.Level2
      .filter(orders => orders.length)
      .map(formatOrders)
      .subscribe((orders) => {
        const bids = orders.filter(order => order.Side === 0).sort((a, b) => {
          if (a.Price < b.Price) return 1;
          if (a.Price > b.Price) return -1;
          return 0;
        });
        
        
        const asks = orders.filter(order => order.Side === 1).sort((a, b) => {
          if (a.Price > b.Price) return 1;
          if (a.Price < b.Price) return -1;
          return 0;
        });

        this.setState({bids, asks});
      });


    this.userOrders = AlphaPoint.openorders.subscribe(openOrders => this.setState({openOrders}));
      
    this.centerBookScroll();
  }

  componentWillUnmount() {
    this.currentInstrument.dispose();
    this.Level2.dispose();
    this.Level2Updates.dispose();
    this.userOrders.dispose();
  }

  formatQty = (qty) => {
    const sqty = String(Number(qty).toFixed(this.state.quantityIncrement));

    if (sqty.includes('.')) {
      const [integer, float] = sqty.split('.');
      const relevantFloat = float.replace(/[^1-9]+$/g, '');
      const restZeroes = float.match(/[^1-9]+$/g) ? float.match(/[^1-9]+$/g)[0] : '';
      const integerStyle = integer > 0 ? {color: 'inherit', fontWeight: 'bold'} : {color: '#9ca0b9'};

      return (
        <span><span style={integerStyle}>{integer}</span><span style={{fontWeight: 'bold'}}>.{relevantFloat}</span><span
          style={{color: '#888'}}>{restZeroes}</span></span>);
    }

    return sqty;
  };

  selectPrice = (row) => AlphaPoint.orderPrefillPrice.onNext(row);

  selectQuantity = (row) => AlphaPoint.orderPrefillQuantity.onNext(row);

  confirmCancel = orderId => this.popup.create({
    message: `Are you sure you want to cancel order ${orderId}?`,
    actions: [
      {
        text: 'Yes',
        className: 'btn btn-action',
        onClick: () => {
          AlphaPoint.cancelOrder({
            OMSId: AlphaPoint.oms.value,
            OrderId: orderId,
            AccountId: AlphaPoint.selectedAccount.value,
          });
          this.popup.close();
        },
      },
      {
        text: 'No',
        className: 'btn btn-action',
        onClick: () => this.popup.close(),
      },
    ],
  });

  cancelOrder = orderId => AlphaPoint.cancelOrder({
    OMSId: AlphaPoint.oms.value,
    OrderId: orderId,
    AccountId: AlphaPoint.selectedAccount.value,
  });

  cancelAllOrders = () => {
    if (this.state.openOrders.length) {
      const cancelledSuccessfullyTxt = AlphaPoint.translation('OPEN_ORDERS.CANCEL_SUCCESS') || 'All orders canceled successfully';
      const wantToCancelTxt =  AlphaPoint.translation('OPEN_ORDERS.CANCEL_ALL') || 'Are you sure you want to cancel all orders?';

      if (AlphaPoint.config.confirmOrderCancellation) {
        return this.popup.create({
          message: wantToCancelTxt,
          actions: [
            {
              text: 'Yes',
              className: 'btn btn-action',
              onClick: () => {
                AlphaPoint.cancelAllOrders({
                  OMSId: AlphaPoint.oms.value,
                  AccountId: AlphaPoint.selectedAccount.value,
                  InstrumentId: this.state.instrument,
                }, (res) => {
                  if (res.result) {
                    $.bootstrapGrowl(
                      cancelledSuccessfullyTxt,
                      {
                        ...AlphaPoint.config.growlerDefaultOptions,
                        type: 'danger'
                      },
                    );
                  }
                });
                this.popup.close();
              },
            },
            {
              text: 'No',
              className: 'btn btn-action',
              onClick: () => this.popup.close(),
            },
          ],
        });
      }

      return AlphaPoint.cancelAllOrders({
        OMSId: AlphaPoint.oms.value,
        AccountId: AlphaPoint.selectedAccount.value,
        InstrumentId: this.state.instrument,
      }, (res) => {
        if (res.result) {
          $.bootstrapGrowl(
            cancelledSuccessfullyTxt,
            {
              ...AlphaPoint.config.growlerDefaultOptions,
              type: 'danger'
            });
        }
      });
    }
    return false;
  };

  drawUserOrders = (row) => {
    const userOrders = this.state.openOrders.filter((order) => order.Price === row.Price);
    const totalMyOrdsQty = userOrders.reduce((amount, order) => {
      const currentAmount = amount + order.Quantity;

      return currentAmount;
    }, 0);
    const ordersList = [];

    userOrders.forEach((order) => {
      if (order.Quantity > 0) {
        if (order.OrderType === 'Limit') {
          ordersList.push((
            <div className={`CellMyOrders ${order.Side}`}>
              <span className={`open-order-highlight ${order.Side}`}>
                L: {totalMyOrdsQty.toFixed(this.state.quantityIncrement)}
              </span>
              <i
                onClick={() => {
                  if (AlphaPoint.config.confirmOrderCancellation) return this.confirmCancel(order.OrderId);
                  return this.cancelOrder(order.OrderId);
                }}
                className="material-icons"
              >highlight_off</i>
            </div>
          ));
        } else {
          ordersList.push((
            <div className={`CellMyOrders ${order.Side}`}>
              <span className={`open-order-highlight ${order.Side}`}>
                S: {totalMyOrdsQty.toFixed(this.state.quantityIncrement)}
              </span>
              <i
                onClick={() => {
                  if (AlphaPoint.config.confirmOrderCancellation) return this.confirmCancel(order.OrderId);
                  return this.cancelOrder(order.OrderId);
                }}
                className="material-icons"
              >highlight_off</i>
            </div>
          ));
        }
      }
    });

    if (totalMyOrdsQty > 0) return ordersList[ordersList.length - 1];

    return (<div className="CellMyOrders">-</div>);
  };

  centerBookScroll = () => {
    const bookHolder = document.getElementById('bookHolder');
    const bookDiv = document.getElementById('book');

    bookHolder.scrollTop = (bookDiv.clientHeight - bookHolder.clientHeight) / 2;
  };

  cancelSide = side => {
    const orders = this.state.openOrders.filter(order => order.Side === side).map(order => order.OrderId);
    const cancelSideOrdersTxt =  AlphaPoint.translation('OPEN_ORDERS.CANCEL_ALL_SIDE', {side}) || `Are you sure you want to cancel all ${side} side orders?`;

    if (orders.length) {
      if (AlphaPoint.config.confirmOrderCancellation) {
        return this.popup.create({
          message: cancelSideOrdersTxt,
          actions: [
            {
              text: 'Yes',
              className: 'btn btn-action',
              onClick: () => {
                orders.forEach(this.cancelOrder);
                this.popup.close();
              },
            },
            {
              text: 'No',
              className: 'btn btn-action',
              onClick: () => this.popup.close(),
            },
          ],
        });
      }

      return orders.forEach(this.cancelOrder);
    }
    return false;
  };

  render() {
    const {currentInstrument} = this.state;
    const rowCount = APConfig.orderBookSideRowCount;
    const rowHeight = 16;
    const rowStyle = {height: rowHeight};
    const sortedAsks = this.state.asks.sort((a, b) => {
      if (+a.Price < +b.Price) return -1;
      if (+a.Price > +b.Price) return 1;
      return 0;
    });
    const sortedBids = this.state.bids.sort((a, b) => {
      if (+a.Price > +b.Price) return -1;
      if (+a.Price < +b.Price) return 1;
      return 0;
    });
    const spread = (sortedAsks[0] && sortedAsks[0].Price) - (sortedBids[0] && sortedBids[0].Price);

    const askRows = sortedAsks
      .slice(0, rowCount)
      .reverse()

      .map((level, idx) => (
        <span key={idx} className="bookrow" style={rowStyle}>
          <div className="CellAskPrice CellPrice" onClick={() => this.selectPrice({ price: level.Price, side: 0, orderType: 2 })}>
            {level.Price.toFixed(this.state.decimalPlaces)}
          </div>
          <div className="CellPublicOrders"
               onClick={() => this.selectQuantity({quantity: level.Quantity, side: 0, orderType: 1})}>
            {this.formatQty(level.Quantity)}
          </div>
          {this.drawUserOrders(level)}
        </span>
      ));

    const bidRows = sortedBids
      .slice(0, rowCount)
      .map((level, idx) => (
        <span key={idx} className="bookrow" style={rowStyle}>
          <div className="CellBidPrice CellPrice" onClick={() => this.selectPrice({ price: level.Price, side: 1, orderType: 2 })}>
            {level.Price.toFixed(this.state.decimalPlaces)}
          </div>
          <div className="CellPublicOrders"
               onClick={() => this.selectQuantity({quantity: level.Quantity, side: 1, orderType: 1})}>
            {this.formatQty(level.Quantity)}
          </div>
          {this.drawUserOrders(level)}
        </span>
      ));

    const emptyAskRows = [];
    for (let i = 0; i < rowCount - askRows.length; i++) {
      const emptyRow = (<div key={uuidV4()} className="emptyBookRow" style={rowStyle}>
        <div>-</div>
        <div>-</div>
        <div>-</div>
      </div>);
      emptyAskRows.push(emptyRow);
    }

    const emptyBidRows = [];
    for (let i = 0; i < rowCount - bidRows.length; i++) {
      const emptyRow = (<div key={uuidV4()} className="emptyBookRow" style={rowStyle}>
        <div>-</div>
        <div>-</div>
        <div>-</div>
      </div>);
      emptyBidRows.push(emptyRow);
    }

    return (
      <div className='order-book'>
        <div id="orderBookActions" className="buttons-holder">
          <span id="cancelAsks" onClick={() => this.cancelSide('Sell')}>
            <i className='material-icons'>cancel</i>
            {AlphaPoint.translation('BUTTONS.TEXT_CANCEL') || 'Cancel'}&nbsp;
            {AlphaPoint.translation('BUTTONS.TEXT_SELLS') || 'Sells'}
          </span>
          <span id="cancelBids" onClick={() => this.cancelSide('Buy')}>
            <i className='material-icons'>cancel</i>
            {AlphaPoint.translation('BUTTONS.TEXT_CANCEL') || 'Cancel'}&nbsp;
            {AlphaPoint.translation('BUTTONS.TEXT_BUYS') || 'Buys'}
          </span>
          <span onClick={this.cancelAllOrders}>
            <i className='material-icons'>cancel</i>
            {AlphaPoint.translation('BUTTONS.TEXT_CANCEL') || 'Cancel'}&nbsp;
            {AlphaPoint.translation('BUTTONS.TEXT_ALL') || 'All'}
          </span>
        </div>
        <div className="buttons-holder">
          <span id="centerBook" onClick={this.centerBookScroll}>
            <i className='material-icons' aria-hidden="true">vertical_align_center</i>
            {AlphaPoint.translation('BUTTONS.TEXT_CENTER') || 'Center'}
          </span>
        </div>
        <div className="book-table-header">
          <div id="priceBookHeader">
            {`${AlphaPoint.translation('OPEN_ORDERS.PRICE_TEXT') || 'Price'} (${currentInstrument.Product2Symbol || 'USD'})`}
          </div>
          <div id="quantityBookHeader">
            {`${AlphaPoint.translation('OPEN_ORDERS.QUANTITY_TEXT') || 'Quantity'} (${currentInstrument.Product1Symbol || 'BTC'})`}
          </div>
          <div id="openOrderHeader">
            {AlphaPoint.translation('OPEN_ORDERS.TITLE_TEXT') || 'Open Orders'}
          </div>
        </div>
        <div id="bookHolder">
          <div id="book" className="noselect">
            <div id="bookTable" className="booktable">
              <div id="askRows">
                {emptyAskRows}
                {askRows}
              </div>
              <div id="bookSpread">
                {this.state.spreadSymbol === 'USD' && '$'}{(spread > 0 ? spread : 0).toFixed(this.state.decimalPlaces)} {this.state.spreadSymbol}&nbsp;
                {AlphaPoint.translation('OPEN_ORDERS.SPREAD') || 'spread'}
              </div>
              <div id="bidRows">
                {bidRows}
                {emptyBidRows}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ShiftOrderBook;