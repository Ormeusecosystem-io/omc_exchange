/* eslint-disable react/no-danger */
import React from 'react';
import widgets from './widgetList';
import Modal from './modal';

class Wrapper extends React.Component {
  constructor() {
    super();

    this.state = { showModal: false };
  }

  modal = (open, e) => {
    e.preventDefault();
    e.nativeEvent.preventDefault();
    this.setState({ showModal: open });
  }

  render() {
    const SelectedWidget = widgets[this.props.apWrapper];

    return (
      <span onClick={() => this.modal(true)}>
        <span dangerouslySetInnerHTML={{ __html: this.props.innerHTML }} />
        {
          this.state.showModal && SelectedWidget &&
          <Modal close={() => this.modal(false)}>
            <SelectedWidget />
          </Modal>
        }
      </span>
    );
  }
}

Wrapper.defaultProps = {
  apWrapper: '',
  innerHTML: '',
};
Wrapper.propTypes = {
  apWrapper: React.PropTypes.string,
  innerHTML: React.PropTypes.string,
};

module.exports = Wrapper;
