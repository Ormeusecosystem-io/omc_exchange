/* global AlphaPoint, localStorage, ChartAPI, TradingView */
import React from 'react';
import Rx from 'rx-lite';

import WidgetBase from './base';

class Chart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      productPairs: [],
      currentPair: null,
      currentInstrumentObject: null,
    };
  }

  componentDidMount() {
    if(localStorage.getItem('tradingview.chartproperties')){
      this.chartOverrideBG(localStorage.getItem('tradingview.chartproperties'));
    }
    this.wsUri = AlphaPoint.config.TickerDataWS || localStorage.getItem('tradingServer') || AlphaPoint.config.API_V2_URL;

    // TODO: still seems to be race condition for which is set
    this.instrumentSubscription = Rx.Observable.combineLatest(
      AlphaPoint.prodPair,
      AlphaPoint.instruments,
      (pair, instruments) => {
        const instrument = instruments.find(inst => inst.Symbol === pair);

        this.setState({
          productPairs: instruments,
          currentPair: pair,
        });

        return instrument;
      },
    )
      .subscribe(instrument => {
        this.setState({ currentInstrumentObject: instrument }, () => {
          if (this.state.currentInstrumentObject) {
            if (!this.chart) {
              const dataFeed = new ChartAPI.UDFCompatibleDatafeed(this.wsUri, null, null);

              this.createChart(dataFeed);
            } else {
              this.chart.setSymbol(this.state.currentPair, '15');
            }
          }
        });
      });
  }

  componentWillUnmount() {
    this.instrumentSubscription.dispose();
    // this.chart.remove();
  }

  createChart = (dataFeed) => {
    const chartOptions = {
      symbol: this.state.currentPair || '',
      datafeed: dataFeed,
      library_path: AlphaPoint.config.charting_library || 'libs/charting_library_new/',
      width: '100%',
      height: '400px',
      autosize: true,
      interval: '15',
      container_id: 'ap-trading-view-chart',
      timezone: 'exchange',
      locale: AlphaPoint.config.defaultLanguage,
      disabled_features: [
        'header_widget',
        'timeframes_toolbar',
        'control_bar',
        'edit_buttons_in_legend',
        'context_menus',
        'left_toolbar',
      ],
      overrides: {
        'mainSeriesProperties.style': 3,
        'mainSeriesProperties.areaStyle.linewidth': 2,
        'scalesProperties.lineColor': '#e3e3e3',
        'scalesProperties.textColor': '#414040',
        'symbolWatermarkProperties.transparency': 100,
      },
      ...AlphaPoint.config.chart,
    };

    this.chart = new TradingView.widget(chartOptions); // eslint-disable-line new-cap
  }

  chartOverrideBG(storeProp){

    let storePropParse = JSON.parse(storeProp);
    if(storePropParse && storePropParse.paneProperties) {
      storePropParse = {
        ...storePropParse,
        paneProperties: {
          ...storePropParse.paneProperties,
          background: "#2f3353",
        }
      }

      localStorage.setItem('tradingview.chartproperties', JSON.stringify(storePropParse));
    }
  }
  
  render() {
    return (
      <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('CHART.TITLE_TEXT') || 'Chart'}>
        <div id="ap-trading-view-chart" style={{ height: '400px' }}>
          {!global.jQuery &&
            <h1 style={{ textAlign: 'center', lineHeight: '400px' }}>
              {AlphaPoint.translation('CHART.JQUERY_ERROR') || 'jQuery needed for this widget.'}
            </h1>
          }
        </div>
      </WidgetBase>
    );
  }
}

export default Chart;
