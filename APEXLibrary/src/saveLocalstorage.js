function SaveLocalstorage() {
  const config = {};
  for (let key in localStorage) {
    if ( key.indexOf('jarvisWidgets_') >= 0) {
      config[key] = localStorage[key];
    }
  }

  config.published = true;

  let setup = JSON.stringify(config);
  setup = 'var JarvisSettings = ' + setup + ';';

  const a = document.createElement('a');
  const blob = new Blob([setup], {'type': 'application/json'});
  a.href = window.URL.createObjectURL(blob);
  a.download = 'settings.js';
  a.click();
}

export default SaveLocalstorage;
