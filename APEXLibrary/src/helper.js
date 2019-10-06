/* global document, AlphaPoint */

// Helper class that containes various helper functions, classes, and patterns
// Event class helps with c# style events

export function getCookie(cname) {
  const name = `${cname}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1);
    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
  }
  return '';
}

export function setCookie(cname, cvalue, exminutes) {
  const d = new Date();
  d.setTime(d.getTime() + exminutes * 60 * 1000);
  const expires = `expires=${d.toUTCString()}`;
  document.cookie = `${cname}=${cvalue}; ${expires}`;
}

// returns the data in the callback, or null if there was an error
export function getRequest(url, callback) {
  const request = new XMLHttpRequest();
  request.open('GET', url, true);

  request.onload = function () {
    if (request.status >= 200 && request.status < 400) {
      // Success!
      callback(request.responseText);
    } else {
      // We reached our target server, but it returned an error
      callback(null);
    }
  };

  request.onerror = function () {
    callback(null);
  };

  request.send();
}

export function setElementHtml(url, htmlElement) {
  if (!htmlElement) {
    alert(`setElementHtml(${url},htmlElement) .. error`);
    return;
  }
  const request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.onload = function () {
    if (request.status >= 200 && request.status < 400) {
      insertAndExecute(htmlElement, request.responseText);
      //  $(htmlElement).html(request.responseText);
    }
  };
  request.send();
}

// sorts an associative array in js
export function getSortedKeys(obj) {
  let keys = [];
  for (const key in obj) keys.push(key);
  return keys.sort((a, b) => {
    return obj[a] - obj[b];
  });
}

export function insertAndExecute(htmElem, text) {
  htmElem.innerHTML = text;
  const scripts = [];
  ret = htmElem.childNodes;
  for (let i = 0; ret[i]; i++) {
    if (
      nodeName(ret[i], 'script') &&
      (!ret[i].type || ret[i].type.toLowerCase() === 'text/javascript')
    ) {
      scripts.push(
        ret[i].parentNode ? ret[i].parentNode.removeChild(ret[i]) : ret[i]
      );
    }
  }

  for (script in scripts) {
    evalScript(scripts[script]);
  }
}

export function nodeName(elem, name) {
  return elem.nodeName && elem.nodeName.toUpperCase() === name.toUpperCase();
}

export function evalScript(elem) {
  data = elem.text || elem.textContent || elem.innerHTML || '';

  let head =
    document.getElementsByTagName('head')[0] || document.documentElement,
    script = document.createElement('script');
  script.type = 'text/javascript';
  script.appendChild(document.createTextNode(data));
  head.insertBefore(script, head.firstChild);
  head.removeChild(script);

  if (elem.parentNode) {
    elem.parentNode.removeChild(elem);
  }
}
// / Usage:
// / var radios = document.getElementsByName('abc');
// / var selected = getSelectedRadioInput(radios);
export function getSelectedRadioInput(radios) {
  for (let i = 0, length = radios.length; i < length; i++) {
    if (radios[i].checked) {
      return radios[i].value;
    }
  }
}

// / Usage:
// / hide(document.querySelectorAll('.target'));
// / hide(document.querySelector('.target'));
// / hide(document.getElementById('target'));
export function hide(elements) {
  elements = elements.length ? elements : [elements];
  for (let index = 0; index < elements.length; index++) {
    elements[index].style.display = 'none';
  }
}

// Usage:
// / var elements = document.querySelectorAll('.target');
// / show(elements);
// / show(elements, 'inline-block'); // The second param allows you to specify a display value
export function show(elements, specifiedDisplay) {
  elements = elements.length ? elements : [elements];
  for (let index = 0; index < elements.length; index++) {
    elements[index].style.display = specifiedDisplay || 'block';
  }
}

// / Event Class (http://stackoverflow.com/questions/15963984/simulate-c-sharp-like-events-in-javascript) ///
// / Event Class
export function Event(sender) {
  this._sender = sender;
  this._listeners = [];
}

Event.prototype = {
  attach(listener) {
    this._listeners.push(listener);
  },
  notify(args) {
    let event = this;
    event._listeners.forEach(listener => {
      listener(event._sender, args);
    });
  }
};

/*
And your my class. For example:

function MyClass(name) {
     var self = this;
     self.Name = name;
     self.nameChanged = new Event(this);

     self.setName = function (newName){
         self.Name = newName;
         self.nameChanged.notify(newName);
     }
}
Subscribe to event example code:

var my_class_obj = new MyClass("Test");
my_class_obj.nameChanged.attach(function (sender,args){

});
my_class_obj.setName("newName");
You can attach more event handlers and all these event handlers will get called. And you can also add more events as you'd like: addressChanged event for example. This approach also simulate c# event (sender and args)

*/
// / END Event Class ///
// / END Event Class ///

export function updateArrayByPx(array, trade) {
  let current = null;

  array.forEach((obj, i) => {
    if (obj.Price === trade.Price) {
      if (!trade.Quantity) {
        array.splice(i, 1);
      } else {
        obj.Quantity = trade.Quantity; // updating the quantity on an order
        current = obj;
      }
    }
  });

  if (!current && trade.Quantity) {
    array.push(trade);
  }

  return array;
}

export function toFixed(num) {
  let x = num;

  if (Math.abs(x) < 1.0) {
    const e = parseInt(x.toString().split('e-')[1], 10);

    if (e) {
      x *= 10 ** (e - 1);
      x = `0.${new Array(e).join('0') + x.toString().substring(2)}`;
    }
  } else {
    let e = parseInt(x.toString().split('+')[1], 10);

    if (e > 20) {
      e -= 20;
      x /= 10 ** e;
      x += new Array(e + 1).join('0');
    }
  }
  return x;
}

export function formatNumberToLocale(value, decimalPlaces) {
  if (isNaN(value)) return '';
  const multi = 10 ** decimalPlaces;
  return (Math.floor(value * multi) / multi).toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  });
}

export default {
  getCookie,
  setCookie,
  getRequest,
  setElementHtml,
  getSortedKeys,
  insertAndExecute,
  nodeName,
  evalScript,
  getSelectedRadioInput,
  hide,
  show,
  Event,
  updateArrayByPx,
  toFixed,
  formatNumberToLocale
};
