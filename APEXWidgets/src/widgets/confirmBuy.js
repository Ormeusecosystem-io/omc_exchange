/* global AlphaPoint */
import React from 'react';

import WidgetBase from './base';

class ConfirmBuy extends React.Component {
  constructor() {
    super();

    this.state = {
      session: {},
    };
  }

  componentDidMount() {
    this.session = AlphaPoint.getUser.subscribe(session => this.setState({ session }));
  }

  componentWillUnmount() {
    this.session.dispose();
  }

  render() {
    return (
      <WidgetBase {...this.props} headerTitle={`${this.props.action} Confirmation`}>
        <div className="modal-body">
          <div className="pad text-center">
            <p className="text-center modal-paragraph" />
            <div className="row">
              <div className="col-sm-12 text-center">
                <p>
                  {this.state.session.UserName} {AlphaPoint.translation('CONFIRM_BUY.PURCHASE_MSG_A') || 'you are about to purchase bitcoin at the price below.'}
                  {AlphaPoint.translation('CONFIRM_BUY.PURCHASE_MSG_B') || 'They will arrive in your account...'}
                </p>
              </div>

              <div style={{ fontWeight: '500' }} className="confirm-modal col-sm-12 text-center">
                <div style={{ display: 'inline-block', width: '150px', textAlign: 'left' }}>
                  <div>{AlphaPoint.translation('CONFIRM_BUY.BTC_PURCHASED') || 'BTC Purchased'}</div>
                  <div>{AlphaPoint.translation('CONFIRM_BUY.TRANSACTION_FEE') || 'Transaction Fees'}</div>
                  <div>{AlphaPoint.translation('CONFIRM_BUY.TOTAL_AMOUNT') || 'Total Amount'}</div>
                </div>
                <div style={{ display: 'inline-block', textAlign: 'right' }}>
                  <div>{AlphaPoint.translation('CONFIRM_BUY.TOTAL') || 'Total'} </div>
                  <div>{AlphaPoint.translation('CONFIRM_BUY.FEE_AMNT') || 'Fee'}</div>
                  <div>{AlphaPoint.translation('CONFIRM_BUY.TOTAL') || 'Total'} </div>
                  <div>{AlphaPoint.translation('CONFIRM_BUY.FEE_AMNT') || 'Fee'}</div>
                </div>
              </div>
            </div>
            <a className="deposit-button btn btn-action btn-modal" data-dismiss="modal" onClick={this.verficationWindow}>{AlphaPoint.translation('CONFIRM_BUY.PLACE_ORDER_A') || 'Place'} {this.props.action} {AlphaPoint.translation('CONFIRM_BUY.PLACE_ORDER_B') || 'Order'}</a>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

ConfirmBuy.defaultProps = {
  action: '',
};

ConfirmBuy.propTypes = {
  action: React.PropTypes.string,
};

export default ConfirmBuy;
