function retryLogin(payload = {}) {
  const SessionToken = localStorage.getItem('SessionToken');

  if (SessionToken && SessionToken !== 'undefined') {
    return document.APAPI.RPCCall(
      'WebAuthenticateUser',
      { SessionToken },
      (data) => {
        if (data.UserId) return true;
        window.location = AlphaPoint.config.logoutRedirect;
        return false;
      }
    );
  }
  window.location = AlphaPoint.config.logoutRedirect;
  return false;
}

export default retryLogin;
