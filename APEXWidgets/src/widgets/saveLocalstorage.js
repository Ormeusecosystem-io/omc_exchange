import React from 'react';
import WidgetBase from './base';

var Referral = React.createClass({
  download: function(){
    // console.log(localStorage && localStorage);
    var LStorage = localStorage;
    delete LStorage.sessionToken;

    var setup = JSON.stringify(LStorage);
    setup = 'var JarvisSettings = ' + setup;
    // console.log(setup);
    var a = document.createElement('a');
    var blob = new Blob([setup], {'type':'application/json'});
    a.href = window.URL.createObjectURL(blob);
    a.download = 'settings.js';
    a.click();
  },
  render: function() {
    return (
      <button onClick={this.download}>Download settings</button>
    );
  }
});

module.exports = Referral;
