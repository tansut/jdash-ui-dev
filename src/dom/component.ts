import { KeyValue } from '../lib/keyvalue';
import { ComponentGeneratedElement } from './componentGeneratedElement';
import { HtmlElement } from './htmlelement';
import Helper from "../helper";

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

    constructor() {
        super();
        this.options = {};
        if (this.elementTag)
            Component.definedElements[this.elementTag] = this;

        Helper.fireEvent(window, 'jdash:component.created', {
            component: this
        });
    }


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


/* TS Support */

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

/* TS Support */