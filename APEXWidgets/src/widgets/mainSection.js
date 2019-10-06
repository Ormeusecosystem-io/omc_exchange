import React from 'react';
import ConfirmWithdrawPopup from './confirmWithdraw-v2';

class MainSection extends React.Component {

    constructor(props) {
        super(props); 
        this.state = {
            session: {}
        }
    }

    componentDidMount() {       
        this.session = AlphaPoint.getUser.subscribe(session => this.setState({ ...this.state, session })); 
    }

    getStarted(){
        const path = Object.keys(this.state.session).length > 0 ? "/my-wallet.html" : "/login.html";
        if(path.includes("my-wallet")){
            localStorage.setItem('pageProperties', JSON.stringify({view: 'balances', section: 'Wallet', productId: 1}));
        }
        window.location.href = path;
    }

    render() {
        return ( 
            <header id="main">
                {window.location.href.indexOf('confirmWithdraw') > -1 && <ConfirmWithdrawPopup/>}
                <div>
                    <div id="left">
                        <h1>Your trusted cryptocurrency exchange</h1>
                        <p>
                            Begin trading Bitcoin, Ethereum and other leading digital currencies with the most reliable crypto trading platform.
                        </p>
                        <button onClick={() => this.getStarted()}>Get Started</button>
                    </div>
                    <div id="right">
                        <img src="img/main-img.png"/>
                    </div>
                </div>
            </header>
       )

    }
}



export default MainSection;