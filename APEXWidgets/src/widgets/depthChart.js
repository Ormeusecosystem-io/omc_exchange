/* global AlphaPoint, document */
import Rx from 'rx-lite';
import { formatOrders } from './helper';

function depthChart() {
  const depthChartTextColor = 'rgb(200,200,200)'; // Grey
  const depthChartTextFont = '12px';
  const depthChartXAxisTextPadding = 60;
  const depthChartYAxisTextPadding = 20;
  const depthChartBottomPadding = 20;
  const lastTradeDownColor = 'rgb(255, 0, 0)';
  const lastTradeDownColorTransparent = 'rgba(255, 0, 0, 0.1)';
  const lastTradeUpColor = 'rgb(0, 255, 0)';
  const lastTradeUpColorTransparent = 'rgba(0, 255, 0, 0.1)';
  const c1 = document.getElementById('depthchart');
  let depthchartzoom = 2.5;
  let mousePos = { x: 0, y: 0 };
  let mouseOver = false;
  let sellBook = [];
  let buyBook = [];

  function ZoomDepthChartPlus() {
    depthchartzoom /= 1.25;
    if (depthchartzoom < 0.0001) depthchartzoom = 0.0001;
    RefreshDepthChart();
  }

  function ZoomDepthChartMinus() {
    depthchartzoom *= 1.25;
    if (depthchartzoom > 1000) depthchartzoom = 1000;
    RefreshDepthChart();
  }

  document.getElementById('zoomIn').addEventListener('click', (e) => {
    e.preventDefault();
    ZoomDepthChartPlus();
  });
  document.getElementById('zoomOut').addEventListener('click', (e) => {
    e.preventDefault();
    ZoomDepthChartMinus();
  });

  c1.addEventListener('mouseover', () => {
    mouseOver = true;
    RefreshDepthChart();
  });
  c1.addEventListener('mouseout', () => {
    mouseOver = false;
    RefreshDepthChart();
  });
  c1.addEventListener('mousemove', (evt) => {
    mousePos = getDepthChartMousePosition(c1, evt);
    if (mouseOver) RefreshDepthChart();
  });

  Rx.Observable.combineLatest(
    AlphaPoint.instrumentChange,
    AlphaPoint.orderBook,
    (instrument, book) => {
      if (book[instrument] && book[instrument].buys && book[instrument].sells) {
        return book[instrument];
      }
      return null;
    },
  )
    .subscribe(book => {
      if (book) {
        sellBook = book.sells.sort((a, b) => b.Price - a.Price);
        buyBook = book.buys.sort((a, b) => b.Price - a.Price);
        RefreshDepthChart();
      }
    });


  this.Leve2Updates = AlphaPoint.Level2Update
    .filter(orders => orders.length)
    .map(formatOrders)
    .subscribe((orders) => {
      const bids = orders.filter(order => order.Side === 0);
      const asks = orders.filter(order => order.Side === 1);

      if (bids.length) {
        bids.forEach((obj) => {
          const newBids = buyBook.filter(lev => lev.Price !== obj.Price);
          const newBuyBook = obj.Quantity ? newBids.concat(obj) : newBids;

          buyBook = newBuyBook.sort((a, b) => b.Price - a.Price);
        });
      }

      if (asks.length) {
        asks.forEach((obj) => {
          const newAsks = sellBook.filter(lev => lev.Price !== obj.Price);
          const newSellBook = obj.Quantity ? newAsks.concat(obj) : newAsks;

          sellBook = newSellBook.sort((a, b) => b.Price - a.Price);
        });
      }

      RefreshDepthChart();
    });

  function getDepthChartMousePosition(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  }

  function RefreshDepthChart() {
    const c2 = document.getElementById('depthchart');
    const ch = document.getElementById('depthChartHolder');
    c2.width = ch.clientWidth;
    // c2.height = ch.clientHeight;
    c2.height = 150;
    const chartHeight = c2.height;
    const chartWidth = c2.width;
    let maxBidPrice = 0;
    let minAskPrice = 999999;

    const sortedSellBook = sellBook.map((order) => order.Price);
    sortedSellBook.forEach((price) => {
      if (price < minAskPrice) minAskPrice = price;
    });

    const sortedBuyBook = buyBook.map((order) => order.Price);
    sortedBuyBook.forEach((price) => {
      if (price > maxBidPrice) maxBidPrice = price;
    });

    const center = (minAskPrice + maxBidPrice) / 2;

    const maxAskDisplay = center + depthchartzoom;
    const minBidDisplay = center - depthchartzoom;

    let visibleAskDepth = 0;
    let sellLevels = 0;
    for (let i = sortedSellBook.length - 1; i >= 0; --i) {
      if (sellBook[i].Price > maxAskDisplay) break;
      visibleAskDepth += sellBook[i].Quantity;
      ++sellLevels;
    }
    let visibleBidDepth = 0;
    let buyLevels = 0;
    for (let i = 0; i < sortedBuyBook.length; i++) {
      if (buyBook[i].Price < minBidDisplay) break;
      visibleBidDepth += buyBook[i].Quantity;
      ++buyLevels;
    }

    let topvisibleDepth = visibleAskDepth;
    if (visibleBidDepth > visibleAskDepth) topvisibleDepth = visibleBidDepth;

    const multX = chartWidth / (depthchartzoom * 2); // pixels per unit of price
    const multY = ((chartHeight - depthChartBottomPadding) / (topvisibleDepth)); // pixels per unit of depth

    const ctx2 = c2.getContext('2d');
    ctx2.clearRect(0, 0, chartWidth, chartHeight);
    let lastY = chartHeight - depthChartBottomPadding;
    let lastX = (chartWidth / 2);

    let mouseHoverBuy = false;
    let mouseHoverSell = false;
    if (mousePos.x < lastX) {
      mouseHoverBuy = true;
    } else if (mousePos.x > lastX) {
      mouseHoverSell = true;
    }

    let lastTextEntry = lastX;
    let lastpx = center;
    lastX = (chartWidth / 2) - ((center - parseFloat(sortedBuyBook[0])) * multX);

    let lastXDrawn = 0;
    let lastYDrawn = 0;

    let lastTextEntryY = lastY;
    let lastTextEntryX = lastX;
    let depthShown = 0;

    const closestMousePositionInfo = { price: 0, volume: 0, x: 0, y: 0, xdiff: 999999 };
    closestMousePositionInfo.mouseX = mousePos.x;

    for (let i = 0; i < buyLevels; i++) {
      const lvl = buyBook[i];
      depthShown += lvl.Quantity;
      const x = parseInt(lastX - ((lastpx - lvl.Price) * multX), 10);
      const y = chartHeight - parseInt(depthShown * multY, 10) - depthChartBottomPadding;

      if (mouseHoverBuy) {
        if (closestMousePositionInfo.xdiff > Math.abs(lastX - mousePos.x)) {
          closestMousePositionInfo.price = lvl.Price;
          closestMousePositionInfo.xdiff = Math.abs(lastX - mousePos.x);
          closestMousePositionInfo.volume = depthShown;
          closestMousePositionInfo.x = lastX;
          closestMousePositionInfo.y = y;
        }
      }

      lastpx = lvl.Price;

      if (lastTextEntryX - x > depthChartXAxisTextPadding && x - 40 > 0) {
        ctx2.font = depthChartTextFont;
        ctx2.fillStyle = depthChartTextColor;
        ctx2.fillText(lastpx.toFixed(2), x, chartHeight - 10);
        lastTextEntryX = x;
      }

      if (x <= chartWidth && y <= chartHeight && x >= 0) {
        ctx2.beginPath();
        ctx2.moveTo(lastX, y);
        ctx2.save();
        ctx2.lineWidth = 1;
        ctx2.lineTo(x, y);
        ctx2.strokeStyle = lastTradeUpColor;
        ctx2.stroke();

        ctx2.beginPath();
        ctx2.moveTo(lastX, lastY);
        ctx2.lineTo(lastX, y);
        ctx2.stroke();
        ctx2.restore();
        ctx2.fillStyle = lastTradeUpColorTransparent;

        ctx2.fillRect(lastX, y, x - lastX, chartHeight - depthChartBottomPadding - y);
        // console.log(lastTextEntryY - y);
        if (lastTextEntryY - y >= depthChartYAxisTextPadding && y - 10 > 0) {
          ctx2.font = depthChartTextFont;
          ctx2.fillStyle = depthChartTextColor;
          // var totalamt = depthShown * lastpx;
          // ctx2.fillText(depthShown.toFixed(0) + " $" + totalamt.toFixed(0), chartWidth - 40, y);
          ctx2.fillText(depthShown.toFixed(0), 20, y);
          lastTextEntryY = y;
          ctx2.save();
          ctx2.beginPath();
          ctx2.moveTo(x, y);
          ctx2.lineW = 1;
          ctx2.lineTo(0, y);
          ctx2.strokeStyle = lastTradeUpColor;
          ctx2.setLineDash([2, 3]);
          ctx2.stroke();
          ctx2.restore();
        }

        if (x - lastTextEntry >= depthChartXAxisTextPadding) {
          ctx2.font = depthChartTextFont;
          ctx2.fillStyle = depthChartTextColor;
          ctx2.fillText(lvl.Price.toFixed(2), x, chartHeight);


          ctx2.save();
          ctx2.beginPath();
          ctx2.moveTo(x, chartHeight - depthChartBottomPadding);
          ctx2.lineW = 1;
          ctx2.lineTo(x, chartHeight - 10);
          ctx2.strokeStyle = lastTradeUpColor;
          ctx2.stroke();
          ctx2.restore();
          lastTextEntry = x;
        }

        lastXDrawn = x;
        lastYDrawn = y;
      }

      lastX = x;
      lastY = y;
    }

    ctx2.fillStyle = lastTradeUpColorTransparent;
    ctx2.fillRect(0, lastYDrawn, lastXDrawn, chartHeight - depthChartBottomPadding - lastYDrawn);
    ctx2.beginPath();
    ctx2.moveTo(lastXDrawn, lastYDrawn);
    ctx2.save();
    ctx2.lineWidth = 1;
    ctx2.lineTo(0, lastYDrawn);
    ctx2.strokeStyle = lastTradeUpColor;
    ctx2.stroke();
    ctx2.restore();

    lastY = chartHeight - depthChartBottomPadding;
    lastX = chartWidth / 2;
    lastTextEntry = lastX;
    lastpx = center;
    lastTextEntryY = lastY;
    lastX = (chartWidth / 2) + ((parseFloat(sortedSellBook[sortedSellBook.length - 1]) - center) * multX);
    lastTextEntryX = 0;
    let shownum = sortedSellBook.length - sellLevels - 1;
    if (shownum < 0) shownum = 0;
    let depthShownA = 0;
    for (let i = sortedSellBook.length - 1; i >= shownum; i--) {
      const lvl = sellBook[i];
      depthShownA += lvl.Quantity;
      const x = parseInt(lastX + ((lvl.Price - lastpx) * multX), 10);
      const y = chartHeight - parseInt(depthShownA * multY, 10) - depthChartBottomPadding;
      lastpx = lvl.Price;

      if (mouseHoverSell) {
        if (closestMousePositionInfo.xdiff > Math.abs(lastX - mousePos.x)) {
          closestMousePositionInfo.xdiff = Math.abs(lastX - mousePos.x);
          closestMousePositionInfo.price = lvl.Price;
          closestMousePositionInfo.volume = depthShownA;
          closestMousePositionInfo.x = lastX;
          closestMousePositionInfo.y = y;
        }
      }

      if (x - lastTextEntryX > depthChartXAxisTextPadding && x + 40 < chartWidth) {
        ctx2.font = depthChartTextFont;
        ctx2.fillStyle = depthChartTextColor;
        ctx2.fillText(lastpx.toFixed(2), x, chartHeight - 10);
        lastTextEntryX = x;
      }

      if (x <= chartWidth && y <= chartHeight && x >= 0) {
        ctx2.save();
        ctx2.beginPath();
        ctx2.moveTo(lastX, y);
        ctx2.lineWidth = 1;
        ctx2.lineTo(x, y);
        ctx2.strokeStyle = lastTradeDownColor;
        ctx2.stroke();

        ctx2.beginPath();
        ctx2.moveTo(lastX, lastY);
        ctx2.lineTo(lastX, y);
        ctx2.stroke();
        ctx2.restore();
        ctx2.fillStyle = lastTradeDownColorTransparent;

        ctx2.fillRect(lastX, y, x - lastX, chartHeight - depthChartBottomPadding - y);

        if (lastTextEntryY - y >= depthChartYAxisTextPadding && y - 10 > 0) {
          ctx2.font = depthChartTextFont;
          ctx2.fillStyle = depthChartTextColor;
          // var totalamt = depthShownA * lastpx;
          // ctx2.fillText(depthShownA.toFixed(0) + " $"+totalamt.toFixed(0), 20, y);
          ctx2.fillText(depthShownA.toFixed(0), chartWidth - 40, y);

          lastTextEntryY = y;
          ctx2.save();
          ctx2.beginPath();
          ctx2.moveTo(chartWidth, y);
          ctx2.lineW = 1;
          ctx2.lineTo(x, y);
          ctx2.strokeStyle = lastTradeDownColor;
          ctx2.setLineDash([2, 3]);
          ctx2.stroke();
          ctx2.restore();
        }
        if (lastTextEntry - x >= depthChartXAxisTextPadding) {
          ctx2.font = depthChartTextFont;
          ctx2.fillStyle = depthChartTextColor;
          ctx2.fillText(lvl.Price.toFixed(2), x, chartHeight);

          ctx2.save();
          ctx2.beginPath();
          ctx2.moveTo(x, chartHeight - depthChartBottomPadding);
          ctx2.lineW = 1;
          ctx2.lineTo(x, chartHeight - 10);
          ctx2.strokeStyle = lastTradeDownColor;
          ctx2.stroke();
          ctx2.restore();

          lastTextEntry = x;
        }
        lastXDrawn = x;
        lastYDrawn = y;
      }
      lastX = x;
      lastY = y;
    }

    ctx2.fillStyle = lastTradeDownColorTransparent;
    ctx2.fillRect(lastXDrawn, lastYDrawn, chartWidth, chartHeight - depthChartBottomPadding - lastYDrawn);
    ctx2.beginPath();
    ctx2.moveTo(lastXDrawn, lastYDrawn);
    ctx2.save();
    ctx2.lineWidth = 1;
    ctx2.lineTo(chartWidth, lastYDrawn);
    ctx2.strokeStyle = lastTradeDownColor;
    ctx2.stroke();
    ctx2.restore();

    if (mouseOver && (mouseHoverBuy || mouseHoverSell)) {
      // ctx2.save();
      ctx2.beginPath();
      // ctx2.moveTo(closestMousePositionInfo.x, closestMousePositionInfo.y);
      ctx2.arc(closestMousePositionInfo.x, closestMousePositionInfo.y, 3, 0, 2 * Math.PI, false);
      ctx2.fillStyle = 'rgba(205,205,205, 0.3)';
      ctx2.fill();
      ctx2.lineWidth = 1;
      ctx2.strokeStyle = 'rgba(205,205,205, 0.3)';
      ctx2.stroke();
      // ctx2.restore();
      if (mouseHoverBuy) {
        ctx2.font = depthChartTextFont;
        ctx2.fillStyle = depthChartTextColor;
        ctx2.fillText(
          closestMousePositionInfo.price.toFixed(2),
          closestMousePositionInfo.x + 5,
          closestMousePositionInfo.y,
        );
        ctx2.fillText(
          closestMousePositionInfo.volume.toFixed(2),
          closestMousePositionInfo.x + 5,
          closestMousePositionInfo.y + 15,
        );
      }
      if (mouseHoverSell) {
        ctx2.font = depthChartTextFont;
        ctx2.fillStyle = depthChartTextColor;
        ctx2.fillText(
          closestMousePositionInfo.price.toFixed(2),
          closestMousePositionInfo.x - 40,
          closestMousePositionInfo.y,
        );
        ctx2.fillText(
          closestMousePositionInfo.volume.toFixed(2),
          closestMousePositionInfo.x - 40,
          closestMousePositionInfo.y + 15,
        );
      }
    }
  }

  RefreshDepthChart();
}

export default depthChart;
