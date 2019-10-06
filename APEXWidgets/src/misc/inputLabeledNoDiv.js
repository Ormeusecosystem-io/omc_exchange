import React from 'react';

class InputLabeledNoDiv extends React.Component {
  setValue = value => {
    this.refs.input.value = value;
  };

  value = () => this.refs.input.value;

  render() {
    return (
      <div className={`form-group ${this.props.wrapperClass}`}>
        <label htmlFor={this._rootNodeID}>
          {this.props.label || this.props.placeholder}
        </label>
        <input
          {...this.props}
          ref="input"
          className={`form-control ${this.props.className}`}
          id={this._rootNodeID}
        />
        {this.props.append &&
          <span className="input-group-addon">
            {this.props.append}
          </span>}
      </div>
    );
  }
}

InputLabeledNoDiv.defaultProps = {
  wrapperClass: '',
  label: '',
  className: '',
  placeholder: '',
  append: false,
};

InputLabeledNoDiv.propTypes = {
  wrapperClass: React.PropTypes.string,
  label: React.PropTypes.string,
  className: React.PropTypes.string,
  placeholder: React.PropTypes.string,
  append: React.PropTypes.bool,
};

export default InputLabeledNoDiv;
