/* global AlphaPoint */
import React, {Component} from 'react';
import WidgetBase from './base';
import {isMobile} from './helper';

class MobileWarningPopup extends Component {
  constructor() {
    super();
    this.state = {
      open: true,
    };
  }

  render() {
    return (
      AlphaPoint.config.showMobileWarningPopup && isMobile() && this.state.open ?
        <div className="fullscreen-modal" style={{opacity: 1, visibility: 'visible', top: 0,}} onClick={() => this.setState({open: false})}>
          <span className="close-m"></span>
          <div className="widget-modal-container">
            <WidgetBase
              {...this.props}
              modalId="mobileWarningModal"
              headerTitle=""
              information={AlphaPoint.translation('COMMON.MOBILE_WARNING') || 'This site is not optimized for mobile devices. Please switch to a computer for the best possible experience.'}
            />
          </div>
        </div>
        :
        null
    );
  }
}

module.exports = MobileWarningPopup;
