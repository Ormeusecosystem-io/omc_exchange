/* global AlphaPoint */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import Rx from 'rx-lite';
import ScrollLock from 'react-scrolllock';
import uuidV4 from 'uuid/v4';

import WidgetBase from './base';
import SelectLabeled from '../misc/selectLabeled';
import Modal from './modal';
import DepositFIAT from './depositFIAT';
import DepositDigital from './depositDigital';
import DepositPM from './depositPM';

import { allowDeposit } from './helper';

class CurrencyPicker extends React.Component {
  next = () => {
    const selectedValue = +this.refs.currencySelect.value();
    const selectedProduct = this.props.products.find((product) => product.ProductId === selectedValue);

    this.props.setCurrency(selectedProduct);
  };

  render() {
    const currencyList = this.props.products.filter((product) => {
      return product.ProductFullName === "Bitcoin" || product.ProductFullName === "Ethereum"
      // We'll only allow crypto currencies deposits in SIM mode
      // if (AlphaPoint.config.useSimMode) return product.ProductType === 'CryptoCurrency';
      // return allowDeposit(product.Product);
    }).map((product) => <option value={product.ProductId} key={uuidV4()}>{product.ProductFullName}</option>);

    return (
      <WidgetBase {...this.props} login headerTitle={AlphaPoint.translation('DEPOSIT.TITLE_TEXT') || 'Deposit Money'} withCloseButton="true">
        <ScrollLock />
        <div className="pad">
          <SelectLabeled ref="currencySelect" placeholder={AlphaPoint.translation('DEPOSIT.SELECT') || 'Select the currency to deposit'}>
            {currencyList}
          </SelectLabeled>

          <div className="clearfix">
            <div className="pull-right">
              <button className="btn btn-action" onClick={this.next} >{AlphaPoint.translation('DEPOSIT.NEXT') || 'Next'}</button>
            </div>
          </div>
        </div>
      </WidgetBase>
    );
  }
}

CurrencyPicker.defaultProps = {
  products: [],
  setCurrency: () => {},
};

CurrencyPicker.propTypes = {
  products: React.PropTypes.arrayOf(React.PropTypes.object),
  setCurrency: React.PropTypes.func,
};

class Deposit extends React.Component {
  constructor() {
    super();

    this.state = {
      screen: 1,
      currency: {},
      products: [],
      treasuryProducts: [],
    };
  }

  componentDidMount() {
    this.products = AlphaPoint.products
      .filter(prods => prods.length)
      .subscribe((products) => this.setState({ products }));
    this.treasuryProducts = AlphaPoint.treasuryProducts
      .filter(prods => prods.length)
      .subscribe(treasuryProducts => this.setState({ treasuryProducts }));

    if (AlphaPoint.config.siteName === 'aztec') {
      AlphaPoint.getTreasuryProductsForAccount({
        AccountId: AlphaPoint.selectedAccount.value,
        OMSId: AlphaPoint.oms.value,
      });
    }
  }

  componentWillUnmount() {
    this.products.dispose();
    this.treasuryProducts && this.treasuryProducts.dispose(); // eslint-disable-line no-unused-expressions
  }

  setCurrency = (currency) => this.setState({ currency });

  render() {
    let Screen = null;
    const products = AlphaPoint.config.siteName === 'aztec' && this.state.treasuryProducts.length ?
      this.state.treasuryProducts.map(product => this.state.products.find(prod => prod.Product === product))
      :
      this.state.products;

    switch (this.state.currency.ProductType) {
      case 'CryptoCurrency':
        Screen = DepositDigital;
        break;
      case 'NationalCurrency':
        Screen = DepositFIAT;
        break;
      case 3:
        Screen = DepositFIAT;
        break;
      case 4:
        Screen = DepositPM;
        break;
      default:
        break;
    }

    if (!AlphaPoint.userPermissions.value.includes('deposit') &&
      !AlphaPoint.userPermissions.value.includes('superuser')) {
      return (
        <WidgetBase {...this.props} login headerTitle={AlphaPoint.translation('DEPOSIT.TITLE_TEXT') || 'Deposit Money'} withCloseButton="true">
          <ScrollLock />
          <div className="pad">
            <span
              style={{
                display: 'block',
                padding: '15px',
                textAlign: 'center',
                fontSize: '1rem',
              }}
            >
              {AlphaPoint.translation('DEPOSIT.INSTRUCTION5') || 'You are not able to perform deposits, please contact an administrator.'}
            </span>
          </div>
        </WidgetBase>
      );
    }

    return (
      <div>
        {!Screen && <CurrencyPicker {...this.props} products={products} setCurrency={this.setCurrency} />}
        {Screen && <Modal close={this.props.close}><Screen {...this.props} {...this.state.currency} /></Modal>}
      </div>
    );
  }
}

Deposit.defaultProps = {
  close: () => {},
};

Deposit.propTypes = {
  close: React.PropTypes.func,
};

export default Deposit;
