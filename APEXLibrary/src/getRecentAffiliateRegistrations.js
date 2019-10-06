import logs from './logs';

// payload = {
//   int UserId	 *UserId and Tag should be exclusive, one or the other
//   string Tag
//   DateTime StartDate	*Required
//   DateTime EndDate
// }

function getRecentAffiliateRegistrations(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetRecentAffiliateRegistrations', requestPayload, (data) => {
      AlphaPoint.recentAffiliateRegistrations.onNext(data);
    });
  });
};


export default getRecentAffiliateRegistrations;
