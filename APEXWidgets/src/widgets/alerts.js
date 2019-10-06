/* global AlphaPoint, $ */
import Rx from 'rx-lite';

AlphaPoint.accountBalances.debounce(() => Rx.Observable.interval(100)).subscribe((res) => {
  const growlerOpts = AlphaPoint.config.growlerDefaultOptions;

  if (res.OrderId) {
    const orderId = res.OrderId || '';
    const cancelReason = res.CancelReason || '';

    if (res.OrderState === 'Working') {
     
    }
    if (res.OrderState === 'Rejected') {
     
    }
  }
});

AlphaPoint.sendorder.debounce(() => Rx.Observable.interval(100)).subscribe((res) => {
  const growlerOpts = {...AlphaPoint.config.growlerDefaultOptions, type: 'info'};
  const orderId = res.OrderId || '';

  if (res.status === 'Pending') {
    $.bootstrapGrowl(
      AlphaPoint.translation('ALERTS.ORDER_PENDING', {orderId}) || `Order ${orderId} is pending`,
      {...growlerOpts, type: 'info'}
    );
  }
  if (res.status === 'Rejected') {
    $.bootstrapGrowl(
      AlphaPoint.translation('ALERTS.ORDER_REJECTED', {orderId}) || `Order ${orderId} was rejected`,
      {...growlerOpts, type: 'danger'});
  }
});

AlphaPoint.rejectedOrders.debounce(() => Rx.Observable.interval(100)).subscribe((res) => {
  const growlerOpts = {...AlphaPoint.config.growlerDefaultOptions, type: 'danger'};

  if (Object.keys(res).length && res.RejectReason) $.bootstrapGrowl(res.RejectReason, growlerOpts);
});

AlphaPoint.requestfunds.subscribe((data) => {
  if (data.length === 0) return;
  const growlerOpts = AlphaPoint.config.growlerDefaultOptions;

  if (data && data.result) {
    $.bootstrapGrowl(
      AlphaPoint.translation('ALERTS.REQUEST_SUCCESSFUL') || 'Request successful',
      {...growlerOpts, type: 'info'}
    );
  } else if (data && !data.result) {
    $.bootstrapGrowl(
      AlphaPoint.translation('ALERTS.REQUEST_UNSUCCESSFUL', {errormsg: data.errormsg}) || `Request unsuccessful: ${data.errormsg}`,
      {...growlerOpts, type: 'danger'}
    );
  }
});
