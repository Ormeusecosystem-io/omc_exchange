/* global AlphaPoint */
/* eslint-disable react/sort-comp */
import React from 'react';

import WidgetBase from './base';

class Buttons extends React.Component {
  authenticate = () => {
    const data = {
      UserName: 'keith9',
      Password: 'apple123',
    };

    AlphaPoint.Authenticate(data);
  };

  webauthenticate = () => {
    const data = {
      UserName: 'shomari7',
      Password: 'Shomari123',
    };

    AlphaPoint.WebAuthenticate(data);
  };

  registerUser = () => {
    const data = {
      UserInfo: {
        UserName: 'test101',
        passwordHash: '1234',
        Email: 'test101@alphapoint.com',
      },
      UserConfig: [],
      OperatorId: 8,
    };

    AlphaPoint.registerNewUser(data);
  }

  getProducts = () => AlphaPoint.getProducts();

  getInstruments = () => AlphaPoint.getInstruments();

  getOms = () => AlphaPoint.getOMS();

  subscribelvl1 = () => AlphaPoint.subscribeLvl1(AlphaPoint.prodPair.value);

  subscribelvl2 = () => AlphaPoint.subscribeLvl2(1);

  subscribetrades = () => AlphaPoint.subscribeTrades();

  unsubscribelvl1 = () => AlphaPoint.unsubscribeLvl1();

  unsubscribelvl2 = () => AlphaPoint.unsubscribeLvl2();

  unsubscribeTrades = () => AlphaPoint.unsubscribeTradesCall();

  getUserInfo = () => {
    const data = { UserName: 'keith9' };

    AlphaPoint.getUserInfo(data);
  }

  setUserInfo = () => {
    const data = {
      UserName: 'shomari8',
      Email: 'shomari@websites.bb',
      Password: '1234',
    };

    AlphaPoint.setUserInfo(data);
  }

  getOrders = () => AlphaPoint.getOpenOrders();

  getAccountTrades = () => AlphaPoint.getAccountTrades();

  getAccountTransactions = () => AlphaPoint.getAccountTransactions();

  getAccountPositions = () => AlphaPoint.getAccountPositions();

  getAccountInfo = () => AlphaPoint.getAccountInfo();

  getUserAccounts = () => AlphaPoint.getUserAccounts();

  subscribeAccountEvents = () => AlphaPoint.subscribeAccountEvents();

  sendOrder = () => AlphaPoint.sendOrder();

  cancelOrder = () => AlphaPoint.cancelOrder();

  cancelAllOrders = () => AlphaPoint.cancelAllOrders();

  modifyOrder = () => AlphaPoint.modifyOrder();

  getUserCon = () => {
    const data = { UserId: 44 };

    AlphaPoint.getUserCon(data);
  }

  setUserCon = () => {
    const data = {
      UserId: 44,
      Config: [
        {
          Key: 'UseGoogle2FA',
          Value: '',
        },
        {
          Key: 'UseNoAuth',
          Value: '',
        },
        {
          Key: 'billingCountry',
          Value: '',
        },
      ],
    };

    AlphaPoint.setUserCon(data);
  }

  getOrderHistory = () => AlphaPoint.getOrderHistory();

  getOrderFee = () => {
    const data = {
      OMSId: AlphaPoint.oms.value,
      AccountId: AlphaPoint.userAccounts.value,
      Amount: 1,
      OrderType: 'Limit',
      InstrumentId: 1,
      MakerTaker: 'Taker',
    };

    AlphaPoint.getOrderFee(data);
  }

  getDepositInfo = () => {
    const data = {
      OMSId: 1,
      AccountId: '3',
      ProductId: '1',
    };

    AlphaPoint.getDepositInfo(data);
  }

  getWithdrawTemplate = () => {
    const data = {
      accountId: '11',
      productId: '4',
      templateType: 'SampleWithdrawFormName',
    };

    AlphaPoint.getWithdrawTemplate(data);
  }

  createAPIKey = () => {
    const data = {
      UserId: 1,
      Permissions: ['Trading'],
    };

    AlphaPoint.createAPIKey(data);
  }

  getAPIKey = () => {
    const data = { UserId: 1 };

    AlphaPoint.getAPIKey(data);
  }

  deleteAPIKey = () => {
    const data = {
      UserId: 1,
      APIKey: 'a6d91d841e04dde2e7ff4be0e9a862a4',
    };

    AlphaPoint.deleteAPIKey(data);
  }

  withdraw = () => {
    const data = {
      OMSId: AlphaPoint.oms.value,
      accountId: '2',
      productId: '2',
      amount: '0.01',
      templateForm: JSON.stringify({
        TemplateType: 'ToExternalBitcoinAddress',
        Comment: 'this is great',
        ExternalAddress: '1ASwH1GWfQEWJ3BQQxByqAbU972U9uA8yD',
      }),
      TemplateType: 'ToExternalBitcoinAddress',
    };

    AlphaPoint.withdraw(data);
  }

  getLogout = () => AlphaPoint.getLogout();

  transferFunds = () => {
    const data = {
      OMSId: '1',
      ProductId: '1',
      SenderAccountId: '24',
      Notes: 'Hello World',
      ReceiverUsername: 'shomari@websites.bb',
      Amount: '1',
    };

    // console.log('payload sent from buttons', data);
    AlphaPoint.transferFunds(data);
  }

  getRequestTransfers = () => {
    const data = {
      OMSId: 1,
      OperatorId: 1,
      RequestorAccountId: 24,
    };

    AlphaPoint.getRequestTransfers(data);
  }

  render() {
    return (
      <WidgetBase headerTitle="Page">
        <button className="btn btn-success" onClick={this.authenticate}>Authenticate User</button>
        <button className="btn btn-success" onClick={this.webauthenticate}>WebAuthenticateUser</button>
        <button className="btn btn-success" onClick={this.getLogout}>Logout</button>
        <button className="btn btn-success" onClick={this.getProducts}>GetProducts</button>
        <button className="btn btn-success" onClick={this.getInstruments}>GetInstruments</button>
        <button className="btn btn-success" onClick={this.getOms}>GetOMS</button>
        <button className="btn btn-success" onClick={this.registerUser}>RegisterNewUser</button>
        <button className="btn btn-success" onClick={this.subscribelvl1}>SubscribeLevel1</button>
        <button className="btn btn-success" onClick={this.subscribelvlLTC}>Subscribe LTC</button>
        <button className="btn btn-success" onClick={this.subscribelvl2}>SubscribeLevel2</button>
        <button className="btn btn-success" onClick={this.subscribetrades}>SubscribeTrades</button>
        <button className="btn btn-success" onClick={this.unsubscribelvl1}>UnsubscribeLevel1</button>
        <button className="btn btn-success" onClick={this.unsubscribelvl2}>UnsubscribeLevel2</button>
        <button className="btn btn-success" onClick={this.unsubscribeTrades}>UnsubscribeTrades</button>
        <br />
        <br />
        <button className="btn btn-success" onClick={this.transferFunds}>TransferFunds</button>
        <button className="btn btn-success" onClick={this.getUserInfo}>GetUserInfo</button>
        <button className="btn btn-success" onClick={this.setUserInfo}>SetUserInfo</button>
        <button className="btn btn-success" onClick={this.getUserCon}>GetUserConfig</button>
        <button className="btn btn-success" onClick={this.getOrders}>GetOpenOrders</button>
        <button className="btn btn-success" onClick={this.getAccountTrades}>GetAccountTrades</button>
        <button className="btn btn-success" onClick={this.getAccountTransactions}>GetAccountTransactions</button>
        <button className="btn btn-success" onClick={this.getAccountPositions}>GetAccountPositions</button>
        <button className="btn btn-success" onClick={this.getAccountInfo}>GetAccountInfo</button>
        <button className="btn btn-success" onClick={this.getUserAccounts}>GetUserAccounts</button>
        <button className="btn btn-success" onClick={this.getOrderHistory}>GetOrderHistory</button>
        <button className="btn btn-success" onClick={this.subscribeAccountEvents}>SubscribeAccountEvents</button>
        <button className="btn btn-success" onClick={this.sendOrder}>SendOrder</button>
        <button className="btn btn-success" onClick={this.cancelOrder}>CancelOrder</button>
        <button className="btn btn-success" onClick={this.cancelAllOrders}>cancelAllOrders</button>
        <button className="btn btn-success" onClick={this.modifyOrder}>ModifyOrder</button>
        <button className="btn btn-success" onClick={this.getDepositInfo}>Deposit Info</button>
        <button className="btn btn-success" onClick={this.getWithdrawTemplate}>Withdraw Template</button>
        <button className="btn btn-success" onClick={this.withdraw}>Withdraw</button>
        <br />
        <br />
        <br />
        <br />
        <h2>Pending</h2>
        <button>GetTickerHistory</button>
        <button className="btn btn-success" onClick={this.getRequestTransfers}>GetRequestTransfers</button>
        <button className="btn btn-success" >ConfirmRequestTransferFunds</button>
        <button className="btn btn-success" >RejectRequestTransferFunds</button>
        <br />
        <br />
        <button>Authenticate2FA</button>
        <button className="btn btn-success" onClick={this.setUserCon}>SetUserConfig</button>
        <button>GetUserConfigValue</button>
        <button>RequestVerifyEmail</button>
        <button>GetAccountHistory</button>
        <button>GetAccountDepositHistory</button>
        <button>GetAccountWithdrawHistory</button>
        <button>SubscribeAccountEvents</button>
        <button onClick={this.getOrderFee}>GetOrderFee</button>
        <button onClick={this.createAPIKey}>ADD API KEYs</button>
        <button onClick={this.deleteAPIKey}>REMOVE API KEYs</button>
        <button onClick={this.getAPIKey}>GET API KEYs</button>
      </WidgetBase>
    );
  }
}

export default Buttons;
