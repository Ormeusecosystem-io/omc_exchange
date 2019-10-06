import logs from './logs';

function getUserPermissions(UserId) {
  const payload = {
    OMSId: AlphaPoint.oms.value ? AlphaPoint.oms.value : 1,
    UserId,
  };

  logs.session
  .filter(open => open.SessionToken)
  .take(1)
  .subscribe((open) => {
    document.APAPI.RPCCall('GetUserPermissions', payload, (data) => {
      const permissions = data.map((permission) => permission.toLowerCase());

      AlphaPoint.userPermissions.onNext(permissions);
    });
  });
};

export default getUserPermissions;
