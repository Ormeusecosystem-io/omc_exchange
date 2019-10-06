/* global AlphaPoint */
import React from 'react';

import WidgetBase from './base';
import InputLabeled from '../misc/inputLabeled';

class WithdrawPM extends React.Component {
  constructor() {
    super();

    this.state = {
      error: '',
      information: '',
      processing: false,
    };
  }

  withdraw = () => {
    this.setState({
      error: '',
      information: AlphaPoint.translation('COMMON.PLEASE_WAIT') || 'Please wait...',
      processing: true,
    });

    const data = {};
    data.fullName = `userAccountID ${AlphaPoint.accountInformation.value.userId}`;
    data.currencyCode = 'usd'; // todo: fix
    data.amount = this.refs.amount.value();
    data.comment = this.refs.comment.value();
    data.userAddress = this.refs.address.value();
    data.bankAccountNumber = `
      ABA: ${this.refs.aba.value()}, SWIFT: ${this.refs.swift.value()}, Bank Account#: ${this.refs.bankNumber.value()}
    `;

    AlphaPoint.submitWithdrawFiatForm(data, (res) => this.setState({
      error: res.rejectReason,
      information: 'Sent',
      processing: false,
    }));
  }

  render() {
    return (
      // wrap all content in widget base
      <WidgetBase {...this.props} headerTitle={'Withdraw Perfect Money'} >
        <div className="pad">
          <div>Create a Withdraw ticket</div>
          <p>Withdrawing Perfect Money can take up to 48 hours to process.</p>
          <br />
          <InputLabeled
            placeholder="Perfect Money ID"
            className="form-control"
            label="Perfect Money Account ID (i.e. U1234567)"
          />
          <InputLabeled
            placeholder="Amount"
            type="number"
            className="form-control"
            label="Amount"
          />
        </div>
        <div className="clearfix pad">
          <div className="pull-right">
            <button className="btn btn-action" onClick={this.props.close} >Cancel</button>
            {' '}
            <button className="btn btn-action" >Submit</button>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

WithdrawPM.defaultProps = {
  close: () => {},
};

WithdrawPM.propTypes = {
  close: React.PropTypes.func,
};

export default WithdrawPM;
