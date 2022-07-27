const userLang = navigator.language || navigator.userLanguage;
if (userLang === "de" || userLang === "de-DE" || userLang === "de-CH" || userLang === "de-AT" || userLang === "de-LI") {
    $('[lang="en"]').hide();
} else {
    $('[lang="de"]').hide();
}
//not working: https://stackoverflow.com/a/43033380/18332741