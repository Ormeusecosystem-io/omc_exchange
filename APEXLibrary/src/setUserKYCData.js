import config from './config';
import ajax from './ajax';
import events from './events/setup';

/**
*  {@link AlphaPoint.getUserInfo} callback
*  @callback AlphaPoint~getUserInfoCallback
*  @param {object} response
*  @param {boolean} response.isAccepted
*  @param {string} response.rejectReason
*  @param {string} response.affiliateId
*  @param {string} response.firstName
*  @param {string} response.lastName
*  @param {boolean} response.UseAuthy2FA
*  @param {boolean} response.UseGoogle2FA
*  @param {boolean} response.GoogleAuthSiteName
*  @param {number[]} response.verificationLevels
*/

/**
*  getUserInfo
*  @memberof AlphaPoint
*  @param {object} data
*  @param {string} data.firstName
*  @param {string} data.lastName
*  @param {boolean} data.UseAuthy2FA
*  @param {boolean} data.UseGoogle2FA
*  @param {string} [data.sessionToken=Logged in sessionToken]
*  @param {AlphaPoint~getUserInfoCallback} [callback] - The callback that handles the response.
*/
function setUserKYCData(data = {}, callback) {
  const newData = {};
  const userKYC_KVP = [];

  newData.sessionToken = data.sessionToken || events.session.value.sessionToken;

  for (const key in data) {
    if (data[key] === undefined) data[key] = '';
    if (
      key !== 'sessionToken' &&
      key !== 'idFrontB64' &&
      key !== 'idBackB64' &&
      key !== 'idHeldB64'
    ) {
      userKYC_KVP.push({ key, value: data[key].toString() });
    }
  }
  newData.userKYC_KVP = userKYC_KVP;
  newData.idFrontB64 = data.idFrontB64;
  newData.idBackB64 = data.idBackB64;
  newData.idHeldB64 = data.idHeldB64;

  if (!newData.sessionToken || !newData.userKYC_KVP.length) {
    // console.log('setUserInfo missing fields');
    return;
  }
  // console.log(`kyc data: ${JSON.stringify(newData)}`);
  ajax({ url: config.http.SetUserKYCData, data: newData }, res => {
    // console.log(res);
    return callback && callback(res);
  });
}

export default setUserKYCData;
