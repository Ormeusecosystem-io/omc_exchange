import React from 'react';
import WidgetBase from './base';

var OrderRow = React.createClass({

  // getDefaultProps: funct
  getInitialState: function() {
    return {
      rowState: 'success'
    };
  },
  componentDidMount: function() {
    this.changed();
  },
  changed: function() {
    var self = this;
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(function(){
      if (self.isMounted()) {
        self.setState({rowState:''});
      }
    }, 1000);
  },

  // shouldComponentUpdate: function (nextProps) {
  //   return !(this.props.qty === nextProps.qty);
  // },
  componentWillReceiveProps: function (nextProps) {
    // console.log("NEXT PROPS",nextProps);
    if (nextProps.Quantity !== this.props.Quantity ) {
      // if (this.state.rowState !== 'success') {
        this.setState({rowState: ''});
        this.changed();
      // }
    }

  },

  render: function() {
    // console.log("THIS IS PROPS IN A ROW",this.props);

        if (this.props.type == "sells") {
          var myStyle = {color:"#af4141"}
        }
        if (this.props.type == "buys") {
        var myStyle = {color:"#4662a1"}
        }

    return (

      <tr key={this.props.TimeStamp} >
          <td className ="borderless" style={myStyle}>
            {this.props.Price.toFixed(AlphaPoint.config.decimalPlaces)}
          </td>
          <td className ="borderless">{this.props.Quantity.toFixed(AlphaPoint.config.decimalPlaces)}</td>
          <td className ="borderless">-</td>
      </tr>
    );
  }
});

var OrdersBook_Orders = React.createClass({
  getInitialState: function() {
    return {
      currentPair: '',
      type: false
    }
  },
  componentWillUnmount: function() {
    this.productPairs.dispose();
  },
  componentDidMount: function() {

    // this.productPairs =  AlphaPoint.instruments
    // .map(function(pairs) {
    //
    //   return pairs.filter(function(pair) { return pair.Symbol == AlphaPoint.prodPair.value })[0];
    // })
    // .subscribe(function(data) {
    //   this.setState({
    //     currentPair: data.length && data
    //   });
    // }.bind(this));
    this.productPairs = AlphaPoint.prodPair.subscribe(function(data){
      this.setState({
         currentPair:data
       });

    }.bind(this))

    if (this.props.type == "sells") {
      this.setState({type:true})
    }

  },
  render: function() {
    var maxLines= 30;
    var rows = [];

    if (this.props.data.length) {

      rows = this.props.data.slice(0,maxLines).map(function(row, idx){

        return (
          <OrderRow
            key={idx}
            currentPair={this.state.currentPair}
            {...row}
            Price={row.Price}
            Quantity={row.Quantity}
            type={this.props.type}/>
        )
      }, this);
    }

    var emptyRows = [];
    for (var i=0;i<maxLines-rows.length;i++) {
      emptyRows.push(<tr key={i}><td className ="borderless" colSpan='3'>&nbsp;</td></tr>);
    }
    // console.log("THIS PROPS TYPE",this.props.type);
    if (this.props.type == "buys") {
        var myStyle = "invisible"
      }
    if (this.props.type == "sell") {
        var myStyle = ""
      }

    return (
      <WidgetBase {...this.props}  >
        <table className="table table-hover minFont">
          <thead>
            <tr className ={myStyle}>
              <th className="header">{AlphaPoint.translation('ORDERBOOK.PRICE_TEXT') || 'Price'}</th>
              <th className="header">{AlphaPoint.translation('ORDERBOOK.QUANTITY_TEXT') || 'Quantity'}</th>
              <th className="header">{AlphaPoint.translation('ORDERBOOK.MYSIZE_TEXT') || 'My Size'}</th>
            </tr>
          </thead>
          <tbody>
            {this.state.type ? rows.reverse() : rows}
            {emptyRows}
          </tbody>
        </table>
      </WidgetBase>
    );
  }
});

module.exports = OrdersBook_Orders;
