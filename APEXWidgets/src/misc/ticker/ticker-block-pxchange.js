/* global AlphaPoint */
import React from 'react';
import { formatNumberToLocale } from '../../widgets/helper';

const downTrend = {
    color: '#ff6820',
    verticalAlign: 'bottom',
    marginLeft: 'auto',
    fontSize: '24px',
    fontFamily: "medium"
};

const upTrend = {
    color: '#50e3c2',
    verticalAlign: 'bottom',
    marginLeft: 'auto',
    fontFamily: "medium",
    fontSize: '24px'
};

const coins = {
    cps: "COTI Dime",
    btc: "Bitcoin",
    eth: "Ethereum",
    xrp: "Ripple",
    bth: "Bitcoincash",
    ltc: "Litecoin"
}

const TickerBlockPxChange = props => {
    
    const pxChangeDirection = props.rolling24HrPxChange < 0 ? 
      (<i style={downTrend} className="material-icons">-</i>) 
      : (<i style={upTrend} className="material-icons">+</i>);
    
    // Getting original Px before the rolling24HrPxChange
    
    // using best offer instead lastTradedPx 
    // const pxBefore24HrChange = props.rolling24HrPxChange < 0 ? 
    //   (props.bestOffer / (100 - Math.abs(props.rolling24HrPxChange)) * 100)
    //   : ((props.bestOffer / (Math.abs(props.rolling24HrPxChange) + 100)) * 100);

    //   source code shift  
    const pxBefore24HrChange = props.rolling24HrPxChange < 0 ? 
      (props.lastTradedPx / (100 - Math.abs(props.rolling24HrPxChange)) * 100)
      : ((props.lastTradedPx / (Math.abs(props.rolling24HrPxChange) + 100)) * 100);
    
    // PxChange in terms of product2 (converted from a percentage)
    const convertedPxChange = props.rolling24HrPxChange < 0 ? 
        formatNumberToLocale(pxBefore24HrChange - props.lastTradedPx, AlphaPoint.config.tickerScrollingPxChangeDecimals || 2) || '-'
      : formatNumberToLocale(props.lastTradedPx - pxBefore24HrChange, AlphaPoint.config.tickerScrollingPxChangeDecimals || 2) || '-';
    // console.log("props: ", props)
    if(props.lastTradedPx > 0) {
        return (
            <div className="ticker-block">
                <div>
                    <img src={`./img/currencies/${props.cryptoFontSuffix}.svg`} />
                    <p className="ticker-symbol">{coins[props.cryptoFontSuffix]}</p>
                    <p className="ticker-name">{props.product1Symbol}</p>
                </div>
                <div>
                    {/* <p className="ticker-rolling"> {(props.rolling24HrPxChange < 0) && '-'}{convertedPxChange} {props.product2Symbol} </p> */}
                    <p className="ticker-rolling"> {props.bestOffer} {props.product2Symbol} </p>
                    <p style={props.rolling24HrPxChange < 0 ? downTrend : upTrend }> {formatNumberToLocale(props.rolling24HrPxChange, AlphaPoint.config.tickerScrollingPxChangeDecimals || 2)}%</p>
                </div>
            </div>
        );
    }else{
        return (
            <div className="ticker-block" style={{display: "none"}}>
                <div>
                    <img src={`./img/currencies/${props.cryptoFontSuffix}.svg`} />
                    <p className="ticker-symbol">{coins[props.cryptoFontSuffix]}</p>
                    <p className="ticker-name">{props.product1Symbol}</p>
                </div>
                <div>
                    <p className="ticker-rolling"> {props.bestOffer} {props.product2Symbol} </p>
                    <p style={props.rolling24HrPxChange < 0 ? downTrend : upTrend }> {formatNumberToLocale(props.rolling24HrPxChange, AlphaPoint.config.tickerScrollingPxChangeDecimals || 2)}%</p>
                </div>
            </div>
        );
    }
};



TickerBlockPxChange.defaultProps = {
    symbol: '',
    product2Symbol: '',
    bestOffer: '0.00',
    lastTradedPx: '-',
    sessionHigh: '-',
    cryptoFontSuffix: '-',
};

// TickerBlockPxChange.propTypes = {
//     symbol: React.PropTypes.string,
//     product2Symbol: React.PropTypes.string,
//     bestOffer: React.PropTypes.string,
//     lastTradedPx: React.PropTypes.string,
//     sessionHigh: React.PropTypes.string,
//     rolling24HrPxChange: React.PropTypes.string,
//     cryptoFontSuffix: React.PropTypes.string,
// };

export default TickerBlockPxChange;