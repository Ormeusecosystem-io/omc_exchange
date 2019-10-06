import React from 'react';

class VerificationRequired extends React.Component {
    constructor() {
        super();

        this.state = {
            verificationLevel: 0
        };
    };

    componentDidMount() {
        this.accountInfo = AlphaPoint.accountInfo.subscribe(info => {
            this.setState({ verificationLevel: info.VerificationLevel });
        });
    }; 

    componentWillUnmount() {
        this.accountInfo.dispose()
    }
    

    render() {
        const verificationRequiredLevel = AlphaPoint.config.verificationRequiredLevel || [];

        if (!AlphaPoint.config.useVerificationRequired) {
            return <div>{this.props.children}</div>
        }
        if (verificationRequiredLevel.includes(this.state.verificationLevel)) {
            return (
                <div style={{ padding: "15px" }} className={`${this.props.className} verifcation-required`}>
                    <h3 className="verification-required-message">
                      {AlphaPoint.translation("VERIFICATION_REQUIRED.UNDER_REVIEW_MESSAGE") ||
                      "Your account is currently under review. We will notify you by email when you are verified. At that time, you will then be able to use this feature."}
                      </h3>
                </div>
            );
        }
        if (this.state.verificationLevel === 0) {
            return (
                <div style={{ padding: "15px" }} className={`${this.props.className} verifcation-required`}>
                    <h3 className="verification-required-message">
                      {AlphaPoint.translation("VERIFICATION_REQUIRED.COMPLETE_VERIFICATION_MESSAGE", {verificationLevel: this.state.verificationLevel}) ||
                      `You are at verification level ${this.state.verificationLevel}. Please complete your account verification to use this feature.`}
                      </h3>
                </div>
            );
        } else {
            return <div>{this.props.children}</div>
        }
    };
};

VerificationRequired.defaultProps = {
    className: '',
    children: null
  };

VerificationRequired.propTypes = {
    className: React.PropTypes.string,
    children: React.PropTypes.node.isRequired
  };

export default VerificationRequired;
