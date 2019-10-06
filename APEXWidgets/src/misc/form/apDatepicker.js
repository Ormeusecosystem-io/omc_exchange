/* global AlphaPoint */
import React from 'react';
import Pikaday from 'react-pikaday';

class ApDatepicker extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            focused: false
        };
    }
    handleChange = date => {
        // Always convert using the default format, when sending back to KYC form.
        // When the props are loaded into Pikaday, they are parsed using the default
        // format as well.
        // console.log(this.config.toString(date, AlphaPoint.config.dateFormat))
        this.props.onChange(this.config.toString(date), );
    };

    onFocus = e => {
        this.setState({ focused: true });
    };

    onBlur = e => {
        this.setState({ focused: false });
    };

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
                case 'YYYY-MM-DD':
                    return `${year}-${month}-${day}`;
                case 'DD/MM/YYYY':
                    return `${day}/${month}/${year}`;
                case 'DD-MM-YYYY':
                    return `${day}-${month}-${year}`;
                case 'MM-DD-YYYY':
                    return `${month}-${day}-${year}`;
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
      <div className={`form-group ${this.props.wrapperClass} ${this.state.focused ? 'ap-input-focused' : ''}`}>
        <label className="ap-datepicker-label">
            <span className='datepicker-label-text'>{this.props.label || this.props.placeholder}</span>
            <Pikaday
                {...this.props}
                value={this.config.parse(this.props.value)}
                className="form-control ap-datepicker-input"
                onChange={this.handleChange}
                initialOptions={this.config}
                onFocus={this.onFocus}
                onBlur={this.onBlur}
                readOnly
                style={{ background: 'white' }}
            />
            <span className='ap-input-error'>{this.props.throwError ? AlphaPoint.translation('DATE.ERROR') || this.props.errorDescription : null}</span>
        </label>
      </div>
    );
  }
}

ApDatepicker.defaultProps = {
  wrapperClass: '',
  dob: false,
  throwError: false,
  errorDescription: '',
  placeholder: '',
  append: false,
  label: '',
  value: '',
  onChange: () => {},
};

ApDatepicker.propTypes = {
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

export default ApDatepicker;
