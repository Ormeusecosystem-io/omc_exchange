/* global document */
import logs from './logs';
import AlphaPoint from './library';

// prettier-ignore
function getWithdrawFee(requestPayload = {}) {
  logs.socketOpen
  .filter(open => open)
  .take(1)
  .subscribe(() => {
    document.APAPI.RPCCall(
      'GetWithdrawFee',
      requestPayload,
      data => AlphaPoint.withdrawFee.onNext(data.FeeAmount))
  });
}

export default getWithdrawFee;
