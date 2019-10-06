import Rx from 'rx-lite';

function orders(arrayOrders) {
  const orders = arrayOrders.length ? arrayOrders.map((info) => {
    return {
      UpdateId: info[0],
      Account: info[1],
      TimeStamp:info[2],
      ActionType: info[3],
      LastTradePrice: info[4],
      Orders: info[5],
      Price: +info[6],
      ProductPairCode: info[7],
      Quantity: +info[8],
      Side: info[9],
    };
  }) : [];

  return orders;
};

function trades(arrayTrades) {
  const trades =  arrayTrades.length ? arrayTrades.map((info) => {
    return {
      TradeId: info[0],
      ProductPairCode: info[1],
      Quantity: +info[2],
      Price: +info[3],
      Order1: info[4],
      Order2: info[5],
      TradeTime:info[6],
      Direction: info[7],
      Side: info[8],
      IsBlockTrade: info[9] ? true : false,
    };
  }) : [];

  return trades;
};

export default {
  orders,
  trades,
};
