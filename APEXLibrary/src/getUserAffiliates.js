import logs from './logs';

// payload = {
//   int OMSId
//   int UserId
// }

function getUserAffiliates(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetUserAffiliates', requestPayload, (data) => {
      AlphaPoint.userAffiliates.onNext(data);
    });
  });
};


export default getUserAffiliates;
