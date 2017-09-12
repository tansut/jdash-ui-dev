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

    introTut.start().oncomplete(function () { console.log('Done'); });
})

// mobilde ekranı büyütüp küçültünce sol tarafın geri açılması için koydum
window.addEventListener('resize', function (event) {
    if(event && event.target.innerWidth > 850){
        app && app.openSidenav();
    }

});