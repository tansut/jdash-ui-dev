(function () {
    var script = document.currentScript;

    var isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);;

    if (isSafari) {
        var safariNative = (script.hasAttribute("data-safari-native") && script.getAttribute("data-safari-native")) || "false";
        if (safariNative.toLowerCase() == "true" || safariNative == "1") {
            window.customElements.forcePolyfill = false;
        } else {
            window.customElements.forcePolyfill = true;
        }
    }

})();