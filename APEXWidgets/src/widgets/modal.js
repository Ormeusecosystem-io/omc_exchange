/* global document */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import ReactDOM from 'react-dom';

class Modal extends React.Component {
  componentDidMount() {
    this.refs.modal.focus();
  }

  onKeyDown = (e) => {
    if (e.keyCode === 27 /* esc */) return this.props.close && this.props.close();
    return true;
  };

  prevent = (e) => e.stopPropagation();

  close = () => (this.props.close && this.props.close()) || (this.props.cancel && this.props.cancel());

  render() {
    const backgroundColor = this.props.opacity ? `rgba(0,0,0,${this.props.opacity})` : 'rgba(0,0,0,0.5)';
    const childrenWithProps = React.Children.map(this.props.children, (child) => React.cloneElement(child, this.props));
    return (
      <div
        className="ap-modal"
        onClick={!this.props.noCloseOnClickOrKey && this.close}
        onKeyDown={!this.props.noCloseOnClickOrKey && this.onKeyDown}
        tabIndex="-1"
        ref="modal"
      >
        <div
          id={this.props.idModal}
          className="ap-modal_inner"
          style={{ width: this.props.width || '600px' }}
          onClick={this.prevent}
        >
          {childrenWithProps}
        </div>
      </div>
    );
  }
}

Modal.defaultProps = {
  close: null,
  cancel: null,
  opacity: null,
  children: null,
  noCloseOnClickOrKey: false,
  idModal: '',
  width: null,
};

Modal.propTypes = {
  close: React.PropTypes.func,
  cancel: React.PropTypes.func,
  opacity: React.PropTypes.number,
  children: React.PropTypes.node,
  noCloseOnClickOrKey: React.PropTypes.bool,
  idModal: React.PropTypes.string,
  width: React.PropTypes.number,
};

class ModalPortal extends React.Component {
  componentDidMount() {
    this.node = document.createElement('div');
    document.body.appendChild(this.node);
    this.renderPortal(this.props);
  }

  componentWillReceiveProps(newProps) {
    this.renderPortal(newProps);
  }

  componentWillUnmount() {
    ReactDOM.unmountComponentAtNode(this.node);
    document.body.removeChild(this.node);
  }

  renderPortal(props) {
    ReactDOM.render(<Modal {...props} />, this.node);
  }

  render() {
    return null;
  }
}

export default ModalPortal;
