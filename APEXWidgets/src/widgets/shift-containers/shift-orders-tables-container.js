/**
 * Config variables
 * @param showBlockTradeUI {Boolean} - Show/hide Trade Reports section
 * 
 */
import React, { Component } from 'react';

// AlphaPoint Components
import OpenOrders2 from '../openOrders-2';
import OrderHistoryCancelled from '../order-history-cancelled';
import TradeReports from '../trade-reports';
import Trades from '../trades';
import WithdrawStatus from '../withdrawStatus';

// Shift Components
import ShiftWidgetWrapper from '../shift-widgets/shift-widget-wrapper';

export default class ShiftOrdersTablesContainer extends Component {
  constructor() {
    super();

    this.tabs = [
      'Open orders',
      'Filled orders',
    ];

  }

  render() {
    // console.log(this.tabs);
    return (
      <ShiftWidgetWrapper
        tabs={this.tabs}
      >
        <OpenOrders2 />
        <Trades />
        <OrderHistoryCancelled />
        <TradeReports />
        <WithdrawStatus />
      </ShiftWidgetWrapper>
    );
  }
}
