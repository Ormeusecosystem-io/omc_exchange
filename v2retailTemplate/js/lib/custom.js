/* ==================================================================================

 Template Name : Infinite
 Description : Professional & Creative Multipurpose Landing Page HTML5 Template
 Version : 1.3
 Author : BitAlphaPoint.Net Kumar

 IF YOU NEED ANY KIND OF HELP REGARDING TO THIS TEMPLATE
 SO, DIRECT E-MAIL US AT :- support@wpsolutiongroup.com


 Copyright 2016 WP Solution Group
 http://www.wpsolutiongroup.com/

 ===================================================================================== */


$(function () {
    "use strict";


    /* ========================================
     Preloader
     ========================================= */
    $(window).load(function () {
        $('.pageloader').delay(500).slideUp(800);
    })


    /* ========================================
     Smooth Scroll
     ========================================= */

    $('a.goto, .navbar .nav a').smoothScroll({
        speed: 1200
    });


    /* ========================================
     Main Menu scroll down effect
     ========================================= */
    // $(window).scroll(function () {
    //     if ($(window).scrollTop() > $("nav").height()) {
    //         $("nav.navbar-down").addClass("down");
    //     } else {
    //         $("nav.navbar-down").removeClass("down");
    //         $(".navbar-down .navMenuCollapse").collapse({toggle: false});
    //         $(".navbar-down .navMenuCollapse").collapse("hide");
    //         $(".navbar-down .navbar-toggle").addClass("collapsed");
    //     }
    // });

    // $('.main-menu .nav a').on('click', function () {
    //     if ($('.navbar-toggle').css('display') != 'none') {
    //         $(".navbar-toggle").click();
    //     }
    // });


    /* ========================================
     Main Menu Social blinking effect
     ========================================= */

    var SocBlink = $('.main-menu .social_blinker'),
        MenuSoc = $('.main-menu .social');
    SocBlink.on('click', function () {
        $(this).toggleClass('hidden');
        MenuSoc.toggleClass('appear');
    });


    MenuSoc.mouseleave(function () {
        $(this).removeClass('appear');
        SocBlink.removeClass('hidden');
    });

    /* ========================================
     Active Menu Highlighter
     ========================================= */
    // Cache selectors
    var topMenu = $(".main-menu");
    var topMenuHeight = topMenu.outerHeight() + 15;
    // All list items
    var menuItems = topMenu.find("a");
    // Anchors corresponding to menu items
    var scrollItems = menuItems.map(function () {
        var item = $($(this).attr("href"));
        if (item.length) {
            return item;
        }
    });


    /* ====================================
     Bind to Scroll
     =================================== */
    $(window).scroll(function () {
        // Get container scroll position
        var fromTop = $(this).scrollTop() + topMenuHeight;

        // Get id of current scroll item
        var cur = scrollItems.map(function () {
            if ($(this).offset().top < fromTop)
                return this;
        });
        // Get the id of the current element
        cur = cur[cur.length - 1];
        var id = cur && cur.length ? cur[0].id : "";
        // Set/remove active class
        menuItems.parent().removeClass("active").end().filter("[href=#" + id + "]").parent().addClass("active");
    })


    /* ====================================
     Sliders Configuration
     =================================== */

    $('.slider-fade-bg').slick({
        autoplay: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        centerMode: false,
        infinite: true,
        arrows: false,
        dots: false,
        fade: true,
        speed: 3700,
        autoplaySpeed: 7000
    });




    /* ====================================
     Portfolio Filter Effect
     =================================== */
    $('#filters-container button').click(function (e) {
        $('#filters-container .filter-item-active').removeClass('filter-item-active');
        $(this).addClass('filter-item-active');
        var target = $(this).attr('data-filter');
        if (target == '*') {
            target = '.item';
        }
        $('#grid-container .item .item-wrapper').addClass('animated fadeOut');

        setTimeout(function () {

            $('#grid-container .item').css({
                display: 'none'
            });
            $('#grid-container .item .item-wrapper').get(0).className = 'item-wrapper';
            $('#grid-container ' + target).each(function () {
                $(this).css({
                    display: 'block'
                });
                $(this).find('.item-wrapper').get(0).className = 'item-wrapper animated fadeIn';
            });
            setTimeout(function () {
                $('#grid-container .animated').removeClass('animated').removeClass('fadeIn');
            }, 1200);
        }, 800);

        e.preventDefault();
    });


    /* ====================================
    PopUP Effect
    =================================== */
    $('.btnsignup').magnificPopup({
        type: 'inline',
        removalDelay: 300,
        mainClass: 'mfp-with-zoom',

        zoom: {
            enabled: true, // By default it's false, so don't forget to enable it

            duration: 300, // duration of the effect, in milliseconds
            easing: 'ease-in-out', // CSS transition easing function

            // The "opener" function should return the element from which popup will be zoomed in
            // and to which popup will be scaled down
            // By defailt it looks for an image tag:
            opener: function (openerElement) {
                // openerElement is the element on which popup was initialized, in this case its <a> tag
                // you don't need to add "opener" option if this code matches your needs, it's defailt one.
                return openerElement.is('img') ? openerElement : openerElement.find('img');
            }
        }

    });


    $('.magnificPopUp_close').on("click", function () {
        $.magnificPopup.close();

    });


    /* ====================================
     Statistics
     =================================== */
    (function ($) {
        var elem = $('#statistics');
        if (elem.length) {

            var inview = new Waypoint.Inview({
                element: elem[0],
                enter: function (direction) {
                    $('.count span').countTo({
                        formatter: function (value, options) {
                            value = value.toFixed(options.decimals);
                            value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                            return value;
                        }
                    });
                    inview.destroy();
                }
            });

        }
    })($); // function end


    /* ====================================
     Mailchimp Form
     =================================== */
    $('.mailchimp').ajaxChimp({
        callback: mailchimpCallback,
        url: "http://wpsolutiongroup.us10.list-manage.com/subscribe/post?u=dfebf17589e5f97ee693a5a9c&amp;id=b2cd10112f"
        //Replace ^ this with your own mailchimp post URL. Don't remove the "". Just paste the url inside "".
    });

    function mailchimpCallback(resp) {
        if (resp.result === 'success') {
            $('.subscription-success').html('<i class="fa fa-thumbs-o-up"></i>' + resp.msg).css("opacity", "1");
            $('.subscription-error').css("opacity", "0");
        } else if (resp.result === 'error') {
            $('.subscription-error').html('<i class="fa fa-user-times"></i>' + resp.msg).css("opacity", "1");
            $('.subscription-success').css("opacity", "0");

        }
    }


    /*===================================================================
     Contact Form Send Email and Validation
     =================================================================*/
    $('.contact-form, .registration').validator({
        disable: false
    });

    $("#contact-form").submit(function (e) {
        e.preventDefault();
        var name = $("#contact-name").val();
        var email = $("#contact-email").val();
        var subject = $("#contact-subject").val();
        var message = $("#contact-message").val();
        var dataString = 'name=' + name + '&email=' + email + '&subject=' + subject + '&message=' + message;
        $.ajax({
            type: "POST",
            url: "sendmail/mail.php",
            data: dataString,
            success: function () {
                $('.form-success').css({
                    "opacity": "1"
                });
                $('.form-error').css({
                    "opacity": "0"
                });
            },
            error: function () {
                $('.form-error').css({
                    "opacity": "1"
                });
                $('.form-success').css({
                    "opacity": "0"
                });
            }
        });
    });


    /*===========================================================================
     Bootstrap Internet Explorer 10 in Windows 8 and Windows Phone 8 FIX
     ===========================================================================*/
    if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
        var msViewportStyle = document.createElement('style');
        msViewportStyle.appendChild(
            document.createTextNode('@-ms-viewport{width:auto!important}'));
        document.querySelector('head').appendChild(msViewportStyle);
    }


});



/*=================================================================
 Back to top
 =================================================================*/
jQuery(document).ready(function ($) {
    // browser window scroll (in pixels) after which the "back to top" link is shown
    var offset = 500,
        //browser window scroll (in pixels) after which the "back to top" link opacity is reduced
        offset_opacity = 2000,
        //duration of the top scrolling animation (in ms)
        scroll_top_duration = 700,
        //grab the "back to top" link
        $back_to_top = $('.back-to-top-link');

    //hide or show the "back to top" link
    $(window).scroll(function () {
        ($(this).scrollTop() > offset) ? $back_to_top.addClass('back-to-top-visible'): $back_to_top.removeClass('back-to-top-visible back-to-top-fade-out');
        if ($(this).scrollTop() > offset_opacity) {
            $back_to_top.addClass('back-to-top-fade-out');
        }
    });

    $back_to_top.on('click', function (event) {
        event.preventDefault();
        $('body,html').animate({
            scrollTop: 0,
        }, scroll_top_duration);
    });
});