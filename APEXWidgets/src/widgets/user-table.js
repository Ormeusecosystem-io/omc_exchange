/* global AlphaPoint, APConfig */
import React from 'react';
import { sortProducts } from './helper';
import WidgetBase from './base';

function TitleWidget(props) {
  return (
    <div className="col-xs-12" style={{ padding: '10px 0', borderBottom: '1px solid #ccc' }}>
      <div className="col-xs-3 col-sm-12">
        <span><a className="text-capitalize" href="dashboard.html" style={{ color: '#444', fontSize: '25px' }}>{props.title}</a></span>
      </div>
    </div>
  );
}

TitleWidget.defaultProps = {
  title: '',
};

TitleWidget.propTypes = {
  title: React.PropTypes.string,
};

class UserTable extends React.Component {
  constructor() {
    super();
    console.log();
    this.state = {
      data: [],
      balances: [],
      currentPair: [],
      pairs: [],
      lvl1: [],
      products: [],
      title: {},
      selectedAccount: AlphaPoint.userAccounts.value[0]
    };
  }

  componentDidMount() {
    this.session = AlphaPoint.getUser.subscribe((title) => this.setState({ title }));
    this.productPair = AlphaPoint.prodPair.subscribe((currentPair) => this.setState({ currentPair }));
    this.selectedAccount = AlphaPoint.selectedAccount.subscribe(selectedAccount => this.setState({ selectedAccount }));
    this.accountInformation = AlphaPoint.accountPositions.subscribe(balances => this.setState({ balances }));
    this.products = AlphaPoint.products.subscribe((products) => {
      if (AlphaPoint.config.sortProducts) {
        products.sort(sortProducts);
      }
      this.setState({ products });
    });
    this.bookTickers = AlphaPoint.tickerBook.subscribe((lvl1) => this.setState({ lvl1 }));
    this.productPairs = AlphaPoint.instruments.subscribe((pairs) => this.setState({ pairs }));
  }

  componentWillUnmount() {
    this.session.dispose();
    this.productPair.dispose();
    this.accountInformation.dispose();
    this.products.dispose();
    this.bookTickers.dispose();
    this.productPairs.dispose();
  }

  render() {
    this.state.balances.forEach((balance) => {
      const product = this.state.products.find((prod) => prod.Product === balance.ProductSymbol) || {};
      /* eslint-disable no-param-reassign */
      balance.DecimalPlaces = product.DecimalPlaces;
      balance.ProductType = product.ProductType;
      balance.fullName = product.ProductFullName;
      /* eslint-enable no-param-reassign */
    });

    // const displayedEntries = this.state.balances.filter((productBalance) => productBalance.Amount >= 0); // This is the condition that determines if it coins with 0 balance will show
    // This is the condition that determines if coins with 0 balance will show
    const displayedEntries = this.state.balances.filter((pairs) => pairs.AccountId === this.state.selectedAccount);
    let btcAmt = 0;

    const shownBalances = displayedEntries.map((product, index) => {
      if (product.ProductSymbol === 'BTC') btcAmt = product.Amount;
      /* eslint-disable react/no-array-index-key */
      if (!product.ProductSymbol) return;
      return (
        <tr key={'' + product.ProductId + index} className="ap-widget_ticker" data-help={product.Product}>
          <td className="pair">{product.ProductSymbol}</td>
          <td className="last">{product.Amount.toFixed(product.DecimalPlaces)}</td>
        </tr>
      );
      /* eslint-enable react/no-array-index-key */
    });

    let sum = 0;
    const total = displayedEntries.filter((balanceProduct) => balanceProduct.ProductSymbol !== 'BTC');

    // total.forEach((coin) => {
    //   let multiplication = 0;
    //   // const prodsPair = this.state.pairs.find((pair) => {
    //   //   if (coin.ProductType === 'NationalCurrency') {
    //   //     return coin.ProductSymbol === pair.Product2Symbol;
    //   //   }
    //   //   if (coin.ProductType === 'CryptoCurrency') {
    //   //     return coin.ProductSymbol === pair.Product1Symbol;
    //   //   }
    //   //   return null;
    //   // }) || {};
    //   const tickerData = this.state.lvl || {};
    //
    // var sum = 0
    // var total =  displayedEntries.filter(function(balanceProduct){
    //   // console.log("TOTAL BALANCE PRODUCT",balanceProduct);
    //
    //     return balanceProduct.ProductSymbol !== "BTC"
    //
    // }.bind(this))
    // // console.log("FOR TOTAL",total);


    total.forEach((coin) => {
      let multiplication = 0;
      // let prodsPair = (this.state.pairs.filter(function(pair){
      //   if (coin.ProductType == "NationalCurrency") {
      //     return coin.ProductSymbol === pair.Product2Symbol
      //   }
      //   if (coin.ProductType == "CryptoCurrency") {
      //     return coin.ProductSymbol === pair.Product1Symbol
      //   }
      // })[0] || {})
      // console.log("prodsPair",prodsPair);
      // var tickerData = (this.state.lvl1.filter(function(lvl1){
      //   return lvl1.InstrumentId === prodsPair.InstrumentId
      // })[0] || {})
      const tickerData = this.state.lvl || {};

      if (coin.ProductType === 'NationalCurrency' && tickerData.SessionClose !== 0) {
        multiplication = (coin.Amount / tickerData.SessionClose);
      }
      if (coin.ProductType === 'NationalCurrency' && tickerData.SessionClose !== 0) {
        multiplication = (coin.Amount / tickerData.SessionClose);
      }
      if (coin.ProductType === 'CryptoCurrency') {
        multiplication = (coin.Amount * tickerData.SessionClose);
      }
      sum += multiplication;
    });

    const display = (<tr className="ap-widget_ticker">
      <td><strong>{AlphaPoint.translation('USER_TABLE.TOTAL') || 'Est. Total BTC'}</strong></td>
      <td>{(btcAmt + sum).toFixed(AlphaPoint.config.decimalPlaces)}</td>
    </tr>);

    const UserName = (<a className="text-capitalize" href="settings.html" style={{ color: '#444', fontSize: '20px' }} alt="Settings">{this.state.title.UserName}</a>);

    return (
      <WidgetBase {...this.props} headerTitle={UserName}>
        {AlphaPoint.config.templateStyle !== 'retail' && <TitleWidget title="Account Balances" /> }
        <table className="table table-responsive">
          {AlphaPoint.config.templateStyle !== 'retail' &&
            <thead>
              <tr>
                <td>{AlphaPoint.translation('USER_TABLE.COIN') || 'Coin'}</td>
                <td>{AlphaPoint.translation('USER_TABLE.AMOUNT') || 'Amount'}</td>
              </tr>
            </thead>}
          <tbody>
            {shownBalances}
            {AlphaPoint.config.templateStyle !== 'retail' && display}
          </tbody>

        </table>
      </WidgetBase>
    );
  }
}

UserTable.defaultProps = {
  narrow: true,
};

export default UserTable;
