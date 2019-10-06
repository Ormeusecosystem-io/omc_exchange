var APConfig = {
    // excludedProducts: ['BTC'],
    // excludedInstruments: ['BTCUSD'],
    maxFormTextLength: 128,
    showDepositBankDetails: false,
    depositFileUpload: false,
    showWidgetPageNumbers: true,
    showTermsandConditions: true,
    registerFormModal: true,
    showDepositBankDetails: true,
    allowCryptoPairs: true, // more pairs (buy/sell page)
    usePairDropdown: true, // change to dropdown currencies selection (sell/buy page)
    showBlockTradeUI: true,
    siteTitle: 'Coti',
    siteName: 'cotix.io',
    templateStyle: 'retail',
    displayBalancesHeaders: true,
    apexSite: false,
    clefLogin: '87c01336758f612feba9721d2c478059',
    useClef: false,
    clefFix: true,
    usePagi: false, // not in new v2 config.js
    usePagiExchange: true,
    pagination: true, // new in v2 config.js - Enable pagination with the default style.
    useBootstrapPagination: true, // new in v2 config.js - Enable using bootstrap style for pagination in dashboard pages, not trade
    useEmailAsUsername: false, // Use email as username. Show/hide username field on sign up form
    registerForm: {
        checkboxNotEUResident: false, // Show/hide UE Resident on sign up form
        showTermsandConditions: true, // show link to terms and condition on terms_accept text
        checkboxTermsAndConditions: false, // hide checkbox form terms_accept
        checkboxRiskOfCrypto: false,
    },
    usePagiExchange: true,
    chart_dark: true,
    VerifiedLevel: 2,
    confirmWithEmail: true, // new in v2 config.js - To confirm withdraw with email
    kycType: 'ManualKYC', // takes “IM”, “Jumio”, “Mitek”, “ManualKYC” ||  “greenId”
    mitekWithIdentityMind: false, // new in v2 config - 
    // home.gettingStarted.step3Img
    // home.gettingStarted.step2Img
    // home.gettingStarted.step1Img
    openKYCRedirectInNewWindow: false, // if set to true calls internalKYCRedirectURL
    internalKYCRedirectURL: false, //  'settings.html' this gets called if openKYCRedirectInNewWindow is set to true
    hideKYCVerifySteps: false, // if set to true hides the verify acct steps in KYC component
    showVerifyExplanation: true, // if true renders directions on how to start verification process in KYC component 
    hideKYCProgressBar: false,
    mitekDisabled: true,
    sendDocsToEmail: 'support@coti.com', // used in logic to describe to user their current KYC status and is used to link manual kyc level 0 email blast sent to broker/ exchange
    UnderManualReviewLevel: 1, // new in v2 config.js - For GreenId and Verification Required widget
    // kycFields new in v2  -  kycRequiredFields is deprecated in widgets ~ 1.1.0 
    kycFields: {
        dob: ['required'],
        firstName: ['required', 'alphanumeric'],
        lastName: ['required', 'alphanumeric'],
        telephone: ['required', 'integer'],
    },

    onlyShowOneCountryKYC: false, // used for logic in kycManual component - not in v2 config
    // kycCountriesList:  [{code: ‘’, name: ‘’},{}] - not in v2 config.js LFMB commented this entire line out because he thinks the common/countrylist.js should be doing this
    advancedUIKYC: true,
    useVerificationRequired: false,
    verificationRequiredLevel: [0], // [1,2] for IM and for ManualKYC with sendDocsToEmail enabled
    WithdrawCryptoProduct: ['LTC'],
    disableSendRequest: true,
    // kycClientId: 'cc1025a69dba4750a34cbad4cf261371', // for GreenId or IM
    API_V2_URL: 'wss://apicotiprod.alphapoint.com/WSGateway/',
    serversList: [],
    useServerSelect: false,
    hideKYCVerifySteps: true,
    // internalKYCRedirect: true,
    // internalKYCRedirectURL: 'https://kyc.quantaplc.im/api/login',
    // openKYCRedirectInNewWindow: true,
    // verificationRequiredLevel: [1], // [1,2] for IM and for ManualKYC with sendDocsToEmail enabled
    dateFormat: 'MM-DD-YYYY',
    OperatorId: 1,
    operatorUrl: 'domainname.com', // Affiliate site url;
    L2UpdateMethod: 2, //this is to use Joe's method of L2 updates
    baseCoin: 'USD',
    prodPair: 'BTCUSD',
    kycURL_NetVerify_SingleDocument: 'https://validation.alphapoint.com/api/im/NetverifyInitSingleDocument',
    loginRedirect: 'index.html',
    logoutRedirect: 'index.html',
    defaultLanguage: 'en',
    languagesLocation: 'lang',
    charting_library: 'libs/charting_library_new/',
    languages: {
        items: [{
                name: "English",
                value: "en"
            },
            {
                name: "Portuguese",
                value: "pt"
            },
        ]
    },
    authy2FA: false,
    authGoogle: true,
    debugging: false,
    useShapeShift: false,
    authGoogleSiteName: 'TraderUI', //this cannot have spaces
    apiKeysLevel: 0,
    withdrawLevel: 0,
    withdrawWidget: 2,
    decimalPlaces: 2, // change decimal price length on ORDER ENTRY (advanced UI) -> actually for my-accounts (Balances component)
    decimalPlacesPrice: 2, // change decimal price length on buy/sell page
    decimalPlacesTraderUI: 5, // change decimal price length on ACCOUNT OVERVIEW (advanced UI)
    advancedUITickerDecimalPlaces: 5, // change decimal price length on Ticker (advanced UI)
    disableLangUserInformation: true,
    decimalPlacesQty: 3,
    dealPrices: {
        ETHBTC: [0.01, 0.02, 0.05, 0.1],
        XMRBTC: [0.01, 0.02, 0.05, 0.1],
        XRPBTC: [0.01, 0.02, 0.05, 0.1],
        BCHBTC: [0.01, 0.02, 0.05, 0.1],
        LTCBTC: [0.01, 0.02, 0.05, 0.1],
        DASHBTC: [0.01, 0.02, 0.05, 0.1],
        ETCBTC: [0.01, 0.02, 0.05, 0.1],
        BTCUSD: [250, 500, 1000, 1000],
        ETHUSD: [250, 500, 1000, 1000],
        BTCEUR: [250, 500, 1000, 1000],
        ETHEUR: [250, 500, 1000, 1000],
        BTCGBP: [250, 500, 1000, 1000],
        ETHGBP: [250, 500, 1000, 1000],
        NEOBTC: [0.01, 0.02, 0.05, 0.1],
        IOTBTC: [0.01, 0.02, 0.05, 0.1],
        OMGBTC: [0.01, 0.02, 0.05, 0.1],
        ZECBTC: [0.01, 0.02, 0.05, 0.1],
        IOTABTC: [0.01, 0.02, 0.05, 0.1],
        IOTAUSD: [100, 200, 500, 1000],
        IOTAETH: [0.1, 0.2, 0.5, 1],
        XRPUSD: [100, 200, 500, 1000],
        LTCUSD: [100, 200, 500, 1000]
    },
    orderbookMaxLines: 30,
    maxLinesWidgets: 14,
    // v2Widgets: true, - not in v2 config.js
    orderBookSideRowCount: 30, // IMPORTANT: this is the row count for each side of the orderbook
    showDepthChart: true,
    chart: {
        disableLogo: true,
        height: '383px',
        timezone: "America/New_York",
        theme: "black",
        toolbar_bg: 'transparent',
        disabled_features: [
            'header_symbol_search',
            'header_compare',
            'header_fullscreen_button',
            'timeframes_toolbar',
            'control_bar',
            'edit_buttons_in_legend',
            'left_toolbar',
            'context_menus',
        ],
        overrides: {
            "paneProperties.background": "#2f3353", // MAIN CHART BACKGROUND COLOR, DON'T USE TRANSPARENT (try it to see why)
            "paneProperties.gridProperties.color": "#212427",
            "symbolWatermarkProperties.transparency": 90,
            "scalesProperties.textColor": "#565A5D",
            "scalesProperties.lineColor": "#303030",
            "scalesProperties.showLeftScale": !1,
            "scalesProperties.showRightScale": !0,
            "scalesProperties.backgroundColor": "transparent",
            "volumePaneSize": "large",
            "mainSeriesProperties.candleStyle.upColor": "#7ACD45", // UP TICK COLOR
            "mainSeriesProperties.candleStyle.downColor": "#FD5959", // DOWN TICK COLOR
            "mainSeriesProperties.candleStyle.borderUpColor": "#669656",
            "mainSeriesProperties.candleStyle.borderDownColor": "#964c4e",
            "mainSeriesProperties.candleStyle.drawWick": false,
            "mainSeriesProperties.hollowCandleStyle.drawWick": false,
            "mainSeriesProperties.haStyle.drawWick": false
        },
        custom_css_url: '../../../assets/css/shift-trade.css' // LINK TO EXTERNAL CSS
    },
    depthChartOptions: {
        chart: {
            type: 'area',
            backgroundColor: 'rgba(0,0,0,0)',
        },
        title: {
            text: 'Depth Chart',
            align: 'left',
            style: {
                color: '#FFF',
                fontSize: '14px',
                fontFamily: '"Roboto", sans-serif',
                fontWeight: 'bold'
            }
        },
        legend: {
            enabled: false,
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
            x: 150,
            y: 100,
            floating: true,
            borderWidth: 1,
            backgroundColor: '#121212',
            itemStyle: {
                color: '#999999'
            },
            itemHoverStyle: {
                color: '#CCCCCC'
            },
            itemHiddenStyle: {
                color: '#444444'
            }
        },
        tooltip: {
            formatter: function() {
                const baseDecimals = this.series.baseCurr === 'USD' ? 2 : 8;
                const quoteDecimals = this.series.quoteCurr === 'USD' ? 2 : 8;
                return '<b>' + this.series.name + '</b><br/>' +
                    this.x.toFixed(quoteDecimals) + this.series.quoteCurr + ': ' + this.y.toFixed(baseDecimals) + this.series.baseCurr;
            }
        },
        plotOptions: {
            series: {
                fillOpacity: 0.35,
                step: 'left'
            }
        },
        xAxis: {
            title: {
                text: ''
            }
        },
        yAxis: {
            title: {
                text: ''
            },
            gridLineColor: 'rgba(0,0,0,0)'
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Bids',
            color: '#7ACD45',
            data: []
        }, {
            name: 'Asks',
            color: '#FD5959',
            data: []
        }]
    },
    deposit: {
        types: {
            BTC: 1,
            USD: 2,
            EUR: 2,
            GBP: 4
        },
        items: [{
            type: 1,
            title: 'BTC - Bitcoin',
            instrument: 'BTC'
        }, {
            type: 2,
            title: 'USD - United States Dollars',
            instrument: 'USD'
        }, {
            type: 2,
            title: 'EUR - Euro',
            instrument: 'EUR'
        }, {
            type: 4,
            title: 'GBP - British Pound',
            instrument: 'GBP'
        }]
    },
    withdraw: {
        types: {
            fiat: 1,
            digital: 2
        },
        items: [{
            type: 2,
            title: 'BTC - Bitcoin',
            instrument: 'BTC',
        }, {
            type: 1,
            title: 'USD - United States Dollars',
            instrument: 'USD',
        }, {
            type: 1,
            title: 'EUR - Euro',
            instrument: 'EUR',
        }, {
            type: 1,
            title: 'GBP - British Pound',
            instrument: 'GBP',
        }]
    },
    withdrawFee: {
        Bitcoin: {
            BTC: 0.0003
        },
        Litecoin: {
            LTC: 0.001
        }
    },
    sendFee: {
        BTC: 0.0003,
        LTC: 0.001,
    },
    TwoFACookie: 'UNOAuth',
    currencyLimits: [{
            name: "BTC",
            level0: {
                daily: 1,
                monthly: 1
            },
            level1: {
                daily: 3,
                monthly: 3
            },
            level2: {
                daily: 6,
                monthly: 6
            }
        },
        {
            name: "USD",
            level0: {
                daily: '500',
                monthly: '1,000'
            },
            level1: {
                daily: '2,500',
                monthly: '2,500'
            },
            level2: {
                daily: '5,000',
                monthly: '5,000'
            }
        },
        {
            name: "EUR",
            level0: {
                daily: '480',
                monthly: '960'
            },
            level1: {
                daily: '2,400',
                monthly: '2,400'
            },
            level2: {
                daily: '4,800',
                monthly: '4,800'
            }
        },
        {
            name: "PHP",
            level0: {
                daily: "25,000",
                monthly: '500'
            },
            level1: {
                daily: "125,000",
                monthly: "125,000"
            },
            level2: {
                daily: "250,000",
                monthly: "250,000"
            }
        }
    ],
    balances: {
        currenciesWithActionBtns: [ // show withdraw and Deposit buttons for this currencies
            'BTC',
            'ETH',
            'USD'
        ]
    },
    trade: {
        hideDepositWhitdrawCurrencies: [
            'IOTA',
            'Ripple',
            'Litecoin'
        ]
    },
    clickableStep1Level: 3, // config for ShiftHomeCoindirect, do step 1 clickable for some levels
    reCaptchaSiteKey: "6LeFaFkUAAAAAJVL3BuBTdv9kT2Hk2fJTKlodoXm",
    reCaptchaTheme: 'dark', // options are 'light' or 'dark'
    tickerBlock: 'TickerBlockPxChange', // NEW IN 1.2.0, 'TickerBlockPxChange' to see new ticker behavior
    instrumentSelectTicker: true, // NEW IN 1.2.0, true to use Coti's instrument select widget with ticker
    loyaltyToken: false, // NEW IN 1.2.0, true to use new loyalty token behavior
};
