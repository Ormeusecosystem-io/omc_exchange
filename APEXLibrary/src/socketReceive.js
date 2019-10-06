/* global document, AlphaPoint, $, window */
import format from './formatOrders';
import { updateArrayByPx, formatNumberToLocale } from './helper';

const level1Update = [];

export default function init() {
  const marketDataWS = AlphaPoint.config.MarketDataWS
    ? document.MarketDataWS
    : document.APAPI;

  if (AlphaPoint.config.useRedirect) {
    AlphaPoint.redirect(window.location.pathname);
  }
  document.APAPI.SubscribeToEvent('Logout', data => {
    AlphaPoint.logoutV2.onNext(data);
    if (data.result) AlphaPoint.logout();
  });
  marketDataWS.SubscribeToEvent('SubscribeLevel1', data => {
    AlphaPoint.tickerBook.onNext(data);
  });
  marketDataWS.SubscribeToEvent('SubscribeLevel2', data => {
    AlphaPoint.subscribe2.onNext(data);
    AlphaPoint.Level2.onNext(data);
  });

  document.APAPI.SubscribeToEvent('RegisterNewUser', data => {
    AlphaPoint.registerUser.onNext(data);
  });

  document.APAPI.SubscribeToEvent('GetUserInfo', data => {
    AlphaPoint.getUser.onNext(data);
  });
  document.APAPI.SubscribeToEvent('GetUserConfig', data => {
    AlphaPoint.getUserConfig.onNext(data);
  });

  document.APAPI.SubscribeToEvent('GetTickerHistory', data => {
    AlphaPoint.getTickerHist.onNext(data);
  });

  document.APAPI.SubscribeToEvent('RequestVerifyEmail', data => {
    AlphaPoint.reqVerifyEmail.onNext(data);
  });

  document.APAPI.SubscribeToEvent('ValidateUserRegistration', data => {
    AlphaPoint.validatorResponse.onNext(data);
  });

  marketDataWS.SubscribeToEvent('Level1UpdateEvent', data => {
    AlphaPoint.Level1.onNext({
      ...AlphaPoint.Level1.value,
      [data.InstrumentId]: data
    });
    AlphaPoint.tickerBook.onNext(data);

    const orderBook = AlphaPoint.orderBook.value;
    level1Update.push(data);
    AlphaPoint.subscribe1.onNext(level1Update);
    if (!orderBook[data.InstrumentId]) orderBook[data.InstrumentId] = {};
    orderBook[data.InstrumentId].ticker = data;
    AlphaPoint.orderBook.onNext(orderBook);
  });

  marketDataWS.SubscribeToEvent('Level2UpdateEvent', data => {
    const orderBook = AlphaPoint.orderBook.value;
    const orders = format.orders(data);
    let buys;
    let sells;

    if (AlphaPoint.config.L2UpdateMethod === 2) {
      return AlphaPoint.Level2Update.onNext(data);
    }

    if (orders.length > 0) {
      if (!orderBook[orders[0].ProductPairCode]) {
        orderBook[orders[0].ProductPairCode] = {};
      }

      buys = orders.filter(trade => trade.Side === 0);
      sells = orders.filter(trade => trade.Side === 1);
    }

    if (buys.length > 0) {
      if (orderBook[buys[0].ProductPairCode].buys) {
        buys.forEach(buy => {
          orderBook[buys[0].ProductPairCode].buys = updateArrayByPx(
            (orderBook[buys[0].ProductPairCode] || {}).buys,
            buy
          );
        });
      } else {
        orderBook[buys[0].ProductPairCode].buys = buys;
      }

      orderBook[buys[0].ProductPairCode].buys.sort((a, b) => {
        if (a.Price < b.Price) return 1;
        if (a.Price > b.Price) return -1;
        return 0;
      });
    }

    if (sells.length > 0) {
      if (orderBook[sells[0].ProductPairCode].sells) {
        sells.forEach(sell => {
          (orderBook[sells[0].ProductPairCode] || {}).sells = updateArrayByPx(
            (orderBook[sells[0].ProductPairCode] || {}).sells,
            sell
          );
        });
      } else {
        orderBook[sells[0].ProductPairCode].sells = sells;
      }

      orderBook[sells[0].ProductPairCode].sells.sort((a, b) => {
        if (a.Price > b.Price) return 1;
        if (a.Price < b.Price) return -1;
        return 0;
      });
    }

    return AlphaPoint.orderBook.onNext(orderBook);
  });

  document.APAPI.SubscribeToEvent('OrderTradeEvent', data => {
    const newTrades = AlphaPoint.accountTrades.value;
    const quantity = `${data.Quantity}`.includes('-')
      ? formatNumberToLocale(data.Quantity, 8) // TODO: work in dynamic decimal places for product traded
      : data.Quantity;

    const { TradeTimeMS, TradeTime } = data;
    const trade = data;
    if (TradeTimeMS < 0) {
      trade.TradeTimeMS = TradeTime;
      trade.TradeTime = TradeTimeMS;
    }

    newTrades.push(trade);
    AlphaPoint.accountTrades.onNext(newTrades);
    $.bootstrapGrowl(
      `Order ${data.OrderId} ${data.Side} ${quantity} @ ${data.Price}`,
      { ...AlphaPoint.config.growlerDefaultOptions, type: 'success' }
    );
  });

  document.APAPI.SubscribeToEvent('OrderStateEvent', data => {
    AlphaPoint.accountBalances.onNext(data);

    if (data.OrderType === 'BlockTrade') {
      if (data.OrderState === 'Canceled') {
        const update = {
          ...AlphaPoint.tradeReports.value,
          [data.Account]: AlphaPoint.tradeReports.value[data.Account].filter(
            order => order.OrderId !== data.OrderId
          )
        };

        return AlphaPoint.tradeReports.onNext(update);
      }
      return false;
    }

    if (data.OrderState === 'Canceled') {
      data.CancelReason = data.ChangeReason;
      const newOrders = AlphaPoint.openorders.value.filter(
        order => order.OrderId !== data.OrderId
      );

      AlphaPoint.orderHistory.onNext(
        AlphaPoint.orderHistory.value.concat(data)
      );

      AlphaPoint.openorders.onNext(newOrders);
    }

    if (data.OrderState === 'Rejected') {
      AlphaPoint.rejectedOrders.onNext(data);
      AlphaPoint.orderHistory.onNext(
        AlphaPoint.orderHistory.value.concat(data)
      );
    }

    if (data.OrderState === 'Working') {
      const newOrders = AlphaPoint.openorders.value.filter(
        order => order.OrderId !== data.OrderId
      );

      newOrders.push(data);
      AlphaPoint.openorders.onNext(newOrders);
    }

    if (data.OrderState === 'FullyExecuted') {
      const newOrders = AlphaPoint.openorders.value.filter(
        order => order.OrderId !== data.OrderId
      );

      AlphaPoint.openorders.onNext(newOrders);
    }
    return true;
  });

  document.APAPI.SubscribeToEvent('AccountPositionEvent', data => {
    const oldPositions = [].concat(AlphaPoint.accountPositions.value);
    const newPositions = oldPositions.map((balance, index) => {
      if (
        data.AccountId === balance.AccountId &&
        data.ProductId === balance.ProductId
      ) {
        return data;
      }
      return balance;
    });

    AlphaPoint.accountPositions.onNext(newPositions);
  });

  document.APAPI.SubscribeToEvent('NewOrderRejectEvent', data => {
    AlphaPoint.rejectedOrders.onNext(data);
  });

  document.APAPI.SubscribeToEvent('MarketStateUpdate', data => {
    const instrument = AlphaPoint.instruments.value.find(
      inst => inst.InstrumentId === data.VenueInstrumentId
    );

    if (data.Action === 'ReSync') return false;
    return $.bootstrapGrowl(
      `Market for ${instrument.Symbol} is ${data.NewStatus}`,
      { ...AlphaPoint.config.growlerDefaultOptions, type: 'info' }
    );
  });

  marketDataWS.SubscribeToEvent('TradeDataUpdateEvent', data => {
    const trades = format.trades(data) || [];
    const orderBook = AlphaPoint.orderBook.value;

    if (trades.length) {
      if (!orderBook[trades[0].ProductPairCode])
        orderBook[trades[0].ProductPairCode] = {};
      trades.forEach(trade => {
        if (orderBook[trades[0].ProductPairCode].trades) {
          return orderBook[trades[0].ProductPairCode].trades.push(trade);
        }
        orderBook[trades[0].ProductPairCode].trades = [].concat(trade);
        return true;
      });
    }
    AlphaPoint.orderBook.onNext(orderBook);
  });

  document.APAPI.SubscribeToEvent('LogoutEvent', () => {
    // AlphaPoint.retryLogin();
    AlphaPoint.logout();
  });

  document.APAPI.SubscribeToEvent('VerificationLevelUpdateEvent', data => {
    const growlerOptions = {
      allow_dismiss: true,
      align: 'center',
      delay: AlphaPoint.config.growlerDelay,
      offset: { from: 'top', amount: 30 },
      left: '60%'
    };
    if (data.VerificationStatus === 'Approved') {

      if (data.VerificationLevel === 2 && AlphaPoint.config.kycType === 'IM') return;

      $.bootstrapGrowl(
        `Your verification has been ${data.VerificationStatus}`,
        { ...growlerOptions, type: 'success' }
      );
      $.bootstrapGrowl(`You are now level ${data.VerificationLevel} verified`, {
        ...growlerOptions,
        type: 'success'
      });
    }
    if (data.VerificationStatus !== 'Approved') {
      $.bootstrapGrowl(data.VerificationStatus, {
        ...growlerOptions,
        type: 'success'
      });
    }
    AlphaPoint.verificationLevelUpdate.onNext(data);
  });
}
