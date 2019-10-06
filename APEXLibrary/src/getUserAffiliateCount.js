import logs from './logs';

// payload = {}

function getUserAffiliateCount(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetUserAffiliateCount', requestPayload, (data) => {
      AlphaPoint.userAffiliateCount.onNext(data);
    });
  });
};


export default getUserAffiliateCount;
