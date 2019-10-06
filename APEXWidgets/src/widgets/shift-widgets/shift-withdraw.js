import Withdraw from '../withdraw';

class ShiftWithdraw extends Withdraw {

  prepareProducts(product) {
    const currencies = AlphaPoint.config.balances.currenciesWithActionBtns;
    return currencies.indexOf(product.Product) !== -1;
  }

  componentDidMount() {
    super.componentDidMount();
    this.products = AlphaPoint.products
      .filter(prods => prods.length)
      .subscribe((products) => {
        const preparedProducts = products.filter(this.prepareProducts);
        super.setState({ products: preparedProducts });
      });
  }
}

export default ShiftWithdraw;
