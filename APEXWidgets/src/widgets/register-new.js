import React from 'react';
import InputLabeled from '../misc/inputLabeled';

var ClefRegisterButton = React.createClass({

  componentWillMount:function(){
      const script = document.createElement("script");
      // script.src = "https://clef.io/v3/clef.js";
      script.async = true;
      document.body.appendChild(script);
  },

  render:function(){
      return (
          <button  className="clef-button mar-top btn btn-primary btn-block"
                   data-app-id={AlphaPoint.config.clefLogin} data-color="blue"
                   data-style="flat" data-redirect-url={AlphaPoint.config.clefRedirectURL + "?type=registerwithclef"}
                   data-custom="true">Register with Clef
          </button>
      )
  }
});


var RegisterDirect = React.createClass({
  getInitialState: function() {
    return {
      authyRequired: false,
      googleRequired: false,
      smsRequired: false,
      registration: false,
      registered: false,
      passwordReset: false,
      useClef: AlphaPoint.config.useClef,
      termsAccept: false
      // userInfo: {}
    };
  },
  selectTerms:function(e){
    this.setState({termsAccept:e.target.checked});
  },
  register: function(e) {
     e.preventDefault();
    // this.props.setBanner({information: 'Account created', error:''});
      var data = {

    UserInfo: {
      UserName: this.refs.username.value(),
      passwordHash: this.refs.password.value(),
      Email: this.refs.email.value(),
      },
      UserConfig:[],
      OperatorId: AlphaPoint.config.OperatorId
    };

    if (this.state.termsAccept == false ) {
      return this.props.setBanner({information: 'Do you accept the terms and conditions?', error: ""});
    }

    if ((this.refs.password.value() == "" ) || (this.refs.password2.value() == "") ) {
      return this.props.setBanner({information: '', error: "Enter a Password"});
    }
      var strongRegex = new RegExp("^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*\\W).*$", "g");
      var mediumRegex = new RegExp("^(?=.{7,})(((?=.*[A-Z])(?=.*[a-z]))|((?=.*[A-Z])(?=.*[0-9]))|((?=.*[a-z])(?=.*[0-9]))).*$", "g");
      var enoughRegex = new RegExp("(?=.{6,}).*", "g");

    if (!strongRegex.test(this.refs.password.value())) {
        return this.props.setBanner({information: '', error: "Password must contain 8 characters and at least on capital letter"});
    }

    if (this.refs.password.value() !== this.refs.password2.value()) {
      return this.props.setBanner({information: '', error: AlphaPoint.translation('SIGNUP_MODAL.PASSWORD_ERROR')||'Passwords do not match.'});
    }
    this.registerUser = AlphaPoint.registerUser.subscribe(function(data){
      // console.log("Response",data);
      if (data.UserId){
        this.setState({registered: true});
      }

      if (data.errormsg){
        //  return this.props.setBanner({information: '', error:data.errormsg});
        // return this.props.setBanner({information: '', error: AlphaPoint.translation("ERRORS" + "." + data.errorcode) || data.errormsg });
     }
    }.bind(this));

    AlphaPoint.registerNewUser(data);

  },

  resetPassword: function() {
    AlphaPoint.resetPassword({email: this.refs.email.value()}, function(res) {
      this.setState({passwordReset: res.isAccepted});
    }.bind(this));
  },

  render: function() {
    if (!this.state.registered) {
      return this.defaultView();
    } else {
      return this.registered();
    }
  },
  registered: function() {
      //sign In function no longer being used
      return (
      <span>
      <h3 className="text-center">{AlphaPoint.translation('SIGNUP_MODAL.REGISTERED')||'Account Created. Check your email for Activation Link.'}</h3>
      {(AlphaPoint.config.siteName == "Digital World Ventures") &&
          <div>
              <img height="1" width="1" alt="" src="//www.googleadservices.com/pagead/conversion/948038419/?label=mtzZCLOZy1sQk9aHxAM&amp;guid=ON&amp;script=0"/>
              <button style ={{marginBottom:"10px"}} type="button" className="btn btn-action" onClick={this.signIn}>{AlphaPoint.translation('BUTTONS.TEXT_SIGNIN')||"Sign In"}</button>
          </div>}
      </span>
      );
  },
  defaultView: function() {
     // console.log('smsRequired: ' + this.state.smsRequired );
    //  console.log("Terms checked",this.state.termsAccept);
    return (
      <div className="intro-form gray-bg">
            <h3 className="h4 fw-400">Sign Up !</h3>
            <form className="registration" onSubmit = {this.register} >
             <div className="form-group">
               <div className="help-block with-errors form-tooltip"></div>
               <InputLabeled className="form-control" placeholder= 'Username' ref='username' data-error="Please enter your e-mail address" required />
             </div>
             <div className="form-group">
               <div className="help-block with-errors form-tooltip"></div>
               <InputLabeled className="form-control" placeholder={AlphaPoint.translation('SIGNUP_MODAL.EMAIL')||'Email'} ref='email' data-error="Please enter your e-mail address" required />
             </div>
             <div className="form-group">
               <div className="help-block with-errors form-tooltip"></div>
               <InputLabeled  placeholder={AlphaPoint.translation('SIGNUP_MODAL.PASSWORD')||'Password'} data-minlength="6" className="form-control" id="inputPassword" data-error="Please confirm your password" required type='password' ref='password' />
             </div>
             <div className="form-group">
               <div className="help-block with-errors form-tooltip"></div>
               <InputLabeled  placeholder={AlphaPoint.translation('SIGNUP_MODAL.VERIFYPASSWORD')||'Password'} data-minlength="6" className="form-control" id="inputPassword" data-error="Please confirm your password" required type='password' ref='password2' />
             </div>
             <div className="form-group">
               <input type="checkbox" name="terms_accept" onClick = {this.selectTerms} value={this.state.termsAccept} /> <span>I accept the <a href ="terms.html">Terms and Conditions</a> </span>
               &nbsp;and <a href ="privacy.html">Privacy Policy </a>
               <br/>
             </div>
             <div className="form-group">
              <button type="submit" className="mar-top btn btn-primary btn-block" onClick={this.register}>Create my Account</button>
            </div>
              {
              this.state.useClef &&
              <div className="form-group">
               {  <ClefRegisterButton/>}
             </div>
            }
          </form>
        </div>
    );
  }
});

module.exports = RegisterDirect;
