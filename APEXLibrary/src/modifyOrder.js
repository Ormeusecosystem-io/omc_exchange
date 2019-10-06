import logs from './logs';

function modifyOrder() {
  const requestPayload = {
    OMSId: localStorage.oms,
    OrderId: 2565,
  };

  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('ModifyOrder', requestPayload, console.log);
  });
};

export default modifyOrder;
