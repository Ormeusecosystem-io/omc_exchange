import React from 'react';
import countryCodes from './countryCodes.json';

class CountryCodePicker extends React.Component {
  constructor() {
    super();

    this.state = {
      opened: false,
      selected: {},
    };
  }

  componentDidMount() {
    countryCodes.forEach(country => {
      if (+country.dialCode === +this.props.value) {
        this.setState({ selected: country });
      }
    });
  }

  componentWillReceiveProps(props) {
    countryCodes.forEach(country => {
      if (+country.dialCode === +props.value) {
        this.setState({ selected: country });
      }
    });
  }

  open = () => this.setState({ opened: !this.state.opened });

  select = country => {
    this.setState({ selected: country }, () => this.props.onChange());
    this.open();
  };

  value = () => this.state.selected.dialCode;

  render() {
    const list = countryCodes.map(country => (
      <li
        className="country"
        onClick={() => this.select(country)}
        key={country.iso2}
      >
        <div className={`flag ${country.iso2}`} />
        <span className="country-name">
          {country.name}
        </span>
        <span className="dial-code">
          +{country.dialCode}
        </span>
      </li>
    ));

    return (
      <div
        className={`form-group ${this.props.wrapperClass}`}
        onClick={this.open}
      >
        <label htmlFor={this._rootNodeID}>
          {this.props.label || this.props.placeholder}
        </label>
        <div className={`intl-tel-input ${this.props.append && 'input-group'}`}>
          <input
            type="tel"
            id="mobile-number"
            value=""
            className="form-control"
            placeholder={
              this.state.selected.name
                ? `${this.state.selected.name}: ${+this.state.selected.dialCode}`
                : this.props.placeholder
            }
          />
          <div className="flag-dropdown">
            {this.state.selected.name &&
              <div
                className="selected-flag"
                title={`${this.state.selected.name}: ${+this.state.selected.dialCode}`}
              >
                <div className={`flag ${this.state.selected.iso2}`}>
                  <div className="arrow up" />
                </div>
              </div>}

            {this.state.opened &&
              <ul className="country-list">
                {list}
              </ul>}
          </div>
        </div>
      </div>
    );
  }
}

CountryCodePicker.defaultProps = {
  wrapperClass: '',
  placeholder: '',
  value: '',
  label: '',
  append: false,
  onChange: () => {},
};

CountryCodePicker.propTypes = {
  wrapperClass: React.PropTypes.string,
  placeholder: React.PropTypes.string,
  value: React.PropTypes.string,
  append: React.PropTypes.bool,
  label: React.PropTypes.string,
  onChange: React.PropTypes.func,
};

export default CountryCodePicker;
