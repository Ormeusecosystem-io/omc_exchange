webpackJsonp([11],{P63K:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function s(e){var t=e.options.map(function(e,t){return r.default.createElement("option",{key:t,value:e.value},e.text)});return r.default.createElement("div",{className:"select"},r.default.createElement("select",{onChange:e.handleOnChange,value:e.value,disabled:e.disabled,name:e.name,style:e.style,defaultValue:e.defaultValue},e.value?null:r.default.createElement("option",{value:"",disabled:!0,selected:!0},e.hintText||""),t))}Object.defineProperty(t,"__esModule",{value:!0});var r=n(a("U7vG")),u=n(a("KSGD"));s.propTypes={options:u.default.array,handleOnChange:u.default.func,value:u.default.oneOfType([u.default.string,u.default.number,u.default.bool]),defaultValue:u.default.oneOfType([u.default.string,u.default.number]),name:u.default.string,hintText:u.default.string,disabled:u.default.bool,style:u.default.object};var i=s;t.default=i,"undefined"!=typeof __REACT_HOT_LOADER__&&(__REACT_HOT_LOADER__.register(s,"Select","/Users/paiziak/Documents/sites/vagrantpress/shift/master/admin-3/src/components/Select/index.js"),__REACT_HOT_LOADER__.register(i,"default","/Users/paiziak/Documents/sites/vagrantpress/shift/master/admin-3/src/components/Select/index.js"))},SaGJ:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}function s(e){return r.default.createElement("img",{src:e.src,className:e.class,alt:e.alt,width:e.width})}Object.defineProperty(t,"__esModule",{value:!0});var r=n(a("U7vG")),u=n(a("KSGD"));s.propTypes={src:u.default.string,class:u.default.string,alt:u.default.string,width:u.default.number};var i=s;t.default=i,"undefined"!=typeof __REACT_HOT_LOADER__&&(__REACT_HOT_LOADER__.register(s,"Img","/Users/paiziak/Documents/sites/vagrantpress/shift/master/admin-3/src/components/Img/index.js"),__REACT_HOT_LOADER__.register(i,"default","/Users/paiziak/Documents/sites/vagrantpress/shift/master/admin-3/src/components/Img/index.js"))},"bPD/":function(e,t){e.exports="data:image/png;base64,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"},mt4I:function(e,t,a){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0});var s=n(a("bOdI")),r=n(a("Zx67")),u=n(a("Zrlr")),i=n(a("wxAW")),A=n(a("zwoO")),l=n(a("Pf15")),o=n(a("U7vG")),d=n(a("KSGD")),c=n(a("tpu8")),f=a("RH2O"),h=a("T452"),p=a("12dL"),_=n(a("3oDM")),m=n(a("qX37")),g=n(a("SaGJ")),T=n(a("P63K")),O=n(a("bPD/")),D=function(e){function t(){(0,u.default)(this,t);var e=(0,A.default)(this,(t.__proto__||(0,r.default)(t)).call(this));return e.handleOnChange=function(){return e.__handleOnChange__REACT_HOT_LOADER__.apply(e,arguments)},e.handleChangeServer=function(){return e.__handleChangeServer__REACT_HOT_LOADER__.apply(e,arguments)},e.reqTwoFactorAuth=function(){return e.__reqTwoFactorAuth__REACT_HOT_LOADER__.apply(e,arguments)},e.handleSubmit=function(){return e.__handleSubmit__REACT_HOT_LOADER__.apply(e,arguments)},e.showErrorSnackBar=function(){return e.__showErrorSnackBar__REACT_HOT_LOADER__.apply(e,arguments)},e.handleRequestClose=function(){return e.__handleRequestClose__REACT_HOT_LOADER__.apply(e,arguments)},e.state={username:"",password:"",token:null,requires2FA:!1,logging:!1,server:window.appConfig.OMSUri,showCustomServerInput:!1,customServer:"",authType:"",showSnackbar:!1,snackbarMessage:""},e}return(0,l.default)(t,e),(0,i.default)(t,[{key:"__handleRequestClose__REACT_HOT_LOADER__",value:function(){this.setState({showSnackbar:!1,snackbarMessage:""})}},{key:"__showErrorSnackBar__REACT_HOT_LOADER__",value:function(e){return this.setState({showSnackbar:!0,snackbarMessage:e})}},{key:"__handleSubmit__REACT_HOT_LOADER__",value:function(e){function t(e){e?location.state&&location.state.nextPathname?a.context.router.replace(location.state.nextPathname):a.context.router.replace("/"):a.setState({logging:!1,showSnackbar:!0,snackbarMessage:"Login failed. Check your credentials and try again."})}var a=this,n=this.state,s=n.username,r=n.password,u=n.token,i=n.customServer,A=n.server,l={username:s,password:r,token:u};if(e.preventDefault(),A!==window.appConfig.OMSUri)if(this.state.showCustomServerInput){if(!~i.indexOf("wss://")&&!~i.indexOf("ws://"))return!1;(0,h.initWebsocket)(i),window.appConfig.OMSUri=i}else(0,h.initWebsocket)(A),window.appConfig.OMSUri=A;return this.setState({logging:!0}),this.state.authType&&"UNO"!==this.state.authType?this.props.authenticate2Fa(u,t):this.props.authenticateUser(l,this.reqTwoFactorAuth,t)}},{key:"__reqTwoFactorAuth__REACT_HOT_LOADER__",value:function(e){this.setState({requires2FA:!0,authType:e,logging:!1})}},{key:"__handleChangeServer__REACT_HOT_LOADER__",value:function(e){var t=e.target.value;return this.setState({server:t,showCustomServerInput:"custom"===t})}},{key:"__handleOnChange__REACT_HOT_LOADER__",value:function(e){var t=e.target,a=t.value,n=t.name;this.setState((0,s.default)({},n,a))}},{key:"render",value:function(){var e=window.localStorage.getItem("adminServer"),t=window.appConfig.serversList.map(function(e){return{value:e,text:e}}).concat([{value:"custom",text:"Custom server"}]);return e&&(~c.default.findIndex(c.default.propEq("value",e))(t)||t.unshift({value:e,text:e})),o.default.createElement("div",{className:"wrapper login"},o.default.createElement("div",{className:"form-container"},o.default.createElement(g.default,{src:O.default,class:"logo",alt:"Coti",width:250}),o.default.createElement("p",{className:"text"},"Log in to access Order Management System"),o.default.createElement("form",{onSubmit:this.handleSubmit},window.appConfig.useServerSelect&&!this.state.requires2FA&&o.default.createElement(T.default,{options:t,value:this.state.server,handleOnChange:this.handleChangeServer}),this.state.showCustomServerInput&&o.default.createElement("input",{type:"text",name:"customServer",placeholder:"Enter server address...",className:"input",onChange:this.handleOnChange}),o.default.createElement("input",{type:"text",name:"username",placeholder:"User Name",className:"input",value:this.state.username,onChange:this.handleOnChange}),o.default.createElement("input",{type:"password",name:"password",placeholder:"Password",className:"input",value:this.state.password,onChange:this.handleOnChange}),this.state.requires2FA&&o.default.createElement("input",{type:"text",name:"token",placeholder:"Token",className:"input",onChange:this.handleOnChange}),this.state.logging?o.default.createElement(_.default,{label:"Logging in...",className:"button inactive",disabled:!0}):o.default.createElement(_.default,{label:"Log in",className:"button primary",type:"submit"}))),o.default.createElement(m.default,{open:this.state.showSnackbar,message:this.state.snackbarMessage,autoHideDuration:4e3,onRequestClose:this.handleRequestClose}))}}]),t}(o.default.Component);D.propTypes={authenticateUser:d.default.func,authenticate2Fa:d.default.func},D.contextTypes={router:d.default.object};var E=(0,f.connect)(null,{authenticateUser:p.authenticateUser,authenticate2Fa:p.authenticate2Fa})(D);t.default=E,"undefined"!=typeof __REACT_HOT_LOADER__&&(__REACT_HOT_LOADER__.register(D,"LoginForm","/Users/paiziak/Documents/sites/vagrantpress/shift/master/admin-3/src/containers/Login/index.js"),__REACT_HOT_LOADER__.register(E,"default","/Users/paiziak/Documents/sites/vagrantpress/shift/master/admin-3/src/containers/Login/index.js"))}});
//# sourceMappingURL=11.80552d32afb27b572223.js.map