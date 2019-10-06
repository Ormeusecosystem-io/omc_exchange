import ajax from './ajax';
import config from './config';
import events from './events';

export default function(dt, cb) {
  const data = {
    ins: dt.ins || config.prodPair,
    startIndex: dt.startIndex || '0',
    count: dt.count || '10',
  };

  ajax({ url: config.http.GetTrades, data: data }, (res) => {
    if (cb) cb(res);
  });
};
