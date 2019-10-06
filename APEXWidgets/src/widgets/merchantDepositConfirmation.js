/* global document, AlphaPoint */
import React from 'react';

import WidgetBase from './base';

class MerchantDepositConfirmation extends React.Component {
  constructor() {
    super();

    this.state = {
      data: {},
      status: '',
    };
  }

  componentDidMount() {
    const data = {};
    const status = {
      1: 'pending',
      2: 'successful',
      3: 'failed',
    };

    document.location.search.substr(1).split('&').forEach(query => {
      const [key, value] = query.split('=');

      data[key] = value;
    });

    this.setState(() => ({ status: status[data.txnState] }));
  }

  render() {
    const { status } = this.state;

    if (status === 'pending') {
      return (
        <WidgetBase
          {...this.props}
          headerTitle="Deposit pending"
          style={{ width: '600px' }}
        >
          <div className="pad">
            <div style={{ textAlign: 'center' }}>
              <i style={{ color: 'white', fontSize: '5rem' }} className="material-icons">alarm</i>
            </div>
            <div style={{ fontSize: '1rem', textAlign: 'center', margin: '1rem 0', lineHeight: '2' }}>
              {AlphaPoint.translation('DEPOSIT_CONFIRMATION.PENDING_MESSAGE1') || 'Your deposit is being processed.'}<br />
              {AlphaPoint.translation('DEPOSIT_CONFIRMATION.PENDING_MESSAGE2') || 'Your account balance will be updated soon.'}
            </div>
          </div>
        </WidgetBase>
      );
    }

    if (status === 'successful') {
      return (
        <WidgetBase
          {...this.props}
          headerTitle="Deposit successful"
          style={{ width: '600px' }}
        >
          <div className="pad">
            <div style={{ textAlign: 'center' }}>
              <i style={{ color: 'white', fontSize: '5rem' }} className="material-icons">check_circle</i>
            </div>
            <div style={{ fontSize: '1rem', textAlign: 'center', margin: '1rem 0', lineHeight: '2' }}>
              {AlphaPoint.translation('DEPOSIT_CONFIRMATION.SUCCESSFUL_MESSAGE1') || 'Your deposit was successfull.'}<br />
              {AlphaPoint.translation('DEPOSIT_CONFIRMATION.SUCCESSFUL_MESSAGE2') || 'Your account balance will be updated soon.'}
            </div>
          </div>
        </WidgetBase>
      );
    }

    if (status === 'failed') {
      return (
        <WidgetBase
          {...this.props}
          headerTitle="Deposit error"
          style={{ width: '600px' }}
        >
          <div className="pad">
            <div style={{ textAlign: 'center' }}>
              <i style={{ color: 'white', fontSize: '5rem' }} className="material-icons">cancel</i>
            </div>
            <div style={{ fontSize: '1rem', textAlign: 'center', margin: '1rem 0', lineHeight: '2' }}>
              {AlphaPoint.translation('DEPOSIT_CONFIRMATION.FAILED_MESSAGE1') || 'There was a problem with your deposit.'}<br />
              {AlphaPoint.translation('DEPOSIT_CONFIRMATION.FAILED_MESSAGE2') || 'Please try again or contact an administrator.'}
            </div>
          </div>
        </WidgetBase>
      );
    }

    return null;
  }
}

MerchantDepositConfirmation.defaultProps = {
  close: () => { },
};

MerchantDepositConfirmation.propTypes = {
  close: React.PropTypes.func,
};

export default MerchantDepositConfirmation;
