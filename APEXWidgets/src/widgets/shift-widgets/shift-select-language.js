import React from 'react';

class ShiftSelectLanguage extends React.Component {
  
  constructor(props) {
    super(props);
    this.languages = AlphaPoint.config.languages ? AlphaPoint.config.languages.items : [];
    this.currentLanguage = localStorage.lang || AlphaPoint.config.defaultLanguage;
    this.types = {
      'dropdown': this.renderDropDown.bind(this),
      'list': this.renderList.bind(this),
    };
    this.defaultType = 'list';
  }

  changeLanguage(lan) {
    localStorage.lang = lan;
    window.location.reload();
  }
  renderDropDown() {
    const listLanguages = this.languages.map((item, index) => (
				<a className="dropdown-item" onClick={() => this.changeLanguage(item.value)}>{item.name}</a>
			));

    let currentLunguage = this.languages.filter(lang => lang.value === this.currentLanguage)[0];

    return (
      <div className="dropdown">
          <button className="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          {currentLunguage.name}
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
          {listLanguages}
        </div>
      </div>
    );
  }
  renderList() {
    const listLanguages = this.languages.map((item, index) => {
      let itemClasses = 'language-item';
      if (item.value === localStorage.lang) {
        itemClasses += ' active';
      }
      return (
        <li className={itemClasses} key={index}>
          <a className="language-link" onClick={() => this.changeLanguage(item.value)}>{item.name}</a>
        </li>
      );
    });

    return (
      <ul className="language-lists">
        {listLanguages}
      </ul>
    );
  }

  render() {
    let listLanguages = '';
    const type = this.props.type;

    if (this.types[type]) {
      listLanguages = this.types[type]();
    } else {
      listLanguages = this.types[this.defaultType]();
    }

    return (
      <div className="languages-section">
        {listLanguages}
      </div>
    );
  }
}

export default ShiftSelectLanguage;
