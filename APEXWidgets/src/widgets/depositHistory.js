import React from 'react';
import WidgetBase from './base';
import common from '../common';

var DepositHistory= React.createClass({

  getInitialState:function(){

    return{
      data:[],
      page:0
    };
  },

  componentDidMount:function(){

    //used to get session token
    AlphaPoint.session
    .where(function(data) {return data.sessionToken;})
    .take(1) // subscribe until valid session
    .subscribe(function(session) {

    AlphaPoint.getDepositHistory(null,function(res) {
    //  console.log(res); to see the contents of the response data
      this.setState({data: res.fiatDepositTickets});
    }.bind(this));

  }.bind(this));

  },

  translateStatus: function(status) {
    if (status == 'Pending') return (AlphaPoint.translation('DEPOSIT_HISTORY.PENDING') || status);
    if (status == 'FullyProcessed') return (AlphaPoint.translation('DEPOSIT_HISTORY.FULLY_PROCESSED') || status);
    return status;
  },
  gotoPage:function(num){

    this.setState({page:num})
  },

  render:function(){

    var maxLines = 10;

    //This was only at 5 to show that the pages functionality is working. Set at 10

    var totalPages=Math.ceil(this.state.data.length/maxLines);
    var pagination = AlphaPoint.config.pagination;
    var paginationClass = AlphaPoint.config.useBootstrapPagination ? 'pagination' : 'pagi';
  /*  var rows=this.state.data.map(function(row){
      return*/
      this.state.data.sort(function(a, b) { return (common.getTimestampFromServerDate(b.date) - common.getTimestampFromServerDate(a.date)) });
      var rows = this.state.data.slice(maxLines*this.state.page, maxLines*(this.state.page+1))
      .map(function(row) {
        return (
        <tr key={row.reference}>
          <td>{common.getLocalDate(row.date,(AlphaPoint.config.timezoneOffset || 0))}</td>
          <td>{row.bankInfo}</td>
          <td>{row.amountRequested}</td>
          <td>{row.reference}</td>
          { (row.status == 'Pending') ? <td>{AlphaPoint.translation('DEPOSIT_HISTORY.PENDING') || row.status}</td>
                : (row.status == 'FullyProcessed') ? <td>{AlphaPoint.translation('DEPOSIT_HISTORY.FULLY_PROCESSED') || row.status}</td>
                :  (row.status == 'AdminProcessing') ? <td>{AlphaPoint.translation('DEPOSIT_HISTORY.PENDING') || row.status}</td>
                :  (row.status == 'Rejected') ? <td>{AlphaPoint.translation('DEPOSIT_HISTORY.REJECTED') || row.status}</td>
                : <td>{row.status}</td>
          }
        </tr>
      );
    });

    var emptyRows = [];
    for (var i=0;i<maxLines-rows.length;i++){
      emptyRows.push(<tr key={i}><td colSpan='6'>&nbsp;</td></tr>);
    }


    var start = (this.state.page - 2) > 0 ? this.state.page - 2 : 0 ;
    var end = (this.state.page + 3) <= totalPages ? this.state.page + 3 : totalPages ;
    var pages = [];

    if (pagination) {
      for ( var x=start; x < end; x++ ) {
        var numButton = (
          <li key={x} className={this.state.page === x ? 'active':null}>
            <a onClick={this.gotoPage.bind(this, x)}>{x+1}</a>
          </li>
        );
        pages.push( numButton );
      }
    }


  return(
          <WidgetBase headerTitle={(AlphaPoint.translation('DEPOSIT_HISTORY.TITLE') ||"Deposit History")}>

            <table className="table table-hover">
              <thead>
                <tr>
                  <th className="header">{(AlphaPoint.translation('DEPOSIT_HISTORY.DATE') ||"Date")}</th>
                  <th className="header">{(AlphaPoint.translation('DEPOSIT_HISTORY.BANK_INFO') ||"Bank Info")}</th>
                  <th className="header">{(AlphaPoint.translation('DEPOSIT_HISTORY.AMOUNT') ||"Amount")}</th>
                  <th className="header">{(AlphaPoint.translation('DEPOSIT_HISTORY.REFERENCE') ||"Reference")}</th>
                  <th className="header">{(AlphaPoint.translation('DEPOSIT_HISTORY.STATUS') ||"Status")}</th>
                </tr>
              </thead>

              <tbody>
                {rows}
                {emptyRows}
              </tbody>

            </table>

            <div className='pad'>
              <div className='pull-right'>
                <ul className={paginationClass}>
                  <li><a onClick={this.gotoPage.bind(this,0)}>&laquo;</a></li>
                  {pages}
                  <li onClick={this.gotoPage.bind(this, totalPages-1)} ><a>&raquo;</a></li>
                </ul>
              </div>
            </div>

          </WidgetBase>
        )
}
});

/*var data= [
  {
    reference: "0e081c6f-37d0-4106-b935-c76001a4533c",
    date: "2015-07-10 23:25:46Z",
    bankInfo: "",
    amountRequested: 1012,
    amountAccepted: 0,
    status: "Pending"
  },
  {
    reference: "25bf3b36-9ef0-40a6-bd38-c89a04cbc768",
    date: "2015-07-10 23:23:11Z",
    bankInfo: "",
    amountRequested: 1015,
    amountAccepted: 0,
    status: "Pending"
  },
  {
    reference: "270fa2d3-3d7d-451c-b0ef-f8b248299ed6",
    date: "2015-07-10 02:58:44Z",
    bankInfo: "Comments: test",
    amountRequested: 1001,
    amountAccepted: 0,
    statusr: "Pending"
  }
 ]
*/
module.exports =DepositHistory;
