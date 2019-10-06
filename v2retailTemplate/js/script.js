// =============================================
//          Custom JS for Landing Page
// =============================================

var dot_nav = $('.dot-nav'),
    sections = $('.section'),
    chapters = $('.chapter'),
    targetOffset = $(".contact").offset().top,
    ref;
const defaultSection = "home";

// =============================================
// dot nav
// =============================================
$(function () {
    AOS.init({
        offset: 200,
        duration: 600,
        easing: 'ease-in-sine',
        delay: 100,
    });
    var scroll = new SmoothScroll('a[href="#home"]', {easing: 'linear'});
    var scroll = new SmoothScroll('a[href="#features"]', {easing: 'linear'});
    var scroll = new SmoothScroll('a[href="#about"]', {easing: 'linear'});
    var scroll = new SmoothScroll('a[href="#contact"]', {easing: 'linear'});
    var scroll = new SmoothScroll('a[href="#security"]', {easing: 'linear'});
    var scroll = new SmoothScroll('a[href="#platform"]', {easing: 'linear'});

    var currentHash = "#home"
    $(document).scroll(function () {
        $('.chapter').each(function () {
            var top = window.pageYOffset;
            var distance = top - $(this).offset().top;
            var hash = $(this).attr('id');
            // 30 is an arbitrary padding choice, 
            // if you want a precise check then use distance===0
            if (distance < 140 && distance > -140 && currentHash != hash) {
                window.location.hash = (hash);
                currentHash = hash;
            }
        });
    });
});

// =============================================
// onScroll eventListener for dotNav
// =============================================
const runOnScroll = () => {
    let newOffset = targetOffset - 300;
    let section = window.location.hash.replace('#', '');
    section = section || defaultSection;
    
    const bodyClasses = 'body-home-section body-features-section body-about-section body-contact-section body-platform-section body-security-section';
    
    $(".dot-nav li").removeClass('active-dot');
    $(".dot-nav li a[href='#" + section + "']").parent().addClass("active-dot");

    $('body').removeClass(bodyClasses);
    $('body').addClass('body-'+ section +'-section');
}

$(document).ready(function () {

    runOnScroll();
    window.addEventListener("scroll", runOnScroll);

    // let dotNavItems = document.querySelectorAll(".dot-nav li");
    // // console.log(dotNavItems);
    // for (let dot of dotNavItems) {
    //     window.addEventListener("scroll", runOnScroll);
    //     (dotNavItems.addEventListener("click", runOnScroll);
    // }

    // =============================================
    // Hamburger Menu Functionality
    // =============================================
    var menu = $(".menu-wrapper"),
        hamburger = $("#hamburger"),
        line = $(".line"),
        menuOpen;

    function openMenu() {
        menu.addClass('menuopen');
        line.css("background", "#FFF");
        menuOpen = true;
    }

    function closeMenu() {
        menu.removeClass('menuopen');
        line.css("background", "#f93e2e");
        menuOpen = false;
    }

    function toggleMenu() {
        if (menuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    $('.menu-item a').on({
        click: function () {
            toggleMenu();
        }
    })

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        hamburger.on({
            click: function () {
                toggleMenu();
            }
        })

    } else {
        hamburger.on({
            mouseenter: function () {
                openMenu();
            }
        });

        menu.on({
            mouseleave: function () {
                closeMenu();
            }

        });

        hamburger.on({
            click: function () {
                toggleMenu();
            }
        })
    }

});

// =============================================
// Login/Register Modal Animation (using GSAP)
// =============================================
let tl = new TimelineMax(),
    openModalBtn = $('.modal-btn'),
    loginModal = $('.login-modal'),
    registerModal = $('.register-modal'),
    widgetModal = $('.widget-modal'),
    closeModalBtn = $('.close-m');

const openModalHandler = (login, register) => {
    return (e) => {
        e.preventDefault();
        let whichModal = $(e.target).hasClass('login-btn') ? login : register;

        tl.to(whichModal, .2, {
            top: 0,
            visibility: 'visible',
            opacity: 1,
            attr: {
                'data-open': true
            },
            onComplete: () => {
                $(document.body).addClass('modal-open');
            },
            ease: Power0.easeNone
        })
    };
};

const closeModalHandler = (login, register, widget) => {
    return (e) => {
        e.preventDefault();
        let whichModal = $(e.target).hasClass('close-login') && login ||
                         $(e.target).hasClass('close-register') && register ||
                         $(e.target).hasClass('close-widget') && widgetModal;


        tl.set(whichModal, {
            clearProps: 'all',
            onComplete: () => {
                $(document.body).removeClass('modal-open');
            }
        })
    }
}

// openModal and closeModal event listeners
openModalBtn.on('click', openModalHandler(loginModal, registerModal))
closeModalBtn.on('click', closeModalHandler(loginModal, registerModal, widgetModal))

// Widget Modal Logic
const resetPasswordStr = window.location.href.indexOf('resetPass') > 0,
    verifyEmailStr = window.location.href.indexOf('verifyEmail') > 0,
    confirmWithdrawStr = window.location.href.indexOf('confirmWithdraw') > 0,
    resetPasswordWidget = $('#ResetPassword'),
    verifyEmailWidget = $('#VerifyEmail'),
    confirmWithdrawWidget = $('#ConfirmWithdraw');

$(document).ready(() => {
    if (resetPasswordStr) {
        resetPasswordWidget.removeClass('hide');
        setTimeout(function () {
            tl.to(widgetModal, .2, {
                top: 0,
                visibility: 'visible',
                opacity: 1,
                attr: {
                    'data-open': true
                },
                onComplete: () => {
                    $(document.body).addClass('modal-open');
                },
                ease: Power0.easeNone
            })
        }, 500);
    }
    if (verifyEmailStr) {
        verifyEmailWidget.removeClass('hide');
        setTimeout(function () {
            tl.to(widgetModal, .2, {
                top: 0,
                visibility: 'visible',
                opacity: 1,
                attr: {
                    'data-open': true
                },
                onComplete: () => {
                    $(document.body).addClass('modal-open');
                    setTimeout(function () {
                        tl.set(widgetModal, {
                            clearProps: 'all'
                        });
                        $(document.body).removeClass('modal-open');
                    }, 20000);
                },
                ease: Power0.easeNone
            })
        }, 500);
    }
    if (confirmWithdrawStr) {
        confirmWithdrawWidget.removeClass('hide');
        setTimeout(function () {
            tl.to(widgetModal, .2, {
                top: 0,
                visibility: 'visible',
                opacity: 1,
                attr: {
                    'data-open': true
                },
                onComplete: () => {
                    $(document.body).addClass('modal-open');
                    setTimeout(function () {
                        tl.set(widgetModal, {
                            clearProps: 'all'
                        });
                        $(document.body).removeClass('modal-open');
                    }, 20000);
                },
                ease: Power0.easeNone
            })
        }, 500);
    }
})

// Loggedin/Loggedout Btn Toggle
$(document).ready(() => {
    // Custom login/logout toggle for html landing page(s)
    var apLogout = document.querySelector('a[ap-action="Logout"]'),
        apLogin = document.querySelector('a[href="#login"]'),
        apSignup = document.querySelector('a[href="#signup"]'),
        apDashboard = document.querySelector('a[href="my-accounts.html"]'),
        loginSlideMenu = document.querySelectorAll('.menu-item.only-show-on-mobile')

    $(document).ready(() => {
        if (localStorage.SessionToken === "undefined" || localStorage.SessionToken === undefined || localStorage.SessionToken === "") {
            return;
        } else if (localStorage.SessionToken) {
            Array.prototype.forEach.call(loginSlideMenu, function (node) {
                node.parentNode.removeChild(node);
            });

            apSignup.replaceWith(apLogout);
            apLogin.replaceWith(apDashboard);
        }
    })
})

// Check for IE
function GetIEVersion() {
    var sAgent = window.navigator.userAgent;
    var Idx = sAgent.indexOf("MSIE");

    // If IE, return version number.
    if (Idx > 0)
        return parseInt(sAgent.substring(Idx + 5, sAgent.indexOf(".", Idx)));

    // If IE 11 then look for Updated user agent string.
    else if (!!navigator.userAgent.match(/Trident\/7\./))
        return 11;

    else
        return 0; //It is not IE
}
// Adjust ticker style for IE compatability
$(document).ready(function () {
    if (GetIEVersion() > 0) {
        let ticker = document.querySelector('.ticker-scrolling');
        ticker.setAttribute("style", "transform:translateX(25px)")
    } else {
        //  console.log("This is not IE.");
    }
})