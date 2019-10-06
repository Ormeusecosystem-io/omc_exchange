import React from 'react';
import WidgetBase from './base';

var Rates = React.createClass({
  getInitialState: function() {
    return {
      rates: []
    };
  },
  componentDidMount: function() {
    // AlphaPoint.productPairs.subscribe(function(data) {
    //   this.setState({
    //     productPairs: data.productPairs
    //   });
    // }.bind(this));

    this.setState({
      rates: [
        {pair:'imaginary/pair', rate: '100%'},
        {pair:'imaginary2/pair2', rate: '200%'}
      ]
    });

  },
  render: function() {
    var rates = this.state.rates.map(function(rate) {
      return <div key={rate.pair}> {rate.pair} - {rate.rate}</div>;
    });

    return (

      <WidgetBase {...this.props} >
        {rates}
      </WidgetBase>
    );
  }
});

module.exports = Rates;
