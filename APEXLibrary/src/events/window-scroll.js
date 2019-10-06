const scroll = fromEvent(config.ws.GetTicker, { messageType: 'logon' })
  .map(e => {
    e = JSON.parse(e.data);

    for (const key in e) {
      if (e[key] === 9223372036.85478) {
        e[key] = 0;
      }
    }

    return e;
  })
  .map(e => {
    let temp = null;
    events.tickers.forEach(tick => {
      if (e.prodPair === tick.prodPair) {
        for (let key in tick) {
          tick[key] = e[key];
        }
        temp = tick;
      }
    });
    if (!temp) {
      events.tickers.push(e);
    }
    return events.tickers;
  });

export default ticker;
