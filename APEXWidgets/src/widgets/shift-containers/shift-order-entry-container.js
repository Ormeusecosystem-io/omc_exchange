import React, { Component } from 'react';

// AlphaPoint Components
import OrderEntry from '../order-entry';

// Shift Components
import ShiftWidgetWrapper from '../shift-widgets/shift-widget-wrapper';

export default class ShiftOrderEntryContainer extends Component {
  render() {
    return (
      <ShiftWidgetWrapper
        tabs={[
          AlphaPoint.translation('WIDGET_WRAPPER.TAB.ORDER_ENTRY') || 'Order Entry'
        ]}
        className={this.props.className}
      >
        <OrderEntry session={this.props.session}/>
      </ShiftWidgetWrapper>
    );
  }
}
