if (isGerman()) {
    $('[lang="en"]').hide();
} else {
    $('[lang="de"]').hide();
}

function isGerman() {
    let userLang = navigator.language || navigator.userLanguage;
    return userLang === "de" ||
        userLang === "de-DE" ||
        userLang === "de-CH" ||
        userLang === "de-AT" ||
        userLang === "de-LU" ||
        userLang === "de-LI" ||
        userLang === "de-de" ||
        userLang === "de-ch" ||
        userLang === "de-at" ||
        userLang === "de-lu" ||
        userLang === "de-li";
}
//not working: https://stackoverflow.com/a/43033380/18332741