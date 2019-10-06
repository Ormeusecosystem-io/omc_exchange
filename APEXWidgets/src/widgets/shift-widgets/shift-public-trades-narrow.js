/* global AlphaPoint, navigator */
import React from 'react';
import Rx from 'rx-lite';
import uuidV4 from 'uuid/v4';
import timeAgo from 'timeago.js';
import { getTimeFormatEpoch } from '../../common';
import WidgetBase from '../base';

class ShiftPublicTradesNarrow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      data: [],
      pairs: [],
      currentInstrument: null,
      quantityIncrement: 2,
      decimalPlaces: 2,
    };
  }

  componentDidMount() {
    this.pairs = AlphaPoint.instruments.subscribe(pairs => this.setState({ pairs }));

    this.currentInstrument = Rx.Observable.combineLatest(
      AlphaPoint.instrumentChange,
      AlphaPoint.instruments,
      (selected, instruments) => {
        const instrument = instruments.find((inst) => inst.InstrumentId === +selected);

        return instrument;
      },
    )
      .filter(instrument => instrument)
      .subscribe((instrument) => this.setState({
        currentInstrument: instrument,
        quantityIncrement: `${instrument.QuantityIncrement}`.includes('-') ? // eslint-disable-line no-nested-ternary
          `${instrument.QuantityIncrement}`.split('-')[1] // eslint-disable-line indent
          :
          `${instrument.QuantityIncrement}`.includes('.') ?
            `${instrument.QuantityIncrement}`.split('.')[1].length
            :
            0,
        decimalPlaces: AlphaPoint.products.value.find(prod => prod.ProductId === instrument.Product2).DecimalPlaces,
      }));

    const publicTrades = Rx.Observable.combineLatest(
      AlphaPoint.prodPair,
      AlphaPoint.orderBook,
      AlphaPoint.instruments,
      (pair, orderBook, instruments) => {
        const instrument = instruments.find(ins => ins.Symbol === pair) || {};

        return (orderBook[instrument.InstrumentId] || {}).trades || [];
      });

    this.publicTrades = publicTrades.subscribe(trades => this.setState({ data: trades.sort((a, b) => {
      if (a.TradeId < b.TradeId) return 1;
      if (a.TradeId > b.TradeId) return -1;
      return 0;
    }) }));
  }

  componentWillUnmount() {
    this.pairs.dispose();
    this.publicTrades.dispose();
  }

  gotoPage = (page) => this.setState({ page });

  render() {
    const timeAgoInstance = timeAgo();
    const pagination = AlphaPoint.config.usePagi;
    const maxLines = pagination ? 36 : 50;
    const totalPages = pagination ? Math.ceil(this.state.data.length / maxLines) : 0;
    const rowsSlice = pagination ?
      this.state.data.slice(maxLines * this.state.page, maxLines * (this.state.page + 1))
      :
      this.state.data.slice(0, maxLines);
    const rows = rowsSlice
      .sort((a, b) => {
        if (a.TradeId > b.TradeId) return 1;
        if (a.TradeId < b.TradeId) return -1;
        return 0;
      })
      .map(row => {
        let direction;
        let myStyle;
        let classAdd = '';

        if (row.Direction === 0) direction = 'No Change';
        if (row.Direction === 1) {
          direction = 'Up Tick';
          classAdd = 'up-tick';
        }
        if (row.Direction === 2) {
          direction = 'Down Tick';
          classAdd = 'down-tick';
        }
        // Note that this eventually must match pairs and show up or down tick
        return (
          <tr key={uuidV4()}>
            <td className={`borderless ${classAdd}`}>{row.Price.toFixed(this.state.decimalPlaces)}</td>
            <td className="borderless">{row.Quantity.toFixed(this.state.quantityIncrement)}</td>
            <td className="borderless">
              {AlphaPoint.config.siteName === 'huckleberry' ?
                <span title={getTimeFormatEpoch(row.TradeTime)}>
                  {timeAgoInstance.format(row.TradeTime, navigator.language)}
                </span>
                :
                getTimeFormatEpoch(row.TradeTime).substring(11, 19)}
            </td>
          </tr>
        );
      });

    const start = (this.state.page - 2) > 0 ? this.state.page - 2 : 0;
    const end = (this.state.page + 3) <= totalPages ? this.state.page + 3 : totalPages;
    const pages = [];

    if (pagination) {
      for (let x = start; x < end; x++) {
        const numButton = (
          <li key={x} className={this.state.page === x ? 'active' : null}>
            <a onClick={() => this.gotoPage(x)}>{x + 1}</a>
          </li>
        );
        pages.push(numButton);
      }
    }

    return (
      <WidgetBase {...this.props} headerTitle="Trades">
        <table className="table table-hover minFont recent-trades-table">
          <thead>
            <tr>
              <th className="header">{AlphaPoint.translation('PUBLIC_TRADES.PRICE_TEXT') || 'Price'}</th>
              <th className="header">{AlphaPoint.translation('PUBLIC_TRADES.SIZE') || 'Size'}</th>
              <th className="header">{AlphaPoint.translation('PUBLIC_TRADES.TIME_TEXT') || 'Time'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.reverse()}
          </tbody>
        </table>


        {pagination && pages.length > 1 && AlphaPoint.config.showWidgetPageNumbers &&
          <div className="clearfix pad-x">
            <ul className="pagi pull-right">
              <li><a onClick={() => this.gotoPage(0)}>&laquo;</a></li>
              {pages}
              <li onClick={() => this.gotoPage(totalPages - 1)}><a>&raquo;</a></li>
            </ul>
          </div>}
      </WidgetBase>
    );
  }
}

export default ShiftPublicTradesNarrow;
