import React from 'react';

class Fennas extends React.Component {
  componentDidMount() {
    this.form.submit();
  }

  render() {
    const { options } = this.props;

    return (<form
      id="fennasForm"
      style={{ visibility: 'hidden' }}
      action={options.PostUrl}
      method="post"
      ref={form => this.form = form} // eslint-disable-line
    >
      <input name="MerchantID" type="text" value={options.MerchantID} />
      <input name="MerchantRefNo" type="text" value={options.MerchantRefNo} />
      <input name="MerchantPaysFees" type="text" value={options.MerchantPaysFees} />
      <input name="SendJSONCallBack" type="text" value={options.SendJSONCallBack} />
      <input name="MerchantLanguage" type="text" value={options.MerchantLanguage} />
      <input name="RequestHasCardOrder" type="text" value={options.RequestHasCardOrder} />
      <input name="ResponseFormat" type="text" value={options.ResponseFormat} />
      <input name="RedirectionURLOK" type="text" value={options.RedirectionURLOK} />
      <input name="RedirectionURLFailed" type="text" value={options.RedirectionURLFailed} />
      <input name="RedirectionURLCancelled" type="text" value={options.RedirectionURLCancelled} />
      <input name="RedirectionURLError" type="text" value={options.RedirectionURLError} />
      <input name="NormalAmount" type="text" value={options.NormalAmount} />
      <input name="NormalCurrency" type="text" value={options.NormalCurrency} />
      <input name="NormalDescription" type="text" value={options.NormalDescription} />
      <input name="RequestType" type="text" value={options.RequestType} />
      <input name="Version" type="text" value={options.Version} />
      <input name="CheckSum" type="text" value={options.CheckSum} />
    </form>);
  }
}

Fennas.defaultProps = {
  options: {
    MerchantID: '',
    MerchantRefNo: '',
    MerchantPaysFees: '',
    SendJSONCallBack: '',
    MerchantLanguage: '',
    RequestHasCardOrder: '',
    ResponseFormat: '',
    RedirectionURLOK: '',
    RedirectionURLFailed: '',
    RedirectionURLCancelled: '',
    RedirectionURLError: '',
    NormalAmount: '',
    NormalCurrency: '',
    NormalDescription: '',
    RequestType: '',
    Version: '',
    CheckSum: '',
  },
};

Fennas.propTypes = {
  options: React.PropTypes.shape({
    MerchantID: React.PropTypes.string,
    MerchantRefNo: React.PropTypes.string,
    MerchantPaysFees: React.PropTypes.string,
    SendJSONCallBack: React.PropTypes.string,
    MerchantLanguage: React.PropTypes.string,
    RequestHasCardOrder: React.PropTypes.string,
    ResponseFormat: React.PropTypes.string,
    RedirectionURLOK: React.PropTypes.string,
    RedirectionURLFailed: React.PropTypes.string,
    RedirectionURLCancelled: React.PropTypes.string,
    RedirectionURLError: React.PropTypes.string,
    NormalAmount: React.PropTypes.string,
    NormalCurrency: React.PropTypes.string,
    NormalDescription: React.PropTypes.string,
    RequestType: React.PropTypes.string,
    Version: React.PropTypes.string,
    CheckSum: React.PropTypes.string,
  }),
};

export default Fennas;
