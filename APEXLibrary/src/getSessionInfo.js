import config from './config';
import ajax from './ajax';
import events from './events/setup';

/**
*  getSessionInfo callback
*  @callback AlphaPoint~getSessionInfoCallback
*  @param {object} response
*  @param {boolean} response.isAccepted
*  @param {string} response.rejectReason - only populated if IsAccepted is false
*  @param {boolean} response.isAccepted
*  @param {number} response.accountId
*  @param {number} response.expiryTimeMinutes
*  @param {boolean} response.isFromAPIKey
*  @param {number} response.lastActivityTime
*  @param {string} response.sessionToken
*  @param {number} response.timeLoggedOn
*  @param {string} response.twoFaRequestType
*  @param {string} response.userId - Email address
*/

/**
*  This needs to be called before the token expires in order to keep it alive.
*  @memberof AlphaPoint
*  @param {object} data
*  @param {string} data.sessionToken
*  @param {AlphaPoint~getSessionInfoCallback} callback - The callback that handles the response.
*/
function getSessionInfo(data = {}, callback) {
  data.sessionToken = data.sessionToken || events.session.value.sessionToken;

  ajax({ url: config.http.GetSessionInfo, data }, (res) => {
    if (res) {
      events.session.onNext(res);
      return callback && callback(res);
    }
  });
};

export default getSessionInfo;
