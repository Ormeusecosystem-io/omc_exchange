import React from 'react';

class Psigate extends React.Component {
  componentDidMount() {
    this.form.submit();
  }

  render() {
    const { options } = this.props;

    return (<form
      id="psigateForm"
      style={{ visibility: 'hidden' }}
      action={options.APIAddress}
      method="post"
      ref={form => this.form = form} // eslint-disable-line
    >
      <input name="MerchantID" type="text" value={options.MerchantID} />
      <input name="PaymentType" type="text" value={options.PaymentType} />
      <input name="OrderID" type="text" value={options.OrderID} />
      <input name="UserID" type="text" value={options.UserID} />
      <input name="SubTotal" type="text" value={options.SubTotal} />
      <input name="CardAction" type="text" value={0} />
      <input name="ResponseFormat" type="text" value={options.ResponseFormat} />
      <input name="Email" type="text" value={options.Email} />
      <input name="ThanksURL" type="text" value={options.ThanksURL} />
      <input name="NoThanksURL" type="text" value={options.NoThanksURL} />
    </form>);
  }
}

Psigate.defaultProps = {
  options: {
    MerchantID: '',
    PaymentType: '',
    OrderID: '',
    UserID: '',
    SubTotal: '',
    ResponseFormat: '',
    Email: '',
  },
};

Psigate.propTypes = {
  options: React.PropTypes.shape({
    MerchantID: React.PropTypes.string,
    PaymentType: React.PropTypes.string,
    OrderID: React.PropTypes.string,
    UserID: React.PropTypes.string,
    SubTotal: React.PropTypes.string,
    ResponseFormat: React.PropTypes.string,
    Email: React.PropTypes.string,
  }),
};

export default Psigate;
