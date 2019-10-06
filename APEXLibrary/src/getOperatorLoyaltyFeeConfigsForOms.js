/* global AlphaPoint, document */
import logs from './logs';

function getOperatorLoyaltyFeeConfigsForOms(payload = {}) {
  logs.session.filter(open => open.SessionToken).subscribe(() => {
    document.APAPI.RPCCall(
      'GetOperatorLoyaltyFeeConfigsForOms',
      payload,
      data => {
        if (AlphaPoint.config.debug) {
          console.log('GetOperatorLoyaltyFeeConfigsForOms', data);
        }
        AlphaPoint.loyaltyFeeConfigs.onNext(data);
      }
    );
  });
}

export default getOperatorLoyaltyFeeConfigsForOms;
