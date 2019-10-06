/* global AlphaPoint */

const Messages = {
    email: (AlphaPoint.translation('VALIDATION_MESSAGES.EMAIL') || 'Please enter a valid email'),
    required: (AlphaPoint.translation('VALIDATION_MESSAGES.REQUIRED') || 'This field is required'),
    alphanumeric: (AlphaPoint.translation('VALIDATION_MESSAGES.ALPHANUMERIC') || 'Only letters and numbers allowed'),
    integer: (AlphaPoint.translation('VALIDATION_MESSAGES.INTEGER') || 'Please enter a valid number'),
};

export default Messages;