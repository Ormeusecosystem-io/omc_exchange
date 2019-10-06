/* global document */
import React from 'react';

class Script extends React.Component {
  componentDidMount() {
    this.createScript();
  }

  createScript = () => {
    const script = document.createElement('script');

    document.body.appendChild(script);
    script.onload = this.props.onLoadCallback;
    // script.async = 1;
    script.src = this.props.url;
  };

  render() {
    return null;
  }
}

Script.defaultProps = {
  url: '',
  onLoadCallback: () => { },
};

Script.propTypes = {
  url: React.PropTypes.string.isRequired,
  onLoadCallback: React.PropTypes.func,
};

export default Script;
