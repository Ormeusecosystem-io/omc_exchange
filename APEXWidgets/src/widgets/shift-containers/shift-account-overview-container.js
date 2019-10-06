import React, { Component } from 'react';

// AlphaPoint Components
import AccountBalances from '../accountBalances';

// Shift Components
import ShiftWidgetWrapper from '../shift-widgets/shift-widget-wrapper';

export default class ShiftAccountOverviewContainer extends Component {
  render() {
    return (
      <ShiftWidgetWrapper
        tabs={[
          AlphaPoint.translation('WIDGET_WRAPPER.TAB.ACCOUNT_OVERVIEW') || 'Account Overview'
        ]}
      >
        <AccountBalances />
      </ShiftWidgetWrapper>
    );
  }
}
