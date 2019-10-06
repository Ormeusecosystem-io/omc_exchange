/* global WebSocket */
const Rx = require('rx-lite');

export default function(address, firstMessage) {
  const ws = new WebSocket(address);
  let messagesSentBeforeOpen = [];

  if (firstMessage) {
    messagesSentBeforeOpen.push(firstMessage);
  }

  const observer = Rx.Observer.create(
    data => {
      // console.log(data, 'onnext');
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      } else {
        messagesSentBeforeOpen.push(data);
      }
    },
    err => {
      // console.log(err, 'onerror');
    },
    () => {
      // console.log('oncompleted');
      ws.close();
    }
  );

  const observable = Rx.Observable.create(obs => {
    ws.onmessage = function(data) {
      obs.onNext(data);
    };
    ws.onerror = function(err) {
      obs.onError(err);
    };

    ws.onclose = function() {
      // console.log('ws closed', address);
      obs.onCompleted();
    };

    ws.onopen = function() {
      messagesSentBeforeOpen.forEach(message => {
        // console.log(message, 'send cached messages');
        ws.send(JSON.stringify(message));
      });
      messagesSentBeforeOpen = [];
    };

    return function() {
      // console.log('dispose', address);
      ws.close();
    };
    // return Rx.Disposable.create(function() {
    //   console.log('dispose', address);
    //   // ws.close();
    // });
  });

  const published = observable.publish();
  const connection = published.connect();
  const subject = Rx.Subject.create(observer, published);

  // console.log(connection, published);

  return subject;
}
