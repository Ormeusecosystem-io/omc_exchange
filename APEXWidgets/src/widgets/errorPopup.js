import React from 'react';

class verificationPopup extends React.Component {
    
    render() {
        return (
            <div id="overlay">
                <div id="popup">
                    {this.props.errorMessage.includes("no market") ? <img src="img/no-market.svg"/> : <img src="img/verify-big.svg"/>}
                    <p>{this.props.errorMessage}</p>
                    {
                        this.props.errorMessage.includes("require") ?
                            <div id="actions">
                                <button onClick={() => this.props.close()}>No, don’t verify</button>
                                <button onClick={() => this.props.verify()}>Yes, verify</button>
                            </div>
                        :
                        <div id="actions" style={{justifyContent: "center"}}>
                            <button onClick={() => this.props.close()}>Close</button>
                        </div>
                    }
                </div>
            </div>
        )
    }
}



export default verificationPopup;