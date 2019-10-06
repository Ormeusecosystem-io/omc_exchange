import React from 'react';

export const ProgressBar = ({step}) => (
    <div className="progress-bar-verification">
        <div className={`step ${step === 1 ? "active" : ""}`}>
            <img src={step === 1 ? "img/personal-active.svg" : "img/personal-done.svg"}/>
            <span>Personal</span>
        </div>
        <div className="stroke"></div>
        <div className={`step ${step === 2 ? "active" : ""}`}>
            <img src={step === 2 ? "img/identity-active.svg" : step === 1 ? "img/identity-idle.svg" : "img/identity-done.svg"}/>
            <span>Identity</span>
        </div>
        <div className="stroke"></div>
        <div className={`step ${step === 3 ? "active" : ""}`}>
            <img src={step === 3 ? "img/residence-active.svg" : step < 3 ? "img/residence-idle.svg" : "img/residence-done.svg"}/>
            <span>Residence</span>
        </div>
        <div className="stroke"></div>
        <div className={`step ${step === 4 ? "active" : ""}`}>
            <img src={step === 4 ? "img/payment-idle-active.svg" : "img/payment-idle.svg"}/>
            <span>Payment</span>
        </div>
    </div>
)