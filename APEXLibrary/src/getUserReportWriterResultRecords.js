import logs from './logs';

function getUserReportWriterResultRecords() {
  const requestPayload = {};

  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetUserReportWriterResultRecords', requestPayload, (data) => {
      AlphaPoint.userReports.onNext(data);
    });
  });
};

export default getUserReportWriterResultRecords;
