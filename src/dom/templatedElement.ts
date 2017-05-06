import { HtmlElement } from './htmlelement';


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