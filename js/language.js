const userLang = navigator.language || navigator.userLanguage;
if (userLang === "de") {
    $('[lang="en"]').hide();
} else {
    $('[lang="de"]').hide();
}
//not working: https://stackoverflow.com/a/43033380/18332741