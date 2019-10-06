import React from 'react';

class CreditCard extends React.Component {

    constructor(props) {
        super(props); 
        this.state = {
            session: {}
        }
    }

    componentDidMount() {       
        this.session = AlphaPoint.getUser.subscribe(session => this.setState({ ...this.state, session })); 
    }

    buyNow(){
        const path = Object.keys(this.state.session).length > 0 ? "/my-wallet.html#buy-crypto" : "/login.html";
        if(path.includes("my-wallet")){
            localStorage.setItem('pageProperties', JSON.stringify({view: 'buy-crypto', section: 'Wallet', productId: 1}));
        }
        window.location.href = path;
    }

    render() {
        return ( 
            <section id="credit-card">
                <div>
                    <div id="left">
                        <h2>Buy crypto simply and easily using your credit card</h2>
                        <p>Make a purchase using your credit or debit card, select your cryptocurrency and buy on the fly. Credit cards make it extremely quick and user-friendly for first-time buyers to buy cryptocurrencies and to avoid time-consuming wire transfers.</p>
                        <button onClick={() => this.buyNow()}>Buy Now</button>
                    </div>
                    <div id="right">
                        <img src="img/credit-card-big.svg"/>
                    </div>
                </div>
            </section>
       )

    }
}



export default CreditCard;