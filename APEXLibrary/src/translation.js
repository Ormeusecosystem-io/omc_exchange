import events from './events/setup';

// function nested(obj, attrString) {
//   if (!attrString.split || !attrString.split) return null;

//   const path = attrString.split('.');
//   for (let i in path) {
//     obj = obj[path[i]];
//     if (!obj) return '';
//   }
//   return obj;
// }

// function translation(path, callback) {
//   const result = nested(AlphaPoint.language.value, path);

//   return result;
// }

function path(paths, obj) {
  let val = obj;
  let idx = 0;

  while (idx < paths.length) {
    if (val == null) {
      return;
    }
    val = val[paths[idx]];
    idx += 1;
  }
  return val;
}

function translation(pathStr, variables) {
  let result = path(pathStr.split('.'), AlphaPoint.language.value);

  if(result && variables) {
    Object.keys(variables).forEach(prop => {
      result = result.replace(new RegExp(`{${prop}}`, 'g'), variables[prop] || '');
    });
  }

  return result;
}

export default translation;
