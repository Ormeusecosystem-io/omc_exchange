import React from 'react';

export const SuccessPopup = (props) => (
    <div id="layout">
        <div id="popup">
            <img src="img/change-pass-popup.svg"/>
            <p className="text-center success">Check your email for withdrawal confirmation link</p>
            <button onClick={()=>props.close()}>Close</button>
        </div>
    </div>
)