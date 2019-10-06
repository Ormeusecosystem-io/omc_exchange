import React from 'react';

class InputLabeled extends React.Component {
  setValue = value => {
    this.refs.input.value = value;
  };

  value = () => this.refs.input.value;

  render() {
    const { wrapperClass, append, ...props } = this.props;
    return (
      <div className={`form-group ${wrapperClass}`}>
        <label htmlFor={this._rootNodeID}>
          {this.props.label || this.props.placeholder}
        </label>
        <div className={append ? 'input-group' : ''}>
          <input
            disabled={this.props.disabled}
            type={this.props.type}
            ref="input"
            placeholder={this.props.placeholder}
            className={`${this.props.errorDescription && this.props.throwError ? 'invalidInput' : null} form-control ${this.props.className}`}
            id={this._rootNodeID}
            name={this.props.name}
            onKeyPress={this.props.onKeyPress}
            onChange={this.props.onChange}
          />
          {this.props.throwError && <label htmlFor={this._rootNodeID} className="error">
            {this.props.errorDescription}
          </label>}
          {this.props.append &&
            <span className="input-group-addon">
              {this.props.append}
            </span>}
        </div>
      </div>
    );
  }
}

InputLabeled.defaultProps = {
  wrapperClass: '',
  placeholder: '',
  append: false,
  className: '',
  label: '',
};

InputLabeled.propTypes = {
  wrapperClass: React.PropTypes.string,
  placeholder: React.PropTypes.string,
  className: React.PropTypes.string,
  append: React.PropTypes.bool,
  label: React.PropTypes.string,
};

export default InputLabeled;
