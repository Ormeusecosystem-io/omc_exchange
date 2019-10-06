import logs from './logs';

// payload = {
//   int OMSId
//   int UserId
//   int AffiliateId
//   string AffiliateTag
// }

function addUserAffiliateTag(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('AddUserAffiliateTag', requestPayload, (data) => {
      if (data.result) {
        return AlphaPoint.getUserAffiliateTag({ OMSId: requestPayload.OMSId, UserId: requestPayload.UserId });
      }
      return $.bootstrapGrowl(
        data.errormsg,
        { ...AlphaPoint.config.growlerDefaultOptions, type: 'danger' },
      );
    });
  });
};


export default addUserAffiliateTag;
