import React from 'react';
import Login from './login';
import Logout from './logout';

var LogInOut = React.createClass({
  getInitialState: function() {
    return {
      session: {}
    };
  },
  componentWillUnmount: function() {
    this.session.dispose();
  },
  componentDidMount: function() {
    this.session = AlphaPoint.session.subscribe(function(session) {
      // console.log("LOGIN Logout",session);
      this.setState({session:session});
    }.bind(this));
  },
  render: function() {
    // console.log("THIS.STATE.SESSION",this.state.session);
    return (
      <span>
        {this.state.session.SessionToken ?
          <Logout {...this.props} headerTitle={'Logout'} />
        :
          <Login {...this.props} headerTitle={'Login'} />
        }
      </span>
    );
  }
});

module.exports = LogInOut;
