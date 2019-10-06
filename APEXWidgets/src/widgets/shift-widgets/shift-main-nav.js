import React from 'react';
import { menuItems } from '../../common/index';

class ShiftMainNav extends React.Component {
  constructor() {
    super();
    this.items = AlphaPoint.config.mainMenu || menuItems;
  }

  componentDidMount() {
    const signupBtn = document.getElementsByClassName('btnsignup-component')[0];
    if (signupBtn) {
      signupBtn.addEventListener('click', this.showPopup);
    }
  }

  showPopup(event) {
    if (!$('#dialog-form #myForm .password-rules').length) {
      $('#dialog-form #myForm').append('<p class="password-rules">The password needs to be at least 8 characters, including 1 number and 1 capital letter.</p>');
    }

    if (!$('#dialog-form #myForm .signup-logo').length && AlphaPoint.config.registerFormLogo.length) {
      $('#dialog-form #myForm').prepend(`<img class="signup-logo" src=${ AlphaPoint.config.registerFormLogo } />`);
    }
  }

  render() {
    const currentMenu = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
    const listItems = this.items.map((item, index) => {
            if (item.href === currentMenu) {
                item.classes += ' active';
            }
            return (
                <li className={item.liClasses} key={index}>
                    <a href={item.href} className={item.classes}>{
                        AlphaPoint.translation(item.titleTranslate || '') || item.title
                    }</a>
                </li>
            );
        });

    return (
      <div>
        <ul className="navbar-nav">
          {listItems}
        </ul>

      </div>
    );
  }
}

export default ShiftMainNav;
