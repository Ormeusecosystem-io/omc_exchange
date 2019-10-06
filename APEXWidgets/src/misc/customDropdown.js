import React from 'react';

var CustomDropdown = React.createClass({
  value: function() {
    return this.refs.input.value;
  },
  setValue: function(value) {
    this.refs.input.value = value;
  },

  componentDidMount:function () {
    function DropDown(el) {
      this.dd = el;
      this.initEvents();
    }
    DropDown.prototype = {
      initEvents : function() {
        var obj = this;

        obj.dd.on('click', function(event){
          $(this).toggleClass('active');
          event.stopPropagation();
        });
      }
    }

    $(function() {

      var dd = new DropDown( $('#dd') );

      $(document).click(function() {
        // all dropdowns
        $('.wrapper-dropdown-2').removeClass('active');
      });

    });
  },

  render: function() {
    var style = {width:"89%", margin:'0'}
    return (
      <div className="container-fluid">

        <section className="main">
          <div className="wrapper-demo">
            <div id="dd" className="wrapper-dropdown-5" tabIndex="1" style={style}><span id="fillMe">{this.props.selectedAddress || "Select an address"}</span>
              <ul className="dropdown">
                {this.props.children}
              </ul>
            </div>
          ​</div>
        </section>

      </div>
    );
  }
});

export default CustomDropdown;
