/* global AlphaPoint, localStorage, document */
import React from 'react';

class ShiftInstrumentSelect extends React.Component {
  state = {
    pair: AlphaPoint.prodPair.value
  }

  componentDidMount() {
    this.instrumentUpdate = AlphaPoint.prodPair.subscribe(pair => this.setState({ pair }));
  }

  componentWillUnmount() {
    this.instrumentUpdate.dispose();
  }

  render() {
    return (
      <div className="current-instrument dropdown instrument-dropdown">
        <h3>{this.state.pair}</h3>
      </div>
    );
  }
}

export default ShiftInstrumentSelect;
