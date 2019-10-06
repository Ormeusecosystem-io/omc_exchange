import React from 'react';

export default class LoginLogoutBtns extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            loggedIn: false
         }
    }
    componentDidMount() {
        this.session = AlphaPoint.session.subscribe(data => {
            this.setState({ loggedIn: data.Authenticated });
        });
    }

    renderLoggedInElements = () => {
        return [
            <li id="login" className={this.props.dashboardClass}>
                <a href='dashboard.html'>Dashboard</a>
            </li>,
            <li id="login" className={this.props.logoutClass}>
                <a ap-action='Logout' href='index.html' name="logout">Log Out</a>
            </li>
        ];
    }
    render() { 

        if (this.state.loggedIn) {
            this.renderLoggedInElements();
        }
        else {
            return (
                <li id="login">
                    <a href={this.props.loginHref} className={this.props.loginClass}>Login</a>
                </li>
            );
        }
    }
}

LoginLogoutBtns.defaultProps = {
    loginClass: 'modal-btn login-btn',
    loginHref: '#login',
    dashboardClass: '',
    logoutClass: ''
};
  
LoginLogoutBtns.propTypes = {
    loginClass: React.PropTypes.string,
    loginHref: React.PropTypes.string,
    dashboardClass: React.PropTypes.string,
    logoutClass: React.PropTypes.string
};