/* global window */
import React from 'react';
import Script from '../script';

const RazorpayDeposit = ({ options }) => (
  <Script
    url="https://checkout.razorpay.com/v1/checkout.js"
    onLoadCallback={() => {
      const optionsObj = {
        ...options,
        handler() {
          window.location.href = options.redirectUrl;
        },
      };
      const rzp = new Razorpay(optionsObj); // eslint-disable-line

      rzp.open();
    }}
  />
);

RazorpayDeposit.defaultProps = {
  options: {
    key: '',
    amount: '',
    order_id: '',
    handler: '',
    prefill: {
      contact: '',
      email: '',
    },
  },
};

RazorpayDeposit.propTypes = {
  options: React.PropTypes.shape({
    key: React.PropTypes.string,
    amount: React.PropTypes.string,
    order_id: React.PropTypes.string,
    handler: React.PropTypes.string,
    prefill: React.PropTypes.shape({
      contact: React.PropTypes.string,
      email: React.PropTypes.string,
    }),
  }),
};

export default RazorpayDeposit;
