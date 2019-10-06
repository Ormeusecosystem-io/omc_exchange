/* global location */
import React from 'react';
import WidgetBase from '../base';
import Script from '../script';

const Trustpay = ({ url, title }) => (
  <WidgetBase headerTitle={title}>
    <div className="pad" style={{ color: '#000' }}>
      Redirecting...
      <form action={location.href} className="paymentWidgets" data-brands="VISA MASTER AMEX" />
      <Script url={url} />
    </div>
  </WidgetBase>
);

Trustpay.defaultProps = {
  url: '',
  title: '',
};

Trustpay.propTypes = {
  url: React.PropTypes.string,
  title: React.PropTypes.string,
};

export default Trustpay;
