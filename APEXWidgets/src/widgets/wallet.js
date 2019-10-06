/* global AlphaPoint */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import Navbar from './navbar';
import Sidebar from './sidebar';
import Balances from './balances';
import AccountTransactions from './accountTransactions';
import DepositSection from './depositSection';
import WithdrawSection from './withdrawSection';
import BuyFixed from './buy-fixed';
import Footer from './footer';
import { viewIsPartOf } from './helper';

class Wallet extends React.Component {
    constructor() {
        super();
        this.state = {
            pageProperties: { view: "balances", section: 'Wallet', productId: 1 },
            approved: false,
            userConfig: null,
            authorized: true,
            accountInfo: null,
            deposits: []
        }
    }

    componentDidMount(){
        this.userConfiguration = AlphaPoint.getUserConfig.subscribe(data => {
            this.setState({...this.state, userConfig: data})
        })
      
        this.accountInformation2 = AlphaPoint.accountInfo.subscribe(data => {
            this.setState({...this.state, accountInfo: data})
        })

        this.accountTransactions = AlphaPoint.accountTransactions.subscribe((data) => {
            const actions = Object.values(data)
              .map(account => account)
              .reduce((a, b) => a.concat(b), [])
              .filter((transaction) => transaction.ReferenceType === 'Deposit') 
            this.setState({ deposits: actions });
        });

        let pageProperties = localStorage.getItem('pageProperties');
        pageProperties = JSON.parse(pageProperties);
        const path = window.location.pathname;
        if(pageProperties && pageProperties.view !== this.state.pageProperties.view && viewIsPartOf(path, pageProperties)) {
            this.setState({pageProperties});
        }

        if(window.location.hash.replace("#", "")){
            const pagePropertiesUpdate = {...this.state.pageProperties, view: window.location.hash.replace("#", "")}
            this.setState({...this.state, pageProperties:pagePropertiesUpdate })
            history.pushState("", document.title, window.location.pathname);
        }
        window.addEventListener("hashchange", () => this.hashChangeHandler());

    }
    
    shouldComponentUpdate(nextProps, nextState) {
        return !(nextState.pageProperties.view === this.state.pageProperties.view) 
                || !(nextState.pageProperties.productId === this.state.pageProperties.productId)
                || this.state.userConfig !== nextState.userConfig
                || this.state.authorized !== nextState.authorized
                || this.state.approved !== nextState.approved
                || this.state.accountInfo !== nextState.accountInfo;
    }
    
    hashChangeHandler(){
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        let pagePropertiesUpdate = {...this.state.pageProperties, view: window.location.hash.replace("#", "")}
        pagePropertiesUpdate = {...pagePropertiesUpdate, productId: 1} 
        localStorage.setItem('pageProperties', JSON.stringify(pagePropertiesUpdate));
        history.pushState("", document.title, window.location.pathname);
        window.location.reload(true);
    }

    toggleView(newPageProperties){
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        newPageProperties = {...this.state.pageProperties, ...newPageProperties}
        localStorage.setItem('pageProperties', JSON.stringify(newPageProperties));

        if(newPageProperties.section === "Account settings"){
            return window.location.href = `/settings.html#${newPageProperties.view}`
        }
        else if(newPageProperties.section === "Orders"){
            return window.location.href = `/orders.html#${newPageProperties.view}`
        }
        window.location.reload(true);
    }

    changeProd(productId){
        this.setState({...this.state, pageProperties: {...this.state.pageProperties, productId}})
    }

    componentDidUpdate(prevProps, prevState) {
    
        const { accountInfo, userConfig } = this.state
        if(prevState.accountInfo !== null && prevState.userConfig !== null) {
          if(prevState.accountInfo !== accountInfo || prevState.userConfig !== userConfig){
            const pendingLevel = userConfig && this.getAcoountStatusFromUserConfig(userConfig) === 'pending' ? true : false;
            if(accountInfo.VerificationLevel > 0 && !this.state.approved){
              return this.setState({...this.state, approved: true, authorized: false})
            }else if(accountInfo.VerificationLevel < 2  && this.state.authorized === pendingLevel){
              return this.setState({...this.state, approved: false, authorized: false})
            }
          }
        }
    }

    checkWithdrawPermission(){
        let errorMessage = "";
        let allowedToProceed = false;
        let uploadedDocuments = !!this.state.userConfig.filter(obj => obj.Key === "uploadedDocuments" && obj.Value === "true").length;
        let isAllowedWithdraw = !!this.state.userConfig.filter(obj => obj.Key === "isAllowedWithdraw" && obj.Value === "true").length;
        let isAccountApproved = this.state.approved;
        let total = 0;
        this.state.deposits.forEach(deposit => {
          total += deposit.CR
        })
        if(!uploadedDocuments && !isAccountApproved){
          errorMessage = "Withdrawals require account verification. Verify account now?";
        }
        else if(uploadedDocuments && !isAccountApproved){
          errorMessage = "Account verification is pending. Once verified, you can proceed with withdrawals."
        }
        else if((isAccountApproved && !isAllowedWithdraw && total < 10000) || (isAccountApproved && isAllowedWithdraw)){
          allowedToProceed = true;
        }
        else if(isAccountApproved && !isAllowedWithdraw && total >= 10000 && !uploadedDocuments){
          errorMessage = "Withdrawals require KYC documents verification. Upload documents now?";
        }
        else if(isAccountApproved && !isAllowedWithdraw && total >= 10000 && uploadedDocuments){
          errorMessage = "KYC documents verification is pending. Once verified, you can proceed with withdrawals.";
        }
        return {allowedToProceed, errorMessage}
    }

    checkPurchasePermission(){
        let errorMessage = "";
        let allowedToProceed = false;
        let uploadedDocuments = !!this.state.userConfig.filter(obj => obj.Key === "uploadedDocuments" && obj.Value === "true").length;
        let isAccountApproved = this.state.approved;
        if(isAccountApproved){
            allowedToProceed = true;
        }
        errorMessage = uploadedDocuments ? "Account verification is pending. Once verified, you can proceed with deposits." : "Deposits require account verification. Verify account now?"
        return {allowedToProceed, errorMessage}
      }
    
    getAcoountStatusFromUserConfig(userConfigArray){
        for (let idx=0; idx < userConfigArray.length; idx++) {
            if(userConfigArray[idx].Key === 'accountStatus'){
                return userConfigArray[idx].Value
            }
        }
        return ''
    }

    render(){
        return (
            <div>
                <Navbar/>
                <div className="container">
                    <Sidebar onItemClick={(newPageProperties) => this.toggleView({...newPageProperties, productId: 1})} active={this.state.pageProperties.view}/>
                    {this.state.pageProperties.view === "balances" && <Balances onItemClick={(pageProperties) => this.toggleView(pageProperties)} checkWithdrawPermission={() => this.checkWithdrawPermission()}/>}
                    {this.state.pageProperties.view === "deposit" && 
                    <DepositSection 
                        Product={this.state.pageProperties.coin || "BTC"} 
                        productId={this.state.pageProperties.productId || 1}
                        changeProd={(productId) => this.changeProd(productId)}
                        />}
                    {this.state.pageProperties.view === "withdrawal" && 
                        <WithdrawSection
                            Product={this.state.pageProperties.coin || "BTC"} 
                            productId={this.state.pageProperties.productId || 1}
                            availableBalance={this.state.pageProperties.availableBalance}
                            fullName={this.state.pageProperties.fullName}
                            changeProd={(productId) => this.changeProd(productId)}
                            checkWithdrawPermission={() => this.checkWithdrawPermission()}
                        />}
                    {this.state.pageProperties.view === "history" && <AccountTransactions/>}
                    {this.state.pageProperties.view === "buy-crypto" && <BuyFixed checkPurchasePermission={() => this.checkPurchasePermission()}/>}
                </div>
                <Footer/>
            </div>
        )
    }
}


export default Wallet;
