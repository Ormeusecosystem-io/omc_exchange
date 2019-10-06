/* global AlphaPoint */
import React from 'react';
import Rx from 'rx-lite';

import WidgetBase from './base';

class Instruments extends React.Component {
  constructor() {
    super();

    this.state = {
      data: [],
      tickers: [],
      currentPair: '',
    };
  }

  componentDidMount() {
    const list = [];

    this.productPairs = AlphaPoint.instruments.subscribe(data => this.setState({ data }));

    this.productPair = AlphaPoint.prodPair.subscribe(currentPair => this.setState({ currentPair }));

    this.ticker = Rx.Observable.merge(
      AlphaPoint.subscribe1,
      AlphaPoint.subscribe1Update,
    )
      .subscribe(data => {
        let index = -1;

        if (data.length) {
          list.some((obj, i) => {
            if (obj.InstrumentId === data[0].InstrumentId) {
              index = i;
              return true;
            }
            return false;
          });

          if (index > -1) list[index] = data[0];
          if (index === -1) list.push(data[0]);
          this.setState({ tickers: list });
        }
      });
  }

  componentWillUnmount() {
    this.productPairs.dispose();
    this.productPair.dispose();
    this.ticker.dispose();
  }

  changePair = (pair) => AlphaPoint.setProductPair(pair);

  render() {
    const pairs = this.state.data.map(pair => {
      const btnStyle = pair.Symbol === this.state.currentPair ? 'btn-action' : 'btn-default';
      const tick = this.state.tickers.filter(ticker => ticker.InstrumentId === pair.InstrumentId);

      return (
        <div
          className={`btn ${btnStyle}`}
          style={{ marginRight: 5 }}
          key={pair.Symbol}
          onClick={() => this.changePair(pair.Symbol)}
        >
          <div className="pair">{pair.Symbol}</div>
          <div className="value">{tick.length && tick[0].Close}</div>
        </div>
      );
    });

    return (
      <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('INSTRUMENTS.TITLE_TEXT') || 'Instruments'}>
        <div className="pad">
          {pairs}
        </div>
      </WidgetBase>
    );
  }
}

export default Instruments;
