/* global window */
import React from 'react';

class Interswitch extends React.Component {
  componentDidMount() {
    this.form.submit();
  }

  render() {
    const { options } = this.props;

    return (<form
      id="interswitchForm"
      style={{ visibility: 'hidden' }}
      action={options.postUrl}
      method="post"
      ref={form => this.form = form} // eslint-disable-line
    >
      <input name="product_id" type="text" value={options.productId} />
      <input name="pay_item_id" type="text" value={options.itemId} />
      <input name="amount" type="text" value={options.amount} />
      <input name="currency" type="text" value={options.currency} />
      <input name="site_redirect_url" type="text" value={options.siteRedirectUrl} />
      <input name="txn_ref" type="text" value={options.transRef} />
      <input name="cust_id" type="text" value={options.customerId} />
      <input name="hash" type="text" value={options.hash} />
    </form>);
  }
}

Interswitch.defaultProps = {
  options: {
    postUrl: '',
    productId: '',
    itemId: '',
    amount: '',
    currency: '',
    siteRedirectUrl: '',
    transRef: '',
    customerId: '',
    hash: '',
  },
};

Interswitch.propTypes = {
  options: React.PropTypes.shape({
    postUrl: React.PropTypes.string,
    productId: React.PropTypes.string,
    itemId: React.PropTypes.string,
    amount: React.PropTypes.string,
    currency: React.PropTypes.string,
    siteRedirectUrl: React.PropTypes.string,
    transRef: React.PropTypes.string,
    customerId: React.PropTypes.string,
    hash: React.PropTypes.string,
  }),
};

export default Interswitch;
