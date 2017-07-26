var privates = {
    isSafari: undefined,
    isMozilla: undefined,
    isIE: undefined,
    isEDGE: undefined,
    isChrome: undefined
}

function notImplementedError() {
    throw new Error("Operation Not Implemented.");
}

export let BrowserDetector = {
    isSafari: () => {
        if (privates.isSafari !== undefined)
            return privates.isSafari;
        privates.isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
        return privates.isSafari;
    },
    isMozilla: () => {
        notImplementedError();
    },
    isIE: () => {
        notImplementedError();
    },
    isEDGE: () => {
        notImplementedError();
    },
    isChrome: () => {
        notImplementedError();
    }
}