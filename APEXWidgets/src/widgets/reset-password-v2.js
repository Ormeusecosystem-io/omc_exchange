/* global AlphaPoint, $, atob, window */
import React from 'react';
import WidgetBase from './base';
import InputNoLabel from '../misc/inputNoLabel';
import { getURLParameter, showGrowlerNotification } from './helper';

class ResetPasswordV2 extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            newPassword: '',
            confirmPassword: '',
            inputsFilled: { newPassword: "", confirmPassword: "" },
            error: '',
            success: '',
            information: '',
            hideCloseLink: true
        };
    }

    colorInIcons = (e) => {
        let value = e.target.value,
        name = e.target.name,
        inputsFilled = this.state.inputsFilled;

        inputsFilled[name] = value;
        this.setState({ inputsFilled })
    };

    setBanner = (info) => {
        this.setState(info);
    };

    handleSubmit = (e) => {
        e.preventDefault();
        const self = this,
            encodedUrl = getURLParameter('d1'),
            verifyCode = getURLParameter('verifycode'),
            userId = getURLParameter('UserId');
        this.setBanner({
            information: AlphaPoint.translation('COMMON.PLEASE_WAIT') || 'Please wait...',
            error: '',
        });
        const mediumRegex = new RegExp('^(?=.{8,})(?=.*[A-Z])(?=.*[0-9]).*$', 'g');
        const enoughRegex = new RegExp('(?=.{8,}).*', 'g');

        if (!this.refs.newPassword.value() || !this.refs.confirmPassword.value()) {
            this.setBanner({
                information: '',
                error: 'Please enter your password in both fields',
            });
        }
        else if (this.refs.newPassword.value() !== this.refs.confirmPassword.value()) {
            this.setBanner({
                information: '',
                error: 'Your Passwords Do Not Match',
            });
        }
        else if (!enoughRegex.test(this.refs.newPassword.value())) {
          this.setBanner({
            information: '',
            error: 'Password must contain at least 8 characters'
          });
        }
        else if (!mediumRegex.test(this.refs.newPassword.value())) {
          this.setBanner({
            information: '',
            error: 'Password must contain at least 8 characters, one number, and at least one capital letter'
          });
        }
        else if (!encodedUrl) {
            return
            this.setBanner({
                information: '',
                error: 'Required parameter d1 was not found in url.',
            });
        }
        else if (!verifyCode) {
            return
            this.setBanner({
                information: '',
                error: 'Required parameter verifycode was not found in url.',
            });
        }
        else if (!userId) {
            return
            this.setBanner({
                information: '',
                error: 'Required parameter UserId was not found in url.',
            });
        } else {

            const ajaxUrl = atob(encodedUrl);
            const payload = {
                PendingCode: verifyCode,
                Password: this.refs.newPassword.value(),
                UserId: userId,
            };

            return $.ajax({
                type: 'POST',
                url: `${ajaxUrl}ResetPassword2`,
                data: JSON.stringify(payload),
                dataType: 'JSON',
                success: (data) => {
                    if (!data.result) {
                        if (data.rejectReason) {
                            return this.setBanner({information: '', error: `Password Reset error: ${data.rejectReason}`});
                        }
                        return this.setBanner({information: '', error: 'Password reset error'});
                    }
                    setTimeout(function() {
                        $('.close-m').click();
                    }, 3000);
                    window.localStorage.removeItem('SessionToken');
                    return this.setBanner({
                        success: 'You successfully reset your password.',
                        information: '',
                        error: '',
                    });
                },
            })
        }
    };

    render() {
        return (
            <WidgetBase {...this.props} {...this.state} headerTitle={AlphaPoint.translation('SIGNIN_MODAL.TITLE_TEXT') || 'Reset Password'}>
                <div>
                    <form>
                        <div className="pad">
                            <span className="input input--custom">
                                <InputNoLabel placeholder="New password" type="password" ref="newPassword" name="newPassword" className="input-field" colorChange={this.colorInIcons} />
                                <i className={"fa fa-key " + (this.state.inputsFilled.newPassword && "completed")} aria-hidden="true"></i>
                            </span>
                            <span className="input input--custom">
                                <InputNoLabel placeholder="Confirm password" type="password" ref="confirmPassword" name="confirmPassword" className="input-field" colorChange={this.colorInIcons} />
                                <i className={"fa fa-key " + (this.state.inputsFilled.confirmPassword && "completed")} aria-hidden="true"></i>
                            </span>
                            <div className="text-center row around-xs">
                                <button
                                    type="submit"
                                    onClick={this.handleSubmit}
                                    className="btn btn-lg submit underline"
                                >Reset Password</button>
                            </div>
                        </div>
                    </form>
                </div>
            </WidgetBase>
        );
    }
}

export default ResetPasswordV2;
