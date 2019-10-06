/* global AlphaPoint */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import Navbar from './navbar';
import Ticker from './ticker';
import ShiftTickerContainer from './shift-widgets/shift-ticker-container';
import ShiftOrderBookTradesContainer from './shift-containers/shift-order-book-trades-container';
import InstrumentSelect from './instrumentSelect';
import ShiftChartContainer from './shift-containers/shift-chart-container';
import ShiftOrderEntryContainer from './shift-containers/shift-order-entry-container';
import ShiftAccountOverviewContainer from './shift-containers/shift-account-overview-container';
import ShiftOrdersTablesContainer from './shift-containers/shift-orders-tables-container';

class TradePlatform extends React.Component {

    state = {
        session: false
    }
 
    updateSession(status){
        this.setState({...this.state, session: status})
    }

    render(){
        return (
            <div>
                <Navbar onSessionChange={(isLoggedIn) => this.updateSession(isLoggedIn)}/>
                <div className="trade-page">
                    <header>
                        <ul className="header-left-col">
                        <li>
                            <div>
                                <InstrumentSelect/>
                            </div>
                        </li>
                        <li className="header-ticker-container">
                            <div>
                                <Ticker/>
                            </div>
                        </li>
                        </ul>
                    </header>
                    <div className="ui-container">
                        <div className="row">
                            <div className="left">
                                <div><ShiftTickerContainer/></div>
                                <div><ShiftOrderBookTradesContainer className="order-book"/></div>
                            </div>
                            <div className="right">

                                <div className="inner-top">
                                    <div className="inner-left"><ShiftChartContainer/></div>
                                    <div className="inner-right">
                                        <div><ShiftOrderEntryContainer session={this.state.session} className="order-entry-section"/></div>
                                        <div><ShiftAccountOverviewContainer/></div>
                                    </div>
                                </div>
                                <div className="inner-bottom">
                                    <div><ShiftOrdersTablesContainer/></div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}


export default TradePlatform;
