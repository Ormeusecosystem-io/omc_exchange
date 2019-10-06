/* global AlphaPoint, document, localStorage, APConfig, window $ */
let defaultInstrumentId = Number(localStorage.getItem('SessionInstrumentId'));

function setupInstrumentDropDown(instruments, pair) {
  let button = '';
  let ul = '<ul class="dropdown-menu" aria-labelledby="dropdownMenu2">';

  instruments.forEach(ins => {
    if (ins.Symbol === pair) {
      // make the button
      button = `
        <button
          class="dropdown-toggle"
          type="button"
          id="dropdownMenu2"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >${pair} <span class="caret"></span> </button>`;
    } else {
      // make an li
      ul += `<li>
        <a onclick="doSelectIns(${ins.InstrumentId},${ins.Symbol});" href="#">${ins.Symbol}</a>
      </li>`;
    }
  });
  ul += '</ul>';
  $('#insDropDown').html(button + ul);
}

function doSelectIns(insId) {
  let taskCount = 0;
  let unsubscribeTaskCount = 0;
  let instrumentIdSelected = +insId;
  // In case the instrument ID argument is invalid use the default one instead.
  if (!AlphaPoint.instruments.value.find(inst => inst.InstrumentId === instrumentIdSelected)) {
    AlphaPoint.instruments.value.forEach(instrument => {
      if (instrument.Symbol === APConfig.prodPair) {
        instrumentIdSelected = instrument.InstrumentId;
      }
    });
  }

  const productPair = (AlphaPoint.instruments.value
    .find(inst => inst.InstrumentId === instrumentIdSelected) || { Symbol: APConfig.prodPair }).Symbol;
  const newIns = AlphaPoint.instruments.value
    .find(inst => inst.InstrumentId === instrumentIdSelected);
  const prevInstrument = AlphaPoint.instruments.value
    .find(inst => inst.InstrumentId === document.APAPI.Session.SelectedInstrumentId);

  function finishedLoading() {
    if (taskCount !== 3) taskCount++;
    if (taskCount === 3) {
      AlphaPoint.sessionLoaded.onNext(true); // Signal that all market info has been loaded
    }
  }

  function finishedUnsubscribe() {
    unsubscribeTaskCount++;
    if (unsubscribeTaskCount === 3) {
      document.APAPI.Session.SelectedInstrumentId = instrumentIdSelected;
      // lets subscribe to instruments
      AlphaPoint.subscribeTrades(instrumentIdSelected, 100, finishedLoading);
      AlphaPoint.subscribeLvl1(instrumentIdSelected, finishedLoading);
      AlphaPoint.subscribeLvl2(instrumentIdSelected, finishedLoading);
    }
  }

  AlphaPoint.setProductPair(productPair);
  AlphaPoint.instrumentChange.onNext(instrumentIdSelected);
  localStorage.setItem('SessionPair', productPair);
  localStorage.setItem('SessionInstrumentId', instrumentIdSelected);

  if (prevInstrument) {
    AlphaPoint.unsubscribeTradesCall(prevInstrument.InstrumentId, finishedUnsubscribe);
    AlphaPoint.unsubscribeLvl1(prevInstrument.InstrumentId, finishedUnsubscribe);
    AlphaPoint.unsubscribeLvl2(prevInstrument.InstrumentId, finishedUnsubscribe);
  } else if (document.APAPI.Session) {
    document.APAPI.Session.SelectedInstrumentId = instrumentIdSelected;
    // lets subscribe to instruments
    AlphaPoint.subscribeTrades(instrumentIdSelected, 100, finishedLoading);
    AlphaPoint.subscribeLvl1(instrumentIdSelected, finishedLoading);
    AlphaPoint.subscribeLvl2(instrumentIdSelected, finishedLoading);
  }

  setupInstrumentDropDown(AlphaPoint.instruments.value, productPair);
}

function init() {
  try {
    defaultInstrumentId = Number(localStorage.getItem('SessionInstrumentId'));
    doSelectIns(defaultInstrumentId);
  } catch (e) {
    console.error(e);
  }
}

export default {
  init,
  doSelectIns,
};
