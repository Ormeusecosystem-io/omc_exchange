/* global AlphaPoint */
import React from 'react';

import WidgetBase from '../base';
import ShiftRegisterFormInnerV2 from './shift-register-form-inner-v2';
// Until I get the css to work on the widget
// var InputLabeled = require('../misc/inputLabeled');


class ShiftRegisterForm extends React.Component {
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
        <ShiftRegisterFormInnerV2 {...this.props} setBanner={this.setBanner} /> 
      </WidgetBase>
    );
  }
}

ShiftRegisterForm.defaultProps = {
  hideCloseLink: true,
};

export default ShiftRegisterForm;