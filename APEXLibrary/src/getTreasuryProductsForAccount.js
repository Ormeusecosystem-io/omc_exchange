import logs from './logs';

function getTreasuryProductsForAccount(requestPayload = {}) {
  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetTreasuryProductsForAccount', requestPayload, (data) => {
      AlphaPoint.treasuryProducts.onNext(data);
    });
  });
};

export default getTreasuryProductsForAccount;
