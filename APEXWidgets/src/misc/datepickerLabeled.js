/* global AlphaPoint */
import React from 'react';
import Pikaday from 'react-pikaday';

class DatePickerLabeled extends React.Component {
  handleChange = date => {
    // Always convert using the default format, when sending back to KYC form.
    // When the props are loaded into Pikaday, they are parsed using the default
    // format as well.
    this.props.onChange(this.config.toString(date));
  }

  // Formats supported are MM/DD/YYYY, DD/MM/YYYY and YYYY/MM/DD
  config = {
    format: AlphaPoint.config.dateFormat || 'MM/DD/YYYY',
    yearRange: this.props.dob ? [1900, new Date().getFullYear()] : 10,
    toString(date, format) {
      if (typeof date.getDate !== 'function') return date;
      
      const day = (`0${date.getDate()}`).slice(-2);
      const month = (`0${date.getMonth() + 1}`).slice(-2);
      const year = date.getFullYear();
      
      switch (format) {
          case 'YYYY/MM/DD':
              return `${year}/${month}/${day}`;
          case 'DD/MM/YYYY':
              return `${day}/${month}/${year}`;
          case 'MM/DD/YYYY':
          default:
              return `${month}/${day}/${year}`;
      }
    },
    parse(dateString, format) {
      if (typeof dateString !== 'string') {
        return typeof dateString.getDate === 'function' ? dateString : new Date();
      }

      const parts = dateString.split('/');
      const dayPart = format === 'DD/MM/YYYY' ? 0 : 1;
      const monthPart = format === 'DD/MM/YYYY' ? 1 : 0;
      const day = parseInt(parts[dayPart], 10);
      const month = parseInt(parts[monthPart], 10) - 1;
      const year = parseInt(parts[2], 10);
      
      return new Date(year, month, day);
    },
  };

  render() {
    return (
      <div className={`form-group ${this.props.wrapperClass}`}>
        <label htmlFor={this._rootNodeID}>
          {this.props.label || this.props.placeholder}
        </label>
        <div className={this.props.append && 'input-group'}>
          <Pikaday
            {...this.props}
            value={this.config.parse(this.props.value)}
            className="form-control"
            onChange={this.handleChange}
            initialOptions={this.config}
          />
          <label htmlFor={this._rootNodeID} className="error">
            {this.props.throwError ? AlphaPoint.translation('DATE.ERROR') || this.props.errorDescription : null}
          </label>
          {this.props.append &&
            <span className="input-group-addon">
              {this.props.append}
            </span>}
        </div>
      </div>
    );
  }
}

DatePickerLabeled.defaultProps = {
  wrapperClass: '',
  dob: false,
  throwError: true,
  errorDescription: '',
  placeholder: '',
  append: false,
  label: '',
  value: '',
  onChange: () => {},
};

DatePickerLabeled.propTypes = {
  dob: React.PropTypes.bool,
  wrapperClass: React.PropTypes.string,
  placeholder: React.PropTypes.string,
  errorDescription: React.PropTypes.string,
  throwError: React.PropTypes.bool,
  append: React.PropTypes.bool,
  label: React.PropTypes.string,
  value: React.PropTypes.string,
  onChange: React.PropTypes.func,
};

export default DatePickerLabeled;
