import logs from './logs';

function getAccountPositions(accountId) {
  if (!AlphaPoint.oms.value) return;

  const requestPayload = {
    AccountId: accountId,
    OMSId: AlphaPoint.oms.value,
  };

  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetAccountPositions', requestPayload, (data) => {
      AlphaPoint.accountPositions.onNext(AlphaPoint.accountPositions.value.concat(data));
    });
  });
};


export default getAccountPositions;
