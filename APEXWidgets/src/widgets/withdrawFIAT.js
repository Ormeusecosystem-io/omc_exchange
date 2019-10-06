/* global AlphaPoint */
import React from 'react';

import WidgetBase from './base';
import InputLabeled from '../misc/inputLabeled';
import TextareaLabeled from '../misc/textareaLabeled';
import ProcessingButton from '../misc/processingButton';

class WithdrawFIAT extends React.Component {
  constructor() {
    super();

    this.state = {
      data: {},
      processing: false,
    };
  }

  withdraw() {
    this.setState({ processing: true, data: {} });

    const data = {};
    data.fullName = this.refs.fullName.value();
    data.currencyCode = this.props.Product;
    data.amount = this.refs.amount.value();
    data.comment = this.refs.comment.value();
    data.userAddress = this.refs.address.value();
    data.bankAccountNumber = `BSB: ${this.refs.aba.value()}, Bank Account#: ${this.refs.bankNumber.value()}`;

    AlphaPoint.submitWithdrawFiatForm(data, (res) => this.setState({ data: res, processing: false }));
  }

  render() {
    return (
      // wrap all content in widget base
      <WidgetBase
        {...this.props}
        headerTitle={`${AlphaPoint.translation('WITHDRAW.WITHDRAW') || 'Withdraw'} ${this.props.Product ? `(${this.props.Product})` : ''}`}
        error={this.state.error}
        success={this.state.success}
      >
        {!this.state.data.isAccepted ?
          <div className="pad">
            <p>Withdraw Form</p>
            <p>Create the withdraw ticket.</p>

            <div>
              <InputLabeled placeholder="Full Name" ref="fullName" />
              <InputLabeled placeholder="Registered Address" ref="address" />
              <InputLabeled placeholder="Amount" ref="amount" type="number" />
              <InputLabeled placeholder="BSB" ref="aba" />
              <InputLabeled placeholder="Bank Account #" ref="bankNumber" />

              <p>The comment field is optional. Please use it for special instructions.</p>
              <TextareaLabeled rows="6" placeholder={AlphaPoint.translation('WITHDRAW.COMMENT_LABEL') || 'Comment'} ref="comment" />
            </div>

            <div className="clearfix">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {this.props.close && <button className="btn btn-action" onClick={this.props.close}>Close</button>}
                {' '}
                <ProcessingButton
                  className="btn btn-action"
                  processing={this.state.processing}
                  disabled={this.state.processing}
                  onClick={this.withdraw}>Submit</ProcessingButton>
              </div>
            </div>

          </div>
          :
          <div className="pad">
            <h3 className="text-center">Withdraw request sent.</h3>
            <div className=" clearfix">
              <div className="pull-right">
                {this.props.close && <button className="btn btn-action" onClick={this.props.close}>Close</button>}
              </div>
            </div>
          </div>}
      </WidgetBase>
    );
  }
}

WithdrawFIAT.defaultProps = {
  Product: '',
  close: () => {},
};

WithdrawFIAT.propTypes = {
  Product: React.PropTypes.string,
  close: React.PropTypes.func,
};

export default WithdrawFIAT;
