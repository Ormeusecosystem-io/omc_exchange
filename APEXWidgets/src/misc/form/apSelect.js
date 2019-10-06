import React from 'react';

class ApSelect extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            focused: false
        };
    };

    setValue = (value) => {
        this.refs.input.value = value;
    };

    onFocus = e => {
        this.setState({ focused: true });
    };

    onBlur = e => {
        this.setState({ focused: false });
    };

    onChange = e => this.props.onChange(this.props.name, e.target.value, 0, true);

    render() {
        return (
            <div className={`form-group ${this.props.wrapperClass} ${this.state.focused ? 'ap-input-focused' : ''}`}>
                <label>
                    <span className='select-label-text'>{this.props.label || this.props.placeholder}</span>
                    <select
                        {...this.props}
                        onChange={this.onChange}
                        ref="input"
                        className="form-control ap-select-input"
                        id={this._rootNodeID}
                        onFocus={this.onFocus}
                        onBlur={this.onBlur}>
                    {this.props.children}
                    </select>
                    <span className='ap-input-error'>{this.props.throwError ? AlphaPoint.translation('DATE.ERROR') || this.props.errorDescription : null}</span>
                </label>
            </div>
        );
    }
}

ApSelect.defaultProps = {
  wrapperClass: '',
  label: '',
  placeholder: '',
  throwError: false,
  children: null,
  name: '',
  onChange: () => {},
};

ApSelect.propTypes = {
  wrapperClass: React.PropTypes.string,
  label: React.PropTypes.string,
  placeholder: React.PropTypes.string,
  throwError: React.PropTypes.bool,
  children: React.PropTypes.node,
  name: React.PropTypes.string,
  onChange: React.PropTypes.func,
};

export default ApSelect;
