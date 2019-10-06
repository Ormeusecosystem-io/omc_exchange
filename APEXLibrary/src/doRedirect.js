/* global document, AlphaPoint, $, localStorage */
const redirect = function(url) {
  let myPath = url.split('/'); // split by
  myPath = myPath.pop(); // make url the last element in the array

  // console.log("Local Storage",localStorage);

  // console.log('Path', myPath);

    const doRedirect = AlphaPoint.config.redirectPageExemptions.filter(page => {
      return myPath === page;
    });
    // console.log('Redirect length', doRedirect);
    if (doRedirect.length === 0 && localStorage.SessionToken === 'undefined') {

      localStorage.setItem('coindirectRedirect', true);
      // console.log('Location', myPath);

      $.bootstrapGrowl('You are not logged in.', {
        type: 'danger',
        allow_dismiss: true,
        align: AlphaPoint.config.growlwerPosition,
        delay: AlphaPoint.config.growlwerDelay,
        offset: { from: 'top', amount: 30 },
        left: '70%'
      });
      $.bootstrapGrowl('You will be redirected', {
        type: 'danger',
        allow_dismiss: true,
        align: AlphaPoint.config.growlwerPosition,
        delay: AlphaPoint.config.growlwerDelay,
        offset: { from: 'top', amount: 30 },
        left: '70%'
      });
      setTimeout(() => {
        document.location = AlphaPoint.config.logoutRedirect;
      }, 4000);
    }

  // if (
  //   localStorage.SessionToken === 'undefined' &&
  //   ( myPath !== '' &&
  //     myPath !== 'index.html' &&
  //     myPath !== 'security.html' &&
  //     myPath !== 'features.html' &&
  //     myPath !== 'currencies.html' &&
  //     myPath !== 'funding.html' &&
  //     myPath !== 'api.html' &&
  //     myPath !== 'contact.html' &&
  //     myPath !== 'fees.html' &&
  //     myPath !== 'verification-levels.html' &&
  //     myPath !== 'faq.html' &&
  //     myPath !== 'announcements.html' &&
  //     myPath !== 'about.html' &&
  //     myPath !== 'terms.html' &&
  //     myPath !== 'terms' &&
  //     myPath !== 'privacy.html' &&
  //     myPath !== 'comingsoon.html')
  // ) {
  //
  //   localStorage.setItem('coindirectRedirect', true);
  //   console.log('Location', myPath);
  //
  //   $.bootstrapGrowl('You are not logged in.', {
  //     type: 'danger',
  //     allow_dismiss: true,
  //     align: AlphaPoint.config.growlwerPosition,
  //     delay: AlphaPoint.config.growlwerDelay,
  //     offset: { from: 'top', amount: 30 },
  //     left: '70%'
  //   });
  //   $.bootstrapGrowl('You will be redirected', {
  //     type: 'danger',
  //     allow_dismiss: true,
  //     align: AlphaPoint.config.growlwerPosition,
  //     delay: AlphaPoint.config.growlwerDelay,
  //     offset: { from: 'top', amount: 30 },
  //     left: '70%'
  //   });
  //   setTimeout(() => {
  //     document.location = AlphaPoint.config.logoutRedirect;
  //   }, 4000);
  // }

  const redirectedStatus = localStorage.coindirectRedirect
    ? JSON.parse(localStorage.coindirectRedirect)
    : false;
  if (redirectedStatus && myPath === AlphaPoint.config.logoutRedirect) {
    $.bootstrapGrowl('You have been redirected', {
      type: 'danger',
      allow_dismiss: true,
      align: AlphaPoint.config.growlwerPosition,
      delay: AlphaPoint.config.growlwerDelay,
      offset: { from: 'top', amount: 30 },
      left: '70%'
    });
    localStorage.setItem('coindirectRedirect', false);
  }

  const redirectedStatusUsers = localStorage.userSettingsUpdate
    ? JSON.parse(localStorage.userSettingsUpdate)
    : false;
  if (redirectedStatusUsers && myPath === 'settings.html') {
    localStorage.setItem('userSettingsUpdate', false);
  }
};

module.exports = redirect;
