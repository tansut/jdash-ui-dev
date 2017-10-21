(function () {
    var script = document.currentScript;

    // var isSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // if (isSafari) {
    //     var safariNative = (script.hasAttribute("data-safari-native") && script.getAttribute("data-safari-native")) || "false";
    //     if (safariNative.toLowerCase() == "true" || safariNative == "1") {
    //         window.customElements.forcePolyfill = false;
    //     } else {
    //         window.customElements.forcePolyfill = true;
    //     }
    // }
    if(!("customElements" in window)){
        window.customElements = {};
    }
    window.customElements.forcePolyfill = true;
    // var viewMode = getCookie("view-mode");
    // if (viewMode == "desktop") {
    //     viewport.setAttribute('content', 'width=1024');
    // } else if (viewMode == "mobile") {
    //     viewport.setAttribute('content', 'width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no');
    // }
})();