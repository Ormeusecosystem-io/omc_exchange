import React from 'react';
import WidgetBase from './base';
import LoginFormInner from './login-form-inner';
import LoginFormInnerV2 from './login-form-inner-v2';

// var InputLabeled = require('../misc/inputLabeled');

var LoginForm = React.createClass({
  getDefaultProps: function () {
    return {
      hideCloseLink: true
    }
  },
  getInitialState: function () {
    return {
      error: '',
      information: ''
    };
  },
  setBanner: function (info) {
    this.setState(info);
  },
  componentWillUnmount: function () {
    AlphaPoint.getUserConfig.subscribe((data) => {
      const configs = ((Array.isArray(data) && data) || []).reduce((item, i) => {
        item[i.Key] = i.Value;
        return item;
      }, {});

      if (configs.language) {
        localStorage.setItem('lang', configs.language);
        AlphaPoint.getLanguage({ language: configs.language });
      }
    })
  },
  render: function () {
    return (
      <WidgetBase {...this.props} modalId="loginModal" information={this.state.information} error={this.state.error}>
        {AlphaPoint.config.v2Widgets ? <LoginFormInnerV2 {...this.props} setBanner={this.setBanner} />
          : <LoginFormInner {...this.props} setBanner={this.setBanner} />
        }
      </WidgetBase>
    );
  }
});

module.exports = LoginForm;
