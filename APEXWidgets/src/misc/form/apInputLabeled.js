import React from 'react';

const ApInputLabeled = props => {
  return (
    <div className={`form-group ${props.wrapperClass}`}>
      <label htmlFor={props.name}>
        {props.label || props.placeholder}
      </label>
      <div className={props.append ? 'input-group' : ''}>
        <input
          {...props}
          placeholder={props.placeholder}
          className={`form-control ${props.className}`}
          id={props.name}
          name={props.name}
          onKeyPress={props.onKeyPress}
          onChange={props.onChange}
          value={props.value}
        />
      </div>
    </div>
  );
}

ApInputLabeled.defaultProps = {
  wrapperClass: '',
  placeholder: '',
  append: false,
  className: '',
  label: '',
  value: ''
};

ApInputLabeled.propTypes = {
  wrapperClass: React.PropTypes.string,
  placeholder: React.PropTypes.string,
  className: React.PropTypes.string,
  append: React.PropTypes.bool,
  label: React.PropTypes.string,
};

export default ApInputLabeled;
