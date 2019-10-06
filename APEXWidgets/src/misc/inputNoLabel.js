import React from 'react';

class InputNoLabel extends React.Component {
  
  setValue = value => {
    this.refs.input.value = value;
  };

  value = () => this.refs.input.value;

  copyToClipboard(e){
    var x = e.pageX,
    y = e.pageY;
    var textField = document.createElement('textarea');
    textField.innerText = this.refs.input.value; //pass the value from state
    document.body.appendChild(textField)
    textField.select()
    document.execCommand('copy')
    textField.remove()
    var copied = document.createElement('span') // tooltip copied!
    copied.innerText = "Copied";
    copied.style = `
      position: absolute;
      top: ${Number(y)-50}px;
      left: ${Number(x)-40}px;
      font-size: 12px;
      background-image: linear-gradient(244deg, #2cbfdf, #2c9cdf);
      border-radius: 8px 4px 8px 0px;
      color: #fff;
      letter-spacing: 1px;
      font-family: book;
      padding: 5px 10px;
      z-index: 99999;
    `;
    document.body.appendChild(copied);
    setTimeout(()=>{copied.remove()},2000)
  }

  render() {
    const { error, className, wrapperClass, name, onChange, disabled, type, ...rest } = this.props
    return (
      <div className={`form-group ${wrapperClass || 'wrapperClassPlaceHolder' }`} style={{height: this.props.twoFAcode ? "140px" : ""}}>
        {
          this.props.twoFAcode && <p>Google authentication code</p>
        }
        {AlphaPoint.config.v2Widgets ?
          <input
            {...this.props}
            ref="input"
            className={`form-control ${className || "" }`}
            id={this._rootNodeID}
            name={name}
            onChange={onChange}
            disabled={disabled}
          /> :
          <input
            {...this.props}
            ref="input"
            className={`form-control ${className || "" }`}
            id={this._rootNodeID}
            name={name}
            disabled={disabled}
            type={type ? type : "text"}
          />
        }
        {
          this.props.twoFA &&
            <div id="copy" onClick={e => this.copyToClipboard(e)}>
              <div id="copy-code"></div>
              <span>COPY</span>
            </div>
        }
        {error && <div className="input-error-icon" />}
        {this.props.append &&
          <span className="input-group-addon">
            {this.props.append}
          </span>}
      </div>
    );
  }
}

InputNoLabel.propTypes = {
  wrapperClass: React.PropTypes.string,
  className: React.PropTypes.string,
  append: React.PropTypes.bool,
  error: React.PropTypes.bool,
};

export default InputNoLabel;
