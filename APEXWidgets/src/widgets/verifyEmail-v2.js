/* global $, atob, AlphaPoint */
import React from 'react';

import WidgetBase from './base';
import { getURLParameter } from './helper';

class VerifyEmailV2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      success: false,
      error: false,
      confirming: true,
      errormsg: ''
    } 

  }
  componentDidMount() {
    if (window.location.href.indexOf('verifyEmail') > -1) {
      const self = this;
      setTimeout(function () {
        self.handleSubmit();
      }, 1000);
    }
  }
  handleSubmit = () => {
    const self = this;
    const encodedUrl = getURLParameter('d1');
    const verifyCode = getURLParameter('verifycode');
    const userId = getURLParameter('UserId');

    if (!encodedUrl) {
      this.setState({ confirming: false, error: true, errormsg: 'Required parameter d1 was not found in url' });
      return;
    }
    if (!verifyCode) {
      this.setState({ confirming: false, error: true, errormsg: 'Required parameter verifycode was not found in url' });
      return;
    }
    if (!userId) {
      this.setState({ confirming: false, error: true, errormsg: 'Required parameter UserId was not found in url' });
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
          if (data.errormsg) {
            this.setState({ confirming: false, error: true, errormsg: data.errormsg })
            return false;
          }
          this.setState({ confirming: false, error: true })
          return false;
        }
        this.setState({ confirming: false, success: true })
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
          <div className="pad verify-email-inner">
            {this.state.success &&
              <div className="text-center success">{AlphaPoint.translation('VERIFY_EMAIL_MODAL.SUCCESS') || 'Email Verification Successful. You may now login to your account'}</div>
            }
            {this.state.error &&
              <div className="text-center error">{AlphaPoint.translation('VERIFY_EMAIL_MODAL.ERROR') || 'There was an error in verifying your email'}<br />{this.state.errormsg}</div>
            }
            {this.state.confirming &&
              <div className="text-center confirming">{AlphaPoint.translation('VERIFY_EMAIL_MODAL.PENDING') || 'Hang on, we are verifying your email.'}</div>
            }
          </div>
        </form>
      </WidgetBase>
    );
  }
}

export default VerifyEmailV2;
