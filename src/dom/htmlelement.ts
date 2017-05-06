import Helper from "../helper";

export abstract class HtmlElement extends HTMLElement {
    private created: Function;
    private connected: Function;
    private disconnected: Function;
    private initialized: Function;
    private attributeChanged: Function;

    protected isInitialized: boolean = false;

    fireEvent(name: string, detail: any = null, cancellable: boolean = false, canBubble: boolean = false) {
        return Helper.fireEvent(this, name, detail, cancellable, canBubble);
    }

    executeAction(name: string, detail: any = null, originalEvent?: CustomEvent) {
        return Helper.executeAction(name, detail, originalEvent, this);
    }

    constructor() {
        super();
        var args = Array.prototype.slice.call(arguments);
        this.created && this.created.apply(this, args);
    }

    callUserCallback(cb: string, args?: Array<any>, async: boolean = true) {
        var self = this, fn = <Function>this[cb];
        if (!async)
            fn && fn.apply(self, args);
        else
            setTimeout(function () {
                fn && fn.apply(self, args);
            });
    }

    getType() {
        return undefined;
    }

    initializeElement() {

    }

    attributeChangedCallback(name: string, oldVal: string, newVal: string) {
        var args = Array.prototype.slice.call(arguments);
        this.fireEvent('attributeChanged', {
            name: name,
            oldVal: oldVal,
            newVal: newVal
        });
        this.callUserCallback('attributeChanged', args);
    }

    connectedCallback() {
        if (!this.isInitialized) {
            var jtype = this.getType();
            jtype && this.setAttribute('j-type', jtype);
            this.initializeElement();
            this.fireEvent('initialized');
            this.callUserCallback('initialized');
            this.isInitialized = true;
        }

        this.fireEvent('connected');
        this.callUserCallback('connected');
    }

    disconnectedCallback() {
        this.fireEvent('disconnected');
        this.callUserCallback('disconnected');
    }
}