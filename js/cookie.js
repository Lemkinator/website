// --- Config --- //
const cookieTitle = "Cookies"; // Title
const cookieDesc = "By using this website, you automatically accept that we use cookies.";
const cookieLink = '<a href="https://www.leonard-lemke.com/impressum" target="_blank">More Information</a>';
const cookieButton = "OK";

// ---        --- //


function fadeIn(elem, display) {
    const el = document.getElementById(elem);
    el.style.opacity = 0;
    el.style.display = display || "block";

    (function fade() {
        let val = parseFloat(el.style.opacity);
        if (!((val += .02) > 1)) {
            el.style.opacity = val;
            requestAnimationFrame(fade);
        }
    })();
}

function fadeOut(elem) {
    const el = document.getElementById(elem);
    el.style.opacity = 1;

    (function fade() {
        if ((el.style.opacity -= .02) < 0) {
            el.style.display = "none";
        } else {
            requestAnimationFrame(fade);
        }
    })();
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

function cookieConsent() {
    if (!getCookie('cookieDismiss')) {
        document.body.innerHTML +=
            '<div class="cookieConsentContainer" id="cookieConsentContainer">' +
                '<div class="cookieTitle"><a>' + cookieTitle + '</a></div>' +
                '<div class="cookieDesc"><p>' + cookieDesc + ' ' + cookieLink + '</p></div>' +
                '<div class="lButton"><a onClick="cookieDismiss();">' + cookieButton + '</a></div>' +
            '</div>';
        fadeIn("cookieConsentContainer");
    }
}

function cookieDismiss() {
    setCookie('cookieDismiss', '1', 7);
    fadeOut("cookieConsentContainer");
}

window.onload = function () {
    cookieConsent();
};