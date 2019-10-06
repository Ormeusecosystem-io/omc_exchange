import React, { Component } from 'react';

class PopupPersonal extends Component {
    render() {
        return (
            <div className="overlay">
                <div className="Popup">
                    <p>Reportable person is a person/entity which is:</p>
                    <p>1. A U.S. citizen (including dual citizen);</p>
                    <p>2. A U.S. resident alien for tax purposes;</p>
                    <p>3. A partnership (form of corporate entity) established in the US; A company incorporated in the US;</p>
                    <p>4. Any trust if:</p>
                    <p>a. A court in the US is able to exercise primary supervision over the administration of the trust, and;</p>
                    <p>b. One or more US persons have the authority to control all substantial decisions of the trust</p>
                    <p>5. Any other person that is not a foreign person for US purposes;</p>
                    <p>6. In case of any company, if a shareholder holding more that 10% fulfils one of the above;</p>
                    
                    <button onClick={() => this.props.onClick()}>RETURN</button>
                    
                </div>
            </div>
        );
    }
}

export default PopupPersonal;