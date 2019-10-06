import React from 'react';
import LoginForm from './login-form';
import Modal from './modal'; 

var Login = React.createClass({
  getInitialState: function() {
    return {
      showLoginForm: false
    };
  },
  show: function() {
    this.setState({showLoginForm: true});
  },
  hide: function() {
    if (this.isMounted()) {
      this.setState({showLoginForm: false});
    }
  },
  // renderLayer: function() {
  //   if (!this.state.showLoginForm) { return <span/>; }
  //
  //   return <LoginModal hide={this.hide} show={this.show} />;
  // },
  render: function() {
    return (
      <span>
        {this.state.showLoginForm && <Modal close={this.hide}><LoginForm {...this.props} /></Modal>}
        <button className='btn btn-default' onClick={this.show}>{'Login'}</button>
      </span>
    );
  }
});

module.exports = Login;
