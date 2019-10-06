/* global AlphaPoint */
import Rx from 'rx-lite';

function subscribeToMarket() {
  this.marketPrice = AlphaPoint.tickerBook.subscribe(ticker => {
    // This updates marketSell and marketBuy values
    // Conditional prevent: if subscribed to multiple instruments, having multiple instrument prices update the state constantly
    if (this.state.InstrumentId) {
      if (this.state.InstrumentId === ticker.InstrumentId) {
        this.setState({ marketBuy: ticker.BestBid, marketSell: ticker.BestOffer });
      }
    } else {
      this.setState({ marketBuy: ticker.BestBid, marketSell: ticker.BestOffer });
    }
  });
}

export function changeValueOnMarketChange() {
  this.changeValueOnMarketChange = AlphaPoint.tickerBook.subscribe(ticker => {
    const price = this.state.buy ? ticker.BestBid : ticker.BestOffer;
    const total = price * (+this.state.amount);

    if (this.state.market) {
      this.setState({ price, total }, this.getOrderFee);
    }
  });
}

export function getRetailInstruments(instruments, products) {
  let pairs = [];
  if (products) {
    if (AlphaPoint.config.allowCryptoPairs) {
      pairs = instruments;
    } else {
      const fiats = [];
      products.forEach(prod => {
        if (prod.ProductType === 'NationalCurrency') fiats.push(prod.ProductId);
      });
      pairs = instruments.filter(pair => fiats.includes(pair.Product2));
    }
  }
  return pairs;
}

export function changeAmountOnMarketChange() {
  this.changeAmountOnMarketChange = AlphaPoint.tickerBook.subscribe(ticker => {
    const marketPrice = this.state.buy ? ticker.BestBid : ticker.BestOffer;
    const amount = (+this.state.price) / marketPrice;

    if (this.state.market) {
      this.setState({ amount }, this.getOrderFee);
    }
  });
}

export function ordersWidgetDidMount(subscribeMarket = true, onlyFiat = false, setFeeState = true) {
  if (subscribeMarket) subscribeToMarket.bind(this)();

  this.productPairs = AlphaPoint.instruments.subscribe((productPairs) => {
    this.setState({ productPairs }, () => {
      productPairs.forEach((pair) => {
        if (this.state.productPair === pair.Symbol) this.setState({ pair });
      });
    });
  });

  this.productPair = AlphaPoint.prodPair.subscribe(productPair => {
    this.setState({ productPair }, () => {
      let currentPair = {};
      let currentProduct = [];

      this.state.productPairs.forEach(pair => {
        if (localStorage.getItem('SessionPair') === pair.Symbol){
          currentPair = pair;
          this.setState({
            pair,
            InstrumentId: pair.InstrumentId,
            productPair: pair.Symbol
          });
        }
      });

      if (this.state.products && onlyFiat) {
        currentProduct = this.state.products[currentPair.Product2];

        if (currentProduct.ProductType !== 'NationalCurrency' && !AlphaPoint.config.allowCryptoPairs) {
          this.setState({
            pair: this.state.productPairs[0],
            InstrumentId: this.state.productPairs[0].InstrumentId,
            productPair: this.state.productPairs[0].Symbol
          });
        }
      }
      if (this.state.AccountId || AlphaPoint.userAccounts.value[0]) this.getOrderFee();
    });
  });

  this.accountBalances = Rx.Observable.combineLatest(
    AlphaPoint.selectedAccount,
    AlphaPoint.accountPositions,
    (selectedAccount, accountPositions) => ({ selectedAccount, accountPositions }),
  ).subscribe(({ selectedAccount, accountPositions }) => this.setState({
    balances: accountPositions.filter(balance => balance.AccountId === +selectedAccount),
    AccountId: selectedAccount,
  }));

  this.products = AlphaPoint.products.filter(data => data.length).subscribe(prods => {
    const decimalPlaces = {};
    const products = {};
    prods.forEach(product => {
      decimalPlaces[product.Product] = product.DecimalPlaces;
      products[product.ProductId] = product;
    });
    this.setState({ decimalPlaces, products });
  });

  if (setFeeState) {
    this.orderfee = AlphaPoint.orderfee.subscribe((res) => this.setState({
      fee: res.OrderFee,
      feeProduct: this.state.products
        && this.state.products[res.ProductId]
        && this.state.products[res.ProductId].Product,
    }));
  }
}

export function ordersWidgetWillUnmount() {
  /* eslint-disable no-unused-expressions */
  this.productPairs && this.productPairs.dispose();
  this.productPair && this.productPair.dispose();
  this.changeAmountOnMarketChange && this.changeAmountOnMarketChange.dispose();
  this.changeValueOnMarketChange && this.changeValueOnMarketChange.dispose();
  this.orderfee && this.orderfee.dispose();
  this.sessionLoaded && this.sessionLoaded.dispose();
  this.sendOrder && this.sendOrder.dispose();
  this.marketPrice && this.marketPrice.dispose();
  this.accountChangeEvent && this.accountChangeEvent.dispose();
  this.accountBalances && this.accountBalances.dispose();
  /* eslint-disable no-unused-expressions */
}

export function getOrderFee() {
  const buy = this.state.buy || this.state.bought;
  const sell = !buy;
  const pair = this.state.productPairs
    .find(prodPair => this.state.productPair === prodPair.Symbol) || {};
  const product1 = this.state.balances
    .find(prod => pair.Product1Symbol === prod.ProductSymbol) || {};
  const product2 = this.state.balances
    .find(prod => pair.Product2Symbol === prod.ProductSymbol) || {};
  const accountId = this.state.AccountId || AlphaPoint.userAccounts.value[0];
  const Amount = buy ? +this.state.amount : +this.state.total;

  const insideBid = this.state.marketBuy; // We should refactor this state variable name
  const insideAsk = this.state.marketSell; // We should refactor this state variable name
  let price = +this.state.price;
  let MakerTaker = '';

  if (this.state.OrderType === 1) price = buy ? this.state.marketSell : this.state.marketBuy;
  if (this.state.OrderType === 3) price = +this.state.stop_price;

  if (buy) MakerTaker = price < insideAsk || insideAsk === 0 ? 'Maker' : 'Taker';

  if (sell) MakerTaker = price > insideBid || insideBid === 0 ? 'Maker' : 'Taker';

  if (this.state.OrderType === 1) MakerTaker = 'Taker'; // Market Order Taker

  const data = {
    OMSId: AlphaPoint.oms.value,
    AccountId: accountId,
    InstrumentId: pair.InstrumentId || 0,
    ProductId: buy ? product1.ProductId : product2.ProductId,
    Amount,
    OrderType: this.state.OrderType,
    MakerTaker,
    Side: buy ? 0 : 1,
    Price: price,
    Quantity: Amount,
  };

  AlphaPoint.getOrderFee(data);
}

export default {
  getOrderFee,
  getRetailInstruments,
  ordersWidgetDidMount,
  ordersWidgetWillUnmount,
  changeValueOnMarketChange,
  changeAmountOnMarketChange,
};
