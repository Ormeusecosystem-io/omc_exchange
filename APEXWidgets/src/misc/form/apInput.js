/* global AlphaPoint, $, alert, window */
/* eslint-disable react/no-multi-comp, no-alert */
import React from 'react';
import Validate from './validators';
import Messages from './validationMessages';

class ApInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            validationMessages: [],
            value: props.value,
            focused: false
        }
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ value: nextProps.value });
    }

    onChange = e => {
        let value = e.target.value,
            validationMessages = [],
            formIsValid = true;

        this.props.validations && this.props.validations.forEach((validationName) => {
            if (!Validate[validationName](value)) {
                validationMessages.push(Messages[validationName]);
                this.setState({ validationMessages });
            } else if (validationMessages.length < 1) {
                formIsValid = true;
                this.setState({ validationMessages });
            }
        });
        // console.log(validationMessages);
        this.setState({ value });
        this.props.onChange(this.props.name, value, validationMessages.length, formIsValid);
    }
    onFocus = e => {
        this.setState({ focused: true });
    }
    onBlur = e => {
        this.setState({ focused: false });
    }

    render() {
        const readOnlyStyle = this.props.readOnly ? { background: '#e2e0e0', borderColor: 'gray'} : {};
        return (
        <div className={`form-group ${this.props.wrapperClass} ${this.state.focused && !this.props.readOnly ? 'ap-input-focused' : ''}`}>
            <label className='ap-input-label'><span className='label-text'>{this.props.label || this.props.placeholder}</span>
                <input readOnly={this.props.readOnly} className='ap-input' style={readOnlyStyle} name={this.props.name} value={this.state.value} type={this.props.type} onChange={this.onChange} onFocus={this.onFocus} onBlur={this.onBlur}/>
            </label>
            <span className='ap-input-error'>{this.state.validationMessages[0]}</span>
        </div>
        );
    }
}

ApInput.defaultProps = {
    name: '',
    wrapperClass: '',
    placeholder: '',
    className: '',
    label: '',
    value: '',
    type: 'text',
    readOnly: false,
    onChange: () => {},
    onError: () => {},
};

ApInput.propTypes = {
    readOnly: React.PropTypes.boolean,
    name: React.PropTypes.string,
    wrapperClass: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    className: React.PropTypes.string,
    label: React.PropTypes.string,
    value: React.PropTypes.string,
    type: React.PropTypes.string,
    onChange: React.PropTypes.func,
    onError: React.PropTypes.func,
};

export default ApInput;
