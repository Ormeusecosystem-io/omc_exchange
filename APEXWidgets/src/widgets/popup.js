import React from 'react';
import Rx from 'rx-lite';
import uuidV4 from 'uuid/v4';
import Modal from './modal';

class Popup extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      show: false,
      message: '',
      actions: [],
    };
  }

  componentDidMount() {
    const escKey = Rx.Observable.fromEvent(document, 'keyup').filter(event => event.keyCode === 27);

    this.escKeySubscription = escKey.subscribe(this.close);
  }

  componentWillUnmount() {
    this.escKeySubscription.dispose();
  }

  create = popup => this.setState(() => ({
    show: true,
    message: popup.message,
    actions: popup.actions,
  }));

  close = () => this.setState(() => ({
    show: false,
    message: '',
    actions: [],
  }));

  render() {
    if (this.state.show) {
      return (
        <Modal width={400}>
          <div className="popup" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '1rem', textAlign: 'center' }}>{this.state.message}</p>
            <div className="actions" style={{ display: 'flex', justifyContent: 'space-between' }}>
              {this.state.actions.map(action => (<button
                key={uuidV4()}
                className={action.className}
                onClick={action.onClick}
              >{action.text}</button>))}
            </div>
          </div>
        </Modal>
      );
    }

    return null;
  }
}

export default Popup;
