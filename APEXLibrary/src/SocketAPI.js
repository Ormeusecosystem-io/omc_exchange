/* global WebSocket, AlphaPoint, $ */
import { Event } from './helper';

// LOW LEVEL API, RPC, Events, IsConnected, Session
// public class AP_API()
function AP_API() {
  const that = this;
  let wsConnection = null;
  let nextIvalue = 0;

  const onOpenCallbacks = [];
  const onCloseCallbacks = [];

  // private Dictionary[frame.id] = callback;
  const RPCCall_ReplyWaitObjects = {};

  // private Dictionary[eventName] = callback
  const RPCEvent_EventWaitObjects = {};

  // ############# PUBLIC FIELDS & EVENTS ###############
  // this.wsUri = APConfig.API_V2_URL;
  // public bool IsConnected = false;
  this.IsConnected = false;
  this.IsConnectedEvent = new Event(this);
  // ############# END PUBLIC FIELDS & EVENTS ###############

  this.addOnOpenCallback = function (callback) {
    onOpenCallbacks.push(callback);
  };

  this.addOnCloseCallback = function (callback) {
    onCloseCallbacks.push(callback);
  };

  // public void RPCCall(function_name, paramObject, callback);
  this.RPCCall = function (
    function_name,
    paramObject,
    callback = () => { },
    level
  ) {
    const frame = {
      m: level || 0,
      i: nextIvalue,
      n: function_name,
      o: paramObject ? JSON.stringify(paramObject) : ''
    };

    wsConnection.send(JSON.stringify(frame));
    RPCCall_ReplyWaitObjects[nextIvalue] = callback;
    nextIvalue += 2;
  };

  this.SubscribeToEvent = function (eventName, callback) {
    if (RPCEvent_EventWaitObjects[eventName] === undefined) {
      RPCEvent_EventWaitObjects[eventName] = [];
    }
    RPCEvent_EventWaitObjects[eventName].push(callback);
  };

  // public void Connect();
  this.Connect = wsUri => {
    wsConnection = new WebSocket(wsUri);

    wsConnection.onopen = internalOpen;
    wsConnection.onclose = internalClose;
    wsConnection.onmessage = internalOnMessage;
    wsConnection.onerror = internalOnError;
    wsConnection.SubscribeToEvent = that.SubscribeToEvent;
    wsConnection.RPCCall = that.RPCCall;
    wsConnection.RPCCallLevel2 = that.RPCCallLevel2;

    // PING
    if (AlphaPoint.config.websocketPing) {
      function ping() { return true; }
      ping.ping = true;
      setInterval(() => this.RPCCall('Ping', '', ping), 180000);
      setInterval(() => {
        const pendingPings = Object.values(RPCCall_ReplyWaitObjects).filter(
          func => func && func.ping
        );

        if (pendingPings.length >= 2) AlphaPoint.logout();
      }, 380000);
    }

    //On socket close try re open it
    const reOpenFn = onCloseReOpenCallback(wsUri, this.Connect, this);
    that.addOnCloseCallback(reOpenFn);

    return wsConnection;
  };


  that.closeConnection = function () {
    wsConnection.close();
  };

  function onCloseReOpenCallback(wsUri, connectFn) {
    return () => {
      const ws = connectFn(wsUri);
      const timeoutID = setTimeout(() => {
        if(ws.readyState === ws.OPEN) {
          clearTimeout(timeoutID);
        } else if(ws.readyState !== ws.CONNECTING) {
          onCloseReOpenCallback(wsUri, connectFn)();
        }
      }, 1000);
    };
  }

  // private void internalOpen();
  function internalOpen(d) {
    that.IsConnected = true;
    that.IsConnectedEvent.notify(true);
    onOpenCallbacks.forEach(callback => {
      callback();
    });
  }

  // private void internalClose();
  function internalClose(d) {
    that.IsConnected = false;
    onCloseCallbacks.forEach(callback => callback());
  }

  // private void internalOnMessage(ev); hooked into this.wsConnection.onmessage = internalOnMessage;
  function internalOnMessage(ev) {
    const frame = JSON.parse(ev.data);
    const rpcCallback = RPCCall_ReplyWaitObjects[frame.i];

    if (rpcCallback) {
      if (frame.o !== '') {
        try {
          rpcCallback(JSON.parse(frame.o));
        } catch (e) {
          // console.error(e);
        }
      } else {
        rpcCallback();
      }
      delete RPCCall_ReplyWaitObjects[frame.i];
    }

    if (RPCEvent_EventWaitObjects[frame.n]) {
      if (frame.o !== '') {
        for (let i = 0; i < RPCEvent_EventWaitObjects[frame.n].length; ++i) {
          try {
            RPCEvent_EventWaitObjects[frame.n][i](JSON.parse(frame.o));
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        for (let i = 0; i < RPCEvent_EventWaitObjects[frame.n].length; ++i) {
          RPCEvent_EventWaitObjects[frame.n][i]();
        }
      }
    }

    if (
      frame.m === 5
      && frame.n !== 'GetTransfersReceived' // this should be remove once the endpoint is available on all backends
    ) {
      console.error(frame.o);
      $.bootstrapGrowl('Function not available', {
        ...AlphaPoint.config.growlerDefaultOptions,
        type: 'danger'
      });
    }
  }

  function internalOnError(evt) {
    console.error('ERROR MESSAGE: ', evt);
  }
} // END CLASS AP_API()

export default AP_API;
