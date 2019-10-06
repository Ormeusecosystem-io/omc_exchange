/* global AlphaPoint */
import React from 'react';

export default class Spinner extends React.Component {
  render() {
  let spinner = (<i className="fas fa fa-spinner fa-spin" />);

    if (AlphaPoint.config.nonFavIconSpinner) {
      spinner = (
        <svg
          className="spinner"
          width="32px"
          height="32px"
          viewBox="0 0 66 66"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="path"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            cx="33"
            cy="33"
            r="30"
          />
        </svg>
      );
    }

    return spinner;
  }
}
