import React from 'react';

class SelectLabeled extends React.Component {
  setValue = (value) => {
    this.refs.input.value = value;
  };

  value = () => this.refs.input.value;

  render() {
    return (
      <div className={`form-group ${this.props.wrapperClass}`}>
        <label htmlFor={this._rootNodeID}>
          {this.props.label || this.props.placeholder}
        </label>
        <select
          {...this.props}
          ref="input"
          className={`form-control ${this.props.className ? this.props.className : ''}`}
          id={this._rootNodeID}
        >
          {this.props.children}
        </select>
      </div>
    );
  }
}

SelectLabeled.defaultProps = {
  wrapperClass: '',
  label: '',
  placeholder: '',
  children: null,
};

SelectLabeled.propTypes = {
  wrapperClass: React.PropTypes.string,
  label: React.PropTypes.string,
  placeholder: React.PropTypes.string,
  children: React.PropTypes.node,
};

export default SelectLabeled;
