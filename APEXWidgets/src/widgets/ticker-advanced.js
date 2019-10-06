import React from 'react';
import WidgetBase from './base';

const Tabs = React.createClass({
  displayName: 'Tabs',
  propTypes: {
    selected: React.PropTypes.number,
    children: React.PropTypes.oneOfType([
      React.PropTypes.array,
      React.PropTypes.element
    ]).isRequired
  },
  getDefaultProps() {
    return {
      selected: 0,
    };
  },
  getInitialState() {
    return {
      selected: this.props.selected
    };
  },
  handleClick(index, event) {
    event.preventDefault();
    this.setState({
      selected: index
    });
  },
  _renderTitles() {
    function labels(child, index) {
      let activeClass = (this.state.selected === index ? 'active' : '');
      return (
        <li key={index}>
          <a href="#"
            className={activeClass}
            onClick={this.handleClick.bind(this, index)}>
            {AlphaPoint.config.onlyShowFirstTitleTickerAdvanced ?
            this.props.currentPair.slice(0,3) : child.props.label}
          </a>
        </li>
      );
    }
    return (
      AlphaPoint.config.onlyShowFirstTitleTickerAdvanced ?
      <ul className="tabs__labels">
        {this.props.children.slice(0,1).map(labels.bind(this))}
      </ul> :        
      <ul className="tabs__labels">
        {this.props.children.map(labels.bind(this))}
      </ul>
    ) 
  },
  _renderContent() {
    return (
      <div className="tabs__content">
        {this.props.children[this.state.selected]}
      </div>
    );
  },
  render() {
    return (
      <div className="tabs">
        {this._renderTitles()}
        {this._renderContent()}
      </div>
    );
  }
});

const Pane = React.createClass({
  displayName: 'Pane',
  propTypes: {
    label: React.PropTypes.string.isRequired,
    children: React.PropTypes.element.isRequired
  },
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
});

const TickerAdvanced = React.createClass({
  getDefaultProps: function() {
    return {
      narrow: true,
      hideCloseLink: true
    }
  },
  getInitialState: function() {
    return {
      data: [],
      currentPair:[],
      instrument: '',
      pairs:[],
      sorted: false
    };
  },
  componentWillUnmount: function() {
    this.bookTickers.dispose();
  },
  componentDidMount: function() {
    var list = []
    this.instrumentCheck = AlphaPoint.instrumentChange.subscribe(function (instrumentId) {
      this.setState({instrument: instrumentId})
    }.bind(this))

    this.productPair = AlphaPoint.prodPair.subscribe( function(data) {
      this.setState({
        currentPair: data
      });
    }.bind(this));

    this.productPairs = AlphaPoint.instruments.subscribe(function(data) {
      this.setState({pairs: data}); //these are all the possible pairs
    }.bind(this));

    this.bookTickers = AlphaPoint.tickerBook.subscribe(function (data) {
      var tmp = []
      this.loadedSession = AlphaPoint.sessionLoaded.subscribe(function (session) {
        if (session) {
          var obj =  document.APAPI.Session.Instruments
          for (var variable in obj) {
            if (obj.hasOwnProperty(variable)) {
              if (obj[variable].L1Data) {
                tmp.push(obj[variable].L1Data)

              }
            }
          }
          this.setState({data: tmp});
        }
      }.bind(this))
    }.bind(this))

  },

  changePair: function(pair) {

    AlphaPoint.setProductPair(pair);
    localStorage.setItem("SessionPair",pair)

    if(AlphaPoint.config.siteName == "yap.cx"){
        localStorage.setItem("SessionPair",pair)
        document.location = "trade.html"
    }
  },
  reverseName: function() {
    var list = []
    var status = this.state.sorted;
    list = this.state.data

    if(status == false){
      list.sort(function (a, b) {
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
      this.setState({sorted: true });
    }
    else if(status == true)
    {
      list.sort(function (a, b) {
        if (a.name < b.name) { return 1; }
        if (a.name > b.name) { return -1; }
        return 0;
      });
      this.setState({sorted: false });
    }

    this.setState({data: list });
  },

  reverseLast: function() {
    var list = []
    var status = this.state.sorted;
    list = this.state.data

    if(status == false){
      list.sort(function (a, b) {
        if (a.Rolling24HrPxChange > b.Rolling24HrPxChange) { return 1; }
        if (a.Rolling24HrPxChange < b.Rolling24HrPxChange) { return -1; }
        return 0;
      });
      this.setState({sorted: true });
    }
    else if(status == true)
    {
      list.sort(function (a, b) {
        if (a.Rolling24HrPxChange < b.Rolling24HrPxChange) { return 1; }
        if (a.Rolling24HrPxChange > b.Rolling24HrPxChange) { return -1; }
        return 0;
      });
      this.setState({sorted: false });
    }

    this.setState({data: list });
  },

  reverseVolume: function() {
    var list = []
    var status = this.state.sorted;
    list = this.state.data

    if(status == false){
      list.sort(function (a, b) {
        if (a.Volume > b.Volume) { return 1; }
        if (a.Volume < b.Volume) { return -1; }
        return 0;
      });
      this.setState({sorted: true });
    }
    else if(status == true)
    {
      list.sort(function (a, b) {
        if (a.Volume < b.Volume) { return 1; }
        if (a.Volume > b.Volume) { return -1; }
        return 0;
      });
      this.setState({sorted: false });
    }

    this.setState({data: list });
  },
  reverseChange: function() {
    var list = []
    var status = this.state.sorted;
    list = this.state.data

    if(status == false){
      list.sort(function (a, b) {
        if (a.Rolling24HrPxChange > b.Rolling24HrPxChange) { return 1; }
        if (a.Rolling24HrPxChange < b.Rolling24HrPxChange) { return -1; }
        return 0;
      });
      this.setState({sorted: true });
    }
    else if(status == true)
    {
      list.sort(function (a, b) {
        if (a.Rolling24HrPxChange < b.Rolling24HrPxChange) { return 1; }
        if (a.Rolling24HrPxChange > b.Rolling24HrPxChange) { return -1; }
        return 0;
      });
      this.setState({sorted: false });
    }

    this.setState({data: list });
  },

  render() {
    this.state.data.forEach(function(ticker){
        var pairName = (this.state.pairs.filter(function(pairName) {
              return (pairName.InstrumentId === ticker.InstrumentId)
        }.bind(this))[0] || {});
        ticker.name = pairName.Symbol


    }.bind(this))

    var tickers = this.state.data.map(function(pair) {
      if (pair.Rolling24HrPxChange  > 0) {
        var fColour = { color: 'yellowgreen'}
      } else {
        var fColour = {color:'red'}
      }

      return (
        <tr key={pair.InstrumentId} className='ap-widget_ticker' data-help={pair.prodPair} >
            <td className='pair'><a onClick={this.changePair.bind(this,pair.name)}>{pair.name}</a></td>
            <td className='last'>{(pair.LastTradedPx).toFixed(AlphaPoint.config.decimalPlaces)}</td>
            <td className='volume'>{pair.Volume}</td>
            <td className='change' style={fColour}>{ pair.LastTradedPx > 0 ? ((pair.Rolling24HrPxChange / pair.LastTradedPx )*100).toFixed(2) : "-" } %</td>
        </tr>
      );
    }.bind(this));

    return (
      <WidgetBase headerTitle="Markets" {...this.props}>
      <div>
        <Tabs selected={0} currentPair={this.state.currentPair}>
          <Pane label="BTC">
            <table className='table table-responsive'>
              <thead>
                <tr>
                  <td><a onClick = {this.reverseName}>{AlphaPoint.translation('TICKERS.PAIR')||"Pair"}</a></td>

                  { !this.props.narrow &&
                    <td>{AlphaPoint.translation('TICKERS.BID')||"Bid"}</td>
                  }

                  { !this.props.narrow &&
                    <td>{AlphaPoint.translation('TICKERS.ASK')||"Ask"}</td>
                  }

                  {!this.props.narrow && <td>{AlphaPoint.translation('TICKERS.HIGH')||"High"}</td>}
                  { !this.props.narrow && <td>{AlphaPoint.translation('TICKERS.LOW')||"Low"}</td>}

                  <td><a onClick = {this.reverseLast}>{AlphaPoint.translation('TICKERS.LAST')||"Last"}</a></td>
                  <td><a onClick = {this.reverseVolume}>{AlphaPoint.translation('TICKERS.VOLUME')||"Volume"}</a></td>
                  <td><a onClick = {this.reverseChange}>{AlphaPoint.translation('TICKERS.24_HOUR_CHANGE')||"Change"}</a></td>

                  { !this.props.narrow &&
                    <td>{AlphaPoint.translation('TICKERS.TRADES')||"Trades"}</td>
                    }
                  { !this.props.narrow &&
                    <td>{AlphaPoint.translation('TICKERS.VOLUME')||"Volume"}</td>
                  }
                </tr>
              </thead>
              <tbody>
                {tickers}
              </tbody>
            </table>
          </Pane>
          <Pane label="ETH">
            <div>ETH TICKERS</div>
          </Pane>
          <Pane label="DASH">
            <div>DASH TICKERS</div>
          </Pane>
          <Pane label="LTC">
            <div>LTC TICKERS</div>
          </Pane>
        </Tabs>
      </div>
    </WidgetBase>

    );
  }
});

module.exports = TickerAdvanced
