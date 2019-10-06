/* global AlphaPoint, $ */
const DepthMarketChart = (function() {
  const EPSILON = 0.0000001;
  const tickerSocket = null;
  const orderBookSocket = null;
  let bids = [];
  let asks = [];
  let lastPrice = 0;
  let InstrumentId = 0;
  let ticker = []; // to hold the value from the subscribe1
  let lastChartRepaint = null;
  let instrument = AlphaPoint.prodPair.value;
  let plot;
  let bidsChartSeries;
  let asksChartSeries;
  let currentPriceChartSeries;

  function DepthMarketChart(symbol, chartPlaceholder, options) {
    this.symbol = symbol;
    this.chartPlaceholder = chartPlaceholder || '#placeholder';
    this.options = options || {};
    instrument = this.symbol;
    this.createChart();
    this.orderBookOnMessage(options.lvl2);
  }

  DepthMarketChart.prototype.changeSymbol = function() {};

  function connect() {}

  DepthMarketChart.prototype.init = function() {
    this.createChart();
  };

  DepthMarketChart.prototype.tickerOnMessage = function(e) {
    ticker = e;
    if (AlphaPoint.prodPair.value !== this.symbol) return;
    lastPrice = ticker.Close;
    InstrumentId = ticker.InstrumentId;
    instrument = this.symbol;
  };

  DepthMarketChart.prototype.orderBookOnMessage = function(entry) {
    entry.buys.sort((a, b) => {
      if (a.Price > b.Price) {
        return 1;
      }
      if (a.Price < b.Price) {
        return -1;
      }
      return 0;
    });

    for (var i = entry.buys.length - 1; i >= 0; i--) {
      if (entry.buys[i].ActionType === 0 && entry.buys[i].Quantity > 0) {
        if (i == entry.buys.length - 1) {
          entry.buys[i].depth = entry.buys[i].Quantity;
        } else {
          entry.buys[i].depth =
            entry.buys[i + 1].depth + entry.buys[i].Quantity;
        }
      }
    }

    for (var i = 0; i < entry.sells.length; i++) {
      if (entry.sells[i].ActionType === 0 && entry.sells[i].Quantity > 0) {
        if (i == 0) {
          entry.sells[i].depth = entry.sells[i].Quantity;
        } else {
          entry.sells[i].depth =
            entry.sells[i - 1].depth + entry.sells[i].Quantity;
        }
      }
    }

    bids = entry.buys;
    asks = entry.sells;

    this.minMaxInterval();
    this.updateChart();
  };

  DepthMarketChart.prototype.insertEntry = function(entry, list) {
    if (list.length === 0 || list[list.length - 1].Price < entry.Price) {
      list.push(entry);
      return;
    }

    let idx = 0;
    while (idx < list.length && entry.Price > list[idx].Price) {
      idx++;
    }

    if (idx === list.length) {
      list.push(entry);
      return;
    }

    if (this.compareNumbers(entry.Price, list[idx].Price)) {
      list[idx].Quantity = entry.Quantity;
      return;
    }

    list.splice(idx, 0, entry);
  };

  DepthMarketChart.prototype.removeEntry = function(entry, list) {
    for (
      let i = 0, j = list.length - 1;
      i < list.length && j >= 0 && j >= i;
      i++, j--
    ) {
      const el = list[i];
      if (el.Price === entry.Price) {
        list.splice(i, 1);
        return true;
      }
    }
    return false;
  };

  DepthMarketChart.prototype.compareNumbers = function(n1, n2) {
    return Math.abs(n1 - n2) < EPSILON;
  };

  DepthMarketChart.prototype.minMaxInterval = function() {
    const entryMin = bids.length && bids[0];
    const entryMax = asks.length && asks[asks.length - 1];
    const middleBids = bids.length && bids[bids.length - 1];
    const middleAsks = asks.length && asks[0];
  };

  DepthMarketChart.prototype.updateChart = function() {
    if (!lastChartRepaint) {
      lastChartRepaint = new Date().getTime();
    }

    e = lastPrice - dx;

    const minPrice = bids.length && bids[0].Price;
    const maxPrice = asks.length && asks[asks.length - 1].Price;
    const midPoint = (minPrice + maxPrice) / 2;
    let maxBid = 0;
    let maxAsk = 0;

    // bids
    const bidsSeries = [];
    for (var i = 0; i < bids.length; i++) {
      if (bids[i].Price < minPrice) continue;
      bidsSeries.push([bids[i].Price, bids[i].depth]);
      maxBid = bids[i].depth;
    }

    const asksSeries = [];
    for (var i = 0; i < asks.length; i++) {
      if (asks[i].Price > maxPrice) break;
      asksSeries.push([asks[i].Price, asks[i].depth]);
      maxAsk = asks[i].depth;
    }

    const opts = plot.getOptions();
    const y1 = opts.yaxes[0];
    const y2 = opts.yaxes[1];
    y1.max = y2.max = Math.max(maxBid, maxAsk) * 1.1;
    bidsChartSeries.data = bidsSeries;
    asksChartSeries.data = asksSeries;
    currentPriceChartSeries.data = [[midPoint, y1.max], [midPoint, 0]];
    plot.setData([bidsChartSeries, asksChartSeries, currentPriceChartSeries]);
    plot.setupGrid();
    plot.draw();
  };

  DepthMarketChart.prototype.createChart = function() {
    bidsChartSeries = {
      color: '#08A61B',
      data: [],
      label: 'Bids',
      shadowSize: 0,
      lines: {
        show: true,
        fill: true,
        lineWidth: 1
      },
      points: { show: true, radius: 2 }
    };
    asksChartSeries = {
      color: '#EB0C0F',
      data: [],
      label: 'Asks',
      yaxis: 2,
      shadowSize: 0,
      lines: {
        show: true,
        fill: true,
        lineWidth: 1
      },
      points: { show: true, radius: 2 }
    };

    currentPriceChartSeries = {
      color: '#FFF',
      data: [],
      label: 'Last',
      shadowSize: 0,
      lines: { lineWidth: 0.2 }
    };

    plot = $.plot(
      this.chartPlaceholder,
      [bidsChartSeries, asksChartSeries, currentPriceChartSeries],
      {
        yaxes: [
          {
            min: 0,
            tickLength: 0
          },
          {
            min: 0,
            position: 'right'
          }
        ],
        xaxis: {
          tickDecimals: 0,
          tickLength: 0,
          tickFormatter(v, axis) {
            return `$${v}`;
          }
        },
        legend: {
          position: 'ne',
          show: false
        },
        grid: {
          borderWidth: { top: 0, right: 1, bottom: 1, left: 1 },
          backgroundColor: AlphaPoint.config.chart_dark ? '#333' : '#FFF',
          clickable: true,
          hoverable: true
        }
      }
    );

    function showTooltip(x, y, contents) {
      $(`<div id = "tooltip">${contents}</div>`)
        .css({
          width: '180px',
          height: '65px',
          position: 'absolute',
          display: 'none',
          top: y + 5,
          left: x + 5,
          border: '1px solid #FFD',
          padding: '2px',
          'background-color': '#000',
          color: '#fff',
          opacity: 0.8
        })
        .appendTo('body')
        .fadeIn(200);
    }

    $(this.chartPlaceholder).bind('plotclick', (event, pos, item) => {
      if (item) plot.highlight(item.series, item.datapoint);
    });
    $(this.chartPlaceholder).bind('plothover', (event, pos, item) => {
      $('#tooltip').remove();
      if (item) {
        const x = item.datapoint[0].toFixed(2);
        const y = item.datapoint[1].toFixed(2);
        showTooltip(
          item.pageX,
          item.pageY,
          `${AlphaPoint.prodPair.value}</br> Price : ${x}</br> Available : ${y}`
        );
      }
    });
  };

  return DepthMarketChart;
})();

export default DepthMarketChart;
