/* global AlphaPoint */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import Navbar from './navbar';
import Sidebar from './sidebar';
import UserSettings from './user-settings';
import AccountVerification from './accountVerification';
import Footer from './footer';
import { viewIsPartOf } from './helper';

class Settings extends React.Component {
    constructor() {
        super();
        this.state = {
            pageProperties: {view: "account-verification", section: "Account settings"}
        }
    }

    toggleView(newPageProperties){
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        localStorage.setItem('pageProperties', JSON.stringify(newPageProperties));
        if(newPageProperties.section === "Wallet"){
            return window.location.href = `/my-wallet.html#${newPageProperties.view}`
        }
        if(newPageProperties.section === "Orders"){
            return window.location.href = `/orders.html#${newPageProperties.view}`
        }
        window.location.reload(true);
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

    render(){
        return (
            <div>
                <Navbar/>
                <div className="container">
                    <Sidebar onItemClick={(newPageProperties) => this.toggleView(newPageProperties)} active={this.state.pageProperties.view}/>
                    {this.state.pageProperties.view === "security-settings" && <UserSettings/>}
                    {this.state.pageProperties.view === "account-verification" && <AccountVerification/>}
                </div>
                <Footer/>
            </div>
        )
    }
}


export default Settings;
