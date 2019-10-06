import React, { Component } from 'react';
import { Glyphicon } from 'react-bootstrap';
import enhanceWithClickOutside from 'react-click-outside';

class ShiftWidgetWrapper extends Component {
  state = {
    activeWidgetIndex: 0,
    hidden: false,
    sumOfTabWidths: undefined,
    overflowTabs: false,
    responsiveTabsMenuHidden: true
  };

  // Lifecycle Methods
  componentDidMount() {
    const sumOfTabWidths = this.calculateSumOfTabWidths();
    this.setState({ sumOfTabWidths: sumOfTabWidths, hidden: false, responsiveTabsMenuHidden: true }, this.checkIfTabsOverflow);
    window.addEventListener('resize', this.checkIfTabsOverflow);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.checkIfTabsOverflow);
  }

  // Event handlers
  handleHideToggle = () =>
    this.setState({
      hidden: !this.state.hidden,
      responsiveTabsMenuHidden: true
    });

  handleWidgetSelection = index => () =>
    this.setState({
      hidden: false,
      activeWidgetIndex: index,
      responsiveTabsMenuHidden: true
    });

  handleResponsiveTabsMenuToggle = () =>
    this.setState({
      responsiveTabsMenuHidden: !this.state.responsiveTabsMenuHidden
    });

  handleClickOutside = () => this.setState({ responsiveTabsMenuHidden: true });

  handleWidgetClick = () => this.setState({ responsiveTabsMenuHidden: true });

  handleHeaderClick = () => {
    if (!this.state.responsiveTabsMenuHidden) {
      this.setState({ responsiveTabsMenuHidden: true });
    }
    if (this.state.hidden) {
      this.setState({ hidden: false });
    }
  };

  // Class methods
  calculateSumOfTabWidths = () => {
    let sumOfTabWidths = 0;
    for (const tab in this.refs) {
      if (tab.includes('tabDOM')) {
        sumOfTabWidths += this.refs[tab].offsetWidth;
      }
    }
    return sumOfTabWidths;
  };

  checkIfTabsOverflow = () => {
    const tabsDivWidth = this.refs.tabsDivDOM.offsetWidth;
    if (this.state.sumOfTabWidths > tabsDivWidth - 45) {
      this.setState({ overflowTabs: true });
    } else {
      this.setState({ overflowTabs: false });
    }
  };

  // Render methods
  renderTabs = () =>
    this.props.tabs.map((item, index) => (
      <li
        key={index}
        onClick={this.handleWidgetSelection(index)}
        className={this.state.activeWidgetIndex === index ? 'active' : null}
        ref={`tabDOM${index}`}
      >
        {item}
      </li>
    ));

  renderTabsOverflow = () => (
    <li
      className="active"
      onClick={this.handleWidgetSelection(this.state.activeWidgetIndex)}
    >
      {this.props.tabs[this.state.activeWidgetIndex]}
    </li>
  );

  renderResponsiveTabsMenu = () => (
    <div className="responsive-tabs-menu-container">
      <div className="arrow-up" />
      <ul className="responsive-tabs-menu">{this.renderTabs()}</ul>
    </div>
  );

  render() {
    return (
      <div className={`widget-container ${this.props.className}`}>
        <div
          className="widget-header"
          onClick={this.handleHeaderClick}
          ref="tabsDivDOM"
        >
          <ul className="widget-tabs">
            {this.renderTabs()}
          </ul>
          {this.state.overflowTabs ? (
            <div
              className="responsive-tabs-menu-icon"
              onClick={this.handleResponsiveTabsMenuToggle}
            >
              {this.state.responsiveTabsMenuHidden ? (
                <Glyphicon glyph="option-vertical" />
              ) : (
                <Glyphicon glyph="remove" />
              )}
            </div>
          ) : null}
          {this.state.responsiveTabsMenuHidden
            ? null
            : this.renderResponsiveTabsMenu()}
        </div>
        <div onClick={this.handleWidgetClick}>
          {this.state.hidden
            ? null
            : this.props.children[this.state.activeWidgetIndex] ||
              this.props.children}
        </div>
      </div>
    );
  }
}

export default enhanceWithClickOutside(ShiftWidgetWrapper);
