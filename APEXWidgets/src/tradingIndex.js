/* global document, AlphaPoint, localStorage, window, $, Math */
import React from 'react';
import ReactDOM from 'react-dom';

import Modal from './widgets/modal';
import widgets from './widgets/tradingWidgetList';
import orderbook from './widgets/orderbook';
import {getURLParameter, toCamelCase} from './widgets/helper';
import initDepthChart from './widgets/depthChart';

import './styles/style.scss';

const rendered = [];
const resetPassword = getURLParameter('resetPass');
const verifyEmail = getURLParameter('verifyEmail');
const merchantConfirmation = getURLParameter('txnref');
const confirmWithdraw = getURLParameter('confirmWithdraw');

function renderCore(parameters, selector, callback = () => {
}) {
  const params = parameters || {};

  Array.from(document.querySelectorAll(selector)).forEach((element) => {
    Array.from(element.attributes).forEach((attr) => {
      const strippedName = toCamelCase(attr.name.replace('data-', ''));
      if (strippedName !== 'class') {
        params[strippedName] = attr.value === 'false' ? false : attr.value || true;
      }
    });

    try {
      callback(params, element);
    } catch (e) {
      console.error(e);
    }
  });
}

function renderWidget(parameters) {
  renderCore(parameters, '[ap-widget]', (params, element) => {
    const Widget = widgets[params.apWidget];

    if (Widget) {
      ReactDOM.render(<Widget {...params} />, element);
      if (rendered.indexOf(element) === -1) rendered.push(element);
    }
  });
}

function renderWidgetWrapper() {
  renderCore(null, '[ap-wrapper]', (params, element) => {
    if (element.innerHTML) params.innerHTML = element.innerHTML;// eslint-disable-line no-param-reassign

    const Widget = widgets[params.apWrapper];

    if (Widget && !element.holderNode) {
      // console.log(element.holderNode);
      element.holderNode = document.createElement('span'); // eslint-disable-line no-param-reassign
      element.appendChild(element.holderNode);

      element.addEventListener('click', (e) => {
        const close = () => ReactDOM.unmountComponentAtNode(element.holderNode);

        e.preventDefault();
        try {
          ReactDOM.render(<Modal close={close}><Widget {...params} /></Modal>, element.holderNode);
        } catch (e) {
          console.log(e);
        }
      });
    }
  });
}

function renderTranslation() {
  renderCore(null, '[ap-translate]', (params, element) => {
    const txt = AlphaPoint.translation(params.apTranslate);
    element.innerHTML = txt || element.innerHTML; // eslint-disable-line no-param-reassign
  });
}

function setLanguageDirection(langArg) {
  if(!AlphaPoint.config.languages) return;

  const languages = AlphaPoint.config.languages.items;
  const currentLang = languages.filter((configLang) => configLang.value === langArg)[0];

  if (currentLang) {
    $('body').attr('dir', currentLang.useRightToLeft ? 'RTL' : null);
    $('html').attr('lang', currentLang.value);
  }
}

function changeLanguage() {
  renderCore(null, '[ap-language]', (params, element) => {
    const language = params.apLanguage;

    if (!language) return;

    if (language === ((localStorage && localStorage.getItem('lang')) || AlphaPoint.config.defaultLanguage)) {
      element.classList.add('active');
    } else {
      element.classList.remove('active');
    }

    if (!element.language) {
      element.language = language; // eslint-disable-line no-param-reassign

      element.addEventListener('click', (e) => {
        e.preventDefault();

        if (localStorage) localStorage.setItem('lang', element.language);

        AlphaPoint.getLanguage({language: element.language});

        Array.from(document.querySelectorAll('[ap-language]')).forEach((elem) => {
          if (elem.language === element.language) {
            elem.classList.add('active');
          } else {
            elem.classList.remove('active');
          }
        });
      });
    }
  });
}

function renderActionWrapper() {
  const Actions = {
    Login: AlphaPoint.login,
    Logout: AlphaPoint.getLogout,
    SaveLocalstorage: AlphaPoint.saveLocalstorage,
  };
  renderCore(null, '[ap-action]', (params, element) => {
    const Action = Actions[params.apAction];

    if (Action && !element.currentAction) {
      element.currentAction = Action; // eslint-disable-line no-param-reassign
      element.addEventListener('click', (e) => {
        e.preventDefault();
        element.currentAction(null, () => {
          if (params.apAction === 'Logout') {
            if (params.to) {
              document.location = params.to;
            } else if (params.redirect && AlphaPoint.config.logoutRedirect) {
              document.location = AlphaPoint.config.logoutRedirect;
            }
          }
        });
      });
    }
  });
}

// clean up if widgets dom element is removed externally
document.addEventListener('DOMNodeRemoved', (e) => {
  if (rendered.indexOf(e.target) > -1) {
    rendered.splice(rendered.indexOf(e.target), 1);
    ReactDOM.unmountComponentAtNode(e.target);
  }
  if (rendered.indexOf(e.relatedNode) > -1) {
    rendered.splice(rendered.indexOf(e.relatedNode), 1);
    ReactDOM.unmountComponentAtNode(e.relatedNode);
  }
}, false);

const language = (localStorage && localStorage.lang) || AlphaPoint.config.defaultLanguage;
AlphaPoint.getLanguage({language});
setLanguageDirection(language);

window.renderWidget = renderWidget;
window.renderWidgetWrapper = renderWidgetWrapper;
window.renderActionWrapper = renderActionWrapper;
window.changeLanguage = changeLanguage;
window.renderTranslation = renderTranslation;
window.doSelectIns = orderbook.doSelectIns;

function init() {
  renderWidget();
  renderWidgetWrapper();
  renderActionWrapper();
  changeLanguage();
  setLanguageDirection(language);

  AlphaPoint.language.subscribe((langData) => {
    renderWidget({language: langData});
    renderTranslation();
    setLanguageDirection(langData);
  });

  if ($) {
    $('body').removeClass('loggedin');
    $('body').addClass('loggedout');
  }

  AlphaPoint.session.subscribe((data) => {
    if (!$) {
      return;
    }

    if ((data || {}).SessionToken) {
      $('body').addClass('loggedin');
      $('body').removeClass('loggedout');
    } else {
      $('body').removeClass('loggedin');
      $('body').addClass('loggedout');
    }
  });

  document.APAPI.IsConnectedEvent.attach((sender, connected) => {
    if (connected) {
      if (document.getElementById('depthChartHolder') && AlphaPoint.config.showDepthChart) {
        initDepthChart();
      }
      orderbook.init();
    }
  });

  // The following code was in a <script> tag in index.html
  $(document).ready(() => {
    $('.menu-hamburger').on('click', () => {
      if (AlphaPoint.config.siteName === 'aztec') {
        //return $('body').toggleClass('isOpen');
      }
      //return $('.content').toggleClass('isOpen');
      return $('.sidebar').toggleClass('isOpen');
    });

    $('.overlay').on('click', () => {
      $('body').toggleClass('isOpen');
    });

    $('.sidebar a').on('click', () => {
      $('body').toggleClass('isOpen');
    });

    $('#userMenu').on('click', 'a', (e) => {
      const accountId = e.target.dataset.id;

      if (accountId) {
        e.preventDefault();
        return document.APAPI.Session.changeCurrentAccount(accountId);
      }
      return true;
    });

    $('.widget-selector').on('change', function (e) {
      $(this).parent().siblings('.trigger-content').children()
        .css('display', 'none');
      $(`#${e.target.value}`).show();
    });

    $('.order-entry-select').val('orderEntryWidget').trigger('change');
    $('.open-orders-select').val('openOrdersContent').trigger('change');

    AlphaPoint.getUserConfig.subscribe((data) => {
      // if (data && data.marketMaker) { // Hide Quote Entry link when user is not marketMaker. Commented for development.
      $('.order-entry-trigger header select').removeClass('hide');
      $('.order-entry-trigger header label').addClass('hide');
      // }
    });
  });

  // Button ripple effect
  $('.btn-action').mousedown((e) => {
    const target = e.target;
    const rect = target.getBoundingClientRect();
    let ripple = target.querySelector('.ripple');
    $(ripple).remove();
    ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
    ripple.style.width = `${Math.max(rect.width, rect.height)}px`;
    target.appendChild(ripple);
    const top = e.pageY - rect.top - (ripple.offsetHeight / 2) - document.body.scrollTop;
    const left = e.pageX - rect.left - (ripple.offsetWidth / 2) - document.body.scrollLeft;
    ripple.style.top = `${top}px`;
    ripple.style.left = `${left}px`;
    return false;
  });

  if (!AlphaPoint.config.showBlockTradeUI) {
    $('trigger-4').hide();
    $('trade-reports-btn').hide();
    $('trigger-content-4').hide();
    $('inactive-ord-btn')[0].addClass('no-brd');
  }

  if (resetPassword) $('#resetPassword').click();
  if (verifyEmail) $('#verifyEmail').click();
  if (confirmWithdraw) $('#confirmWithdraw').click();
  if (merchantConfirmation) $('#merchantDepositConfirmation').click();
}

if (AlphaPoint.config.useCustomLoginScreen && (!localStorage.getItem('SessionToken') || localStorage.getItem('SessionToken') === 'undefined')) {
  document.location = AlphaPoint.config.logoutRedirect;
} else {
  init();
}
