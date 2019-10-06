import Rx from 'rx-lite';

// List of BehaviorSubjects
const authenticateSubject = new Rx.BehaviorSubject([]);
const webAuthenticateSubject = new Rx.ReplaySubject(0);
const products = new Rx.BehaviorSubject([]);
const instruments = new Rx.BehaviorSubject([]);
const oms = new Rx.BehaviorSubject();
const registerUser = new Rx.BehaviorSubject([]);
const resetPass = new Rx.BehaviorSubject([]);
const subscribe1 = new Rx.BehaviorSubject([]);
const subscribe2 = new Rx.BehaviorSubject([]);
const subscribe1Update = new Rx.BehaviorSubject([]);
const subscribe2Update = new Rx.BehaviorSubject([]);
const subscribe2UpdateBook = new Rx.BehaviorSubject([]);
const subscribeTradesSubject = new Rx.BehaviorSubject([]);
const getTickerHist = new Rx.BehaviorSubject([]);
const unsubscribe1 = new Rx.BehaviorSubject([]);
const unsubscribe2 = new Rx.BehaviorSubject([]);
const unsubscribeTrades = new Rx.BehaviorSubject([]);
const orderPrefillPriceAndSide = new Rx.BehaviorSubject([]);
const orderPrefillPrice = new Rx.BehaviorSubject([]);
const orderPrefillQuantity = new Rx.BehaviorSubject([]);

// Authenticated
const auth2FA = new Rx.ReplaySubject(0);
const Disable2FA = new Rx.ReplaySubject(0);
const EnableGoogle2FA = new Rx.BehaviorSubject([]);
const getUser = new Rx.BehaviorSubject([]);
const setUser = new Rx.ReplaySubject(0);
const setUserConfig = new Rx.BehaviorSubject([]);
const getUserConfig = new Rx.BehaviorSubject([]);
const getUserConfigVal = new Rx.BehaviorSubject([]);
const reqVerifyEmail = new Rx.BehaviorSubject([]);
const openorders = new Rx.BehaviorSubject([]);
const tradeReports = new Rx.BehaviorSubject([]);
const openquotes = new Rx.BehaviorSubject([]);
const accountTrades = new Rx.BehaviorSubject([]);
const accountTransactions = new Rx.BehaviorSubject([]);
const accountHistory = new Rx.BehaviorSubject([]);
const accountDepositHistory = new Rx.BehaviorSubject([]);
const accountWithDrawHistory = new Rx.BehaviorSubject([]);
const accountPositions = new Rx.BehaviorSubject([]);
const accountEvents = new Rx.BehaviorSubject([]);
const accountInfo = new Rx.BehaviorSubject([]);
const loyaltyFeeConfigs = new Rx.BehaviorSubject([]);
const userAccounts = new Rx.BehaviorSubject([]);
const userAccountsInfo = new Rx.BehaviorSubject([]);
const selectedAccount = new Rx.BehaviorSubject(null);
const orderHistory = new Rx.BehaviorSubject([]);
const orderfee = new Rx.BehaviorSubject([]);
const sendorder = new Rx.ReplaySubject(0);
const submitBlockTradeEvent = new Rx.ReplaySubject(0);
const cancel = new Rx.BehaviorSubject([]);
const cancelReplace = new Rx.BehaviorSubject([]);
const cancelAll = new Rx.BehaviorSubject([]);
const modify = new Rx.BehaviorSubject([]);
const rejectedOrders = new Rx.BehaviorSubject([]);
const sellOrders = new Rx.BehaviorSubject([]);
const buyOrders = new Rx.BehaviorSubject([]);
const sellOrdersUpdate = new Rx.BehaviorSubject([]);
const buyOrdersUpdate = new Rx.BehaviorSubject([]);
const lvl2Sells = new Rx.BehaviorSubject([]); // for Joe
const lvl2Buys = new Rx.BehaviorSubject([]); // for Joe
const lvl2SellsUpdate = new Rx.BehaviorSubject([]); // for Joe
const lvl2BuysUpdate = new Rx.BehaviorSubject([]); // for Joe
const lvl2RawUpdate = new Rx.BehaviorSubject([]); // for Joe
const lvl2Update = new Rx.BehaviorSubject([]);
const deposits = new Rx.BehaviorSubject([]);
const withdrawTemplateTypes = new Rx.BehaviorSubject([]);
const withdrawTemplate = new Rx.BehaviorSubject([]);
const submitWithdraw = new Rx.BehaviorSubject([]);
const createWithdrawTicket = new Rx.BehaviorSubject([]);
const createDeposit = new Rx.BehaviorSubject([]);
const keys = new Rx.BehaviorSubject([]);
const accountBalances = new Rx.BehaviorSubject([]);
const accountOrders = new Rx.BehaviorSubject([]);
const addApiKey = new Rx.BehaviorSubject([]);
const removeApiKey = new Rx.BehaviorSubject([]);
const myApiKeys = new Rx.BehaviorSubject([]);
const logoutEvent = new Rx.BehaviorSubject([]);
const openorderEvents = new Rx.BehaviorSubject([]);
const transfunds = new Rx.ReplaySubject(0);
const requestfunds = new Rx.ReplaySubject(0);
const getrequests = new Rx.BehaviorSubject([]);
const confirmrequests = new Rx.ReplaySubject(0);
const rejectrequests = new Rx.ReplaySubject(0);
const verifylevel = new Rx.BehaviorSubject([]);
const verificationLevelUpdate = new Rx.BehaviorSubject([]);
const sessionLoaded = new Rx.BehaviorSubject(false);
const userReports = new Rx.BehaviorSubject([]);
const userReportTickets = new Rx.BehaviorSubject([]);
const depositTemplate = new Rx.BehaviorSubject({});
const withdrawTickets = new Rx.BehaviorSubject([]);
const canceledWithdraw = new Rx.BehaviorSubject({});
const userPermissions = new Rx.BehaviorSubject([]);
const treasuryProducts = new Rx.BehaviorSubject([]);
const accountWithdrawTransactions = new Rx.BehaviorSubject();
const accountDepositTransactions = new Rx.BehaviorSubject();
const validatorResponse = new Rx.BehaviorSubject([]);
const userAffiliateTag = new Rx.BehaviorSubject([]);
const userAffiliateCount = new Rx.BehaviorSubject([]);
const userAffiliates = new Rx.BehaviorSubject([]);
const recentAffiliateRegistrations = new Rx.BehaviorSubject([]);
const receivedTransferRequests = new Rx.BehaviorSubject([]);
const sentTransferRequests = new Rx.BehaviorSubject([]);
const sentTransfers = new Rx.BehaviorSubject([]);
const GetAllDepositRequestInfoTemplates = new Rx.BehaviorSubject([]);
const withdrawFee = new Rx.ReplaySubject(0);
const receivedTransfers = new Rx.BehaviorSubject([]);

const list = {
  // Unauthenticated
  authenticateSubject,
  webAuthenticateSubject,
  products,
  instruments,
  oms,
  registerUser,
  resetPass,
  subscribe1,
  subscribe2,
  subscribe1Update,
  subscribe2Update,
  subscribe2UpdateBook,
  subscribeTradesSubject,
  getTickerHist,
  unsubscribe1,
  unsubscribe2,
  unsubscribeTrades,
  orderPrefillPriceAndSide,
  orderPrefillPrice,
  orderPrefillQuantity,
  buyOrders,
  sellOrders,
  buyOrdersUpdate,
  sellOrdersUpdate,
  loyaltyFeeConfigs,
  lvl2Buys,
  lvl2Sells,
  lvl2BuysUpdate,
  lvl2SellsUpdate,
  lvl2RawUpdate,
  lvl2Update,

  // Authenticated
  auth2FA,
  Disable2FA,
  EnableGoogle2FA,
  getUser,
  setUser,
  setUserConfig,
  getUserConfig,
  getUserConfigVal,
  reqVerifyEmail,
  openorders,
  tradeReports,
  openquotes,
  accountTrades,
  accountTransactions,
  accountHistory,
  accountDepositHistory,
  accountWithDrawHistory,
  accountPositions,
  accountEvents,
  accountInfo,
  userAccounts,
  userAccountsInfo,
  orderHistory,
  orderfee,
  sendorder,
  submitBlockTradeEvent,
  cancel,
  cancelReplace,
  cancelAll,
  modify,
  deposits,
  withdrawTemplateTypes,
  withdrawTemplate,
  submitWithdraw,
  createWithdrawTicket,
  createDeposit,
  selectedAccount,
  rejectedOrders,
  keys,
  accountBalances,
  accountOrders,
  addApiKey,
  removeApiKey,
  myApiKeys,
  logoutEvent,
  openorderEvents,
  transfunds,
  requestfunds,
  getrequests,
  confirmrequests,
  rejectrequests,
  verifylevel,
  verificationLevelUpdate,
  sessionLoaded,
  userReports,
  userReportTickets,
  depositTemplate,
  withdrawTickets,
  canceledWithdraw,
  userPermissions,
  treasuryProducts,
  accountWithdrawTransactions,
  accountDepositTransactions,
  validatorResponse,
  userAffiliateTag,
  userAffiliateCount,
  userAffiliates,
  recentAffiliateRegistrations,
  receivedTransferRequests,
  sentTransferRequests,
  sentTransfers,
  GetAllDepositRequestInfoTemplates,
  withdrawFee,
  receivedTransfers
};

export default list;
