/* global document, AlphaPoint, $ */
import logs from './logs';

function resetPassword(data = {}) {
  const requestPayload = {
    userName: data.UserName
  };

  // prettier-ignore
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('ResetPassword',requestPayload, (data) => {
      AlphaPoint.resetPass.onNext(data);
      // if (data.result) {
      //   $.bootstrapGrowl('Please check your email for password reset link', { 
      //     type: 'info',
      //     allow_dismiss: true,
      //     align: AlphaPoint.config.growlwerPosition,
      //     delay: AlphaPoint.config.growlwerDelay,
      //     offset: { from: 'top', amount: 30 },
      //     left: '70%'
      //   });
      // }
    });
  });
}

export default resetPassword;
