import React from 'react';
import WidgetBase from './base';

var Referral = React.createClass({
  getInitialState: function() {
    return {
      affiliateId: ''
    };
  },
  componentWillUnmount: function() {
    // console.log('removed');
    this.userInformation.dispose();
  },
  componentDidMount: function() {
    this.userInformation = AlphaPoint.userInformation.subscribe(function(data) {
      this.setState({
        affiliateId: data.affiliateId,
        referred: 99
      });
    }.bind(this));
  },
  render: function() {

    return (

      <WidgetBase {...this.props} >

        <div>
          Your referral link is <a href='alphapoint.com/?ref={this.state.affiliateId}'>
            alphapoint.com/?ref={this.state.affiliateId}
          </a>
        </div>
        <div>You have referred {this.state.referred} customer{+this.state.referred===1?'':'s'} who are currently active.</div>
      </WidgetBase>
    );
  }
});

module.exports = Referral;
