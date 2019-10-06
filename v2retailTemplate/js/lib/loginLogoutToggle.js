// Custom login/logout toggle for html landing page(s)
var apLogout = document.querySelector('a[ap-action="Logout"]'),
    apLogin = document.querySelector('a[href="#login"]'),
    apSignup = document.querySelector('a[href="#dialog-form"]'),
    apDashboard = document.querySelector('a[href="dashboard.html"]');

$(document).ready(() => {
    if (localStorage.SessionToken === "undefined" || localStorage.SessionToken === undefined || localStorage.SessionToken === "") {
        return;
    } else if (localStorage.SessionToken) {
        apLogin.replaceWith(apLogout);
        apSignup.setAttribute('style', 'display:none;');
    }
})