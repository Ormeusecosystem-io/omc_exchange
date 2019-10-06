/* global document, AlphaPoint */

import logs from './logs';

function subscribeAccountEvents(accountId) {
  const requestPayload = {
    AccountId: accountId,
    OMSId: AlphaPoint.oms.value
  };

  // prettier-ignore
  logs.session
    .filter(open => open.SessionToken)
    .take(1)
    .subscribe(() => {
    document.APAPI.RPCCall(
      'SubscribeAccountEvents',
      requestPayload,
      () => {}
    );
  });
}

export default subscribeAccountEvents;
