import React, { Component } from 'react';

// AlphaPoint Components
import Chart from '../chart';

// Shift Components
import ShiftDepthChart from '../shift-widgets/shift-depth-chart';
import ShiftWidgetWrapper from '../shift-widgets/shift-widget-wrapper';

export default class ShiftChartContainer extends Component {
  shiftChart = () => {
    return (
      <div>
        <Chart />
        <ShiftDepthChart />
      </div>
    );
  };

  render() {
    return (
      <ShiftWidgetWrapper
        tabs={[
          AlphaPoint.translation('WIDGET_WRAPPER.TAB.PRICE_CHART') || 'Price Chart'
        ]}
      >
        {this.shiftChart()}
      </ShiftWidgetWrapper>
    );
  }
}
