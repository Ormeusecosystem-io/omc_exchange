import superagent from 'superagent';

function ajax(obj, cb) {
  const { url, data } = obj;
  const type = obj.method || obj.type || 'post';
  let request = superagent;

  if (type.toLowerCase() === 'post') {
    request = request.post(url).send(data);
  } else {
    request = request.get(url);
  }

  request.end(res => cb && res && cb(res.body || ''));
}

export default ajax;
