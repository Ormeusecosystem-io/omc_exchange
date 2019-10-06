/* global AlphaPoint */
import React from 'react';
import { formatNumberToLocale } from '../../widgets/helper';

const TickerBlock = props => {
    if(props.lastTradedPx > 0) {
        return (
            <div className="ticker-block">
                <p className="ticker-symbol">{props.symbol}</p>
                <p className="ticker-last-trade">{props.lastTradedPx + ' '}
                    <span className="currency">
                        {props.currencySymbol}
                    </span></p>
                <p className="ticker-session-high">high:
                    <span className="high">{' ' + props.sessionHigh}</span></p>
            </div>
        );
    }else{
        return (
            <div className="ticker-block" style={{display: "none"}}>
                <p className="ticker-symbol">{props.symbol}</p>
                <p className="ticker-last-trade">{props.lastTradedPx + ' '}
                    <span className="currency">
                        {props.currencySymbol}
                    </span></p>
                <p className="ticker-session-high">high:
                    <span className="high">{' ' + props.sessionHigh}</span></p>
            </div>
        );
    }
};

TickerBlock.defaultProps = {
    symbol: '',
    product2Symbol: '',
    lastTradedPx: '-',
    sessionHigh: '-',
    cryptoFontSuffix: '-',
};

TickerBlock.propTypes = {
    symbol: React.PropTypes.string,
    product2Symbol: React.PropTypes.string,
    lastTradedPx: React.PropTypes.number,
    sessionHigh: React.PropTypes.number,
    rolling24HrPxChange: React.PropTypes.number,
    cryptoFontSuffix: React.PropTypes.string,
};

export default TickerBlock;