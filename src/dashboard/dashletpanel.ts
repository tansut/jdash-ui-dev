import { Component, ComponentElement, ComponentGeneratedElement, HtmlElement, KeyValue, Configuration } from '../core';
import { IDashletElement, Dashlet } from './dashlet';
import Helper from '../helper';

export interface IDashletPanel extends ComponentElement {
    dashlet: IDashletElement;
}


export class DashletPanel extends ComponentGeneratedElement<DashletPanelModule> implements IDashletPanel {
    private _dashlet: IDashletElement;


    public get dashlet(): IDashletElement {
        return this._dashlet || <IDashletElement>this.querySelector('[j-type="j-dashlet-"]');
    }

    public set dashlet(v: IDashletElement) {
        this._dashlet = v;
    }

    createChildren(parent: HTMLElement) {
        super.createChildren(parent);
        if (this.dashlet) {
            this.dashlet.setAttribute('slot', 'body');
            this.addToSlot(this.dashlet, true);
        }
    }

    getType() {
        return 'j-dashlet-panel';
    }

}

export class DashletPanelModule extends Component {
    getBaseElementClass() {
        return DashletPanel;
    }
}

// Component.define('j-dashlet-panel', {
//     elementClass: DashletPanel
// })