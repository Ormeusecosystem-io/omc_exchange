import ajax from './ajax';
import config from './config';

/**
*  {@link AlphaPoint.resetPassword2} callback
*  @callback AlphaPoint~resetPassword2Callback
*  @param {object} response
*  @param {boolean} response.isAccepted
*  @param {string} response.rejectReason
*/

/**
*  resetPassword2
*  @memberof AlphaPoint
*  @param {Object} data
*  @param {String} data.verifyCode
*  @param {AlphaPoint~resetPassword2Callback} [callback] - The callback that handles the response.
*/
function resetPassword2(data = {}, callback) {
  if (!data.verifyCode) {
    return callback && callback({ isAccepted: false, rejectReason: 'Missing fields' });
  }

  ajax({ url: config.http.ResetPassword2, data:data }, (res) => callback && callback(res));
};

export default resetPassword2;
