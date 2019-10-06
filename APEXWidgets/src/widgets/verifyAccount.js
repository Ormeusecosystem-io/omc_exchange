import React, { Component } from 'react'
import Modal from './modal';
import { MoonLoader } from "react-spinners";

const style = {
  position: 'absolute',
  right: '40px',
  top: '0px',
  color: '#fff',
  fontSize: '25px',
  transform: 'rotate(45deg)',
  cursor: 'pointer'
}

const frameStyle = () => ({
  "msZoom": "0.85",
  "MozTransform": "scale(0.85)",
  "MozTransformOrigin": "50% 30%",
  "OTransform": "scale(0.85)",
  "OTransformOrigin": "50% 30%",
  "WebkitTransform": "scale(0.85)",
  "WebkitTransformOrigin": "50% 30%",
   display:"block",
   width: window.innerWidth > 768 ? "80%" : "100%", 
   minWidth:"300px", 
   maxWidth:"800px", 
   height: window.innerWidth > 768 ? "800px" : "600px", 
   border:"none", 
   margin:"0 auto"
})


export default class verifyAccount extends Component {
  state = {
    open: false,
    spinner: true,
    authorized: true,
    approved: false,
    accountInfo: null,
    userConfig: null,
  }

  componentWillMount() {
    const self = this
    this.accountInformation = AlphaPoint.accountInfo.subscribe(function (data) {
      self.setState({...self.state,accountInfo: data})
    })
    this.userConfiguration = AlphaPoint.getUserConfig.subscribe(data => {
      self.setState({...self.state,userConfig: data})
    })
  }


  getUserVerificationLevel(){
    AlphaPoint.getUserCon({
      UserId: AlphaPoint.userData.value.UserId
    });
  }
  
  componentDidUpdate(prevProps, prevState) {
    const { accountInfo, userConfig } = this.state
    if(prevState.accountInfo !== null && prevState.userConfig !== null) {
      if(prevState.accountInfo !== accountInfo || prevState.userConfig !== userConfig){
        const pendingLevel = userConfig && this.getAcoountStatusFromUserConfig(userConfig) === 'pending' ? true : false;
        if(accountInfo.VerificationLevel > 0 && !this.state.approved){
          return this.setState({...this.state, approved: true, authorized: false, btnStatusUpdated: true})
        }else if(accountInfo.VerificationLevel < 2  && this.state.authorized === pendingLevel){
          return this.setState({...this.state, approved: false, authorized: false, btnStatusUpdated: true})
        }
        this.setState({...this.state, btnStatusUpdated: true});
      }
    }
  }
  
  getAcoountStatusFromUserConfig(userConfigArray){
    for (let idx=0; idx < userConfigArray.length; idx++) {
      if(userConfigArray[idx].Key === 'accountStatus'){
        return userConfigArray[idx].Value
      }
    }
    return ''
  }
  
  onLoad(){
    console.log('iframe loaded')
    this.setState({...this.state, spinner: false})
    window.addEventListener("message", (e) => {
      if(e.data === 'close iframe'){
        this.getUserVerificationLevel();
        this.setState({...this.state, open: false})
      }
    });
}

  closeModal = () => {    
    this.setState({...this.state, open: false });
  };

  verifyAccount(e){
    this.setState({...this.state, open: true});   
  }

  getIdByWindowWidth(){
    return window.innerWidth > 768 ? "verifyAccount" : "verifyAccountMobile"
  }

  render() {
      return (
         <div>
           {this.state.open ?
            <Modal idModal="verifyAccountModal" close={this.closeModal}>    
                <div style={{position: 'relative'}}>
                  {this.state.spinner && <div className="isLoading"><MoonLoader sizeUnit={"px"} size={90} color={'rgb(43,191,223)'} loading={true} /></div>}
                  <span style={style} onClick={() => this.closeModal()}>+</span>
                  <iframe onLoad={() => this.onLoad()} src={`${process.env.ON_BOADRDING_URL}/?isEx=true`} style={frameStyle()} />
                </div>
            </Modal>    
            : null}
            <button style={{opacity: this.state.btnStatusUpdated ? '1' : '0', transition: '0.4s opacity ease-in'}} id={this.state.authorized ? this.getIdByWindowWidth() : 'accountVerification' } onClick={(e) => this.verifyAccount(e)} disabled={this.state.approved || !this.state.authorized}>
              {this.state.approved && <img src={require('../../../v2retailTemplate/images/icons/verified.png')}/>}
              {this.state.authorized ? "Verify account" : this.state.approved ? 'Account verified' : 'Account pending verification'}
            </button>
         </div>
    )
  }
}