import BuyNarrow from './buy-narrow';
import SellNarrow from './sell-narrow';
import AccountBalances from './accountBalances';

import React from 'react'

class OrderEntryStandard extends React.Component {
  constructor(props) {
    super(props);

    this.handleResetForm = this.handleResetForm.bind(this);
    
    this.state = {
      OrderType: 2,
      orderTypes:[
        { name: 'market-order', value: 1, label: 'Market Order' },
        { name: 'limit-order', value: 2, label: 'Limit Order' },
        { name: 'stop-market', value: 3, label: 'Stop Order' }
      ],
      resetForm: false
    };
  }

  changeOrderType = e => this.setState({ OrderType: +e.target.value });

  handleResetForm = () => this.setState({ resetForm: false });
  
  render() {
    return (
      <div>

        <div className='tabs'>
        {this.state.orderTypes.map(orderType => { 
          return (
            <span className="tab">
              <input
                className={`order-type ${this.state.OrderType === orderType.value ? 'checked' : ''}`}
                id={`${orderType.name}-ordertype`}
                key={orderType.value}
                name={orderType.name}
                defaultChecked={orderType === 2}
                checked={this.state.OrderType === orderType.value}
                type='radio'
                value={orderType.value}
                onChange={this.changeOrderType}
              />
              <label onClick={() => this.setState({ resetForm: true })} htmlFor={`${orderType.name}-ordertype`}>
              {orderType.value === 1 ? AlphaPoint.translation('ORDER_ENTRY_STANDARD.TAB_MARKET_ORDER') || orderType.label : ''}
              {orderType.value === 2 ? AlphaPoint.translation('ORDER_ENTRY_STANDARD.TAB_LIMIT_ORDER') || orderType.label : ''}
              {orderType.value === 3 ? AlphaPoint.translation('ORDER_ENTRY_STANDARD.TAB_STOP_MARKET_ORDER') || orderType.label : ''}
              </label>
            </span>
          );
        })
      }
      <div className={`select-indicator ${this.state.OrderType === 3 ? 'three' : ''} ${this.state.OrderType === 2 ? 'two' : ''}`}/>
      </div>
      <div className="row">
        <div className="col-xs-6 buy-narrow-widget-container">
          
          <div className="buy-account-overview">
            <AccountBalances/>
          </div>

          <BuyNarrow 
            OrderType={this.state.OrderType} 
            changeOrderType={(OrderType) => this.setState({ OrderType })}
            resetForm={this.state.resetForm}
            handleResetForm={this.handleResetForm}
          />

        </div>

        <div className="col-xs-6 sell-narrow-widget-container">

          <div className="sell-account-overview">
            <AccountBalances/>
          </div>

          <SellNarrow 
            OrderType={this.state.OrderType} 
            changeOrderType={(OrderType) => this.setState({ OrderType })}
            resetForm={this.state.resetForm}
            handleResetForm={this.handleResetForm}
          />

        </div>
      
      </div>
        
        

      </div>
    );
  }
};

export default OrderEntryStandard;