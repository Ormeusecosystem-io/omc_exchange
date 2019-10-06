/* global AlphaPoint */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import Navbar from './navbar';
import Sidebar from './sidebar';
import Trades from './trades';
import OpenOrders from './openOrders-2';
import Footer from './footer';
import { viewIsPartOf } from './helper';

class Orders extends React.Component {
    constructor() {
        super();
        this.state = {
            pageProperties: {view: "open-orders", section: "Orders"}
        }
    }

    componentDidMount(){
        let pageProperties = localStorage.getItem('pageProperties');
        pageProperties = JSON.parse(pageProperties);
        const path = window.location.pathname;
        if(pageProperties.view !== this.state.pageProperties.view && viewIsPartOf(path, pageProperties)) {
            this.setState({pageProperties});
        }
        if(window.location.hash.replace("#", "")){
            const pagePropertiesUpdate = {...this.state.pageProperties, view: window.location.hash.replace("#", "")}
            this.setState({...this.state, pageProperties:pagePropertiesUpdate })
            history.pushState("", document.title, window.location.pathname);
        }
        window.addEventListener("hashchange", () => this.hashChangeHandler());
    }

    hashChangeHandler(){
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        const pagePropertiesUpdate = {...this.state.pageProperties, view: window.location.hash.replace("#", "")}
        localStorage.setItem('pageProperties', JSON.stringify(pagePropertiesUpdate));
        history.pushState("", document.title, window.location.pathname);
        window.location.reload(true);
    }


    toggleView(newPageProperties){
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        localStorage.setItem('pageProperties', JSON.stringify(newPageProperties));
        if(newPageProperties.section === "Account settings"){
            return window.location.href = `/settings.html#${newPageProperties.view}`
        }
        if(newPageProperties.section === "Wallet"){
            return window.location.href = `/my-wallet.html#${newPageProperties.view}`
        }
        window.location.reload(true);
    }

    render(){
        return (
            <div>
                <Navbar/>
                <div className="container">
                    <Sidebar onItemClick={(newPageProperties) => this.toggleView(newPageProperties)} active={this.state.pageProperties.view}/>
                    {this.state.pageProperties.view === "filled-orders" && <Trades isOrderSection />}
                    {this.state.pageProperties.view === "open-orders" && <OpenOrders isOrderSection/>}
                </div>
                <Footer/>
            </div>
        )
    }
}


export default Orders;
