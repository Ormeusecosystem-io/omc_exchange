/* global AlphaPoint */
import React from 'react';

import WidgetBase from './base';
// Until I get the css to work on the widget
import RegisterFormInner from './register-form-inner';
import RegisterFormV2 from './register-form-inner-v2'
// var InputLabeled = require('../misc/inputLabeled');

class RegisterForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: '',
      information: '',
    };
  }

  setBanner = (info) => this.setState(info);

  render() {
    return (
      <WidgetBase
        {...this.props}
        headerTitle={AlphaPoint.translation('SIGNUP_MODAL.TITLE_TEXT') || 'Signup'}
        information={this.state.information}
        error={this.state.error}
      >
    {AlphaPoint.config.v2Widgets ?
      <RegisterFormV2 {...this.props} setBanner={this.setBanner} /> :
      <RegisterFormInner {...this.props} setBanner={this.setBanner} />
    }
      </WidgetBase>
    );
  }
}

RegisterForm.defaultProps = {
  hideCloseLink: true,
};

export default RegisterForm;
