/**
 * Config variables
 * @param modalWelcome        {Object}  - Object for widget
 * @param modalWelcome.enable {Boolean} - Enable or disable this modal
 * @param modalWelcome.text   {String}  - Text or translation path
 * 
 * localStorege
 * This widget use localStorage variable
 * @param showModalWelcome {Boolean} - Show popup only one time
 */

import React from 'react';
import Modal from '../modal';
import WidgetBase from '../base';

class ShiftModalWelcome extends React.Component {
  constructor(props) {
    super(props);

    const showModal = (AlphaPoint.config.modalWelcome.enable && !localStorage.showModalWelcome);
    this.state = { showModal: showModal };
    this.toggleBodyClass(showModal);
  }

  closeModal = () => {
    this.setState({ showModal: false });
    localStorage.showModalWelcome = false;
    this.toggleBodyClass(false);
  };

  toggleBodyClass = (showModal) => document.body.classList.toggle('welcome-modal-open', showModal);

  render() {
    const text = AlphaPoint.config.modalWelcome.text;
    return (
      <div>
        {this.state.showModal &&
          <Modal close={this.closeModal}>
            <WidgetBase>
              <div 
                className="modal-welcome-content" 
                dangerouslySetInnerHTML={{ __html: AlphaPoint.translation(text) || text }}>
              </div>
            </WidgetBase>
          </Modal>
        }
      </div>
      
    );
  }
}

export default ShiftModalWelcome;
