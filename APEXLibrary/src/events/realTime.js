const events = require('./setup');
const Rx = require('rx-lite');

const realTime = events.getRealTimeSubject
  .map(e => {
    const ret = JSON.parse(e.data);
    return ret;
  })
  .subscribe(e => {
    // console.log("HISTORY",events.realTimeData[e.productPair]);
    // console.log("HISTORY",e);

    if (
      events.realTimeData[e.productPair] &&
      events.realTimeData[e.productPair].history.value.length < 1
    ) {
      events.realTimeData[e.productPair].history.onNext(
        e.items.map(item => ({
          time: item[0],
          open: item[1],
          high: item[2],
          low: item[3],
          close: item[4],
          volume: item[5]
          // productPair: e.productPair
        }))
      );
    } else {
      (e.items || []).forEach(item => {
        const tempItem = {
          time: item[0],
          open: item[1],
          high: item[2],
          low: item[3],
          close: item[4],
          volume: item[5]
          // productPair: e.productPair
        };
        // events.realTimeData[e.productPair].stream.subscribe(function(valueX){console.log(valueX)});
        events.realTimeData[e.productPair].stream.onNext(tempItem);
        const history = events.realTimeData[e.productPair].history.value;
        history.push(tempItem);
        // console.log(tempItem, e.productPair);
        events.realTimeData[e.productPair].history.onNext(history);
      });
    }
  });

export default realTime;
