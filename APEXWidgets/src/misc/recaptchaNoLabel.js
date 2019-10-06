import React from 'react';
import Recaptcha from 'react-recaptcha';

class RecaptchaNoLabel extends React.Component {

  constructor (props) {
    
    super(props)
    this.state = {
      sitekey: "6LcFJXgUAAAAANoKEBxRns2JzgNwFdWbQIIqxYG3" ,
    };
    this.setSiteKey = this.setSiteKey.bind(this);
  }

  setSiteKey = (sitekey) => {
    this.setState({sitekey: this.state.sitekey});
  };


  onloadCallback(){
    console.log('12ac78sgRec-cb~~!!')
  }

  render() {
    return (
      <div className="g-recaptcha" className="form-group">
        <Recaptcha
          sitekey="6LcFJXgUAAAAANoKEBxRns2JzgNwFdWbQIIqxYG3"
          verifyCallback={this.props.verifyCallback}
          onloadCallback={()=> this.onloadCallback()}
        />
      </div>
    );
  }
}

RecaptchaNoLabel.defaultProps = {
  wrapperClass: '',
  placeholder: '',
  append: false,
  className: '',
  label: '',
  render: 'explicit',
  sitekey: '',
  verifyCallback: '',
  onloadCallback: '',
};

RecaptchaNoLabel.propTypes = {
  wrapperClass: React.PropTypes.string,
  placeholder: React.PropTypes.string,
  className: React.PropTypes.string,
  append: React.PropTypes.bool,
  label: React.PropTypes.string,
  render: React.PropTypes.string,
  sitekey: React.PropTypes.string,
  verifyCallback: React.PropTypes.func,
  onloadCallback: React.PropTypes.func,
};

export default RecaptchaNoLabel;
