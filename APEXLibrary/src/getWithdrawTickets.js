import logs from './logs';

function getWithdrawTickets(payload = {}) {
  logs.socketOpen
  .filter((open) => open)
  .take(1)
  .subscribe(() => {
    document.APAPI.RPCCall('GetWithdrawTickets', payload, (data) => {
      const update = {
        ...AlphaPoint.withdrawTickets.value,
        [payload.AccountId]: data,
      };
      AlphaPoint.withdrawTickets.onNext(update);
    });
  });
};


export default getWithdrawTickets;
