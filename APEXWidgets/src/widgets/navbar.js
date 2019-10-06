import React from 'react';
import axios from '../axios';
import {getAccountStatus, getAccountStatusColor} from './helper';
import {pageProperties} from './pageProperties';

const style = {
    padding: "0",
    display: "flex",
    height: "100%",
    alignItems: "center",
    width: "100%"
}

class Navbar extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            session: false,
            loaded: false,
            windowWidth: window.innerWidth,
            navTop: false,
            hover: null,
            user: null,
            accountInfo: null,
            openMobileMenu: false,
            openWallet: false,
            openOrders: false,
            signoutTime: 1000 * 60 * 60 * 4,
            accountStatus: ""
        }      
    }

    componentWillMount() {
        const self = this
        this.accountInformation = AlphaPoint.accountInfo.subscribe(function (data) {
          self.setState({...self.state,accountInfo: data})
        })
      }

    async componentDidMount(){
        this.startAuth
        let state = {...this.state}
        setTimeout(() => {
          if(!this.state.loaded) {
            state = document.APAPI.Session.IsAuthenticated
            ? { ...this.state, loaded: true, session: document.APAPI.Session.IsAuthenticated, user: document.APAPI.Session.UserObj.UserName } 
            : { ...this.state, loaded: true, session: false }
            this.setState({...state});
            clearInterval(this.startAuth);
          }
        }, 3000);
        window.addEventListener('scroll', this.handleScroll.bind(this))
        window.addEventListener('resize', this.handleResize.bind(this));

        this.setActivityTimeOut();

        const {code, accountStatus} = await getAccountStatus();
        if(code === 200 && accountStatus){
            this.setState({...this.state, accountStatus})
        }
        else{
            console.log(code);
        }
    }
    
    setActivityTimeOut(){
        const blackList = ['settings', 'my-wallet', "orders"];
        const pathname = window.location.pathname.replace("/", "").replace(".html", "");
        if(blackList.includes(pathname)){
            this.events = [
                'load',
                'mousemove',
                'mousedown',
                'click',
                'scroll',
                'keypress'
              ];
        
              for (let i in this.events) {
                  window.addEventListener(this.events[i], this.resetTimeout);
              }
              this.setTimeout();
        }
    }

    resetTimeout = () => {
        this.clearTimeoutFunc();
        this.setTimeout();
    };

    clearTimeoutFunc = () => {
        if (this.logoutTimeout) clearTimeout(this.logoutTimeout);
    };
  
    setTimeout = () => {
        this.logoutTimeout = setTimeout(this.navigate, this.state.signoutTime);
    };

    handleResize() {
        this.setState({...this.state, windowWidth: window.innerWidth});
    }

    handleScroll(){
        const scrollTop = this.getDistanceDownPage();
        if(scrollTop > 76 && !this.state.navTop){
          this.setState({navTop: true})
        }
        else if(scrollTop <= 76 && this.state.navTop){
          this.setState({navTop: false})
        }
      }

      getDistanceDownPage() {
        return (window.pageYOffset !== undefined) ?
          window.pageYOffset : (
            document.documentElement || document.body.parentNode || document.body
          ).scrollTop
      }

    startAuth = setInterval(()=>{
        let state = {...this.state}    
        if((document.APAPI.Session && document.APAPI.Session.IsAuthenticated) !== undefined && document.APAPI.Session.UserObj){
            state = document.APAPI.Session.IsAuthenticated
            ? { ...this.state, loaded: true, session: document.APAPI.Session.IsAuthenticated, user: document.APAPI.Session.UserObj.UserName } 
            : { ...this.state, loaded: true, session: document.APAPI.Session.IsAuthenticated }
            this.setState({...state});
            clearInterval(this.startAuth);
        }
    }, 100)
    

    navigate(){
        localStorage.setItem('SessionToken', undefined)
        window.location = '/';
    }

    componentDidUpdate(precProps, prevState){
        const blackList = ['settings', 'personal-details', 'my-wallet', "orders"];
        const pathname = window.location.pathname.replace("/", "").replace(".html", "");
        if(this.state.loaded && !this.state.session && blackList.includes(pathname)){
            const sessionToken = localStorage.getItem('SessionToken');
            if(sessionToken !== 'undefined' && sessionToken !== undefined) 
                return this.webAuthenticator(sessionToken)
            return window.location = '/login.html';
        }
        if(prevState.session !== this.state.session && this.props.onSessionChange){
            this.props.onSessionChange(this.state.session)
        }
        if(!prevState.session && this.state.session){
            const blackList = ['login', 'signup'];
            const pathname = window.location.pathname.replace("/", "").replace(".html", "");
            if(blackList.includes(pathname) && this.state.session){
                window.location.href = "/my-wallet.html#balances";
            }
        }
    }

    webAuthenticator(sessionToken){ 
        AlphaPoint.WebAuthenticate({SessionToken: sessionToken}, () => {
            window.fetchExchangeAndMarketData(document.APAPI);
        });  
    }


    onMouseMove(enter, id){
        this.setState({...this.state, hover: enter ? id : null})
    }

    toggleSubmenu(name){
        name === "wallet" 
            ? this.setState({...this.state, openWallet: !this.state.openWallet, openOrders: false}) 
            : this.setState({...this.state, openOrders: !this.state.openOrders, openWallet: false})
    }

    redirectTo(path){
        this.setState({...this.state, openMobileMenu: false});
        localStorage.setItem('pageProperties', JSON.stringify(pageProperties[path]));
        window.location.href = path;
    }

    encrypEmail(){
        if(this.state.user){
            const left = this.state.user.split("@")[0];
            const right = this.state.user.split("@")[1];
            const slice = Math.ceil(left.length/2);
            return left.slice(0, slice).concat("*".repeat(left.length-slice)).concat("@").concat(right)
        }
        return ""
    }

    render() {
        
        return ( 
            this.state.windowWidth > 1000 
            ?
            <nav className={this.state.navTop ? 'nav-top' : ""}>
                <div className="holder">
                    <div>
                        <a href="/"><img src={this.state.navTop ? "images/logos/orme-dark.png" : "img/orme-light.png"} alt="logo" width="141"/></a>
                        <ul className="menu">
                            <li>
                                <a href="/trade.html">Exchange</a>
                            </li>
                            <li>
                                <a href="/fees.html">Fees</a>
                            </li>
                            <li>
                                <a href="/faq.html">FAQ</a>
                            </li>
                            <li>
                                <a href="/contact.html">Contact Us</a>
                            </li>
                        </ul>
                    </div>
                    {
                        this.state.session
                        ? <div className="app-navigation">
                            <ul className="menu">
                                <li id="wallet" onMouseEnter={() => this.onMouseMove(true, "wallet")} onMouseLeave={() => this.onMouseMove(false)}>
                                    <a>Wallet <img src={this.state.navTop ? "img/drop-copy-2.svg" : "img/drop-copy.svg"} style={{marginLeft: '10px'}}/></a>
                                    {
                                        (this.state.hover === "wallet") &&
                                        <div>
                                            <div className={this.state.navTop ? 'nav-top' : ""}>
                                                <ul>
                                                    <li onClick={() => this.redirectTo("/my-wallet.html#balances")}><a style={style}>Balances</a></li>
                                                    <li onClick={() => this.redirectTo("/my-wallet.html#deposit")}><a style={style}>Deposit</a></li>
                                                    <li onClick={() => this.redirectTo("/my-wallet.html#withdrawal")}><a style={style}>Withdrawal</a></li>
                                                    <li onClick={() => this.redirectTo("/my-wallet.html#buy-crypto")}><a style={style}>Buy Crypto with Credit card</a></li>
                                                    <li onClick={() => this.redirectTo("/my-wallet.html#history")}><a style={style}>Deposit & Withdrawal history</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    }
                                </li>
                                <li id="orders" onMouseEnter={() => this.onMouseMove(true, "orders")} onMouseLeave={() => this.onMouseMove(false)}>
                                    <a>Orders <img src={this.state.navTop ? "img/drop-copy-2.svg" : "img/drop-copy.svg"} style={{marginLeft: '10px'}}/></a>
                                    {
                                        this.state.hover === "orders" &&
                                        <div>
                                            <div className={this.state.navTop ? 'nav-top' : ""}>
                                                <ul>
                                                    <li onClick={() => this.redirectTo("/orders.html#open-orders")}><a style={style}>Open orders</a></li>
                                                    <li onClick={() => this.redirectTo("/orders.html#filled-orders")}><a style={style}>Filled orders</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    }
                                </li>
                                <li id="account" onMouseEnter={() => this.onMouseMove(true, "account")} onMouseLeave={() => this.onMouseMove(false)}>
                                    <img src={`${this.state.navTop ? "img/account-img-color.svg"  : "img/account-img.svg"}`}/>
                                    {
                                        this.state.hover === "account" &&                                    
                                        <div>
                                            <div className={this.state.navTop ? 'nav-top' : ""}>
                                                <p style={{color: this.state.navTop ? "#333758" : '#ffffff'}}>{this.encrypEmail()}</p>
                                                <p id="account-status" style={{color: getAccountStatusColor(this.state.accountStatus)}}>
                                                    {this.state.accountStatus}
                                                </p>
                                                <hr/>
                                                <ul>
                                                    <li onClick={() => this.redirectTo("/settings.html#account-verification")}><img src={this.state.navTop ? 'img/verification-color.svg' : 'img/verification.svg'}/><a style={style}>Account verification</a></li>
                                                    <li onClick={() => this.redirectTo("/settings.html#security-settings")}><img src={this.state.navTop ? 'img/security-color.svg' : 'img/security.svg'}/><a style={style}>Security settings</a></li>
                                                    <li onClick={() => this.navigate()}><img src={this.state.navTop ? 'img/logout-color.svg': 'img/logout.svg'}/>Log out</li>
                                                </ul>
                                            </div>
                                        </div>
                                    }
                                </li>
                            </ul>
                        </div>
                        :
                        <div>
                            <ul className="menu">
                                <li><a href="/login.html">Log In</a></li>
                            </ul>
                        </div>
                    }
                </div>
            </nav>
            :
            <nav>
                <div className="holder">
                    <a href="/"><img src="img/orme-light.png" alt="" width="103"/></a>
                    <div className={`menu-hamburger ${this.state.openMobileMenu ? "open" : ""}`} onClick={() => this.setState({...this.state, openMobileMenu: !this.state.openMobileMenu})}>
                        <span className={`${this.state.openMobileMenu ? "open" : ""}`}></span>
                        <span className={`${this.state.openMobileMenu ? "open" : ""}`}></span>
                        <span className={`${this.state.openMobileMenu ? "open" : ""}`}></span>
                    </div>
                </div>
                 
                <div className={`menu-mobile ${this.state.openMobileMenu ? "open" : ""}`}>
                    {
                        this.state.session 
                        ?
                        <div>
                            <div className="section">
                                <p>Profile</p>
                                <div>
                                    <span>{this.encrypEmail()}</span>
                                    <span style={{color: getAccountStatusColor(this.state.accountStatus)}}>
                                        {this.state.accountStatus}
                                    </span>
                                </div>
                            </div>
                            <ul className="section">
                                <li onClick={() => this.redirectTo("/settings.html#account-verification")}><img src="img/verification.svg"/><a style={style}>Account verification</a></li>
                                <li onClick={() => this.redirectTo("/settings.html#security-settings")}><img src="img/security.svg"/><a style={style}>Security settings</a></li>
                                <li onClick={() => this.navigate()}><img src="img/logout.svg"/>Log out</li>
                            </ul>
                            
                            <div className="submenu-container">
                                <div>
                                    <span>Wallet</span>
                                    <span onClick={() => this.toggleSubmenu("wallet")}><img src="img/drop-copy.svg" className={this.state.openWallet ? "open" : ""}/></span>
                                </div>
                                {
                                    this.state.openWallet &&
                                    <ul>
                                        <li onClick={() => this.redirectTo("/my-wallet.html#balances")}><a style={style}>Balances</a></li>
                                        <li onClick={() => this.redirectTo("/my-wallet.html#deposit")}><a style={style}>Deposit</a></li>
                                        <li onClick={() => this.redirectTo("/my-wallet.html#withdrawal")}><a style={style}>Withdrawal</a></li>
                                        <li onClick={() => this.redirectTo("/my-wallet.html#buy-crypto")}><a style={style}>Buy Crypto with Credit card</a></li>
                                        <li onClick={() => this.redirectTo("/my-wallet.html#history")}><a style={style}>Deposit & Withdrawal history</a></li>
                                    </ul>
                                }
                            </div>
                            <div className="submenu-container">
                                <div>
                                    <span>Orders</span>
                                    <span onClick={() => this.toggleSubmenu("orders")}><img src="img/drop-copy.svg" className={this.state.openOrders ? "open" : ""}/></span>
                                </div>
                                {
                                    this.state.openOrders &&
                                    <ul>
                                        <li onClick={() => this.redirectTo("/orders.html#open-orders")}><a style={style}>Open orders</a></li>
                                        <li onClick={() => this.redirectTo("/orders.html#filled-orders")}><a style={style}>Filled orders</a></li>
                                    </ul>
                                }
                            </div>
                            <ul className="menu">
                                <li>
                                    <a href="/trade.html">Exchange</a>
                                </li>
                                <li>
                                    <a href="/fees.html">Fees</a>
                                </li>
                                <li>
                                    <a href="/faq.html">FAQ</a>
                                </li>
                                <li>
                                    <a href="/contact.html">Contact Us</a>
                                </li>
                                
                                
                            </ul>
                        </div>
                        :
                        <div>
                            <ul className="menu-logout">
                                <li>
                                    <a href="/trade.html">Exchange</a>
                                </li>
                                <li>
                                    <a href="/fees.html">Fees</a>
                                </li>
                                <li>
                                    <a href="/faq.html">FAQ</a>
                                </li>
                                <li>
                                    <a href="/contact.html">Contact Us</a>
                                </li>
                            </ul>
                            <ul className="menu-logout">
                                <li id="register">
                                    <a href="/signup.html">Register</a>
                                </li>
                                <li><a href="/login.html">Log In</a></li>
                            </ul>
                        </div>
                    }
                </div>
            </nav>
       )

    }
}



export default Navbar;