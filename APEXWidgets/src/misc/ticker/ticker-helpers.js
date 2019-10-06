import cc from 'cryptocompare';

const cryptocomparePriceFull = (product1symbol, toSymbol, self) => {

    cc.priceFull([product1symbol], [toSymbol]).then(prices => {
        self.setState({data: prices[product1symbol][toSymbol] });
    }, (errorReason) => {
        if (errorReason) self.setState({ data: false });
    });

}

export default cryptocomparePriceFull;