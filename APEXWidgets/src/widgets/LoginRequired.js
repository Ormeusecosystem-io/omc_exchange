/* global AlphaPoint, window, document */
import React from 'react';

import Modal from './modal';
import LoginForm from './login-form';

class LoginRequired extends React.Component {
  constructor() {
    super();

    this.state = {
      session: null,
      show: false,
    };
  }

  componentDidMount() {
    this.session = AlphaPoint.session.subscribe(data => {
      if (data.Authenticated === false) {
        if (AlphaPoint.config.useCustomLoginScreen) {
          document.location = AlphaPoint.config.logoutRedirect;
          return false;
        }
        return this.setState({ show: true });
      }
      return false;
    });
  }

  componentWillUnmount() {
    this.session.dispose();
  }

  hide = () => this.setState({ show: false });

  render() {
    const show = !window.localStorage.getItem('SessionToken') ||
      window.localStorage.getItem('SessionToken') === 'undefined' ||
      this.state.show;

    return (
      <span>
        {show &&
          <Modal noCloseOnClickOrKey opacity="0.93" close={this.hide} width="450px">
            <LoginForm hideCancelBtn hideCloseLink {...this.props} />
          </Modal>}
      </span>
    );
  }
}

export default LoginRequired;
