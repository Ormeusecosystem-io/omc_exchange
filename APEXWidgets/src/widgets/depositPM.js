import React from 'react';
import WidgetBase from './base';
import SelectLabeled from '../misc/selectLabeled';
import InputLabeled from '../misc/inputLabeled';

var DepositPM = React.createClass({
  getInitialState: function() {
    return {
      currency: (this.props.parameters||{}).currencies[0].title || '',
      session: {}
    };
  },
  componentWillUnmount: function() {
    this.session.dispose();
  },
  componentDidMount: function() {
    this.session = AlphaPoint.session.subscribe(function(data) {
      // console.log(data);
      this.setState({session:data});
    }.bind(this));
  },
  deposit: function() {
    //https://alitinexchange.com/app/partials/deposit.perfectmoney.dialog.html
    var data = {
      PAYEE_ACCOUNT: '',
      PAYEE_NAME: '',
      PAYMENT_UNITS:'',
      PAYMENT_ID:'',
      PAYMENT_URL:'',
      NOPAYMENT_URL:'',
      SUGGESTED_MEMO:''
    };

  },
  currencyChange: function(e) {
    this.setState({currency: e.target.value});
  },
  render: function() {

    var selectedCurrency;
    var currencies = (this.props.parameters||{}).currencies.map(function(currency) {
      if(currency.title=== this.state.currency) {
        selectedCurrency=currency;
      }
      return <option value={currency.title}>{currency.title}</option>;
    }.bind(this));

    return (
      // wrap all content in widget base
      <WidgetBase login headerTitle={'Deposit via Perfect Money'} >
        <form className='pad' action={this.props.parameters.sciUrl} method="post">

          <input type="hidden" name="PAYEE_ACCOUNT" id="PAYEE_ACCOUNT" value={selectedCurrency.account} />
          <input type="hidden" name="PAYEE_NAME" id="PAYEE_NAME" value={this.props.parameters.payeeName} />
          <input type="hidden" name="PAYMENT_UNITS" id="PAYMENT_UNITS" value={selectedCurrency.title.toUpperCase()} />
          <input type="hidden" name="PAYMENT_ID" id="PAYMENT_ID" value={this.state.session.userId + '-' + selectedCurrency.title} />
          <input type="hidden" name="PAYMENT_URL" id="PAYMENT_URL" value={location.origin + this.props.parameters.successUrl} />
          <input type="hidden" name="NOPAYMENT_URL" id="NOPAYMENT_URL" value={location.origin + this.props.parameters.errorUrl} />
          <input type="hidden" name="PAYMENT_URL_METHOD" id="PAYMENT_URL_METHOD" value="LINK" />
          <input type="hidden" name="NOPAYMENT_URL_METHOD" id="NOPAYMENT_URL_METHOD" value="LINK" />
          <input type="hidden" name="SUGGESTED_MEMO" id="SUGGESTED_MEMO" value={'depositing to: ' + this.props.parameters.payeeName + ', AccountID#' + this.state.session.userId}/>

          <SelectLabeled label='Currency' name='currency' onChange={this.currencyChange}>
            {currencies}
          </SelectLabeled>

          <InputLabeled placeholder='Amount' name='PAYMENT_AMOUNT'/>

          <div className='clearfix'>
            <div className='pull-right'>
              <button type='button' className='btn btn-action' onClick={this.props.close}>Close</button>
              {' '}
              <button type='submit' className='btn btn-action' >Submit</button>
            </div>
          </div>

        </form>
      </WidgetBase>
    );
  }
});



module.exports = DepositPM;
