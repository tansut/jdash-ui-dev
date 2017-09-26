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

function startNewDashboardIntro() {
    if (!startNewDashboardIntro.isNewDashboardIntroShown) {
        var intro = introJs();
        intro.setOptions({
            steps: [
                {
                    intro: "Your new dashboard has been created and is ready to design!"
                },
                {
                    element : document.querySelector('#dashlet-list'),
                    intro : 'You can add any dashlet inside.'
                },
                {
                    element: document.querySelector('#layoutedit'),
                    intro: "Click design button to design dashboard layout."
                }
            ]
        });

        intro.start();
        startNewDashboardIntro.isNewDashboardIntroShown = true;
    }
}
