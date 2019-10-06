/* global window, AlphaPoint, localStorage */
/* eslint-disable react/no-multi-comp */
import React from 'react';

import Modal from './modal';
import LoginForm from './login-form-inner';

function HelpWindow(props) {
  return (
    <div
      style={{
        zIndex: 1000,
        padding: '10px',
        minHeight: '80px',
        minWidth: '150px',
        color: 'white',
        borderRadius: '5px',
        border: '5px double white',
        backgroundColor: '#2b2b2b',
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate(${props.x + 10}px, ${props.y + 10}px)`,
      }}
    >
      {props.text}
    </div>
  );
}

HelpWindow.defaultProps = {
  x: null,
  y: null,
  text: '',
};

HelpWindow.propTypes = {
  x: React.PropTypes.number,
  y: React.PropTypes.number,
  text: React.PropTypes.string,
};

class Base extends React.Component {
  constructor() {
    super();

    this.state = {
      showLogin: false,
      showHelp: false,
      helpText: '',
      helpX: 0,
      helpY: 0,
      session: {},
      error: '',
      information: '',
    };
  }

  componentDidMount() {
    this.session = AlphaPoint.session.subscribe((session) => this.setState({ session }));
  }

  componentWillUnmount() {
    this.session.dispose();
  }

  onMouseLeave = () => this.setState({ helpText: '' });

  onMouseMove = (e) => {
    if (!this.state.showHelp) return;
    const container = this.refs.container;
    const text = this.getTitleText(e.target);

    this.setState({
      helpText: text,
      helpY: e.pageY - container.parentNode.offsetTop,
      helpX: e.pageX - container.parentNode.offsetLeft,
    });
  }

  getTitleText = (element) => {
    if (this.state.showHelp && this.refs.help && (element === this.refs.help)) return null;

    if (element && element.attributes && element.attributes['data-help']) {
      return element.attributes['data-help'].value;
    }
    if (element === this.refs.container) return null;
    return this.getTitleText(element.parentNode);
  }

  setLoginBanner = (info) => this.setState(info);

  helpToggle = () => this.setState({ showHelp: !this.state.showHelp });

  loginToggle = () => this.setState({ showLogin: !this.state.showLogin });

  loginContent = () => (
    <div className="pad">
      {this.state.showLogin &&
        <Modal close={this.loginToggle}>
          <Base
            headerTitle={AlphaPoint.translation('SIGNIN_MODAL.TITLE_TEXT') || 'Login'}
            information={this.state.information}
            error={this.state.error}
          >
            <LoginForm close={this.loginToggle} setBanner={this.setLoginBanner} />
          </Base>
        </Modal>}
    </div>
  );

  close = (e) => {
    e.stopPropagation();
    this.props.close && this.props.close(); // eslint-disable-line no-unused-expressions
  }

  displaySuccessPopup(){
    return (
      <div
        className={`ap-widget ${this.props.customClass} ${!this.props.depositFiat ? "successPopup" : ''}`}
        ref="container"
        onMouseMove={this.onMouseMove}
        onMouseLeave={this.onMouseLeave}
        id={this.props.modalId}>
          <div>
            <div id="close-success-btn">
              <div>Success</div>
              <span onClick={this.close}>+</span>
            </div>
          </div>
          <div className="ap-body">
            <div className="inner">
            {(this.props.login && !this.state.session.SessionToken) ? 
              (this.state.session.initial ? null : this.loginContent())
              : 
              this.props.children
            }
            </div>
          </div>
      </div>
    )
  }

  render() {
    if (!window.AlphaPoint) return (<div>AlphaPoint library not found</div>);
    if(this.props.successPopup){
      return this.displaySuccessPopup();
    }
    return (
      <div
        className={`ap-widget ${this.props.customClass}`}
        ref="container"
        onMouseMove={this.onMouseMove}
        onMouseLeave={this.onMouseLeave}
        id={this.props.modalId}
      >
        {this.state.showHelp && this.state.helpText ?
          <HelpWindow ref="help" x={this.state.helpX} y={this.state.helpY} text={this.state.helpText} />
          :
          null}

        {(localStorage.published === 'true' || !this.props.hideHeader) &&
        <div>
          { (this.props.withCloseButton === 'true') ? <div className="ap-close-button-row">
            <div className="ap-close-button" onClick={this.close} /> 
          </div>: <div className="ap-close-button-row"></div> }
          
          
          <div className="ap-header">
              <div className="ap-title">
              {this.props.materialIconTitle && (<i className="material-icons modal-title-material-icon">{this.props.materialIconTitle}</i>)}
              {this.props.headerTitle}
              {this.props.subTitle && <div className="sub-title">{this.props.subTitle}</div>}
            </div>
            
            
            {
              !this.props.modalId === "advancedOrdersModal" &&
              <div style={this.props.left ? { float: 'right' } : null} className="ap-header-actions">
                <div className="header-tabs">
                  {this.props.left}
                </div>

                {this.props.showHelp &&
                  <div onClick={this.helpToggle} className={`ap-header-actions-btn-help ${this.state.showHelp ? 'active' : ''}`}>?</div>}

                {/* {this.props.close && !this.props.hideCloseLink &&
                  <div onClick={this.close} className="ap-header-actions-btn-close">
                    {AlphaPoint.config.siteName === 'aztec' ?
                      <i className="icon-cme-card-close icon--medium" />
                      :
                      <i className="material-icons">clear</i>}
                  </div>} */}
              </div>
            }
          </div>
          
        </div>  
        }

        {this.props.error &&
          <div className="pad error-block">
            {this.props.error}
          </div>}
        {this.props.success &&
          <div className="pad success-block" >
            {this.props.success}
          </div>}
        {this.props.information &&
          <div className="pad information-block" >
            {this.props.information}
          </div>}

        <div className={`ap-body ${this.state.showHelp ? 'showhelp' : ''}`} >
          <div className={`inner  ${this.props.innerClassName}`}>
            {(this.props.login && !this.state.session.SessionToken) ? // eslint-disable-line no-nested-ternary
      (this.state.session.initial ? null : this.loginContent())
              : this.props.children} {/* This is where the child/widget mounts*/}
          </div>
        </div>
      </div>
    );
  }
}

Base.defaultProps = {
  close: () => {},
  modalId: '',
  hideCloseLink: false,
  hideHeader: false,
  subTitle: '',
  headerTitle: '',
  left: null,
  showHelp: false,
  error: '',
  success: '',
  information: '',
  login: false,
  children: null,
  innerClassName: '',
  withCloseButton: true,
};

Base.propTypes = {
  close: React.PropTypes.func,
  modalId: React.PropTypes.string,
  hideCloseLink: React.PropTypes.bool,
  hideHeader: React.PropTypes.bool,
  subTitle: React.PropTypes.string,
  headerTitle: React.PropTypes.node || React.PropTypes.string,
  left: React.PropTypes.node,
  showHelp: React.PropTypes.bool,
  error: React.PropTypes.string,
  success: React.PropTypes.string,
  information: React.PropTypes.string,
  login: React.PropTypes.bool,
  children: React.PropTypes.node,
  innerClassName: React.PropTypes.string,
  withCloseButton: React.PropTypes.bool,
};

export default Base;
