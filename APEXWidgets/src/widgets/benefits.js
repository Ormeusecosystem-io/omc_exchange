import React from 'react';

class Benefits extends React.Component {

    state = {
       
    }

    render() {
        return ( 
            <section id="benefits">
                <div>
                    <div>
                        <div className="wrapper"><img src="img/safe-secure.svg"/></div>
                        <h4>Secure and reliable</h4>
                        <p>Multi-level encryption technology, offline cold wallet support, two factor authentication (2FA) ensure the highest security standards.</p>
                    </div>
                    <div>
                        <div className="wrapper"><img src="img/fast-responsive.svg"/></div>
                        <h4>Fast-paced and efficient</h4>
                        <p>ORME streamlines trading with near instantaneous transaction processing, countless trading pairs and a suite of innovative features.</p>
                    </div>
                    <div>
                    <div className="wrapper"><img src="img/support.svg"/></div>
                        <h4>Round the clock support</h4>
                        <p>Trade anywhere and anytime with our state of the art 24/7 trading platform. Access prompt customer service support when you need it.</p>
                    </div>
                </div>
            </section>
       )
    }
}



export default Benefits;