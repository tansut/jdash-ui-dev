import { Component } from './component';
import { TemplatedElement } from './templatedElement';

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

