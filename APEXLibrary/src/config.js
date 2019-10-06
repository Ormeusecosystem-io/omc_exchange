const config = global.APConfig || {};
let exchange = {};
if (config.exchange) exchange = config.exchange;

const defaultConfig = {
  loyaltyToken: config.loyaltyToken || false,
  displayBalancesHeaders: config.displayBalancesHeaders || false,
  noBalanceFilter: config.noBalanceFilter || false,
  BalanceHover: config.BalanceHover || true,
  showDepositBankDetails: config.showDepositBankDetails || false,
  depositFileUpload: config.depositFileUpload || false,
  nonFavIconSpinner: config.nonFavIconSpinner || false, // used by CoinDirect when there is no fav icons used
  showWidgetPageNumbers: config.showWidgetPageNumbers || true,
  showTermsandConditions: config.showTermsandConditions || true,
  registerFormModal: config.registerFormModal || true,
  locale: config.locale || 'en',
  siteName: config.siteName || '',
  pagination: config.pagination || true,
  templateStyle: config.templateStyle || '',
  clefLogin: config.clefLogin || '',
  useClef: config.useClef || false,
  clefFix: config.clefFix || false,
  clefRedirectURL: config.clefRedirectURL || '',
  companyName: config.companyName || 'Alitin',
  companyCopyright: config.companyCopyright || 'Bitcoin Co', // company copyright text
  kycURL_NetVerify_SingleDocument: config.kycURL_NetVerify_SingleDocument || '',
  loginRedirect: config.loginRedirect || '',
  logoutRedirect: config.logoutRedirect || '',
  useRedirect :config.useRedirect || false,
  redirectPageExemptions: config.redirectPageExemptions || ['','index.html', 'about.html', 'terms.html', 'privacy.html'],

  apiKeysLevel: config.apiKeysLevel || 0,
  withdrawLevel: config.withdrawLevel || 0,
  debugging: config.debugging || false,
  kycType: config.kycType || 'Identity Mind',
  kycClientId: config.kycClientId || '',
  kycURL:
    config.kycURL ||
    'http://dev-validation.alphapoint.com/api/im/ValidateUserRegistration_v2',

  API_V2_URL: config.API_V2_URL || 'ws://demo.alphapoint.com:8086/WSGateway/',
  OperatorId: config.OperatorId || 1,
  prodPair: config.prodPair || 'BTCUSD',
  decimalPlaces: config.decimalPlaces || 4,
  growlwerPosition: config.growlwerPosition || 'left',
  growlwerDelay: config.growlwerDelay || 4000,

  authy2FA: config.authy2FA, // enable authentication using 2FA
  authGoogle: config.authGoogle, // enable authentication using Google

  reCaptcha_siteKey: '6LcIpp0UAAAAAOQ2mvehoPx4NT8OVD-NPWsIpIkw',
  defaultLanguage: config.defaultLanguage || 'en',
  languagesLocation: config.languagesLocation || 'dist/lang',

  api_version: exchange.app_version || config.api_version || 'v1',
  use_sim: exchange.use_sim || config.use_sim,

  app_url_sim: exchange.app_url_sim || 'https://sim3.alphapoint.com:8400/ajax',
  ws_url_sim: exchange.ws_url_sim || 'wss://sim3.alphapoint.com:8401',

  app_url:
    exchange.app_url ||
    config.app_url ||
    'https://sim3.alphapoint.com:8400/ajax',
  ws_url: exchange.ws_url || config.ws_url || 'wss://sim3.alphapoint.com:8401',
  ws_apis: [
    'GetTicker',
    'GetL2AndTrades',
    'GetAccountInfo',
    'GetAccountActions'
  ],
  ws: {},
  http: {},

  chart: config.chart || {},
  charting_url:
    exchange.charting_url ||
    config.charting_url ||
    'wss://dev2.alphapoint.com:8402/v1/GetRealTime/',
  charting_library: config.charting_library || 'libs/charting_library_new/',

  deposit: config.deposit || {
    types: {
      bitcoin: 1,
      usd: 2,
      eur: 3,
      pm: 4
    },
    items: [
      {
        type: 1,
        title: 'Digital Currency'
      },
      {
        type: 2,
        title: 'USD - United States Dollars',
        instrument: 'USD'
      },
      {
        type: 3,
        title: 'EUR - Euro',
        instrument: 'EUR'
      },
      {
        type: 4,
        title: 'Perfect Money',
        parameters: {
          // Perfect Money parameters
          currencies: [
            {
              title: 'USD',
              account: 'XX'
            },
            {
              title: 'EUR',
              account: 'XX'
            }
          ],
          payeeName: 'Alitin Exchange' // payee name
        }
      }
    ]
  },
  useWithdrawFees: typeof config.useWithdrawFees === 'undefined' ? true : config.useWithdrawFees,
  withdraw: config.withdraw || {
    types: {
      fiat: 1,
      digital: 2,
      perfectMoney: 3
    },
    items: [
      {
        type: 2,
        title: 'BTC - BitCoin',
        instrument: 'BTC'
      },
      {
        type: 2,
        title: 'LTC - LiteCoin',
        instrument: 'LTC'
      },
      {
        type: 2,
        title: 'PPC',
        instrument: 'PPC'
      },
      {
        type: 2,
        title: 'NMC',
        instrument: 'NMC'
      },
      {
        type: 1,
        title: 'EUR - Euro',
        instrument: 'EUR'
      },
      {
        type: 2,
        title: 'CNY',
        instrument: 'CNY'
      },
      {
        type: 1,
        title: 'USD - United States Dollar',
        instrument: 'USD'
      },
      {
        type: 3,
        title: 'Perfect Money'
      }
    ]
  },
  optionalNewDepositKeys: true
};

function method_url(methodName) {
  return `${this.use_sim ? this.app_url_sim : this.app_url}/${this
    .api_version}/${methodName}`;
}

function ws_method_url(methodName) {
  return `${this.use_sim ? this.ws_url_sim : this.ws_url}/${this
    .api_version}/${methodName}/`;
}

defaultConfig.ws_apis.forEach(url => {
  defaultConfig.ws[url] = ws_method_url.call(defaultConfig, url);
});

Object.keys(defaultConfig).forEach(field => {
  config[field] = defaultConfig[field];
});

export default config;
