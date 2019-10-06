import React, { Component } from 'react'
// import Highcharts from 'highcharts'
// import HighchartsReact from 'highcharts-react-official'
import axios from 'axios';
import moment from 'moment';
import Highcharts from 'highcharts/highstock.src.js';
import HighchartsReact from 'highcharts-react-official'
import sunburst from 'highcharts/modules/sunburst.js';
sunburst(Highcharts);
// import Highcharts from 'highcharts'
// import HC_map from 'highcharts/modules/map'

// // init the module
// HC_map(Highcharts)
  
  
export default class HighchartsComponent extends Component {
    state = {
        ohlc: [],
        volume: [],
        pair: null, // initial value
    }

    componentDidMount() {
        this.getHistoricalData();
    }
    
    componentWillReceiveProps(nextProps){
        if(nextProps.pair !== this.props.pair){
            this.getHistoricalData(nextProps.pair)
        }
    }
    
    async getHistoricalData(pair){
        try {
            const {data} = await axios.get(`${this.props.url}/api/historicalData?pair=${pair || 'ORMEUS_BTC' }`)
            if(data) {
                this.getSeries(data.data, pair);
            }
        }catch(error) {
            console.log('error: ', error)
        }
    }

    getSeries(data, pair){
        // close: "0.00017936"
        // high: "0.00019"
        // low: "0.00014108"
        // open: "0.00014108"
        // time: 1552597200000
        // vol: "37435.01750796"
        if(data) {
        var ohlc = [], volume = [], dataLength = data.length, i = 0;
            for (i; i < dataLength; i += 1) {
                ohlc.push([
                    data[i].time, // the date
                    Number(data[i].open), // open
                    Number(data[i].high), // high
                    Number(data[i].low), // low
                    Number(data[i].close) // close
                ]);
                volume.push([
                    data[i].time, // the date
                    Number(data[i].vol) // the volume
                ]);
            }
        }
        
        this.setState({ohlc, volume, pair});
    }
    
    render() {
        const options = {
            title: {
                text: '',
            },
           chart: {
                height: 460,
           },
           
            xAxis: {
                units: [['day', [3]]],
                type: 'datetime',
                labels: {
                    rotation: 90,
                }
            },
            series: [{
                type: 'ohlc',
                name: this.props.pair.replace('_', '/'),
                color: this.props.pair.includes('BTC') ? '#e87a2d' : '#2c9cdf',
                data: this.state.ohlc,
            }]
        }

          
              
        const style = {
            marginTop: '10px',
            maxWidth: '650px',
            width: '100%'
        }
        
    return (
        <div style={style}>
         {this.state.volume.length > 0 && this.state.ohlc.length > 0 &&
             <HighchartsReact 
                highcharts={Highcharts}
                options={options}
            />}
        </div>
      )

    }
  }
  