/* global AlphaPoint */
import React from 'react';
import axios from 'axios';
import uuidV4 from 'uuid/v4';

import Rx from 'rx-lite';
import TickerBlock from '../misc/ticker/ticker-block'
import TickerBlockCCUSD from '../misc/ticker/ticker-block-cc-usd';
import TickerBlockPxChange from '../misc/ticker/ticker-block-pxchange';

class TickerScrolling extends React.Component {
    constructor() {
        super();
        this.state = {
            instruments: [],
            tickerData: [],
            tickerDataCps: [],
            tickerBlocks: {
                TickerBlock: TickerBlock,
                TickerBlockCCUSD: TickerBlockCCUSD,
                TickerBlockPxChange: TickerBlockPxChange,
            }
        
        };
    }
    async getBitfinexTickerData(symbolsAsString){
            let tickerData;
            let url = `https://tickers.ccx.io/api/tickers`;
            try{
                let { data } = await axios.get(`${url}?symbols=${symbolsAsString}`)
                tickerData = data.map((item, index) => {
                    let instrumentId = index + 1;
                    return {
                        InstrumentId: instrumentId,
                        BestOffer: item[10],
                        LastTradedPx: item[6],
                        SessionHigh: item[9],
                        Rolling24HrPxChange: item[6],
                    }
                })
                this.setState(prevState => ({
                    ...prevState,
                    tickerData: tickerData
                  }))


            }catch(e){
                console.log("e: ", e)
            }
    
    }


    componentDidMount() {

        let bitfinexData = "";

        this.productPairs = AlphaPoint.instruments.subscribe(instruments => {
            
            //bitfinex filter params to make a call
            bitfinexData = instruments.filter(ins => ins.Symbol !== "CPSUSD" || ins.Symbol !== "CPSBTC").map(i => `t${i.Symbol}`).join(',');
            if(bitfinexData !== "") {
                this.getBitfinexTickerData(bitfinexData);
                setInterval(() => this.getBitfinexTickerData(bitfinexData) , 20000)
            };
            
            instruments = instruments.filter(ins => ins.Symbol !== "CPSBTC");
            
            this.setState({ instruments });
            
            instruments.map(ins => ins.InstrumentId).forEach(instrument => {
                AlphaPoint.subscribeLvl1(instrument);
            });

            AlphaPoint.Level1.subscribe(tickerData => {
                tickerData = Object.values(tickerData)
                tickerData = tickerData.filter(ins => ins.InstrumentId === 8);

                this.setState(prevState => ({
                    ...prevState,
                    tickerDataCps: tickerData
                  }))
            });
        });        
    }

    render() {
        const TickerBlock = AlphaPoint.config.tickerBlock ? this.state.tickerBlocks[AlphaPoint.config.tickerBlock] : this.state.tickerBlocks['TickerBlock'];
        
        return (
            <div className="ticker" id={this.state.instruments.length}>
                {this.state.instruments
                    .filter(ins=> ins.Symbol === "ETHBTC" || ins.Symbol === 'BTCUSD' || ins.Symbol === 'ETHUSD' || ins.Symbol === 'BTCEUR' || ins.Symbol === 'ETHEUR' || ins.Symbol === 'BTCGBP' || ins.Symbol === 'ETHGBP')
                    .map(ins => {
                            let tickerData = ins.Symbol === "CPSUSD"  ? this.state.tickerDataCps : this.state.tickerData
                            
                            let rolling24HrPxChange = tickerData.filter(obj => obj.InstrumentId == ins.InstrumentId).map(data => data.Rolling24HrPxChange) * 100;
                            let sessionHigh = tickerData.filter(obj => obj.InstrumentId === ins.InstrumentId).map(data => data.SessionHigh);
                            let lastTradedPx = tickerData.filter(obj => obj.InstrumentId === ins.InstrumentId).map(data => data.LastTradedPx);
                            let bestOffer = tickerData.filter(obj => obj.InstrumentId === ins.InstrumentId).map(data => data.BestOffer);
                            return (<TickerBlock
                                {...this.props}
                                key={uuidV4()}
                                id={ins.InstrumentId}
                                symbol={ins.Symbol}
                                cryptoFontSuffix={(ins.Product1Symbol).toLowerCase()}
                                product1Symbol={ins.Product1Symbol}
                                product2Symbol={ins.Product2Symbol}
                                bestOffer={customFixed(bestOffer,2)}
                                lastTradedPx={customFixed(lastTradedPx,2)}
                                sessionHigh={customFixed(sessionHigh,2)}
                                rolling24HrPxChange={customFixed(rolling24HrPxChange,2)}
                            />)
                        })
                    }
            </div>
        );
    };
};

TickerScrolling.defaultProps = {
    showHighSymbol: false,
};
    
TickerScrolling.propTypes = {
    showHighSymbol: React.PropTypes.bool,
};

export default TickerScrolling;

const customFixed = (num, fixed) => {
    num = String(num);
    fixed = fixed+1;
    if(num.length < 3) return num
    let fixed_num = "";
    let counter = 0;
    for (let i = 0; i < num.length; i++) {
        fixed_num = fixed_num + num[i];
        if(num[i] === "."  || counter > 0){
            counter++
            if(counter === fixed){
                return Number(fixed_num)
            }
        }
    }
    return Number(fixed_num)
  }