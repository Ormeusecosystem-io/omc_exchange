/* global AlphaPoint */
import React from 'react';
import { formatNumberToLocale } from '../../widgets/helper';
import cryptocomparePriceFull from './ticker-helpers';


const downTrend = {
    color: 'lightcoral',
    verticalAlign: 'bottom',
    marginLeft: '20px'
};

const upTrend = {
    color: 'lightgreen',
    verticalAlign: 'bottom',
    marginLeft: '20px'
};

class TickerBlockCCUSD extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            data: {
                CHANGEPCT24HOUR: 0,
                CHANGE24HOUR: '-',
                PRICE: '-'
            },
        };
        this.cryptocomparePriceFull = cryptocomparePriceFull.bind(this);
    }

    componentDidMount() {
        this.cryptocomparePriceFull(this.props.product1Symbol, 'USD', this);
    }

    render() {
        const pxChangeDirection = this.state.data.CHANGEPCT24HOUR < 0 ? 
        (<i style={downTrend} className="material-icons">trending_down</i>) 
        : (<i style={upTrend} className="material-icons">trending_up</i>);

        return (
            this.state.data ?
            <div className="ticker-block">
                <i className={`cf cf-${this.props.cryptoFontSuffix}`} />
                <p className="ticker-symbol">{this.props.symbol} {pxChangeDirection}
                <br/>
                <span>{formatNumberToLocale(this.state.data.CHANGE24HOUR, AlphaPoint.config.tickerScrollingPxChangeDecimals || 2)} USD | {formatNumberToLocale(this.state.data.CHANGEPCT24HOUR, AlphaPoint.config.tickerScrollingPxChangeDecimals || 2)} %</span></p>
                <p className="ticker-last-trade">{this.state.data.PRICE + ' ' || '-'}
                    <span className="currency">
                        {this.props.product2Symbol}
                    </span>
                </p>
            </div> : null
        );
    }
}

TickerBlockCCUSD.defaultProps = {
    symbol: '',
    product1Symbol: '',
    product2Symbol: '',
    lastTradedPx: '-',
    sessionHigh: '-',
    cryptoFontSuffix: '-',
};

TickerBlockCCUSD.propTypes = {
    symbol: React.PropTypes.string,
    product1Symbol: React.PropTypes.string,
    product2Symbol: React.PropTypes.string,
    lastTradedPx: React.PropTypes.number,
    sessionHigh: React.PropTypes.number,
    rolling24HrPxChange: React.PropTypes.number,
    cryptoFontSuffix: React.PropTypes.string,
};

export default TickerBlockCCUSD;