import React from 'react';
import WidgetBase from './base';

var Products = React.createClass({

  // changeProduct: function(pair) {
  //   // console.log(AlphaPoint.setProductPair);
  //   AlphaPoint.setProduct(pair);
  // },

  getInitialState: function() {
    return {
      data:[],
      current:0
    };
  },
  componentDidMount: function() {

    this.products = AlphaPoint.products.subscribe(function(data) {
      this.setState({
        data: data
      });
    }.bind(this));

  this.prodProduct =  AlphaPoint.prodProduct.subscribe(function(data) {
      // console.log("FROM PRODUCTS",data);
      this.setState({
        current: data
      })
    }.bind(this));
  },
componentWillUnmount:function(){

  this.products.dispose()
  this.prodProduct.dispose()

},
  render: function() {
    var self = this;
    // console.log("THIS STATE",this.state.current);
    var pairs = (this.state.data||[]).map(function(pair) {
      // var btnStyle = (pair.ProductId == this.state.current ?'btn-action':'btn-default');
      // console.log(pair);
      return (
        <div className="btn" style={{marginRight:5}} key={pair.ProductFullName} >
          {pair.Product}
        </div>
      );
    }.bind(this));

    return (
      <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('PRODUCTS.TITLE_TEXT')||'Products'}>
        <div className='pad'>
          {pairs}
        </div>
      </WidgetBase>
    );
  }
});

module.exports = Products;
