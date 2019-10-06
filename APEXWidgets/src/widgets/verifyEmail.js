/* global $, atob, AlphaPoint */
import React from 'react';

import WidgetBase from './base';
import { getURLParameter, showGrowlerNotification } from './helper';

class VerifyEmail extends React.Component {
  componentDidMount() {
    this.handleSubmit();
  }

  handleSubmit = () => {
    const self = this;
    const encodedUrl = getURLParameter('d1');
    const verifyCode = getURLParameter('verifycode');
    const userId = getURLParameter('UserId');

    if (!encodedUrl) {
      showGrowlerNotification('error', AlphaPoint.translation('VERIFY_EMAIL_MODAL.ERROR_D1') || 'Required parameter d1 was not found in url');
      return;
    }
    if (!verifyCode) {
      showGrowlerNotification('error', AlphaPoint.translation('VERIFY_EMAIL_MODAL.ERROR_VERIFY_CODE') || 'Required parameter verifycode was not found in url');
      return;
    }
    if (!userId) {
      showGrowlerNotification('error', AlphaPoint.translation('VERIFY_EMAIL_MODAL.ERROR_USER_ID') || 'Required parameter UserId was not found in url');
      return;
    }

    const ajaxUrl = atob(encodedUrl);
    const payload = {
      VerifyEmailCode: verifyCode,
      UserId: +userId,
    };

    $.ajax({
      type: 'POST',
      url: `${ajaxUrl}confirmemail`,
      data: JSON.stringify(payload),
      dataType: 'JSON',
      success: (data) => {
        if (!data.result) {
          if (data.rejectReason) {
            showGrowlerNotification('error', AlphaPoint.translation('VERIFY_EMAIL_MODAL.VERIFICATION_ERROR') || `Email verification error: ${data.rejectReason}`);
            return false;
          }
          showGrowlerNotification('error', AlphaPoint.translation('VERIFY_EMAIL_MODAL.VERIFICATION_ERROR') || 'Email verification error');
          return false;
        }
        showGrowlerNotification('success', AlphaPoint.translation('VERIFY_EMAIL_MODAL.VERIFICATION_SUCCESS') || 'Email verification successful');
        return self.props.close();
      },
    });
  }

  render() {
    return (
      <WidgetBase
        {...this.props}
        headerTitle={AlphaPoint.translation('VERIFY_EMAIL_MODAL.TITLE_TEXT') || 'Verify email address'}
        style={{ width: '600px' }}
      >
        <form>
          <div className="pad">{AlphaPoint.translation('VERIFY_EMAIL_MODAL.VERIFYING') || 'Verifying email address...'}</div>
        </form>
      </WidgetBase>
    );
  }
}

export default VerifyEmail;
