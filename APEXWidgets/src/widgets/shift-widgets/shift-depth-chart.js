/* global AlphaPoint, $ */
import React from 'react';
import Highcharts from 'highcharts/js/highcharts'; // use this for styling via CSS
// import Highcharts from 'highcharts'; // use this for styling via options in config.js
import orderBook from '../../common/shift/orderBook';

const options = AlphaPoint.config.depthChartOptions;

class ShiftDepthChart extends React.Component {
  constructor(props) {
    super(props);
    this.container = 'depth-chart-container'; //TODO: get from props?
  }

  componentDidMount() {
    options.title.text = AlphaPoint.translation('DEPTH_CHART.TITLE_TEXT') || 'Depth Chart';
    options.series[0].name = AlphaPoint.translation('DEPTH_CHART.BIDS') || 'Bids';
    options.series[1].name = AlphaPoint.translation('DEPTH_CHART.ASKS') || 'Asks';

    this.chart = Highcharts.chart(this.container, options);

    orderBook.subscribe(update => {
      const bids = [];
      if (update.bids && update.bids.length > 0) {
        let bidVolume = 0;
        for (const bid of update.bids) {
          bidVolume += bid.volume;
          bids.push([bid.price, bidVolume]);
        }
      }

      const asks = [];
      if (update.asks && update.asks.length > 0) {
        let askVolume = 0;
        for (const ask of update.asks) {
          askVolume += ask.volume;
          asks.push([ask.price, askVolume]);
        }
      }

      // For the tooltip formatter function in config.js
      this.chart.series.forEach(series => {
        series.baseCurr = update.baseCurrency;
        series.quoteCurr = update.quoteCurrency;
      });

      this.chart.series[0].setData(bids.reverse(), false);
      this.chart.series[1].setData(asks);
    });
  }

  componentWillUnmount() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  render() {
    return (<div id={this.container} />)
  }
}

export default ShiftDepthChart;
