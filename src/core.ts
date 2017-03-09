import Helper from './helper';

export type KeyValue<T> = { [key: string]: T }

interface ElementDefinitionOptions {
    extends: string;
}

interface CustomElementRegistry {
    define(name: string, constructor: Function, options?: ElementDefinitionOptions): void;
    get(name: string): any;
    whenDefined(name: string): PromiseLike<void>;
}

declare global {
    interface Window {
        customElements: CustomElementRegistry;
    }
}

export class Configuration {
    //public _data: KeyValue<any> = {};

    set(key: string, value: any) {
        var oldVal = this[key];
        if (this.changeCallback && oldVal !== value) {
            var res = this.changeCallback.apply(this, [key, value, oldVal]);
            if (res === false) return false;
            this[key] = value;
            return true;
        }
    }

    get(key: string) {
        return this[key];
    }

    init(initialValues: KeyValue<any>, ) {
        for (var prop in this) {
            if (!this.hasOwnProperty(prop) && typeof this[prop] != 'function')
                delete this[prop];
        }

        Object.keys(initialValues || {}).forEach((key) => {
            this[key] = initialValues[key];
        })
        return this;
    }

    constructor(public changeCallback: Function) {

    }
}


export class HtmlElement extends HTMLElement {
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

    callUserCallback(cb: string, args?: Array<any>) {
        var self = this, fn = <Function>this[cb];
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

export class TemplatedElement extends HtmlElement {
    template: HTMLTemplateElement;
    elementContent: HtmlElement;
    useShadow: boolean = false;

    constructor() {
        super();
        this.elementContent = this;
    }

    createShadowRoot() {
        var fn = <Function>this['attachShadow'];
        var shadowRoot = fn.apply(this, [{ mode: 'open' }]);
        return shadowRoot;
    }

    attributeChangedCallback(name: string, oldVal: string, newVal: string) {
        if (name == 'template' && newVal) {
            var template = document.querySelector(newVal);
        }
        super.attributeChangedCallback(name, oldVal, newVal);
    }

    addToSlot(newContent: Node | HTMLElement, appendAlways: boolean = false) {
        if (this.useShadow) {
            return this.elementContent.appendChild(newContent);
        }
        else {
            var targetSlot = (<HTMLElement>newContent).getAttribute('slot');
            var slot = this.elementContent.querySelector(`slot[name=${targetSlot}]`);
            if (slot) {
                var parent = slot.parentElement;
                if (parent)
                    parent.replaceChild(newContent, slot);
                else slot.appendChild(newContent);
                return newContent;
            } else return appendAlways ? this.elementContent.appendChild(newContent) : undefined;
        }
    }

    getDefaultTemplate() {
        var defaultTemplate = this.getAttribute('default-template');
        return defaultTemplate ? <HTMLTemplateElement>document.querySelector(`template#${this.getAttribute('default-template')}`) : undefined;
    }

    locateTemplate(): HTMLTemplateElement {
        var located: HTMLTemplateElement;
        if (this.getAttribute('template')) {
            located = <HTMLTemplateElement>document.querySelector(`template#${this.getAttribute('template')}`);
        }
        if (this.getAttribute('remote-template')) {

        }
        if (!located)
            located = <HTMLTemplateElement>this.querySelector('template');
        if (!located)
            located = <HTMLTemplateElement>document.querySelector(`template#${this.tagName.toLowerCase()}`)
        if (!located)
            located = this.getDefaultTemplate();

        return located;
    }

    createChildren(parent: HTMLElement) {
        this.template = this.template || this.locateTemplate();
        if (this.template) {
            var clone = document.importNode(this.template.content, true);
            parent.appendChild(clone);
        }
    }

    connectedCallback() {
        if (!this.isInitialized) {
            this.useShadow = this.getAttribute('j-attach-shadow') == 'true'
            this.elementContent = this.useShadow ? this.createShadowRoot() : this;
            this.createChildren(this.elementContent);
        }
        super.connectedCallback();
    }
}

export class ComponentGeneratedElement<T extends Component> extends TemplatedElement {
    protected component: T;

    locateTemplate() {
        var located = this.template || super.locateTemplate();
        !located && this.component && (located = this.component.template);
        return located;
    }

    initializeElement() {
        // this.component = this.component || <T>Component.getByTag(this.tagName.toLowerCase());
        // this.component && this.component.initElement(this);
    }

    connectedCallback() {
        if (!this.isInitialized) {
            this.component = this.component || <T>Component.getByTag(this.tagName.toLowerCase());
            this.component && this.component.initElement(this);
        }
        super.connectedCallback();
    }
}

export class ComponentElement extends ComponentGeneratedElement<Component> {

}

export interface ComponentOptions {
    createdCallback?: Function;
    elementClass?: typeof HTMLElement;
    is?: string;
}

export class Component extends HtmlElement {
    template: HTMLTemplateElement;
    options: ComponentOptions;
    elementRegistered = false;
    elementClass: typeof HTMLElement;
    defineScriptExecuted = false;

    static definedElements: KeyValue<Component> = {};
    static reservedAttributes = ['id', 'name', 'is'];

    initElement(el: HTMLElement, defaults?: KeyValue<string>): HTMLElement {
        defaults = defaults || {};
        for (var i = 0; i < this.attributes.length; i++) {
            var attribute = this.attributes[i];
            if (Component.reservedAttributes.indexOf(attribute.name) >= 0)
                continue;
            var attributeVal = defaults[attribute.name] || attribute.value;
            el.getAttribute(attribute.name) || el.setAttribute(attribute.name, attributeVal);
        }
        Object.keys(defaults).forEach((key) => {
            if (!el.getAttribute(key)) {
                var dskey = key;
                el.setAttribute(dskey, defaults[key]);
            } else el.setAttribute(key, defaults[key])
        })
        return el;
    }

    constructor() {
        super();
        this.options = {};
        if (this.elementTag)
            Component.definedElements[this.elementTag] = this;
        Helper.fireEvent(window, 'jdash:component.created', {
            component: this
        });
    }

    static getByTag(tag) {
        return Component.definedElements[tag];
    }

    static locate(options: string | ComponentOptions | Function) {
        var component: Component = null;
        if (typeof options == 'object' && options.is) {
            var tag = options.is;
            component = Component.getByTag(tag);
        } else if (typeof options == 'string') {
            component = Component.getByTag(tag);
        } else {
            var script = document['_currentScript'] || document.currentScript;
            component = script ? <Component>script.parentElement : undefined;
        }
        return component;
    }



    setElementClassProperties() {
        this.elementClass.prototype['component'] = this;
        this.options.createdCallback && (this.elementClass.prototype['created'] = this.options.createdCallback);
    }

    getBaseElementClass() {
        return ComponentElement;
    }

    generateElementClass(): typeof HTMLElement {
        var requestedClass = (this.options && this.options.elementClass) || this.getBaseElementClass();
        var generatedClass = Helper.inherit(requestedClass);
        return <any>generatedClass;
    }

    registerElement() {
        var tag = this.elementTag;
        if (!tag)
            throw new Error('Element tag should be set using id, name, is attribute or calling jdash.define with options.is');
        this.elementClass = this.generateElementClass();
        this.setElementClassProperties();
        Component.definedElements[tag] = this;
        var existing = window.customElements.get(tag);
        if (!existing)
            window.customElements.define(tag, this.elementClass);
        //else console.log(`${tag} seems already registered, skipping`);
        this.elementRegistered = true;
    }

    connectedCallback() {
        this.template = this.querySelector('template');

        Helper.fireEvent(window, 'jdash:component.connected', {
            component: this
        });
        if (this.getAttribute('delay-register') != 'true' && !this.elementRegistered)
            this.registerElement();
        super.connectedCallback();
    }

    runDefineScript(options: ComponentOptions) {
        if (this.defineScriptExecuted)
            return;
        this.options = options;
        if (this.elementRegistered) {
            this.setElementClassProperties();
            if (this.options.elementClass)
                throw new Error('Element already registered. Please add delay-register attribute to set a different element class');
        } else {
            this.registerElement();
        }
        this.defineScriptExecuted = true;
    }

    static elementTag(node: HTMLElement) {
        return node.id || node.getAttribute('name') || node.getAttribute('is');
    }

    get elementTag() {
        return (this.options && this.options.is) || Component.elementTag(this);
        //return Component.elementTag(this);
    }

    static define(id: string | Function | Object, handler: Function | Object) {
        var args = arguments;
        var component = Component.locate(id);

        var options: ComponentOptions = {};
        if (args.length == 1) {
            if (typeof id == 'string') options.is = id;
            else if (typeof id == 'function') options.createdCallback = id;
            else if (typeof id == 'object') options = id;
        } else if (args.length == 2) {
            options.is = <string>id;
            if (typeof handler == 'function')
                options.createdCallback = handler;
            else if (typeof handler == 'object') {
                options.elementClass = handler['elementClass'];
                options.createdCallback = handler['createdCallback'];
            }
        }

        var elementTag = options.is || (component && Component.elementTag(component));

        if (!elementTag)
            throw new Error('Need an element tag either by id or functions arguments');

        window.customElements.whenDefined('j-component').then(function (e) {
            component = component || Component.getByTag(elementTag);
            component && component.runDefineScript && component.runDefineScript(options);
        });

        window.addEventListener('jdash:component.created', function (e: CustomEvent) {
            component = component || Component.getByTag(elementTag);
            component && (component == e.detail.component || options.is == component.elementTag) && component.runDefineScript && component.runDefineScript(options);
        });

        window.addEventListener('jdash:component.connected', function (e: CustomEvent) {
            component = component || Component.getByTag(elementTag);
            if (component == e.detail.component || e.detail.component.elementTag == options.is) {
                component = e.detail.component;
                component.runDefineScript && component.runDefineScript(options)
            }
        });
    }
}