/* global AlphaPoint */
import React from 'react';

class Logout extends React.Component {
  logout = () => AlphaPoint.logout();

  render() {
    return (
      <button
        className="btn btn-default"
        onClick={this.logout}
      >
        {this.props.text || 'Logout'}
      </button>
    );
  }
}

Logout.defaultProps = {
  text: '',
};

Logout.propTypes = {
  text: React.PropTypes.string,
};

export default Logout;
