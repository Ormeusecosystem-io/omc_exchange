import React, { Component } from 'react';

import OrderBook from '../bookview';
import ShiftPublicTradesNarrow from '../shift-widgets/shift-public-trades-narrow';

// Shift Components
import ShiftWidgetWrapper from '../shift-widgets/shift-widget-wrapper';
import ShiftOrderBook from '../shift-widgets/shift-bookview';

export default class ShiftOrderBookTradesContainer extends Component {
  render() {
    return (
      <ShiftWidgetWrapper
        tabs={[
          AlphaPoint.translation('WIDGET_WRAPPER.TAB.ORDER_BOOK') || 'Order Book',
          AlphaPoint.translation('WIDGET_WRAPPER.TAB.RECENT_TRADES') || 'Recent Trades'
        ]}
        className={this.props.className}
      >
        <ShiftOrderBook />
        <ShiftPublicTradesNarrow/>
      </ShiftWidgetWrapper>
    );
  }
}
