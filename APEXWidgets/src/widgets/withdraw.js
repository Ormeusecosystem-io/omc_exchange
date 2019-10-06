/* global AlphaPoint */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import Rx from 'rx-lite';
import uuidV4 from 'uuid/v4';

import WidgetBase from './base';
import Modal from './modal';
import SelectLabeled from '../misc/selectLabeled';
import WithdrawFIAT from './withdrawFIAT';
import WithdrawFIAT2 from './withdrawFIAT2';
import WithdrawDigital from './withdrawDigital';
import WithdrawPM from './withdrawPM';

import { formatNumberToLocale, allowWithdraw } from './helper';

function LevelLow(props) {
  return (
    <WidgetBase {...this.props} login headerTitle={AlphaPoint.translation('WITHDRAW.TITLE_TEXT') || 'Withdraw Money'}  customClass="withdraw-cash" >
      <div className="pad">
        <h3 className="text-center">{AlphaPoint.translation('WITHDRAW.TITLE_NOT_VERIFY') || 'Withdrawing fiat currency requires verification.'}</h3>
        <h3 className="text-center">{AlphaPoint.translation('WITHDRAW.SUBTITLE_NOT_VERIFY') || 'Click Verify Account to verify.'}</h3>

        <div className="clearfix">
          <div className="pull-right">
            {this.props.close && <button className="btn btn-action" onClick={props.close}>{AlphaPoint.translation('WITHDRAW.CLOSE') || 'Close'}</button>}
          </div>
        </div>
      </div>
    </WidgetBase>
  );
}

LevelLow.defaultProps = {
  close: () => {},
};

LevelLow.propTypes = {
  close: React.PropTypes.func,
};

class CurrencyPicker extends React.Component {
  next = () => {
    const selectedValue = +this.refs.currencySelect.value();
    const selectedProduct = this.props.products.find((product) => product.ProductId === selectedValue);

    this.props.setCurrency(selectedProduct);
  }

  render() {
    const currencyList = this.props.products
      .filter(product => product.Product === 'BTC' || product.Product === 'ETH')
      .map((product) => (
        <option value={product.ProductId} key={uuidV4()}>{product.ProductFullName}</option> // eslint-disable-line react/no-array-index-key
      ));

    return (
      <WidgetBase {...this.props} login headerTitle={AlphaPoint.translation('WITHDRAW.TITLE_TEXT') || 'Withdraw Money'}  customClass="withdraw-cash" >
        <div className="pad">
          <SelectLabeled ref="currencySelect" placeholder={AlphaPoint.translation('WITHDRAW.SELECT') || 'Select the currency to withdraw'}>
            {currencyList}
          </SelectLabeled>
          <div className="clearfix">
            <div className="pull-right">
              <button className="btn btn-action" onClick={this.next} >{AlphaPoint.translation('BUTTONS.TEXT_NEXT') || 'Next'}</button>
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

class Withdraw extends React.Component {
  constructor() {
    super();

    this.state = {
      screen: 1,
      currency: {},
      level: 0,
      accountInformation: [],
      products: [],
      treasuryProducts: [],
      selectedAccount: null,
    };
  }

  componentDidMount() {
    this.products = AlphaPoint.products
      .filter(prods => prods.length)
      .subscribe((products) => this.setState({ products }));
    this.accountInformation = AlphaPoint.accountPositions
      .subscribe((accountInformation) => this.setState({ accountInformation }));
    this.selectedAccount = AlphaPoint.selectedAccount
      .subscribe((selectedAccount) => this.setState({ selectedAccount }));
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
    /* eslint-disable no-unused-expressions */
    this.treasuryProducts && this.treasuryProducts.dispose();
    this.accountInformation && this.accountInformation.dispose();
    this.selectedAccount && this.selectedAccount.dispose();
    /* eslint-enable no-unused-expressions */
  }

  setCurrency = (currency) => this.setState({ currency });

  render() {
    this.state.accountInformation
      .filter((account) => account.AccountId === this.state.selectedAccount)
      .forEach((balance) => {
        const product = this.state.products.find((prod) => prod.Product === balance.ProductSymbol) || {};

        balance.DecimalPlaces = product.DecimalPlaces; // eslint-disable-line no-param-reassign
        balance.fullName = product.ProductFullName; // eslint-disable-line no-param-reassign
      });
    const info = this.state.accountInformation
      .filter((account) => account.AccountId === this.state.selectedAccount)
      .find((prodBalance) => this.state.currency.Product === prodBalance.ProductSymbol) || {};
    const availableBalance = info.Amount-info.Hold;

    const products = AlphaPoint.config.siteName === 'aztec' && this.state.treasuryProducts.length ?
      this.state.treasuryProducts.map(product => this.state.products.find(prod => prod.Product === product))
      :
      this.state.products;
    let Screen = null;

    switch (this.state.currency.ProductType) {
      case 'CryptoCurrency':
        Screen = WithdrawDigital;
        break;
      case 'NationalCurrency':
        if (this.state.level < AlphaPoint.config.withdrawLevel) {
          Screen = LevelLow;
        } else {
          AlphaPoint.config.withdrawWidget === '1' ? Screen = WithdrawFIAT : Screen = WithdrawFIAT2; // eslint-disable-line no-unused-expressions
        }
        break;
      case 3:
        Screen = WithdrawPM;
        break;
      default:
        break;
    }

    if (AlphaPoint.config.useSimMode) {
      return (
        <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('WITHDRAW.TITLE_TEXT') || 'Withdraw Money'} customClass="withdraw-cash" >
          <div className="pad">
            <span
              style={{
                display: 'block',
                padding: '15px',
                textAlign: 'center',
                fontSize: '1rem',
              }}
            >
              {AlphaPoint.translation('WITHDRAW.NO_SIM_MODE') || 'Not available in sim mode.'}
            </span>
          </div>
        </WidgetBase>
      );
    }

    if (!AlphaPoint.userPermissions.value.includes('withdraw') &&
      !AlphaPoint.userPermissions.value.includes('superuser')) {
      return (
        <WidgetBase {...this.props} headerTitle={AlphaPoint.translation('WITHDRAW.TITLE_TEXT') || 'Withdraw Money'} customClass="withdraw-cash" >
          <div className="pad">
            <span
              style={{
                display: 'block',
                padding: '15px',
                textAlign: 'center',
                fontSize: '1rem',
              }}
            >
              {AlphaPoint.translation('WITHDRAW.NO_WITHDRAWS') || 'You are not able to perform withdrawals, please contact an administrator.'}
            </span>
          </div>
        </WidgetBase>
      );
    }

    return (
      <span>
        {!Screen && <CurrencyPicker {...this.props} products={products} setCurrency={this.setCurrency} />}
        {Screen &&
          <Modal close={this.props.close}>
            <Screen
              {...this.props}
              {...this.state.currency}
              instrument={this.state.currency.instrument}
              balance={availableBalance}
              fullName={info.fullName}
            />
          </Modal>}
      </span>
    );
  }
}

Withdraw.defaultProps = {
  close: () => {},
};

Withdraw.propTypes = {
  close: React.PropTypes.func,
};

export default Withdraw;
