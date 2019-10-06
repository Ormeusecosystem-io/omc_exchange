/* global AlphaPoint */
import React from 'react';
import ReactTooltip from 'react-tooltip';
import WidgetBase from './base';
import ApInputLabeled from '../misc/form/apInputLabeled';

import {
  ordersWidgetDidMount,
  ordersWidgetWillUnmount,
  getOrderFee,
} from '../misc/ordersWidgetsHelper';
import {
  formatNumberToLocale,
  truncateToDecimals,
  getQuantityForFixedPrice,
  getPriceForFixedQuantity,
  formatOrders,
  parseNumberToLocale,
  getDecimalPrecision,
} from './helper';

class SellNarrow extends React.Component {
  constructor(props) {
    super(props);

    this.ordersWidgetDidMount = ordersWidgetDidMount.bind(this);
    this.ordersWidgetWillUnmount = ordersWidgetWillUnmount.bind(this);
    this.getOrderFee = getOrderFee;

    this.state = {
      buy: false,
      decimalPlaces: {},
      productPairs: [],
      pair: {},
      total: 0,
      fee: 0,
      feeProduct: '',
      productPair: '',

      amount: 0,
      amountString: '0',
      price: 0,
      priceString: '0',
      StopPrice: 0,
      LimitPrice: 0,

      successMsg: '',
      errorMsgs: {
        amount: '',
        price: '',
        balance: '',
        total: ''
      },

      AccountId: null,
      balances: [],
      orderTypes:[
        { name: 'Market Order', value: 1 },
        { name: 'Limit Order', value: 2 },
        { name: 'Stop Market', value: 3 },
      ],
      OrderType: 2,
      InstrumentId: 0,
      bookBuys: [],

      verificationLevel: 0,
    };
  };

  componentDidMount() {
    this.ordersWidgetDidMount(true, false, false);
    this.selectedAccount = AlphaPoint.selectedAccount.subscribe((AccountId) => this.setState({ AccountId }));
    this.accountInfo = AlphaPoint.accountInfo.subscribe(data => {
      if (data.VerificationLevel) {
        this.setState({ verificationLevel: data.VerificationLevel });
        this.getOrderFee();
      }
    });

    this.orderFee = AlphaPoint.orderfee
      .filter(feeData => feeData.ProductId === this.state.pair.Product2)
      .subscribe(res => this.setState({
        fee: res.OrderFee || 0,
        feeProduct: this.state.products
          && this.state.products[res.ProductId]
          && this.state.products[res.ProductId].Product
      }));

    this.Level2 = AlphaPoint.Level2
      .filter(orders => orders.length)
      .map(formatOrders)
      .subscribe(orders => {
        const bookBuys = orders.filter(order => order.Side === 0).sort((a, b) => {
          if (a.Price < b.Price) return 1;
          if (a.Price > b.Price) return -1;
          return 0;
        });

        this.setState({ bookBuys });
      });

    this.Level2Updates = AlphaPoint.Level2Update
      .filter(orders => orders.length)
      .map(formatOrders)
      .subscribe((orders) => {
        const bookBuys = orders.filter(order => order.Side === 0);

        if (bookBuys.length) {
          bookBuys.forEach((obj) => {
            const newBuys = this.state.bookBuys.filter(lev => lev.Price !== obj.Price);

            this.setState({ bookBuys: obj.Quantity ? newBuys.concat(obj) : newBuys });
          });
        }
      });

      this.orderPrefillQuantity = AlphaPoint.orderPrefillQuantity.subscribe(selected => {
        const product2DecimalPlaces = this.state.pair.length ? this.state.decimalPlaces[this.state.pair.Product2Symbol] : 2;
        const product1DecimalPlaces = this.state.pair.length ? this.state.decimalPlaces[this.state.pair.Product1Symbol] : 8;

        if (selected.side === 1) {
          this.props.changeOrderType(selected.orderType);

          let amount = (selected.quantity || 1);
          let amountString = truncateToDecimals(amount, product1DecimalPlaces).toString();


          let { Price: total, LimitPrice: price } = getPriceForFixedQuantity(amount, 0, this.state.bookBuys, true, product2DecimalPlaces);
          let priceString = truncateToDecimals(price || 0, product2DecimalPlaces).toString()

          if (isNaN(price)) {
            return this.setState(prevState => ({
              amount,
              amountString,
              price: 0,
              priceString,
              total: 0,
              errorMsgs: {
                amount: '',
                price: AlphaPoint.translation('SELL_NARROW.ERROR_MSG_PREFILL_QUANTITY') || 'No Price for this quantity.',
                balance: ''
              }
            }));
          }

          this.setState(prevState => ({
            amount,
            amountString,
            price,
            priceString,
            total: truncateToDecimals(price * amount, product2DecimalPlaces),
            errorMsgs: {
              amount: '',
              price: '',
              balance: ''
            }
          }));
        }
      });

      this.orderPrefillPrice = AlphaPoint.orderPrefillPrice.subscribe(selected => {
        let price = selected.price;
        let priceString  = (price || 0).toString();

        if (selected.side === 1) {
          this.props.changeOrderType(selected.orderType);

          this.setState(prevState => ({
            price,
            priceString,
            LimitPrice: price,
            total: price * this.state.amount,
            errorMsgs: {
              price: '',
              amount: '',
              balance: ''
            }
          }));
        }

      });

  }

  componentWillReceiveProps = nextProps => {
    if (nextProps.resetForm) {
      this.setState({
        OrderType: nextProps.OrderType,
        amount: 0,
        amountString: '0',
        price: 0,
        priceString: '0',
        LimitPrice: 0,
        StopPrice: 0,
        total: 0
      });
      return this.props.handleResetForm();
    }
    this.setState({ OrderType: nextProps.OrderType });
  }

  componentWillUnmount() {
    ordersWidgetWillUnmount.bind(this)();
    this.selectedAccount.dispose();
    this.accountInfo.dispose();
    this.orderPrefillPrice.dispose();
    this.orderPrefillQuantity.dispose();
  }

  changeAmount = (product1Symbol, product2Symbol, e) => {
    // clear error message
    this.setState(prevState => ({
      errorMsgs: {
          ...prevState.errorMsgs,
          amount: '',
          balance: '',
          total: ''
      }
    }));

    const amountString = e.target.value;
    const amount = parseNumberToLocale(amountString);
    const decimals = getDecimalPrecision(amount);
    const decimalsAllowed = this.state.decimalPlaces[product1Symbol];
    const msgInvalid = AlphaPoint.translation('SELL_NARROW.INVALID_AMOUNT') || 'Please enter a valid amount';
    const msgDecimals = `${AlphaPoint.translation('SELL_NARROW.MAX_DECIMAL') || 'Max decimal places allowed is'} ${decimalsAllowed}`;
    let total = amount * this.state.price;

    if (decimals > decimalsAllowed) {
      return this.setState(prevState => ({
        errorMsgs: {
          ...prevState.errorMsgs,
          amount: msgDecimals
        },
        amount,
        amountString
      }));
    } else if (isNaN(amount)) {
      return this.setState(prevState => ({
        errorMsgs: {
            ...prevState.errorMsgs,
            amount: msgInvalid
        },
        amount,
        amountString
      }));
    } else if (amount <= 0) {
      return this.setState(prevState => ({
        errorMsgs: {
            ...prevState.errorMsgs,
            amount: msgInvalid
        },
        amount,
        amountString
      }));
    }

    if (this.state.OrderType === 1 || this.state.OrderType === 3) {
      let {Price: total, LimitPrice: price }  = getPriceForFixedQuantity(amount, 0, this.state.bookBuys, true, decimals);

      if (isNaN(price)) {
        return this.setState(prevState => ({
          amount,
          amountString,
          price: 0,
          priceString: '0',
          total: 0,
          errorMsgs: {
            ...prevState.errorMsgs,
            price: AlphaPoint.translation('SELL_NARROW.ERROR_MSG_INPUT_QUANTITY') || 'Try entering a different quantity'
          }
        }));
      }

      this.setState({
        amount,
        amountString,
        price,
        priceString: price,
        total,
        totalString: total.toFixed(this.state.decimalPlaces[product2Symbol]),
      }, this.getOrderFee);
    } else {
      this.setState({
        amount,
        amountString,
        total,
        totalString: total.toFixed(this.state.decimalPlaces[product2Symbol]),
      }, this.getOrderFee);
    }
  }

  changePrice = (product2Symbol, e) => {
    // clear error message
    this.setState(prevState => ({
      errorMsgs: {
          ...prevState.errorMsgs,
          price: '',
          balance: '',
          total: ''
      }
    }));

    const priceString = e.target.value;
    const price = parseNumberToLocale(priceString);
    const decimals = getDecimalPrecision(price);
    const decimalsAllowed = this.state.decimalPlaces[product2Symbol];
    const msgInvalid = AlphaPoint.translation('SELL_NARROW.INVALID_PRICE') || 'Please enter a valid price';
    const msgDecimals = `${AlphaPoint.translation('SELL_NARROW.MAX_DECIMAL') || 'Max decimal places allowed is'} ${decimalsAllowed}`;

    let total = price * this.state.amount;

    if (decimals > decimalsAllowed) {
      return this.setState(prevState => ({
        errorMsgs: {
            ...prevState.errorMsgs,
            price: msgDecimals
        },
        priceString,
        price
      }));
    } else if (isNaN(price)) {
      return this.setState(prevState => ({
        errorMsgs: {
            ...prevState.errorMsgs,
            price: msgInvalid
        },
        priceString,
        price
      }));
    } else if (price <= 0) {
      return this.setState(prevState => ({
        errorMsgs: {
            ...prevState.errorMsgs,
            price: msgInvalid
        },
        priceString,
        price
      }));
    }

    this.setState({
      priceString,
      price,
      LimitPrice: price,
      total,
      totalString: total.toFixed(decimalsAllowed),
    }, this.getOrderFee);
  }

  order = e => {
    const pair = this.state.pair;
    const product1 = this.state.balances.find((prod) => pair.Product1Symbol === prod.ProductSymbol) || {};
    const balance = (product1.Amount - product1.Hold) || 0;
    let total = this.state.amount;

    // Turn off balance check for demo
    if (total > balance) {
      return this.setState(prevState => ({
        errorMsgs: {
          ...prevState.errorMsgs,
          balance: AlphaPoint.translation('SELL_NARROW.ERROR_MSG_INSUFFICIENT_FUNDS') || 'Insufficient Funds'
        }
      }));
    } else if ((this.state.total - this.state.fee) <= 0) {
      return this.setState(prevState => ({
        errorMsgs: {
          ...prevState.errorMsgs,
          total: AlphaPoint.translation('SELL_NARROW.INVALID_NET_TOTAL') || 'Invalid Net Total'
        }
      }));
    }

    const LimitPrice = this.state.LimitPrice;
    const StopPrice = this.state.StopPrice

    let payload;
    let commonPayload = {
      AccountId: this.state.AccountId,
      ClientOrderId: 0,
      Side: 1,
      Quantity: this.state.amount,
      OrderIdOCO: 0,
      OrderType: this.state.OrderType,
      InstrumentId: pair.InstrumentId,
      TimeInForce: 0,
      OMSId: AlphaPoint.oms.value,
      UseDisplayQuantity: false,
    };

    switch (this.state.OrderType) {
      case 2: {
        payload = {
          ...commonPayload,
          LimitPrice,
        };
        break;
      }
      case 3: {
        payload = {
          ...commonPayload,
          StopPrice,
          PegPriceType: 2,
        };
        break;
      }
      case 1:
      default: {
        payload = commonPayload;
        break;
      }
    }

    AlphaPoint.sendOrder(payload)
  }

  render() {
    const { fee, feeProduct, total } = this.state;
    const verificationRequiredLevel = AlphaPoint.config.verificationRequiredLevel || [0];
    const pair = this.state.pair;
    const Product1Symbol = pair ? pair.Product1Symbol : '';
    const Product2Symbol = pair ? pair.Product2Symbol : '';
    const net = Product2Symbol === feeProduct ? Math.max(0, total - fee) : total;


    return (
      <WidgetBase modalId='advancedOrdersModal' {...this.props} login error={this.state.errorMsg} success={this.state.successMsg} headerTitle={'Sell '+' ('+ (Product1Symbol) +') '} style={{width:'600px'}}>

        <div className='clearfix pad-y sell-narrow' style={{minHeight: '414px'}}>

          <div style={{ position: 'relative', height: '66px' }}>
            {pair &&
              <ApInputLabeled
                value={this.state.amountString}
                label={(AlphaPoint.translation('SELL_NARROW.AMOUNT') || `Sell Amount (${Product1Symbol})`)}
                placeholder='0'
                type='text'
                name='amount'
                onChange={this.changeAmount.bind(this, Product1Symbol, Product2Symbol)}
                wrapperClass='col-xs-12'
                className={this.state.errorMsgs.amount || this.state.errorMsgs.balance ? 'narrow-input-error' : ''}
              />
            }
            {this.state.errorMsgs.amount && <span className='narrow-error'>{this.state.errorMsgs.amount}</span>}
          </div>

          <div style={{ position: 'relative', height: '66px' }}>
            {pair &&
              <ApInputLabeled
                readOnly={this.state.OrderType === 1}
                value={this.state.priceString}
                label={(AlphaPoint.translation('SELL_NARROW.PRICE') || `${this.state.OrderType === 1 ? 'Market Price (' + Product2Symbol + ')' : ''} ${this.state.OrderType === 2 ? 'Limit Price (' + Product2Symbol + ')' : ''} ${this.state.OrderType === 3 ? 'Stop Price (' + Product2Symbol + ')' : ''}`)}
                placeholder='0'
                type='text'
                name='price'
                onChange={this.changePrice.bind(this, Product2Symbol)}
                wrapperClass='col-xs-12 '
                className={this.state.errorMsgs.price ? 'narrow-input-error' : ''}
                />
            }
            {this.state.errorMsgs.price && <span className='narrow-error'>{this.state.errorMsgs.price}</span>}
          </div>
          <div>
            <ApInputLabeled
              readOnly
              value={this.state.fee}
              label={AlphaPoint.translation('SELL_NARROW.FEE') ||  `Fee (${feeProduct || ''})`}
              placeholder='0'
              name='fee'
              type='text'
              wrapperClass='col-xs-6 fee '
            />
          </div>
          <div>
            <ApInputLabeled
              readOnly
              value={this.state.totalString}
              label={AlphaPoint.translation('SELL_NARROW.TOTAL')|| 'Total ' + '(' + (Product2Symbol) + ')'}
              placeholder='0'
              name='total'
              type='text'
              wrapperClass='col-xs-6 '
            />
          </div>
          <div>
            <ApInputLabeled
              readOnly
              value={truncateToDecimals(net, this.state.decimalPlaces[Product2Symbol])} // net amount received (after fee)
              label={AlphaPoint.translation('SELL_NARROW.NET_TOTAL') || `Net ${pair.Product2Symbol || ''} Received`}
              placeholder='0'
              name='net'
              type='text'
              wrapperClass='col-xs-12 '
              className={this.state.errorMsgs.total ? 'narrow-input-error' : ''}
            />
          </div>
            <div className='form-group col-xs-12 button-wrap'>
              <span
                style={{display: 'block' }}
                data-tip={AlphaPoint.translation('VERIFY.TOOLTIP') || 'Complete account verification to use this feature.'}
                data-tip-disable={!verificationRequiredLevel.includes(this.state.verificationLevel)}
                data-for='verificationRequiredTip'
              >
                <button
                  className={this.state.errorMsgs.balance || this.state.errorMsgs.total ? 'btn btn-action funds-error' : 'btn btn-action'}
                  onClick={this.order}
                  disabled={this.state.errorMsgs.price || this.state.errorMsgs.amount || this.state.errorMsgs.balance || this.state.errorMsgs.total || verificationRequiredLevel.includes(this.state.verificationLevel)}
                >{this.state.errorMsgs.balance || this.state.errorMsgs.total ? this.state.errorMsgs.balance || this.state.errorMsgs.total : AlphaPoint.translation('SELL_NARROW.PLACE_ORDER') || 'Place Sell Order'}</button>
              </span>
            <ReactTooltip id='verificationRequiredTip' place='top' type='info' effect='solid' />
            </div>
        </div>


      </WidgetBase>
    );
  }
};

SellNarrow.defaultProps = {
    hideCloseLink: true,
    changeOrderType: (OrderType) => this.setState({ OrderType }),
};

SellNarrow.propTypes = {
  hideCloseLink: React.PropTypes.bool,
  changeOrderType: React.PropTypes.func
};

export default SellNarrow;
