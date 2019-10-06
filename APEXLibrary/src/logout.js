import config from './config';
import logs from './logs.js';

function reset() {
  logs.session.onNext({})
}

function logout(data = {}) {
  localStorage.setItem('SessionToken', '');
  if (data.SessionToken) {
    logs.session.onNext({})
    document.location = AlphaPoint.config.logoutRedirect;
  } else {
    reset();
    document.location = AlphaPoint.config.logoutRedirect;
  }
};

export default logout;
