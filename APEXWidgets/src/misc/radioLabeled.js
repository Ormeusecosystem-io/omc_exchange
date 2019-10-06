import React from 'react';

class TextareaLabeled extends React.Component {
  value = () => this.refs.input.value;

  render() {
    return (
      <div className={`form-group ${this.props.wrapperClass}`}>
        <label htmlFor={this._rootNodeID}>
          {this.props.label || this.props.placeholder}
        </label>
        <textarea
          {...this.props}
          ref="input"
          className="form-control"
          id={this._rootNodeID}
        />
      </div>
    );
  }
}

TextareaLabeled.defaultProps = {
  wrapperClass: '',
  label: '',
  placeholder: '',
};

TextareaLabeled.propTypes = {
  wrapperClass: React.PropTypes.string,
  label: React.PropTypes.string,
  placeholder: React.PropTypes.string,
};

export default TextareaLabeled;
