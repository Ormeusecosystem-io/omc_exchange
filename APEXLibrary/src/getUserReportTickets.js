import logs from './logs';

function getUserReportTickets() {
  const requestPayload = {
    UserId: AlphaPoint.userData.value.UserId,
  };

  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetUserReportTickets', requestPayload, (data) => {
      AlphaPoint.userReportTickets.onNext(data);
    });
  });
};

export default getUserReportTickets;
