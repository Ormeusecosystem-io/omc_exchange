/* global AlphaPoint */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import AccountTransactions from './accountTransactions';
import VerificationRequired from './verificationRequired';
import DepositDigital from './depositDigital';

class DepositSection extends React.Component {

    render(){
        return (
            <div style={{width: '100%'}}>
                <VerificationRequired>
                    <DepositDigital
                        Product={this.props.Product}
                        changeProd={this.props.changeProd}
                    />
                </VerificationRequired>
                <AccountTransactions deposit product={this.props.Product} productId={this.props.productId}/>
            </div>
        )
    }
}


export default DepositSection;
