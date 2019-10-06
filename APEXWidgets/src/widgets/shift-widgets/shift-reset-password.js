import ResetPassword from '../resetPassword';

class ShiftResetPassword extends ResetPassword {
    constructor() {
        super();
    }
    
    componentDidMount() {
        super.setState({
            information: '',
            error: 'The password needs to be at least 8 characters, including 1 number and 1 capital letter.'
        });
    }
}

export default ShiftResetPassword;
