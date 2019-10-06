import queryString from 'query-string';

import list from './Test';
import logs from './logs';

import config from './config';

import sendOrder from './sendOrder';
import getWithdrawTickets from './getWithdrawTickets';
import getAccountInfo from './getAccountInfo';
import getAccountsInfo from './getAccountsInfo';
import getOperatorLoyaltyFeeConfigsForOms from './getOperatorLoyaltyFeeConfigsForOms';
import cancelWithdraw from './cancelWithdraw';
import validateUserRegistration from './validateUserRegistration';
import submitBlockTrade from './submitBlockTrade';
import cancelAllOrders from './cancelAllOrders';
import WebAuthenticate from './webAuthenticate';
import Authenticate from './authenticate';
import logout from './logout';
import getLogout from './get-logout';
import getProducts from './getProducts';
import getInstruments from './getInstruments';
import getOMS from './getOMSs';
import registerNewUser from './createAccount';
import resetPassword from './resetPassword';
import subscribeLvl1 from './subscribe1';
import subscribeLvl2 from './subscribe2';
import subscribeTrades from './subscribeTrades';
import unsubscribeLvl1 from './unsubscribe1';
import unsubscribeLvl2 from './unsubscribe2';
import unsubscribeTradesCall from './unsubscribeTrades';
import authenticate2FA from './authenticate2FA';
import disable2FA from './disable2FA';
import enableGoogle2FA from './enableGoogle2fa';
import getUserInfo from './getUserInfo';
import setUserInfo from './setUserInfo';
import setUserCon from './setUserConfig';
import getUserCon from './getUserConfig';
import getUserConfigValue from './getUserConfigValue';
import getOpenOrders from './getOpenOrders';
import getOpenTradeReports from './getOpenTradeReports';
import getAccountTrades from './getAccountTrades';
import getAccountTransactions from './getAccountTransactions';
import getAccountHistory from './getAccountHistory';
import getAccountDepositHistory from './getAccountDepositHistory';
import getAccountWithDrawHistory from './getAccountWithDrawHistory';
import getAccountPositions from './getAccountPositions';
import subscribeAccountEvents from './accountEventsSubscribe';
import getUserAccounts from './getUserAccounts';
import getOrderHistory from './getOrderHistory';
import getOrderFee from './getOrderFee';
import cancelOrder from './cancelOrder';
import cancelReplaceOrder from './cancelReplaceOrder';
import modifyOrder from './modifyOrder';
import getDepositInfo from './getDepositInfo';
import getDepositRequestInfoTemplate from './getDepositRequestInfoTemplate';
import getWithdrawTemplateTypes from './getWithdrawTemplateTypes';
import getWithdrawTemplate from './getWithdrawTemplate';
import withdraw from './withdraw';
import createAPIKey from './createAPIKeys';
import deleteAPIKey from './removeAPIKeys';
import getAPIKey from './getAPIKeys';
import createDepositTicket from './createDepositTicket';
import createWithdrawTicket from './createWithdrawTicket';
import transferFunds from './transferFunds';
import requestFunds from './requestFunds';
import getRequestTransfers from './getRequestTransfers';
import confirmRequestTransfers from './confirmRequestTransfers';
import rejectRequestTransfers from './rejectRequestTransfers';
import setUserKYCData from './setUserKYCData';
import getLanguage from './getLanguage';
import translation from './translation';
import getUserReportWriterResultRecords from './getUserReportWriterResultRecords';
import getUserReportTickets from './getUserReportTickets';
import getUserPermissions from './getUserPermissions';
import redirect from './doRedirect';
import retryLogin from './retryLogin';
import getTreasuryProductsForAccount from './getTreasuryProductsForAccount';
import getAccountDepositTransactions from './getAccountDepositTransactions';
import getAccountWithdrawTransactions from './getAccountWithdrawTransactions';
import getUserAffiliateTag from './getUserAffiliateTag';
import addUserAffiliateTag from './addUserAffiliateTag';
import updateUserAffiliateTag from './updateUserAffiliateTag';
import getUserAffiliateCount from './getUserAffiliateCount';
import getUserAffiliates from './getUserAffiliates';
import getRecentAffiliateRegistrations from './getRecentAffiliateRegistrations';
import getReceivedTransferRequests from './getReceivedTransferRequests';
import getSentTransferRequests from './getSentTransferRequests';
import getTransfers from './getTransfers';
import getAllDepositRequestInfoTemplates from './getAllDepositRequestInfoTemplates';
import getWithdrawFee from './getWithdrawFee';
import getTransfersReceived from './getTransfersReceived';

/** @namespace * */
const AlphaPoint = {
  config,

  // Websocket Library Starts here
  // ES6
  sendOrder,
  getWithdrawTickets,
  getAccountInfo,
  getAccountsInfo,
  cancelWithdraw,
  validateUserRegistration,
  submitBlockTrade,
  cancelAllOrders,
  WebAuthenticate,
  Authenticate,
  logout,
  getLogout,
  getProducts,
  getInstruments,
  getOMS,
  registerNewUser,
  resetPassword,
  subscribeLvl1,
  subscribeLvl2,
  subscribeTrades,
  unsubscribeLvl1,
  unsubscribeLvl2,
  unsubscribeTradesCall,
  authenticate2FA,
  disable2FA,
  enableGoogle2FA,
  getUserInfo,
  setUserInfo,
  setUserCon,
  getUserCon,
  getUserConfigValue,
  getOpenOrders,
  getOpenTradeReports,
  getAccountTrades,
  getAccountTransactions,
  getAccountHistory,
  getAccountDepositHistory,
  getAccountWithDrawHistory,
  getAccountPositions,
  getOperatorLoyaltyFeeConfigsForOms,
  subscribeAccountEvents,
  getUserAccounts,
  getOrderHistory,
  getOrderFee,
  cancelOrder,
  cancelReplaceOrder,
  modifyOrder,
  getDepositInfo,
  getDepositRequestInfoTemplate,
  getWithdrawTemplateTypes,
  getWithdrawTemplate,
  withdraw,
  createAPIKey,
  deleteAPIKey,
  getAPIKey,
  createDepositTicket,
  createWithdrawTicket,
  transferFunds,
  requestFunds,
  getRequestTransfers,
  confirmRequestTransfers,
  rejectRequestTransfers,
  setUserKYCData,
  getLanguage,
  translation,
  redirect,
  getUserReportWriterResultRecords,
  getUserReportTickets,
  getUserPermissions,
  retryLogin,
  getTreasuryProductsForAccount,
  getAccountDepositTransactions,
  getAccountWithdrawTransactions,
  getUserAffiliateTag,
  addUserAffiliateTag,
  updateUserAffiliateTag,
  getUserAffiliateCount,
  getUserAffiliates,
  getRecentAffiliateRegistrations,
  getReceivedTransferRequests,
  getSentTransferRequests,
  getTransfers,
  getAllDepositRequestInfoTemplates,
  getWithdrawFee,
  getTransfersReceived,

  // BehaviorSubjects
  list,
  selectedAccount: list.selectedAccount,
  authenticateSubject: list.authenticateSubject,
  webAuthenticateSubject: list.webAuthenticateSubject,
  products: list.products,
  instruments: list.instruments,
  oms: list.oms,
  registerUser: list.registerUser,
  resetPass: list.resetPass,
  subscribe1: list.subscribe1,
  subscribe2: list.subscribe2,
  subscribe1Update: list.subscribe1Update,
  subscribe2Update: list.subscribe2Update,
  subscribe2UpdateBook: list.subscribe2Update,
  subscribeTradesSubject: list.subscribeTradesSubject,
  getTickerHist: list.getTickerHist,
  unsubscribe1: list.unsubscribe1,
  unsubscribe2: list.unsubscribe2,
  unsubscribeTrades: list.unsubscribeTrades,
  orderPrefillPriceAndSide: list.orderPrefillPriceAndSide,
  orderPrefillPrice: list.orderPrefillPrice,
  orderPrefillQuantity: list.orderPrefillQuantity,
  auth2FA: list.auth2FA,
  Disable2FA: list.Disable2FA,
  EnableGoogle2FA: list.EnableGoogle2FA,
  getUser: list.getUser,
  setUser: list.setUser,
  setUserConfig: list.setUserConfig,
  getUserConfig: list.getUserConfig,
  getUserConfigVal: list.getUserConfigVal,
  reqVerifyEmail: list.reqVerifyEmail,
  openorders: list.openorders,
  tradeReports: list.tradeReports,
  openquotes: list.openquotes,
  accountTrades: list.accountTrades,
  accountTransactions: list.accountTransactions,
  accountHistory: list.accountHistory,
  accountDepositHistory: list.accountDepositHistory,
  accountWithDrawHistory: list.accountWithDrawHistory,
  accountPositions: list.accountPositions,
  accountEvents: list.accountEvents,
  accountInfo: list.accountInfo,
  loyaltyFeeConfigs: list.loyaltyFeeConfigs,
  userAccounts: list.userAccounts,
  userAccountsInfo: list.userAccountsInfo,
  orderfee: list.orderfee,
  orderHistory: list.orderHistory,
  sendorder: list.sendorder,
  submitBlockTradeEvent: list.submitBlockTradeEvent,
  cancel: list.cancel,
  cancelReplace: list.cancelReplace,
  cancelAll: list.cancelAll,
  modify: list.modify,
  deposits: list.deposits,
  withdrawTemplateTypes: list.withdrawTemplateTypes,
  withdrawTemplate: list.withdrawTemplate,
  submitWithdraw: list.submitWithdraw,
  createDeposit: list.createDeposit,
  keys: list.keys,
  rejectedOrders: list.rejectedOrders,
  buyOrders: list.buyOrders,
  sellOrders: list.sellOrders,
  buyOrdersUpdate: list.buyOrdersUpdate,
  sellOrdersUpdate: list.sellOrdersUpdate,
  lvl2Buys: list.lvl2Buys,
  lvl2Sells: list.lvl2Sells,
  lvl2BuysUpdate: list.lvl2BuysUpdate,
  lvl2SellsUpdate: list.lvl2SellsUpdate,
  lvl2RawUpdate: list.lvl2RawUpdate,
  lvl2Update: list.lvl2Update,
  accountBalances: list.accountBalances,
  accountOrders: list.accountOrders,
  addApiKey: list.addApiKey,
  removeApiKey: list.removeApiKey,
  myApiKeys: list.myApiKeys,
  logoutEvent: list.logoutEvent,
  openorderEvents: list.openorderEvents,
  transfunds: list.transfunds,
  requestfunds: list.requestfunds,
  getrequests: list.getrequests,
  confirmrequests: list.confirmrequests,
  rejectrequests: list.rejectrequests,
  verifylevel: list.verifylevel,
  verificationLevelUpdate: list.verificationLevelUpdate,
  sessionLoaded: list.sessionLoaded,
  userReports: list.userReports,
  userReportTickets: list.userReportTickets,
  depositTemplate: list.depositTemplate,
  withdrawTickets: list.withdrawTickets,
  canceledWithdraw: list.canceledWithdraw,
  userPermissions: list.userPermissions,
  treasuryProducts: list.treasuryProducts,
  accountWithdrawTransactions: list.accountWithdrawTransactions,
  accountDepositTransactions: list.accountDepositTransactions,
  validatorResponse: list.validatorResponse,
  userAffiliateTag: list.userAffiliateTag,
  userAffiliateCount: list.userAffiliateCount,
  userAffiliates: list.userAffiliates,
  recentAffiliateRegistrations: list.recentAffiliateRegistrations,
  receivedTransferRequests: list.receivedTransferRequests,
  sentTransferRequests: list.sentTransferRequests,
  sentTransfers: list.sentTransfers,
  withdrawFee: list.withdrawFee,
  receivedTransfers: list.receivedTransfers,

  // Captured data
  logs,
  queryString,
  userData: logs.userData,
  session: logs.session,
  socketOpen: logs.socketOpen,
  prodPair: logs.prodPair,
  orderBook: logs.orderBook,
  bestBidPrice: logs.bestBidPrice,
  bestAskPrice: logs.bestAskPrice,
  tickerBook: logs.tickerBook,
  tickerData: logs.tickerData,
  logoutV2: logs.logoutV2,
  loginStatusRedirect: logs.loginStatusRedirect,
  prodProduct: logs.prodProduct,
  setProductPair: logs.prodPair.onNext.bind(logs.prodPair),
  setProduct: logs.prodProduct.onNext.bind(logs.prodProduct),
  Level1: logs.Level1,
  Level2: logs.Level2,
  Level2Update: logs.Level2Update,
  synched: logs.synched,
  instrumentChange: logs.instrumentChange,
  language: logs.language, // not sure what this is doing currently
};

export default AlphaPoint;
