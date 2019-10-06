import React, { Component } from 'react';

class ReCAPTCHAv2 extends Component {
	state = {
		captchaId: null
	}

	componentDidMount() {
		const script = document.createElement("script");
		script.src = "https://www.google.com/recaptcha/api.js";
		script.async = true;
		script.defer = true;
		document.body.appendChild(script);

		const captchaId = document.getElementsByClassName('g-recaptcha').length;
		this.setState({ captchaId });
	}

	render() {
		return (
			<div 
				id={`recaptcha-${this.state.captchaId}`}
				className="g-recaptcha"
				data-sitekey="6LcFJXgUAAAAANoKEBxRns2JzgNwFdWbQIIqxYG3"
			/>
		)
	}
}

export default ReCAPTCHAv2;