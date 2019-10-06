/* global AlphaPoint */
import React from 'react';
import Rx from 'rx-lite';
import ReactTooltip from 'react-tooltip';
import { formatNumberToLocale } from './helper';

class AccountBalances extends React.Component {
  constructor() {
    super();

    this.state = {
      currentInstrument: {},
      Product1AvailableBalance: '0.00',
      Product2AvailableBalance: '0.00',
      Product1TotalBalance: '0.00',
      Product2TotalBalance: '0.00',
      balances: [],
      accountId: null,
      decimalPlaces: {},
    };
  }

  componentDidMount() {
    this.products = AlphaPoint.products.filter(data => data.length).subscribe(products => {
      const decimalPlaces = {};
      products.forEach(product => {
        decimalPlaces[product.Product] = product.DecimalPlaces;
      });
      this.setState({ decimalPlaces });
    });
    this.decimalPlacesTraderUI = AlphaPoint.config.decimalPlacesTraderUI;
    this.accountPositions = AlphaPoint.accountPositions.filter(data => data.length).subscribe(balances => {
      this.setState({ balances });
      this.updateBalances();
    });

    this.accountChange = AlphaPoint.selectedAccount
      .filter(accountId => accountId)
      .subscribe(accountId => this.setState({ accountId }, this.updateBalances));

    this.currentInstrument = Rx.Observable.combineLatest(
      AlphaPoint.instrumentChange,
      AlphaPoint.instruments,
      (selected, instruments) => {

        if (instruments.length === 0) {
          instruments = AlphaPoint.instruments.value;
        }

        const instrument = instruments.find(inst => inst.InstrumentId === +selected);
        return instrument;
      },
    )
      .filter(instrument => instrument)
      .subscribe(instrument => this.setState({ currentInstrument: instrument }, this.updateBalances));
  }

  componentWillUnmount() {
    this.accountPositions.dispose();
    this.accountChange.dispose();
    this.currentInstrument.dispose();
  }

  updateBalances = () => {
    const selectedAccount = this.state.accountId;
    const instrument = this.state.currentInstrument;
    const balances = this.state.balances.filter(balance => balance.AccountId === selectedAccount);
    const product1Balance = balances.find(balance => balance.ProductId === instrument.Product1);
    const product2Balance = balances.find(balance => balance.ProductId === instrument.Product2);

    if (product1Balance && product2Balance) {
      const product1AvailableBalance = product1Balance.Amount - product1Balance.Hold;
      const product2AvailableBalance = product2Balance.Amount - product2Balance.Hold;

      this.setState({
        Product1AvailableBalance: product1AvailableBalance || '0.00',
        Product2AvailableBalance: product2AvailableBalance || '0.00',
        Product1TotalBalance: product1Balance.Amount || '0.00',
        Product2TotalBalance: product2Balance.Amount || '0.00',
      });
    }
  };

  formatDataTip = (value, symbol) => {
    const { decimalPlaces } = this.state;
    if (decimalPlaces[symbol]) {
      return formatNumberToLocale(value, decimalPlaces[symbol]);
    }
    return value;
  }

  render() {
    const {
      currentInstrument,
      Product2AvailableBalance,
      Product2TotalBalance,
      Product1AvailableBalance,
      Product1TotalBalance,
    } = this.state;

    const { Product1Symbol, Product2Symbol } = currentInstrument;
    const strProduct1AvailableBalance = formatNumberToLocale(Product1AvailableBalance, this.state.decimalPlaces[Product1Symbol] || 2);
    const strProduct2AvailableBalance = formatNumberToLocale(Product2AvailableBalance, this.state.decimalPlaces[Product2Symbol] || 2);
    const strProduct1TotalBalance = formatNumberToLocale(Product1TotalBalance, this.state.decimalPlaces[Product1Symbol] || 2);
    const strProduct2TotalBalance = formatNumberToLocale(Product2TotalBalance, this.state.decimalPlaces[Product2Symbol] || 2);

    const balanceSliceIndex = AlphaPoint.config.balanceSliceIndex || 11;

    const aryProduct1AvailableBalance = strProduct1AvailableBalance.length > balanceSliceIndex ? [strProduct1AvailableBalance.slice(0, balanceSliceIndex), strProduct1AvailableBalance.slice(balanceSliceIndex)] : [strProduct1AvailableBalance];
    const aryProduct2AvailableBalance = strProduct2AvailableBalance.length > balanceSliceIndex ? [strProduct2AvailableBalance.slice(0, balanceSliceIndex), strProduct1AvailableBalance.slice(balanceSliceIndex)] : [strProduct2AvailableBalance];
    const aryProduct1TotalBalance = strProduct1TotalBalance.length > balanceSliceIndex ? [strProduct1TotalBalance.slice(0, balanceSliceIndex), strProduct1TotalBalance.slice(balanceSliceIndex)] : [strProduct1TotalBalance];
    const aryProduct2TotalBalance = strProduct2TotalBalance.length > balanceSliceIndex ? [strProduct2TotalBalance.slice(0, balanceSliceIndex), strProduct2TotalBalance.slice(balanceSliceIndex)] : [strProduct2TotalBalance];

    return (
      <div>
        <div className="module-head">
          <h2>{AlphaPoint.translation('ACCOUNT_BALANCES.TITLE_TEXT') || 'Account Overview'}</h2>
        </div>
        <table className="ap-list">
          <thead>
            <tr>
              <th>{AlphaPoint.translation('ACCOUNT_BALANCES.PRODUCT') || 'Product'}</th>
              <th>{AlphaPoint.translation('ACCOUNT_BALANCES.AVAIL_BALANCE_TEXT') || 'Available Balance'}</th>
              <th>{AlphaPoint.translation('ACCOUNT_BALANCES.TOTAL_BALANCE_TEXT') || 'Total Balance'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{Product2Symbol || 'ETH'} {AlphaPoint.translation('ACCOUNT_BALANCES.PRODUCT_BALANCE_TEXT')}</td>
              <td>
                {
                  aryProduct2AvailableBalance.map((balance, idx) => {
                    return(<p key={idx} data-for='balanceTip' data-tip={strProduct2AvailableBalance}>{balance}</p>);
                  })
                }
              </td>
              <td>
                {
                  aryProduct2TotalBalance.map((balance, idx) => {
                    return(<p key={idx} data-for='balanceTip' data-tip={strProduct2TotalBalance}>{balance}</p>);
                  })
                }
              </td>
            </tr>
            <tr>
              <td>{Product1Symbol || 'BTC'} {AlphaPoint.translation('ACCOUNT_BALANCES.PRODUCT_BALANCE_TEXT')}</td>
              <td>
                {
                  aryProduct1AvailableBalance.map((balance, idx) => {
                    return(<p key={idx} data-for='balanceTip' data-tip={strProduct1AvailableBalance}>{balance}</p>);
                  })
                }
              </td>
              <td>
                {
                  aryProduct1TotalBalance.map((balance, idx) => {
                    return(<p key={idx} data-for='balanceTip' data-tip={strProduct1TotalBalance}>{balance}</p>);
                  })
                }
              </td>
            </tr>
          </tbody>
        </table>
        <ReactTooltip id='balanceTip' />
      </div>
    );
  }
}

export default AccountBalances;
