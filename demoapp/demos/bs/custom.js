$(window).ready(function () {
    var introTut = introJs();
    introTut.setOptions({
        exitOnOverlayClick: false,
        exitOnEsc: false,
        showProgress: true,
        hideNext: true,
        disableInteraction: true,
        doneLabel: 'Start!'
    }).start().oncomplete(function () {
        console.log('Done');
    })
})
function rightBarInitted(navbar, isResize) {
    if (!isResize) {
        app.loadThemes(navbar.querySelector('#themes'));
    }
}