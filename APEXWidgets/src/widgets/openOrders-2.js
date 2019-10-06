/* global AlphaPoint */
import React from 'react';
import uuidV4 from 'uuid/v4';
import ReactTooltip from 'react-tooltip';
import { getTimeFormatEpoch } from '../common';
import { formatNumberToLocale } from './helper';

import Popup from './popup';
import WidgetBase from './base';

class OpenOrders2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      data: [],
      pairs: [],
      accounts: [],
      showLogin: false,
      currentOrder: null,
      decimalPlaces: {},
      windowWidth: window.innerWidth,
      showExpanded: null
    };
  }

  handleResize() {
    this.setState({windowWidth: window.innerWidth})
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize.bind(this));
    this.OpenOrders = AlphaPoint.openorders.subscribe((data) => {
      this.setState({
        data: data.sort((a, b) => {
          if (a.ReceiveTime < b.ReceiveTime) return 1;
          if (a.ReceiveTime > b.ReceiveTime) return -1;
          return 0;
        }),
      });
    });
    this.pairs = AlphaPoint.instruments.subscribe((pairs) => this.setState({ pairs }));
    this.userAccounts = AlphaPoint.userAccountsInfo.subscribe((accounts) => this.setState({ accounts }));

    this.products = AlphaPoint.products.filter(data => data.length).subscribe(products => {
      const decimalPlaces = {};
      products.forEach(product => {
        decimalPlaces[product.Product] = product.DecimalPlaces;
      });
      this.setState({ decimalPlaces });
    });
  }

  componentWillUnmount() {
    this.OpenOrders.dispose();
    this.pairs.dispose();
  }

  gotoPage = (page) => this.setState({ page });

  loginToggle = () => this.setState({ showLogin: !this.state.showLogin });

  sort = (a, b) => {
    if (a.OrderId < b.OrderId) { return 1; }
    if (a.OrderId > b.OrderId) { return -1; }
    return 0;
  };

  mapOrderTypeToPriceDisplay = (order, product2Symbol) => {
    const priceDisplay = {
      StopMarket: formatNumberToLocale(order.Price, this.state.decimalPlaces[product2Symbol]),
      TrailingStopLimit: 'TRL',
      TrailingStopMarket: 'TRL',
      Limit: formatNumberToLocale(order.Price, this.state.decimalPlaces[product2Symbol]),
      StopLimit: formatNumberToLocale(order.Price, this.state.decimalPlaces[product2Symbol]),
      Market: 'MKT'
    };

    return priceDisplay[order.OrderType];
  }

  confirmCancel = order => {
    this.popup.create({
      message: `Are you sure you want to cancel order ${order.OrderId}?`,
      actions: [
        {
          text: 'Yes',
          className: 'btn btn-action',
          onClick: () => {
            AlphaPoint.cancelOrder({
              OMSId: AlphaPoint.oms.value,
              OrderId: order.OrderId,
              AccountId: order.Account,
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

  cancel = order => AlphaPoint.cancelOrder({
    OMSId: AlphaPoint.oms.value,
    OrderId: order.OrderId,
    AccountId: order.Account,
  });

  toggleExpandedRow(orderId){
    if(this.state.windowWidth > 768){ return };
    this.setState({...this.state, showExpanded: orderId})
  }

  render() {
    const pagination = AlphaPoint.config.pagination;
    const maxLines = AlphaPoint.config.maxLinesWidgets || 15;
    const totalPages = pagination ? Math.ceil(this.state.data.length / maxLines) : 0;
    const rowsSlice = pagination ?
      this.state.data.slice(maxLines * this.state.page, maxLines * (this.state.page + 1))
      :
      this.state.data;
    const rows = rowsSlice
      .sort(this.sort)
      .map((order) => {
        const pairName = this.state.pairs.find((inst) => inst.InstrumentId === order.Instrument);
        const accountInfo = this.state.accounts.find((account) => account.AccountId === order.Account);

        return (
          <tbody key={uuidV4()}>
            <tr onClick={() => this.toggleExpandedRow(order.OrderId)}>
              <td className="borderless">{pairName.Symbol}</td>
              <td className={`borderless ${order.Side === 'Buy' ? 'buyFont' : 'sellFont'}`}>
                {order.Side === 'Buy' ?
                  AlphaPoint.translation('OPEN_ORDERS.BUY') || 'Buy'
                  :
                  AlphaPoint.translation('OPEN_ORDERS.SELL') || 'Sell'}
              </td>
              {!AlphaPoint.config.hideInBuyCustomWidget && <td className="borderless">{order.IsQuote ? 'Quote' : order.OrderType}</td>}
              <td className="borderless txt-right">≈{formatNumberToLocale(order.Quantity, this.state.decimalPlaces[pairName.Product1Symbol])}</td>
              {this.state.windowWidth > 768 && <td className="borderless txt-right">{this.mapOrderTypeToPriceDisplay(order, pairName.Product2Symbol)}</td>}
              {this.state.windowWidth > 768 && <td className="borderless">0.00</td>}
              <td className="borderless">{getTimeFormatEpoch(order.ReceiveTime)}</td>
              {!AlphaPoint.config.hideInBuyCustomWidget && this.state.windowWidth > 768 && <td className="borderless">{order.OrderState === 'Working' ? 'Open' : order.OrderState}</td>}
              {
                this.state.windowWidth > 768 &&
                <td className="borderless">
                <div
                  className="ordersActions"
                  onClick={() => {
                    if (AlphaPoint.config.confirmOrderCancellation) return this.confirmCancel(order);
                    return this.cancel(order);
                  }}
                >
                  <span>Cancel</span>
                </div>
              </td>
              }
            </tr>
            {
              this.state.windowWidth <= 768 && this.state.showExpanded === order.OrderId &&
              <tr>
                <td colSpan="5" className="expanded-data">
                  <ul>
                    <li>
                      <div>Price</div>
                      <div>{this.mapOrderTypeToPriceDisplay(order, pairName.Product2Symbol)}</div>
                    </li>
                    <li>
                      <div>Fee</div>
                      <div>0.00</div>
                    </li>
                    <li>
                      <div>Status</div>
                      <div>{order.OrderState === 'Working' ? 'Open' : order.OrderState}</div>
                    </li>
                    <li>
                      <div>Actions</div>
                      <div 
                        onClick={() => {
                            if (AlphaPoint.config.confirmOrderCancellation) return this.confirmCancel(order);
                            return this.cancel(order);
                          }}>
                          Cancel
                      </div>
                    </li>
                    <li onClick={() => this.toggleExpandedRow(null)}><img src="img/drop-copy.svg"/></li>
                  </ul>
                </td>
              </tr>
            }
          </tbody>
        );
      });

    const noActivity = (
      <tbody>
        <tr>
          <td colSpan="10" style={{border: "none"}}>
            <div id="no-activity">
              <img src="img/no-activity.svg"/>
              <p>You have no activity history.</p>
            </div>
          </td>
        </tr>
      </tbody>
    )
    const pages = [];
    if (pagination) {
      const start = (this.state.page - 2) > 0 ? this.state.page - 2 : 0;
      const end = (this.state.page + 3) <= totalPages ? this.state.page + 3 : totalPages;

      for (let x = start; x < end; x++) {
        const numButton = (
          <li key={x} className={this.state.page === x ? 'active' : null}>
            <a onClick={() => this.gotoPage(x)}>{x + 1}</a>
          </li>
        );
        pages.push(numButton);
      }
    }

    const tableClassList = AlphaPoint.config.siteName === 'aztec' ?
      'table table--comfy table--hover table--striped table--light'
      :
      'table table-hover minFont';

    return (
      <div id="right">

        <WidgetBase login {...this.props} headerTitle={AlphaPoint.translation('OPEN_ORDERS.TITLE_TEXT') || 'Open Orders'}>
          <div>
            {this.props.isOrderSection && <h1 className="orders-title">Open orders</h1>}
            {this.state.windowWidth  <= 768 && this.props.isOrderSection && <h2 className="orders-subtitle">Click on any order to view full details.</h2>}
            <table className={tableClassList} id="OrdersTable" cellPadding="0" cellSpacing="0">
              <thead>
                <tr>

                  <th className="header">Pair</th>
                  <th className="header">Side</th>
                  {!AlphaPoint.config.hideInBuyCustomWidget && <th className="header">Type</th>}
                  <th className="header">Size</th>
                  {this.state.windowWidth > 768 && <th className="header">Price</th>}
                  {this.state.windowWidth > 768 && <th className="header">Fee</th>}
                  <th className="header">Time</th>
                  {!AlphaPoint.config.hideInBuyCustomWidget && this.state.windowWidth > 768 && <th className="header">Status</th>}
                  {this.state.windowWidth > 768 && <th className="header">Actions</th>}
                </tr>
              </thead>
              {rows.length > 0 ? rows : noActivity}
              {pagination && pages.length > 1 &&
              <tbody>
                <tr className="clearfix pad-x">
                  <td colSpan="10" style={{border: "none"}}>
                    <ul className="pagi pull-right">
                      <li><a onClick={() => this.gotoPage(0)}>&laquo;</a></li>
                      {pages}
                      <li onClick={() => this.gotoPage(totalPages - 1)} ><a>&raquo;</a></li>
                    </ul>
                  </td>
                </tr>
              </tbody>}
            </table>

            {this.state.currentOrder &&
              <ReactTooltip id={`orderInfo-${this.state.currentOrder.OrderId}`} class="order-tooltip" delayShow={500}>
                <div>
                  <h4>Additional Order Information</h4>
                  <table>
                    <tbody>
                      <tr>
                        <td>Order Id</td>
                        <td>{this.state.currentOrder.OrderId}</td>
                      </tr>
                      <tr>
                        <td>Original Quantity</td>
                        <td>{this.state.currentOrder.OrigQuantity}</td>
                      </tr>
                      <tr>
                        <td>Display Quantity</td>
                        <td>{this.state.currentOrder.DisplayQuantity}</td>
                      </tr>
                      <tr>
                        <td>Quantity Executed</td>
                        <td>{this.state.currentOrder.QuantityExecuted}</td>
                      </tr>
                      <tr>
                        <td>Remaining Quantity</td>
                        <td>{this.state.currentOrder.Quantity}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </ReactTooltip>}

            
          </div>

          {AlphaPoint.config.confirmOrderCancellation && <Popup ref={popup => { this.popup = popup; }} />}
        </WidgetBase>
      </div>
    );
  }
}

OpenOrders2.defaultProps = {
  hideCloseLink: true,
};

export default OpenOrders2;
