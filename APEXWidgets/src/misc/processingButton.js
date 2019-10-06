import React from 'react';
import Spinner from './spinner';

class ProcessingButton extends React.Component {
  constructor() {
    super();

    this.state = {
      mounted: false,
    };
  }

  componentDidMount() {
    this.setState({ mounted: true });
  }

  render() {
    const {processing, children, ...props} = this.props;
    return (
      <button {...props} id={this._rootNodeID}>
        {processing ? <Spinner /> : children}
      </button>
    );
  }
}

ProcessingButton.defaultProps = {
  disabled: false,
  processing: false,
  children: null,
};

ProcessingButton.propTypes = {
  disabled: React.PropTypes.bool,
  processing: React.PropTypes.bool,
  children: React.PropTypes.node,
};

export default ProcessingButton;
