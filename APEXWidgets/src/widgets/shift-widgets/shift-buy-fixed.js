import Buy_Fixed from '../buy-fixed';

class ShiftBuyFixed extends Buy_Fixed {
    componentWillUnmount() {
        this.productPairs.dispose();
        this.accountInformation.dispose();
        this.senderOrder.dispose();
        this.orderFee.dispose();
        this.selectedAccount.dispose();
        this.orderStateEvent.dispose();
        this.orderTradeEvent.dispose();
        this.Level2.dispose();
        // this.Level2Updates.dispose(); // error this.Level2Updates is undefined
      }
}

ShiftBuyFixed.defaultProps.hideCloseLink = false;

export default ShiftBuyFixed;