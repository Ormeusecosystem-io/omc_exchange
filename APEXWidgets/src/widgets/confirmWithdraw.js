/* global $, atob, AlphaPoint */
import React from 'react';

import WidgetBase from './base';
import { getURLParameter, showGrowlerNotification } from './helper';

class ConfirmWithdraw extends React.Component {
  componentDidMount() {
    this.handleSubmit();
  }

  handleSubmit = () => {
    const self = this;
    const encodedUrl = getURLParameter('d1');
    const verifyCode = getURLParameter('verifycode');
    const userId = getURLParameter('UserId');

    if (!encodedUrl) {
      showGrowlerNotification('error', AlphaPoint.translation('CONFIRM_WITHDRAW.ENCODE_URL_ERROR') || 'Required parameter d1 was not found in url');
      return;
    }
    if (!verifyCode) {
      showGrowlerNotification('error', AlphaPoint.translation('CONFIRM_WITHDRAW.VERIFY_CODE_ERROR') || 'Required parameter verifycode was not found in url');
      return;
    }
    if (!userId) {
      showGrowlerNotification('error', AlphaPoint.translation('CONFIRM_WITHDRAW.USER_ID_ERROR') || 'Required parameter UserId was not found in url');
      return;
    }

    const ajaxUrl = atob(encodedUrl);
    const payload = {
      verifycode: verifyCode,
      UserId: +userId,
    };

    $.ajax({
      type: 'POST',
      url: `${ajaxUrl}confirmwithdraw`,
      data: JSON.stringify(payload),
      dataType: 'JSON',
      success: (data) => {
        if (!data.result) {
          if (data.rejectReason) {
            showGrowlerNotification('error', `${AlphaPoint.translation('CONFIRM_WITHDRAW.CONFIRMATION_ERROR') || 'Withdraw confirmation error'}: ${data.rejectReason}`);
            return false;
          }
          showGrowlerNotification('error', AlphaPoint.translation('CONFIRM_WITHDRAW.CONFIRMATION_ERROR') || 'Withdraw confirmation error');
          return false;
        }
        showGrowlerNotification('success', AlphaPoint.translation('CONFIRM_WITHDRAW.CONFIRMATION_SUCCESS') || 'Withdraw confirmation successful');
        return self.props.close();
      },
    });
  }

  render() {
    return (
      <WidgetBase
        {...this.props}
        headerTitle={AlphaPoint.translation('CONFIRM_WITHDRAW.TITLE_TEXT') || 'Confirm Withdraw'}
        style={{ width: '600px' }}
      >
        <div className="pad confirm-withdraw-inner">
          <div className="text-center">{AlphaPoint.translation('CONFIRM_WITHDRAW.PENDING') || 'Confirming withdraw...'}</div>
        </div>
      </WidgetBase>
    );
  }
}

export default ConfirmWithdraw;
