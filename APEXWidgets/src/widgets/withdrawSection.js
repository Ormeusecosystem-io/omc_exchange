/* global AlphaPoint */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import AccountTransactions from './accountTransactions';
import VerificationRequired from './verificationRequired';
import DepositDigital from './depositDigital';
import WithdrawDigital from './withdrawDigital';

class WithdrawSection extends React.Component {

    render(){
        return (
            <div style={{width: '100%'}}>
                <VerificationRequired>
                    <WithdrawDigital
                        Product={this.props.Product}
                        balance={this.props.availableBalance}
                        fullName={this.props.fullName}
                        changeProd={this.props.changeProd}
                        checkWithdrawPermission={() => this.props.checkWithdrawPermission()}
                    />
                </VerificationRequired>
                <AccountTransactions withdraw product={this.props.Product} productId={this.props.productId}/>
            </div>
        )
    }
}


export default WithdrawSection;
