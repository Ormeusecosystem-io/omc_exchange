
import React from 'react';
import InputLabeled from '../misc/inputLabeled';

var ClefButton = React.createClass({

  componentWillUnmount:function(){

  },

  componentWillMount:function(){
  const script = document.createElement("script");

      //  script.src = "https://clef.io/v3/clef.js";
       script.async = true;

       document.body.appendChild(script);
  },

  render:function(){

    return (
      <button type="button" className="clef-button mar-top btn btn-primary btn-block"
               data-app-id={AlphaPoint.config.clefLogin} data-color="blue"
               data-style="flat" data-redirect-url={AlphaPoint.config.clefRedirectURL + "?type=loginwithclef"}
               data-custom="true">Login with Clef
      </button>
    )

  }

});


var LoginDirect = React.createClass({
  getInitialState: function() {
    return {
      authyRequired: false,
      googleRequired: false,
      smsRequired: false,
      registration: false,
      registered: false,
      passwordReset: false,
      sessionToken: "",
      useClef: AlphaPoint.config.useClef,
    };
  },
  close:function(){
    // this.props.setBanner({information: '', error:''});
    this.props.close()
  },
  signIn: function(e) {
     e.preventDefault();

    this.props.setBanner({
      information: AlphaPoint.translation('COMMON.PLEASE_WAIT') || 'Please wait...', 
      error:''
    });

    if ((this.refs.email.value() == "" ) ) {
      return this.props.setBanner({information: '', error: "Enter a User name"});
    }
    if ((this.refs.password.value() == "" ) ) {
      return this.props.setBanner({information: '', error: "Enter a Password"});
    }

    if(this.state.googleRequired) {
      //send the 2FA code
      var data = {
        Code: this.refs.authCode.value()
      }

      AlphaPoint.auth2FA.subscribe(function (res) {
        console.log(res);
        if (res.Authenticated === true) {
            // console.log(this.props)
            if (this.props && this.props.to) {
              document.location = this.props.to;
            } else if (this.props.redirect && AlphaPoint.config.loginRedirect) {
              document.location = AlphaPoint.config.loginRedirect;
            }

          this.props.close();
        } else if (res.Authenticated === false) {
          // this.props.setBanner({error: "Invalid Code", information: ''});
          // console.log("not Authenticated");
            localStorage.setItem("SessionToken","")
        }

      }.bind(this));

      AlphaPoint.authenticate2FA(data);

    } else {
      //this is authenticate level 1

      var data = {
        UserName: this.refs.email.value(),
        Password: this.refs.password.value(),
      };

      AlphaPoint.webAuthenticateSubject.subscribe(function (res) {

        if (res.Authenticated === true) {
          console.log("RES TRUE",res);
          // this.props.setBanner({information: 'Please wait...', error:''});
          if (res.Requires2FA) {
            if (res.AuthType && res.AuthType == "Google") {
              this.props.setBanner({ information: 'Please enter 2FA token',error: ""});
              this.setState({googleRequired: true, sessionToken: res.SessionToken});
            }
          } else {
            console.log(this.props)
            if (this.props && this.props.to) {
              document.location = this.props.to;
            } else if (this.props.redirect && AlphaPoint.config.loginRedirect) {
              document.location = AlphaPoint.config.loginRedirect;
            }
            // this.props.close();
          }
          //this.props.close();
        }

        if (res.Authenticated === false) {
          console.log("RES FALSE",res);
          this.props.setBanner({ information: '',error: "Invalid Username or Password"});
          // console.log("not Authenticated");
        localStorage.setItem("SessionToken","")
        } else if (res == "Authentication tries exceeded.") {
            this.props.setBanner({ information: '',error: "Authentication tries exceeded."});
        }

      }.bind(this));
      console.log("Called from login");
      AlphaPoint.WebAuthenticate(data);
    }
    //   AlphaPoint.login(data, function(res) {
    //   if (res.is2FAAuthyRequired) {
    //     this.setState({authyRequired: true});
    //   }
    //
    //   if (res.is2FAGoogleRequired) {
    //     this.setState({googleRequired: true});
    //   }
    //
    //       if (res.isSMSRequired) {
    //           this.setState({smsRequired: true});
    //       }
    //
    //       if (res.rejectReason) {
    //     this.props.setBanner({error: res.rejectReason, information:''});
    //   }
    //   if (res.isAccepted) {
    //     console.log(res);
    //     if (this.props && this.props.to) {
    //       document.location = this.props.to;
    //     } else if (this.props.redirect && AlphaPoint.config.loginRedirect) {
    //       document.location = AlphaPoint.config.loginRedirect;
    //     }
    //
    //     this.props.close();
    //   }
    // }.bind(this));
  },

  register: function() {
    this.props.setBanner({information: 'Creating account...', error:''});
    var data = {};
    AlphaPoint.createAccount({
      email: this.refs.email.value(),
      password: this.refs.password.value(),
    }, function(res) {
      this.props.setBanner({error: res.rejectReason, information:''});
      this.setState({registered: res.isAccepted});
      if (res.isAccepted) {
//          window.google_conversion_id = 948038419;
//          window.google_conversion_language = "en";
//          window.google_conversion_format = "3";
//          window.google_conversion_color = "ffffff";
//          window.google_conversion_label = "mtzZCLOZy1sQk9aHxAM";
//          window.google_remarketing_only = false;
//           document.write("<script type=\"text/javascript\" src=\"//www.googleadservices.com/pagead/conversion.js\">"+"<"+"/script>");
     //   this.props.close();
      }
    }.bind(this));
  },
  resetPassword: function() {
    AlphaPoint.resetPassword({UserName:this.refs.email.value()});
    AlphaPoint.resetPass.subscribe(function(res) {
      if(res.Result) {
        this.setState({passwordReset: res.Result});
      }
      if (!res.Result) this.props.setBanner({error: res.rejectReason});
    }.bind(this));
  },

  //AlphaPoint.resetPassword({
  //      email: this.refs.email.value(),
  //      language: (localStorage && localStorage.lang) ? localStorage.lang : AlphaPoint.config.defaultLanguage},
  //      function(res) {
  //    this.setState({passwordReset: res.isAccepted});
  //    if (!res.isAccepted) this.props.setBanner({error: res.rejectReason});
  //  }.bind(this));
  //},
  render: function() {
    if (!this.state.registered) {
      return this.defaultView();
    } else {
      return this.registered();
    }
  },
  registered: function() {
      return (
      <h3 className="text-center">{AlphaPoint.translation('SIGNIN_MODAL.REGISTERED')||'Account Created. Check your email for Activation Link.'}</h3>
      );
  },
  defaultView: function() {
      //console.log('smsRequired: ' + this.state.smsRequired );
    return (
      <div className="intro-form gray-bg">
        <h3 className="h4 fw-400">Login</h3>
        <form onSubmit = {this.signIn}  className="registration" >
         <div className="form-group">
           <div className="help-block with-errors form-tooltip"></div>
           <InputLabeled type="email" className="form-control" label={AlphaPoint.translation('SIGNIN_MODAL.EMAIL_QUES')||'Email'} ref='email'  data-error="Please enter your e-mail address" required />
         </div>
         <div className="form-group">
           <div className="help-block with-errors form-tooltip"></div>
           <InputLabeled  label={AlphaPoint.translation('SIGNUP_MODAL.PASSWORD')||'Password'} data-minlength="6" className="form-control" id="inputPassword" data-error="Please confirm your password" required type='password' ref='password' />         </div>
         <div className="form-group">
          <button type="submit" onClick={this.signIn} className="mar-top btn btn-primary btn-block">Login</button>
        </div>

        {
          this.state.useClef &&
          <div className="form-group">
           {  <ClefButton/>}
         </div>
        }

      </form>
    </div>
      )

  }
});

module.exports = LoginDirect;
