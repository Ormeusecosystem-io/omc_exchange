import { shallow } from 'enzyme';
import React from 'react';
import AccountBalances from '../src/widgets/accountBalances';

describe('Account balances widget', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<AccountBalances />, { disableLifecycleMethods: true });
  });

  test('should have an h2 tag with the title Account Overview', () => {
    expect(wrapper.containsMatchingElement(<h2>Account Overview</h2>)).toBe(true);
  });

  describe('on initial state', () => {
    test('it should show default BTC and USD product total and available balances as 0.00', () => {
      expect(wrapper.containsMatchingElement(<tr><td>USD</td><td><span>0.00</span></td><td><span>0.00</span></td></tr>)).toBe(true);
      expect(wrapper.containsMatchingElement(<tr><td>BTC</td><td><span>0.00</span></td><td><span>0.00</span></td></tr>)).toBe(true);
    });
  });

  describe('if state already updated', () => {
    beforeEach(() => {
      wrapper.setState({
        Product1AvailableBalance: "99.00",
        Product1Symbol: "BTC",
        Product1TotalBalance: "100.00",
        Product2AvailableBalance: "98957.00",
        Product2Symbol: "USD",
        Product2TotalBalance: "99000.00",
        balances: [
          {
            AccountId: 15,
            Amount: 100,
            Hold: 1,
            OMSId: 1,
            PendingDeposits: 0,
            PendingWithdraws: 0,
            ProductId: 1,
            ProductSymbol: "BTC",
            TotalDayDeposits: 100,
            TotalDayWithdraws: 0,
            TotalMonthWithdraws: 0,
          },
          {
            AccountId: 15,
            Amount: 99000,
            Hold: 43,
            OMSId: 1,
            PendingDeposits: 0,
            PendingWithdraws: 0,
            ProductId: 2,
            ProductSymbol: "USD",
            TotalDayDeposits: 100000,
            TotalDayWithdraws: 1000,
            TotalMonthWithdraws: 1000,
          },
        ],
        instrumentId: "1",
      });
    });

    it('should show correct available and total balances for both products', () => {
      expect(wrapper.containsMatchingElement(<tr><td>USD</td><td><span>98957.00</span></td><td><span>99000.00</span></td></tr>)).toBe(true);
      expect(wrapper.containsMatchingElement(<tr><td>BTC</td><td><span>99.00</span></td><td><span>100.00</span></td></tr>)).toBe(true);
    });
  });
});
