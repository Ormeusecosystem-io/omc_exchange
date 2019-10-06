/* global AlphaPoint */
import React from 'react';

import WidgetBase from './base';
import { getTimeFormatEpoch } from '../common';
import { formatNumberToLocale } from './helper';

class Trades extends React.Component {
  constructor() {
    super();

    this.state = {
      sortDirection: {
        account: true,
        number: true,
        pair: true,
        side: true,
        size: true,
        price: true,
        total: true,
        fee: true,
        executionid: true,
        time: true,
      },
      toggleOpen: {},
      showMobile: false,
      page: 0,
      data: [],
      pairs: [],
      ticker: {},
      products: [],
      decimalPlaces: {},
      selectedAccount: null,
      windowWidth: window.innerWidth,
      showExpanded: null
    };
  }

  handleResize() {
    this.setState({windowWidth: window.innerWidth})
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize.bind(this));
    this.accountChangedEvent = AlphaPoint.selectedAccount
      .subscribe(selectedAccount => {
        this.setState({ selectedAccount });
      });

    this.tradeHistory = AlphaPoint.accountTrades
      .filter(data => data)
      .subscribe(data => {
        this.setState({
          data: data.filter(trade => !trade.IsBlockTrade)
            .sort((a, b) => {
              if (a.TradeTime < b.TradeTime) return 1;
              if (a.TradeTime > b.TradeTime) return -1;
              return 0;
            }),
        });
      });

    this.pairs = AlphaPoint.instruments.subscribe(pairs => this.setState({ pairs }));

    this.products = AlphaPoint.products.subscribe(products => {
      const decimalPlaces = {};
      products.forEach(product => {
        decimalPlaces[product.Product] = product.DecimalPlaces;
      });

      this.setState({ products, decimalPlaces })

    });

    this.userAccounts = AlphaPoint.userAccountsInfo.subscribe(accounts => this.setState({ accounts }));
  }

  componentWillUnmount() {
    this.accountChangedEvent.dispose();
    this.tradeHistory.dispose();
    this.pairs.dispose();
    this.products.dispose();
  }

  gotoPage = (page) => this.setState({ page });

  generateGuid = () => {
    function p8(s) {
      const numberStr = `${Math.random().toString(16)}000000000`;
      const p = numberStr.substr(2, 8);

      return s ? `-${p.substr(0, 4)}-${p.substr(4, 4)}` : p;
    }
    return p8() + p8(true) + p8(true) + p8();
  };

  sortRows = (paramName, ascending = true, fieldName) => {
    const compare = (a, b) => {
      if (ascending === true) {
        if (a[paramName] < b[paramName]) { return -1; }
        if (a[paramName] > b[paramName]) { return 1; }
      } else {
        if (a[paramName] < b[paramName]) { return 1; }
        if (a[paramName] > b[paramName]) { return -1; }
      }
      return 0;
    };

    const sorted_array = [].concat(this.state.data).sort(compare);
    const sortDirection = this.state.sortDirection;
    sortDirection[fieldName] = !this.state.sortDirection[fieldName];
    this.setState({ data: sorted_array, sortDirection, showExpanded: null });
  };

  openMobileDetails = (row_number) => {
    const toggleOpen = this.state.toggleOpen;
    if (toggleOpen[row_number] === undefined) {
      toggleOpen[row_number] = true;
    } else {
      toggleOpen[row_number] = !this.state.toggleOpen[row_number];
    }
    this.setState({ showMobile: !this.state.showMobile, toggleOpen });
  };

  toggleExpandedRow(id){
    if(this.state.windowWidth > 768){ return };
    this.setState({...this.state, showExpanded: id})
  }

  render() {
    const siteName = AlphaPoint.config.siteName;
    const pagination = AlphaPoint.config.pagination;
    const paginationClass = AlphaPoint.config.useBootstrapPagination ? 'pagination' : 'pagi';
    const maxLines = 10;
    const totalPages = pagination ? Math.ceil(this.state.data.length / maxLines) : 0;
    const rowsSlice = pagination ?
      this.state.data.slice(maxLines * this.state.page, maxLines * (this.state.page + 1))
      :
      this.state.data;

    const rows = rowsSlice
      .map((row, index) => {
        if (row.AccountId !== this.state.selectedAccount) return;

        const accountInfo = this.state.accounts.find(account => account.AccountId === row.AccountId);
        const pairName = this.state.pairs.find(pair => pair.InstrumentId === row.InstrumentId);
        const symbol = this.state.products.find(prod => prod.ProductId === row.FeeProductId);
        const topRowActive = this.state.toggleOpen[index] ? 'top-row-active' : '';
        const time = <div className="recent-transactions-account-time">{getTimeFormatEpoch(row.TradeTimeMS)}</div>; // add .substring(11,19) to display time only
        const price = row.OrderType === 'TrailingStopMarket' || row.OrderType === 'TrailingStopLimit'
          ? 'TRL'
          : row.Price.toFixed(AlphaPoint.config.decimalPlacesTraderUI || AlphaPoint.config.decimalPlaces);
        /* eslint-disable consistent-return */
        if(this.props.isOrderSection){

          return (
            <div key={this.generateGuid()} className="transaction-row">
              <div className={`recent-transactions-top-row ${topRowActive} ${this.state.showExpanded === row.TradeId ? "expanded": ""}`} onClick={() => this.toggleExpandedRow(row.TradeId)}>
                <div className="recent-transactions-account-id">{row.TradeId}</div>
                <div className="recent-transactions-account-pair">{pairName.Symbol}</div>
                {row.Side === 'Buy' ?
                  <div className="buyFont recent-transactions-account-side">{AlphaPoint.translation('TRADES.BUY') || 'Buy'}</div>
                  :
                  <div className="sellFont recent-transactions-account-side"> {AlphaPoint.translation('TRADES.SELL') || 'Sell'} </div>}
                <div className="recent-transactions-account-quantity">≈{formatNumberToLocale(row.Quantity, this.state.decimalPlaces[pairName.Product1Symbol])}</div>
                {this.state.windowWidth > 768 && <div className="recent-transactions-account-price">{formatNumberToLocale(price, this.state.decimalPlaces[pairName.Product2Symbol])}</div>}
                {
                  this.state.windowWidth > 768 &&
                  <div className="recent-transactions-account-total">
                    {formatNumberToLocale(row.Value, (row.Side === 'Buy' ? this.state.decimalPlaces[pairName.Product1Symbol] : this.state.decimalPlaces[pairName.Product2Symbol]))}
                  </div>
                }
                {
                  this.state.windowWidth > 768 &&
                  <div className="recent-transactions-account-fee">
                    {symbol !== undefined
                      ? `${formatNumberToLocale(row.Fee, this.state.decimalPlaces[symbol.Product])}
                        (${symbol.Product})`
                      : row.Fee}
                  </div>
                }
                {this.state.windowWidth > 768 && <div className="recent-transactions-account-executionid">{row.ExecutionId}</div>}
                {time}
              </div>

              {
                this.state.showExpanded === row.TradeId && this.state.windowWidth <= 768 && 
                <div className="recent-transactions-top-row-open">
                  <ul>
                      <li>
                        <div>Price</div>
                        <div>{formatNumberToLocale(price, this.state.decimalPlaces[pairName.Product2Symbol])}</div>
                      </li>
                      <li>
                        <div>Total</div>
                        <div>{formatNumberToLocale(row.Value, (row.Side === 'Buy' ? this.state.decimalPlaces[pairName.Product1Symbol] : this.state.decimalPlaces[pairName.Product2Symbol]))}</div>
                      </li>
                      <li>
                        <div>Fee</div>
                        <div>{symbol !== undefined
                          ? `${formatNumberToLocale(row.Fee, this.state.decimalPlaces[symbol.Product])}
                            (${symbol.Product})`
                          : row.Fee}
                        </div>
                      </li>
                      <li>
                        <div>Execution ID</div>
                        <div>{row.ExecutionId}</div>
                      </li>
                      <li onClick={() => this.toggleExpandedRow(null)}><img src="img/drop-copy.svg"/></li>
                  </ul>
                </div>
              }
  
              {this.state.toggleOpen[index] &&
              <div className={`bottom-row bottom-row-${this.props.key}`} ref={this.props.key}>
                <div className="currency-details">
                  <div className="currency-detail-rows">
                    <div className="detail-name">#</div>
                    <div className="detail-amount">{row.TradeId}</div>                
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">PAIR</div>
                    <div className="detail-amount">{pairName.Symbol}</div>                
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">SIDE</div>
                    <div className="detail-amount">{row.Side}</div>    
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">SIZE</div>
                    <div className="detail-amount">{formatNumberToLocale(row.Quantity, this.state.decimalPlaces[pairName.Product1Symbol])}</div>
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">PRICE</div>
                    <div className="detail-amount">{formatNumberToLocale(price, this.state.decimalPlaces[pairName.Product2Symbol])}</div>
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">TOTAL</div>
                    <div className="detail-amount">{formatNumberToLocale(row.Value, (row.Side === 'Buy' ? this.state.decimalPlaces[pairName.Product1Symbol] : this.state.decimalPlaces[pairName.Product2Symbol]))}</div>                
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">FEE</div>
                    <div className="detail-amount">{(row.Fee).toFixed(2)}</div>
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">EXECUTION ID</div>
                    <div className="detail-amount">{row.ExecutionId}</div>
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">TIME</div>
                    <div className="detail-amount">{getTimeFormatEpoch(row.TradeTimeMS)}</div>
                  </div>
                </div>
              </div>
              }
            </div>
          );
        }
        return (
          <tr key={this.generateGuid()}>
                <td className="borderless">{row.AccountId || null}</td>
                {siteName !== 'huckleberry' && <td className="borderless">{row.TradeId}</td>}
                <td className="borderless">{pairName.Symbol}</td>
                {row.Side === 'Buy' ?
                  <td className="borderless buyFont">{AlphaPoint.translation('TRADES.BUY') || 'Buy'}</td>
                  :
                  <td className="borderless sellFont"> {AlphaPoint.translation('TRADES.SELL') || 'Sell'} </td>}
                <td className="borderless">≈{formatNumberToLocale(row.Quantity, this.state.decimalPlaces[pairName.Product1Symbol])}</td>
                <td className="borderless">{formatNumberToLocale(price, this.state.decimalPlaces[pairName.Product2Symbol])}</td>
                {siteName !== 'huckleberry' &&
                  <td className="borderless">
                    {formatNumberToLocale(row.Value, (row.Side === 'Buy' ? this.state.decimalPlaces[pairName.Product1Symbol] : this.state.decimalPlaces[pairName.Product2Symbol]))}
                  </td>}
                {siteName === 'aztec'
                  ? <td className="borderless">{(row.Fee).toFixed(2)}</td>
                  : <td className="borderless">
                    {symbol !== undefined
                      ? `${formatNumberToLocale(row.Fee, this.state.decimalPlaces[symbol.Product])}
                        (${symbol.Product})`
                      : row.Fee}
                  </td>}
                <td className="borderless">{row.ExecutionId}</td>
                <td className="borderless">{time}</td>
                {siteName === 'huckleberry' && <div>{AlphaPoint.translation('TRADES.EXECUTED') || 'Fully Executed'}</div>}
                <td className="borderless"><div className="sort-icon" onClick={() => { this.openMobileDetails(index); }} /></td>

              {this.state.toggleOpen[index] &&
              <div className={`bottom-row bottom-row-${this.props.key}`} ref={this.props.key}>
                <div className="currency-details">
                  <div className="currency-detail-rows">
                    <div className="detail-name">#</div>
                    <div className="detail-amount">{row.TradeId}</div>                
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">PAIR</div>
                    <div className="detail-amount">{pairName.Symbol}</div>                
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">SIDE</div>
                    <div className="detail-amount">{row.Side}</div>    
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">SIZE</div>
                    <div className="detail-amount">{formatNumberToLocale(row.Quantity, this.state.decimalPlaces[pairName.Product1Symbol])}</div>
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">PRICE</div>
                    <div className="detail-amount">{formatNumberToLocale(price, this.state.decimalPlaces[pairName.Product2Symbol])}</div>
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">TOTAL</div>
                    <div className="detail-amount">{formatNumberToLocale(row.Value, (row.Side === 'Buy' ? this.state.decimalPlaces[pairName.Product1Symbol] : this.state.decimalPlaces[pairName.Product2Symbol]))}</div>                
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">FEE</div>
                    <div className="detail-amount">{(row.Fee).toFixed(2)}</div>
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">EXECUTION ID</div>
                    <div className="detail-amount">{row.ExecutionId}</div>
                  </div>
                  <div className="currency-detail-rows">
                    <div className="detail-name">TIME</div>
                    <div className="detail-amount">{getTimeFormatEpoch(row.TradeTimeMS)}</div>
                  </div>
                </div>
              </div>
              }
            </tr>
        )
      });
      /* eslint-enable consistent-return */

    const emptyRows = [];
    for (let i = 0; i < maxLines - rows.length; i++) {
      emptyRows.push(<tr key={i}><td colSpan="11">&nbsp;</td></tr>);
    }

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

    let displayPagination;

    displayPagination = (
      <ul className="pagi">
        <li><a onClick={() => this.gotoPage(0)}><img src="img/back.svg"/></a></li>
        {pages}
        <li onClick={() => this.gotoPage(totalPages - 1)} ><a><img src="img/forth.svg"/></a></li>
      </ul>
    );
    const noActivity = 
    this.props.isOrderSection 
      ?
      (
        <div id="no-activity">
          <img src="img/no-activity.svg"/>
          <p>You have no activity history.</p>
        </div>
      )
      : 
      (
        <tr>
            <td colSpan="10" style={{borderTop: "none"}}>
              <div id="no-activity">
                <img src="img/no-activity.svg"/>
                <p>You have no activity history.</p>
              </div>
            </td>
        </tr>
      )
    const tableClassList = siteName === 'aztec' ?
      'table table--comfy table--hover table--striped table--light'
      :
      'table table-hover minFont';
      if(this.props.isOrderSection){

        return (
          <div id="right">
    
            <WidgetBase login hideCloseLink {...this.props} headerTitle={AlphaPoint.translation('TRADES.TITLE_TEXT') || 'Trades'}>
              {this.props.isOrderSection && <h1 className="orders-title">Filled orders</h1>}
              {this.state.windowWidth <= 768 && this.props.isOrderSection && <h2 className="orders-subtitle">Click on any order to view full details.</h2>}
              <div className="table-responsive">
                <div className="transactions-header-container">
                  {siteName !== 'huckleberry' && <div className="header transaction-header-number">
                    <div className="transactions-header-text">{AlphaPoint.translation('TRADES.ID_TEXT') || '#'}</div>
                    <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.number, 'number')} data-sort="TradeId" data-direction={this.state.sortDirection.number} />
                  </div>}
                  <div className="header transaction-header-pair">
                    <div className="transactions-header-text">{AlphaPoint.translation('TRADES.INSTRUMENT_TEXT') || 'Instrument'}</div>
                    <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.pair, 'pair')} data-sort="InstrumentId" data-direction={this.state.sortDirection.pair} />
                  </div>
                  <div className="header transaction-header-side">
                    <div className="transactions-header-text">{AlphaPoint.translation('TRADES.SIDE_TEXT') || 'Side'}</div>
                    <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.side, 'side')} data-sort="Side" data-direction={this.state.sortDirection.side} />
                  </div>
                  <div className="header transaction-header-size">
                    <div className="transactions-header-text">{AlphaPoint.translation('TRADES.QUANTITY_TEXT') || 'Quantity'}</div>
                    <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.quantity, 'quantity')} data-sort="Quantity" data-direction={this.state.sortDirection.quantity} />
                  </div>
                  {
                    this.state.windowWidth > 768 &&
                    <div className="header transaction-header-price">
                      <div className="transactions-header-text">{AlphaPoint.translation('TRADES.PRICE_TEXT') || 'Price'}</div>
                      <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.price, 'price')} data-sort="Price" data-direction={this.state.sortDirection.price} />
                    </div>
                  }
                  {this.state.windowWidth > 768 && 
                    <div className="header transaction-header-total">
                      <div className="transactions-header-text">{AlphaPoint.translation('TRADES.TOTAL_TEXT') || 'Total'}</div>
                      <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.total, 'total')} data-sort="Value" data-direction={this.state.sortDirection.total} />
                    </div>}
                    {
                      this.state.windowWidth > 768 &&
                      <div className="header transaction-header-fee">
                        <div className="transactions-header-text">{AlphaPoint.translation('TRADES.FEE_TEXT') || 'Fee'}</div>
                        <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.fee, 'fee')} data-sort="Fee" data-direction={this.state.sortDirection.fee} />
                      </div>
                    }
                    {
                      this.state.windowWidth > 768 &&
                      <div className="header transaction-header-executionid">
                        <div className="transactions-header-text">{AlphaPoint.translation('TRADES.EXECUTION_ID_TEXT') || 'Execution ID'}</div>
                        <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.executionid, 'executionid')} data-sort="ExecutionId" data-direction={this.state.sortDirection.executionid} />
                      </div>
                    }
                  <div className="header transaction-header-time">
                    <div className="transactions-header-text">{AlphaPoint.translation('TRADES.TIME_TEXT') || 'Time'}</div>
                    <div className="sort-icon" onClick={(e) => this.sortRows(e.target.dataset.sort, this.state.sortDirection.time, 'time')} data-sort="TradeTime" data-direction={this.state.sortDirection.time} />
                  </div>
                </div>
    
                <div className="transactions-container">
                  {rows.length > 0 ? rows : noActivity}
                </div>
                {pagination && pages.length > 1 &&
                  <div className="pad">
                    <div className="pull-right transactions-pagination-container">
                      {displayPagination}
                    </div>
                  </div>}
              </div>
    
    
            </WidgetBase>
          </div>
        );
      }
      return (
        <WidgetBase login hideCloseLink {...this.props}>
          <div className="table-responsive">
            <table className="table table-hover minFont">
                <thead>
                  <tr>
                    <th className="header">ACCOUNT</th>
                    <th className="header">#</th>
                    <th className="header">PAIR</th>
                    <th className="header">SIDE</th>
                    <th className="header">SIZE</th>
                    <th className="header">PRICE</th>
                    <th className="header">TOTAL</th>
                    <th className="header">FEE</th>
                    <th className="header">EXEC. ID</th>
                    <th className="header">TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? rows : noActivity}
                </tbody>
            </table>
          </div>

          {pagination && pages.length > 1 &&
            <div className="pad">
              <div className="pull-right transactions-pagination-container">
                {displayPagination}
              </div>
            </div>}

        </WidgetBase>
      )
  }
}

export default Trades;
