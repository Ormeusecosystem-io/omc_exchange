import React, { Component } from 'react';

// AlphaPoint Components
import ShiftTicker from './shift-ticker';

// Shift Components
import ShiftWidgetWrapper from './shift-widget-wrapper';

export default class ShiftTickerContainer extends Component {
  render() {
    return (
      <ShiftWidgetWrapper tabs={[AlphaPoint.translation('WIDGET_WRAPPER.TAB.INSTRUMENTS') || 'Instruments']}>
        <ShiftTicker />
      </ShiftWidgetWrapper>
    );
  }
}