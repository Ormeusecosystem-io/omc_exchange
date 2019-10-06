/* global document, AlphaPoint */
import logs from './logs';

function validateUserRegistration(data = {}) {
  logs.socketOpen
    // prettier-ignore
    .filter(open => open)
    .take(1)
    .subscribe(open => {
      document.APAPI.RPCCall('ValidateUserRegistration', data, data => {
        let res;
        try {
          res = JSON.parse(data.result);
        } catch (error) {
          // console.log(error)
          res = data.result
        }
        AlphaPoint.verifylevel.onNext(res);
      });
    });
}

export default validateUserRegistration;
