if (isGerman()) {
    $('[lang="en"]').hide();
} else {
    $('[lang="de"]').hide();
}

function isGerman() {
    let userLang = navigator.language || navigator.userLanguage;
    return userLang.toLowerCase().includes('de');
}
//not working: https://stackoverflow.com/a/43033380/18332741