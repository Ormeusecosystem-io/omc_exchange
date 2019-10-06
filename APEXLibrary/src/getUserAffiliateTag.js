import logs from './logs';

// payload = {
//   int OMSId
//   int UserId
// }

function getUserAffiliateTag(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetUserAffiliateTag', requestPayload, (data) => {
      AlphaPoint.userAffiliateTag.onNext(data);
    });
  });
};


export default getUserAffiliateTag;
