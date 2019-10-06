import React from 'react';
import SidebarMenu from './sidebarMenu';

class Sidebar extends React.Component {

    state = {
        wallet: [{label: "Balances", value: "balances"}, {label: "Deposit", value: "deposit"}, {label: "Withdrawal", value: "withdrawal"}, {label: "Buy Crypto with Credit card", value: "buy-crypto"}, {label: "Deposit & Withdrawal history", value: "history"}],
        orders: [{label: "Open orders", value: "open-orders"}, {label: "Filled orders", value: "filled-orders"}],
        account: [{label: "Account verification", value: "account-verification"}, {label: "Security settings", value: "security-settings"}]
    }

    render() {
        return ( 
            <div id="sidebar">
                <SidebarMenu active={this.props.active} title="Wallet" items={this.state.wallet} onItemClick={this.props.onItemClick}/>
                <SidebarMenu active={this.props.active} title="Orders" items={this.state.orders} onItemClick={this.props.onItemClick}/>
                <SidebarMenu active={this.props.active} title="Account settings" items={this.state.account} onItemClick={this.props.onItemClick}/>
            </div>
       )

    }
}



export default Sidebar;