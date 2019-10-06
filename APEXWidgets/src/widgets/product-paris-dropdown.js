import React from 'react';
import WidgetBase from './base';
import InputLabeled from '../misc/inputLabeled';

var ProductPairsDropDown = React.createClass({
  getInitialState: function() {
    return {
      productPairs: [],
      productPair: '',
    };
  },
  componentDidMount: function() {
    this.productPairs = AlphaPoint.productPairs.subscribe( function(data) {
      this.setState({
        productPairs: data.productPairs
      });
    }.bind(this));

    this.productPair = AlphaPoint.prodPair.subscribe( function(data) {

      this.setState({
        productPair: data
      });
    }.bind(this));
  },
  componentWillUnmount: function() {
    this.productPairs.dispose();
    this.productPair.dispose();
  },
  changePair: function(e) {
    AlphaPoint.setProductPair(e.target.value);
  },
  render: function() {
    //console.log(this.state);
    var options = this.state.productPairs.map(function(pair) {
      return <option value={pair.name} key={pair.name}>{pair.product1Label} - {pair.product2Label}</option>;
    });

    var pair = this.state.productPairs.filter(function(pair) {
      return this.state.productPair === pair.name;
    }.bind(this))[0]||{};

    return (
            <WidgetBase>
              <select className='form-control pull-left ' style={{width:'130px'}} value={this.state.productPair} onChange={this.changePair}>
                {options}
              </select>
              </WidgetBase>
    );
  }
});

module.exports = ProductPairsDropDown;
