import React, { Component } from 'react';
import {commaFormatted, customFixed} from './helper';
import socketIOClient from 'socket.io-client';
import sailsIOClient from 'sails.io.js';
import { MoonLoader } from "react-spinners";
const sockerUrl = 'https://tickers.ccx.io';

class Prices extends Component {

    state = {
        windowWidth: window.innerWidth,
        rows: {
            btc: {name: 'Bitcoin'},
            eth: {name: 'Ethereum'},
            xrp: {name: 'XRP'},
            ltc: {name: 'Litecoin'},
            bch: {name: 'Bitcoin Cash'},
            ada: {name: 'Cardano'},
            trx: {name: 'TRON'},
            xmr: {name: 'Monero'},
            xlm: {name: 'Stellar'},
            miota: {name: 'IOTA'},
            eos: {name: 'EOS'},
            dash: {name: 'Dash'},
        },
        spinner: false,
        display: false
    }

    subscribeToPair(currency, io){
        io.socket.get(`/api/ws/quote?pair=${currency.toUpperCase()}_USD`, (body, JWR) => {
            if(JWR.statusCode === 201){
                const rows = {...this.state.rows};
                const name = rows[currency].name
                rows[currency] = {name, ...body.quote};
                this.setState({...this.state, rows, spinner: false})
            }
        });
    }

    componentDidMount(){
        window.addEventListener('resize', this.handleResize.bind(this));
        let io = sailsIOClient(socketIOClient);
        
        io.sails.url = sockerUrl; //TODO : change with enviroment variable
        this.setState({...this.state, spinner: true})
        setTimeout(() => {
            if(this.state.spinner){
                this.setState({...this.state, spinner: false})
            }
        }, 7000)

        for(let currency in this.state.rows){
            this.subscribeToPair(currency, io)
        }
    
        io.socket.on('message', ({pair, quote}) => {
            const rows = {...this.state.rows};
            const name = rows[pair.split("_")[0].toLowerCase()].name
            rows[pair.split("_")[0].toLowerCase()] = {name, ...quote};
            this.setState({...this.state, rows})
        });

        io.socket.on('error', (body) => {
            console.log(body)
        });
    }

    componentDidUpdate(prevProps, prevState){
        if(this.state.rows !== prevState.rows && !this.state.display){
            this.setState({...this.state, display: true, spinner: false})
        }
    }

    handleResize() {
        this.setState({windowWidth: window.innerWidth})
    }

    render() {
        const tableColumns = ['Name', 'Symbol', 'Price', '24H Change', 'Market Cap'];
        const tableColumnsMobile = ['Coin', 'Price', '24H Change', 'Market Cap'];
        const rows = {...this.state.rows};
        const cubes = {};
        for(let row in rows){
            if(row === "btc" || row === "eth" || row === "ltc" || row === "xrp"){
                cubes[row] = rows[row];
            }
        }
        return (
            <div>
            <section id="coins">
                    <div>
                        {
                            Object.keys(cubes).map((row, i) => (
                                Object.keys(cubes[row]).length > 1 &&
                                <div className="cube" key={i}>
                                    <div className="title">
                                        <div>
                                            <img src={`img/${row}.png`}/>
                                            {cubes[row].name}
                                        </div>
                                        
                                    </div>
                                    <div className="price">${commaFormatted(customFixed(cubes[row].price, 2))}<span className={cubes[row].percent_change_24h < 0 ? "negative" : "positive"}>{cubes[row].percent_change_24h < 0 ? "" : "+"}{customFixed(cubes[row].percent_change_24h, 2)}%</span></div>
                                </div>
                            ))
                        }
                    </div>
                </section>
                <section id="crypto-prices">
                    <div id="prices-table-container">
                        {this.state.spinner && <div className="isLoading"><MoonLoader sizeUnit={"px"} size={90} color={'rgb(43,191,223)'} loading={true} /></div>}
                        {
                        this.state.display &&
                        <table>
                            <thead>
                                    <tr>
                                        {this.state.windowWidth > 768 ? tableColumns.map(col=><th key={col} className={col}>{col}</th>) : tableColumnsMobile.map(col=><th key={col} className={col}>{col}</th>)}
                                    </tr>
                            </thead>
                            <tbody>
                                {this.state.windowWidth > 768
                                ? Object.keys(rows).map((row ,i)=> 
                                    Object.keys(rows[row]).length > 1 &&
                                    <tr key={i}>
                                        <td>
                                            <div>
                                                <div className="icon-holder"><img src={require(`../../../v2retailTemplate/images/currencies/${row.toLocaleLowerCase()}.png`)}/></div>
                                                {rows[row].name}
                                            </div>
                                        </td>
                                        <td>{row.toUpperCase()}</td>
                                        <td className="price">{commaFormatted(customFixed(rows[row].price, 2))} USD</td>
                                        <td className={rows[row].percent_change_24h < 0 ? "negative" : "positive"}>{rows[row].percent_change_24h < 0 ? "" : "+"}{customFixed(rows[row].percent_change_24h, 2)}%</td>
                                        <td>{commaFormatted(Math.trunc(rows[row].market_cap))}</td>
                                    </tr>
                                )
                                :
                                Object.keys(rows).map((row ,i)=> 
                                    Object.keys(rows[row]).length > 1 &&
                                    <tr>
                                        <td>
                                            <div>
                                                <div className="icon-holder">
                                                    <img src={require(`../../../v2retailTemplate/images/currencies/${row.toLocaleLowerCase()}.png`)}/>
                                                </div>
                                                {row.toUpperCase()}
                                            </div>
                                        </td>
                                        <td className="price">{commaFormatted(customFixed(rows[row].price, 2))} USD</td>
                                        <td className={rows[row].percent_change_24h < 0 ? "negative" : "positive"}>{rows[row].percent_change_24h < 0 ? "" : "+"}{customFixed(rows[row].percent_change_24h, 2)}%</td>
                                        <td>{commaFormatted(Math.trunc(rows[row].market_cap))}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        }
                    </div>
                </section>
                
            </div>
        )
    }
}

export default Prices;