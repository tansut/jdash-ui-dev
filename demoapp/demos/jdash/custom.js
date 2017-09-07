$(window).ready(function () {
    var introTut = introJs();
    introTut = introTut.setOptions({
        exitOnOverlayClick: false,
        exitOnEsc: false,
        showProgress: true,
        hideNext: true,
        disableInteraction: true,
        doneLabel: 'Start!'
    })

    // introTut.start().oncomplete(function () { console.log('Done'); });
})