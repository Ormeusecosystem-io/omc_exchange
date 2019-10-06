
import React from 'react';
import WidgetBase from './base';
import LoginFormInner from './login-form-inner';
// var InputLabeled = require('../misc/inputLabeled');

var LoginForm = React.createClass({
  getInitialState: function() {
    return {
      error: '',
      information: ''
    };
  },
  setBanner: function(info) {
    this.setState(info);
  },

  render: function() {
    return (
      <WidgetBase {...this.props}  headerTitle={AlphaPoint.translation('SIGNIN_MODAL.TITLE_TEXT')||'Login'} information={this.state.information} error={this.state.error}>
        <LoginFormInner {...this.props} setBanner={this.setBanner} />
      </WidgetBase>
    );
  }
});

module.exports = LoginForm;
