'use strict';
/*
 This class implements interaction with UDF-compatible datafeed.

 See UDF protocol reference at
 https://github.com/tradingview/charting_library/wiki/UDF
 */

var ChartAPI = {};
var instrumentsArray = [];
var amcid = 0;
var connected = false;
var tryReconnect = false;
var _amsynchro = {};
var callback;
var lastBar;
var subscriptionIntervalMs;
var unsubscribeReqObj = {};

ChartAPI.UDFCompatibleDatafeed = function(datafeedURL, updateFrequency, protocolVersion) {
    this._datafeedURL = datafeedURL;
    this._configuration = undefined;

    this._symbolSearch = null;
    this._symbolsStorage = null;
    this._protocolVersion = protocolVersion || 2;

    this._enableLogging = false;
    this._initializationFinished = false;
    this._callbacks = {};

    this.connected = false;

    this.ws = new AP_API();
    this.ws.Connect(datafeedURL);

    this.ws.IsConnectedEvent.attach(this._initialize.bind(this));

    AlphaPoint.instruments.subscribe( function(data) {
        instrumentsArray = data;
    });

    // if (this.connected) {
    //     this.ws.onclose = function () { }; // disable onclose handler first
    //     this.ws.close();
    // }
    // this.ws = new WebSocket(datafeedURL);

    // this.ws.onmessage = this.onMessage;
    // this.ws.onopen = this.wsOpened;
    // this.ws.onerror = function (ev) { console.log(ev.data); }
    // this.ws.onclose = this.wsClosed;


    // this._initialize();
};


// ChartAPI.UDFCompatibleDatafeed.prototype.wsOpened = function(event) {
//     this.connected = true;
// }

ChartAPI.UDFCompatibleDatafeed.prototype.onMessage = function(ev) {
    var frame = JSON.parse(ev.data);
    var synchroCallBack = _amsynchro[frame.i];
    // console.log(synchroCallBack)
    // console.log("message " + frame.n);
    if (synchroCallBack === undefined) {
        if (frame.n == "TickerDataUpdateEvent") {
            // console.log("Ticker update");
            var data = JSON.parse(frame.o);
            // console.log(data);
            if (callback != undefined && callback != null) {
                var newBar = buildBar(data[0]);

                if (lastBar != null) {
                    if (newBar.time - subscriptionIntervalMs < lastBar.time) {
                        newBar.time = lastBar.time;
                    }

                    callback(newBar);
                    lastBar = newBar;
                }
            }
        }
        else {
            // console.log("******");
            // console.log("message " + frame.n);
            // console.log("******");
        }
    }
    else {
        if (frame.o == '') {
            synchroCallBack({});
        }
        else {
            // console.log("syncro callbacl");
            if (synchroCallBack != null) {
                synchroCallBack(JSON.parse(frame.o));
                // _amsynchro[frame.i] = null;
            }
        }
    }
};


// ChartAPI.UDFCompatibleDatafeed.prototype.wsClosed = function() {
//     // showErrorMsg("Connection Closed");
//     this.connected = false;
//     ChartAPI.UDFCompatibleDatafeed.prototype.Reconnect();
// };

// ChartAPI.UDFCompatibleDatafeed.prototype.InvokeRPC = function(fn,payload) {
//     var frame = {};
//     frame.m = 0;
//     frame.i = this.amcid;
//     frame.n = fn;
//     frame.o = JSON.stringify(payload);
//     var f = JSON.stringify(frame);
//     this.ws.send(f);
//     this.amcid += 2;
// };

// ChartAPI.UDFCompatibleDatafeed.prototype.SubscribeEvent = function(ev) {
//     var frame = {};
//     frame.m = 2;
//     frame.i = this.amcid;
//     frame.n = ev;
//     frame.o = "";
//     var f = JSON.stringify(frame);
//     this.ws.RPCCallLevel2(ev, '');
//     // console.log(ev, ": ", f);

//     this.amcid += 2;
// };

// ChartAPI.UDFCompatibleDatafeed.prototype.amSynchroCall = function(remoteFunction, payload, callback) {
//     // if (!this.connected) {
//     //     return;
//     // }
//     var frame = {};
//     frame.m = 0;
//     frame.i = this.amcid;
//     frame.s = '';
//     _amsynchro[amcid] = callback;
//     frame.n = remoteFunction;
//     frame.o = JSON.stringify(payload);
//     var f = JSON.stringify(frame);
//     this.ws.send(f);
//     // console.log(remoteFunction, ": ", f);
//     this.amcid += 2;
// };

// ChartAPI.UDFCompatibleDatafeed.prototype.Reconnect = function() {
//     setTimeout(function () {
//         if (this.tryReconnect) {
//             this.ws = new WebSocket(host);
//             this.ws.onmessage = this.onMessage;
//             this.ws.onopen = this.wsOpened;
//             this.ws.onerror = function (ev) { console.log(ev.data); }
//             this.ws.onclose = this.wsClosed;
//         }
//     }, 5000);
// }


ChartAPI.UDFCompatibleDatafeed.prototype.defaultConfiguration = function() {
    return {
        supports_search: true,
        supports_group_request: false,
        supported_resolutions: [1, 5, 15, 30, 60, 360, 720, 'D', 'W', 'M'],
        supports_marks: false,
        supports_timescale_marks: false
    };
};

ChartAPI.UDFCompatibleDatafeed.prototype.getServerTime = function(callback) {
    if (this._configuration.supports_time) {
        this._send(this._datafeedURL + '/time', {})
            .done(function (response) {
                callback(+response);
            })
            .fail(function() {

            });
    }
};

ChartAPI.UDFCompatibleDatafeed.prototype.on = function (event, callback) {

    if (!this._callbacks.hasOwnProperty(event)) {
        this._callbacks[event] = [];
    }

    this._callbacks[event].push(callback);
    return this;
};

ChartAPI.UDFCompatibleDatafeed.prototype._fireEvent = function(event, argument) {
    console.log("event" + event)
    if (this._callbacks.hasOwnProperty(event)) {
        var callbacksChain = this._callbacks[event];
        for (var i = 0; i < callbacksChain.length; ++i) {
            callbacksChain[i](argument);
        }

        this._callbacks[event] = [];
    }
};

ChartAPI.UDFCompatibleDatafeed.prototype.onInitialized = function() {
    console.log("on initialized")
    this._initializationFinished = true;
    this._fireEvent('initialized');
};

ChartAPI.UDFCompatibleDatafeed.prototype._logMessage = function(message) {
    if (this._enableLogging) {
        var now = new Date();
        console.log(now.toLocaleTimeString() + '.' + now.getMilliseconds() + '> ' + message);
    }
};

ChartAPI.UDFCompatibleDatafeed.prototype._send = function(url, params) {
    var request = url;
    if (params) {
        for (var i = 0; i < Object.keys(params).length; ++i) {
            var key = Object.keys(params)[i];
            var value = encodeURIComponent(params[key]);
            request += (i === 0 ? '?' : '&') + key + '=' + value;
        }
    }

    this._logMessage('New request: ' + request);

    return $.ajax({
        type: 'GET',
        url: request,
        contentType: 'text/plain'
    });
};

ChartAPI.UDFCompatibleDatafeed.prototype._initialize = function() {
    this._setupWithConfiguration(this.defaultConfiguration());

    // this.ws.RPCCall('TickerDataUpdateEvent', null, null, 2);
    this.ws.SubscribeToEvent('TickerDataUpdateEvent', function(data) {
        if (callback !== null && callback !== undefined) {
            var newBar = buildBar(data[0]);

            if (lastBar != null) {
                if (newBar.time - subscriptionIntervalMs < lastBar.time) {
                    newBar.time = lastBar.time;
                }

                callback(newBar);
                lastBar = newBar;
            }
        }
    });
};

ChartAPI.UDFCompatibleDatafeed.prototype.onReady = function(callback) {
    var that = this;
    if (this._configuration) {
        setTimeout(function() {
            callback(that._configuration);
        }, 0);
    } else {
        this.on('configuration_ready', function() {
            callback(that._configuration);
        });
    }

    console.log("Ready")
};

ChartAPI.UDFCompatibleDatafeed.prototype._setupWithConfiguration = function(configurationData) {
    this._configuration = configurationData;


    console.log(this._configuration)
    if (!configurationData.exchanges) {
        configurationData.exchanges = [];
    }

    //	@obsolete; remove in 1.5
    var supportedResolutions = configurationData.supported_resolutions || configurationData.supportedResolutions;
    configurationData.supported_resolutions = supportedResolutions;

    //	@obsolete; remove in 1.5
    var symbolsTypes = configurationData.symbols_types || configurationData.symbolsTypes;
    configurationData.symbols_types = symbolsTypes;

    if (!configurationData.supports_search && !configurationData.supports_group_request) {
        throw 'Unsupported datafeed configuration. Must either support search, or support group request';
    }

    if (!configurationData.supports_search) {
        this._symbolSearch = new ChartAPI.SymbolSearchComponent(this);
    }

    if (configurationData.supports_group_request) {
        //	this component will call onInitialized() by itself
        // this._symbolsStorage = new ChartAPI.SymbolsStorage(this);
    } else {
        this.onInitialized();
    }

    this._fireEvent('configuration_ready');
    this._logMessage('Initialized with ' + JSON.stringify(configurationData));
};

//	===============================================================================================================================
//	The functions set below is the implementation of JavaScript API.


ChartAPI.UDFCompatibleDatafeed.prototype.searchSymbolsByName = function(suserInput, exchange, symbolType, onResultReadyCallback) {
    console.log("searchSymbolsByName");

}


ChartAPI.UDFCompatibleDatafeed.prototype.searchSymbols = function(searchString, exchange, type, onResultReadyCallback) {
    console.log("searchSymbols");
    var MAX_SEARCH_RESULTS = 30;

    if (!this._configuration) {
        onResultReadyCallback([]);
        return;
    }

    if (this._configuration.supports_search) {

        this._send(this._datafeedURL + '/search', {
            limit: MAX_SEARCH_RESULTS,
            query: searchString.toUpperCase(),
            type: type,
            exchange: exchange
        })
            .done(function (response) {
                var data = JSON.parse(response);

                for (var i = 0; i < data.length; ++i) {
                    if (!data[i].params) {
                        data[i].params = [];
                    }
                }

                if (typeof data.s == 'undefined' || data.s != 'error') {
                    onResultReadyCallback(data);
                } else {
                    onResultReadyCallback([]);
                }

            })
            .fail(function(reason) {
                onResultReadyCallback([]);
            });
    } else {

        if (!this._symbolSearch) {
            throw 'Datafeed error: inconsistent configuration (symbol search)';
        }

        var searchArgument = {
            searchString: searchString,
            exchange: exchange,
            type: type,
            onResultReadyCallback: onResultReadyCallback
        };

        if (this._initializationFinished) {
            this._symbolSearch.searchSymbols(searchArgument, MAX_SEARCH_RESULTS);
        } else {

            var that = this;

            this.on('initialized', function() {
                that._symbolSearch.searchSymbols(searchArgument, MAX_SEARCH_RESULTS);
            });
        }
    }
};

ChartAPI.UDFCompatibleDatafeed.prototype._symbolResolveURL = '/symbols';

//	BEWARE: this function does not consider symbol's exchange
ChartAPI.UDFCompatibleDatafeed.prototype.resolveSymbol = function(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    console.log('Resolve Symbol - ' +  symbolName);
    var symbol = {};
    var instrument = instrumentsArray.filter(function(instrument) {
        return instrument.Symbol === symbolName;
    })[0];

    console.log('instrument - ' +  instrument);
    if (instrument) {
        symbol.omsId = instrument.OMSId;
        symbol.name = instrument.Symbol;
        symbol.full_name = instrument.Symbol;
        symbol.description = instrument.Symbol;
        symbol.instrumentId = instrument.InstrumentId;
        symbol.ticker = instrument.Symbol;
        symbol.has_intraday = true;

        setTimeout(function() { onSymbolResolvedCallback(symbol); }, 0);
    } else {
        onResolveErrorCallback('');
    }

};

ChartAPI.UDFCompatibleDatafeed.prototype._historyURL = '/history';

ChartAPI.UDFCompatibleDatafeed.prototype.getBars = function(symbolInfo, resolution, rangeStartDate, rangeEndDate, onDataCallback, onErrorCallback) {
    var that = this;

    //	timestamp sample: 1399939200
    if (rangeStartDate > 0 && (rangeStartDate + '').length > 10) {
        throw ['Got a JS time instead of Unix one.', rangeStartDate, rangeEndDate];
    }

    var interval = 60;
    switch (resolution) {
        case "1":
            interval = 60;
            break;
        case "5":
            interval = 300;
            break;
        case "15":
            interval = 900;
            break;
        case "30":
            interval = 1800;
            break;
        case "60":
            interval = 3600;
            break;
        case "360":
            interval = 21600;
            break;
        case "720":
            interval = 43200;
            break;
        case "D":
            interval = 86400;
            break;
        case "W":
            interval = 604800;
            break;
        case "M":
            interval = 2592000;
            break;
        default:
            interval = 60;
    }

    var req = {};
    req.OMSId = symbolInfo.omsId;
    req.InstrumentId = symbolInfo.instrumentId;
    req.Interval = interval; // interval is seconds
    req.IncludeLastCount = 5000;

    subscriptionIntervalMs = interval * 1000;
    // console.log(subscriptionIntervalMs + " interval ms")
    // console.log("calling subscribe");


    that.ws.RPCCall("SubscribeTicker", req, function(data) {
        that.ws.RPCCall('TickerDataUpdateEvent', null, null, 2);
        // console.log(data);
        var nodata = false;
        if (!data) {
            data = new Array();
            nodata = true;
        }
        else if (data.length === 0) {
            nodata = true;
        }
        var bars = [];
        var barsCount = data.length;

        // console.log(data.length);
        for (var i = 0; i < barsCount; ++i) {
            var barData = data[i];
            var barValue = buildBar(barData);
            // console.log(barValue)
            bars.push(barValue);
        }
        // console.log(bars);
        if (barsCount > 0) {
            lastBar = bars[bars.length - 1];
        }
        else {
            lastBar = null;
        }
        onDataCallback(bars, {version: that._protocolVersion, noData: nodata, nextTime: data.nb || data.nextTime || null});
        // console.log("done");
    });

    // console.log("end calling subscribe");
    // console.log("end getBars");

};

function buildBar(barData) {
    var barValue = {
        time: barData[0],
        high: barData[1],
        low: barData[2],
        open: barData[3],
        close: barData[4], // close
        volume: barData[5] // close
    };
    return barValue;
}


ChartAPI.UDFCompatibleDatafeed.prototype.subscribeBars = function(symbolInfo, resolution, onRealtimeCallback, listenerGUID) {
    console.log("subscribeBars")
    // console.log(symbolInfo)
    // console.log(resolution)
    callback = onRealtimeCallback;
    // set this to unsubscribe later
    unsubscribeReqObj.OMSId = symbolInfo.omsId;
    unsubscribeReqObj.InstrumentId = symbolInfo.instrumentId;
    // this.SubscribeEvent("TickerDataUpdateEvent");
};

ChartAPI.UDFCompatibleDatafeed.prototype.unsubscribeBars = function(listenerGUID) {
    console.log("unsubscribeBars");
    console.log(unsubscribeReqObj);
    var req = unsubscribeReqObj;
    this.ws.RPCCall("UnsubscribeTicker", req);
};

