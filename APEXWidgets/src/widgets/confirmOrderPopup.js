import React from 'react';

class confirmOrderPopup extends React.Component {

    state = {
        hover: false,
        disclaimerConfirmation: false
    }

    onMouseMove(flag){
        this.setState({hover: flag})
    }

    onToggleCheckbox = (name, value) => {
        this.setState({[name]: value});
    } 
    
    render() {
        const {product2symbol, price, product1symbol, received, fee, net_amount_bought, fixedOrder, close, user} = this.props;
        return (
            <div id="overlay">
                <div id="popup" className="verification">
                    <h2>Confirm your order</h2>
                    <p>Please check the details of your order are correct before continuing with the payment process…</p>
                    <ul>
                        <li>
                            <div>Total cost</div>
                            <div>{price} {product2symbol}</div>
                        </li>
                        <li>
                            <div>Order amount</div>
                            <div>{received} {product1symbol}</div>
                        </li>
                        <li>
                            <div>Transaction fee</div>
                            <div>{fee} {product1symbol}</div>
                        </li>
                        <li style={{background: "#50557b"}}>
                            <div id="tooltip-trigger">Net amount received<img src="img/info.svg" onMouseEnter={() => this.onMouseMove(true)} onMouseLeave={() => this.onMouseMove(false)}/></div>
                            <div>{net_amount_bought} {product1symbol}</div>
                            {this.state.hover && <div id="tooltip">Final amount will be calculated once the payment has been processed.</div>}
                        </li>
                        <li style={{fontSize: "12px"}}>
                            <div>Deposit to account</div>
                            <div>{user}</div>
                        </li>
                    </ul>
                    <div className="confirmation-disclaimer-wrapper">
                        <div id="confirmationDisclaimer">
                            <p>Disclaimer</p>
                            <p>I hereby confirm that I am executing an order to exchange fiat money to cryptocurrencies trough Orme.io's exchange platform, and I hereby confirm that I have read, understand and agree to the Risk Warning presented on the website's footer. I hereby release and forever discharge Orme from any claim, argument and/or demand with connection with any issues related to this order execution.</p>
                        </div>
                        <label htmlFor="disclaimerConfirmation">
                            <div className={!this.state.disclaimerConfirmation ? "disclaimerConfirmationCheckboxUI" :  "disclaimerConfirmationCheckboxUI checked"} ></div>
                            <input type="checkbox" id="disclaimerConfirmation" name="disclaimerConfirmation" value={this.state.disclaimerConfirmation} checked={this.state.disclaimerConfirmation} onClick={({target}) => this.onToggleCheckbox( target.name , target.checked)}/>
                            I have read and agreed to the disclaimer
                        </label>
                    </div>
                    <div>
                        <span onClick={() => close()}>Cancel</span>
                        <button onClick={() => fixedOrder()} disabled={!this.state.disclaimerConfirmation} className={`${this.state.disclaimerConfirmation ? '' : 'disabled'}` } >Go to payment</button>
                    </div>
                </div>
            </div>
        )
    }
}



export default confirmOrderPopup;