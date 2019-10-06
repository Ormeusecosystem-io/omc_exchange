// Common place for all validating function to be re used across componentns

const Validate = {
    email: (value) => {
        // some email validation
        const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
        return emailRegex.test(value);
    },

    required: (value) => {
        // some required validation
        return value && value.trim();
    },

    alphanumeric: (value) => {
        // some alphanumeric validation
        const alphanumericRegex = /^[a-zA-Z0-9]*$/;
        
        return alphanumericRegex.test(value);
    },

    integer: (value) => {
        // some interger valdation
        const integerRegex = /^[0-9]*$/;
        
        return integerRegex.test(value);
    }
}

export default Validate;