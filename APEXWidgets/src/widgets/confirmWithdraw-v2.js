/* global $, atob, AlphaPoint */
import React from 'react';
import ScrollLock from 'react-scrolllock';
import WidgetBase from './base';
import { getURLParameter } from './helper';

class ConfirmWithdrawV2 extends React.Component {
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
      const self = this;
      setTimeout(function () {
        self.handleSubmit();
      }, 1000);
  }
  handleSubmit = () => {
    const self = this;
    const encodedUrl = getURLParameter('d1');
    const verifyCode = getURLParameter('verifycode');
    const userId = getURLParameter('UserId');

    if (!encodedUrl) {
      this.setState({ confirming: false, error: true, errormsg: AlphaPoint.translation('CONFIRM_WITHDRAW_V2.ENCODED_URL_ERROR') || 'Required parameter d1 was not found in url' });
      return;
    }
    if (!verifyCode) {
      this.setState({ confirming: false, error: true, errormsg: AlphaPoint.translation('CONFIRM_WITHDRAW_V2.VERIFY_CODE_ERROR') || 'Required parameter verifycode was not found in url' });
      return;
    }
    if (!userId) {
      this.setState({ confirming: false, error: true, errormsg: AlphaPoint.translation('CONFIRM_WITHDRAW_V2.USER_ID_ERROR') || 'Required parameter UserId was not found in url' });
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

  closePopup() {
    this.setState({
      ...this.state,
      success: false,
      error: false,
      confirming: false,
    })
  }
  render() {
    return (
      (this.state.confirming || this.state.success || this.state.error) && (getURLParameter('verifycode') && getURLParameter('d1'))  && 
      <WidgetBase
        {...this.props}
        headerTitle={AlphaPoint.translation('CONFIRM_WITHDRAW.TITLE') || 'Confirm Withdraw'}
        style={{ width: '600px' }}
        modalId="confirmWithdrawV2"
      >
        <div className="pad confirm-withdraw-inner">
          <span onClick={()=> this.closePopup()}> + </span>
          <h1>Confirm Withdraw</h1>
          {this.state.success &&
            <div className="text-center success">
              
             <p>
             Withdraw Confirmation Successful.
             </p> 
             <p>
             It make require several blocks confirmation before the transaction appears in your wallet.
             </p> 
            </div>
          }
          {this.state.error &&
            <div className="text-center error">{AlphaPoint.translation('CONFIRM_WITHDRAW.ERROR') || 'There was an error in confirming your withdraw:'}<br />{this.state.errormsg}</div>
          }
          {this.state.confirming &&
            <div className="text-center confirming">{AlphaPoint.translation('CONFIRM_WITHDRAW.PENDING') || 'Hang on, we are confirming your withdraw.'}</div>
          }
        </div>
      </WidgetBase>
    );
  }
}

export default ConfirmWithdrawV2;
