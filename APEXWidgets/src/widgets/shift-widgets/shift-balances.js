import Balances from '../balances';

class ShiftBalances extends Balances {
  componentDidMount() {
    super.componentDidMount();
    const depositBtnClass = '.deposit-button';
    const withdrawBtnClass = '.withdraw-button';
    let currencies = AlphaPoint.config.balances.currenciesWithActionBtns;
    let intervalTimes = 0;
    let intervalTimesLimit = 10;
    
    let showActionBtnsInterval = setInterval(() => {
        $(depositBtnClass + ', ' + withdrawBtnClass).css('display', 'none');
        $('.ap-balances .currency-name').each(function() {
            var currency = $(this).text().split(' : ')[0];
            if (currencies.indexOf(currency) === -1) {
                return true;
            }
            $(this).closest('.row').find(depositBtnClass + ', ' + withdrawBtnClass).css('display', 'inline-block');
            intervalTimes = intervalTimesLimit;

            $(depositBtnClass + ', ' + withdrawBtnClass).each(function() {
                $(this).on("click", () => {
                    setTimeout(() => {
                        $('.ap-body p').each((index, value) => {
                            let el = $('.ap-body p')[index];
                            $(el).html($.parseHTML($(el).html().replace(/\n/g, "<br />")));
                        })
                    }, 1000);
                });
            });
        });
        if (intervalTimes === intervalTimesLimit) {
            clearInterval(showActionBtnsInterval);
        }
        intervalTimes++;
    }, 500);
  }
}

export default ShiftBalances;
