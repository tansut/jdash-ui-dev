import { Component, ComponentElement, ComponentGeneratedElement, HtmlElement, KeyValue, Configuration } from '../core';
import { Dashlet, IDashletEditorElement, IDashletElement } from './dashlet';
import Helper from '../helper';

export interface IDashletEditorPanel extends ComponentElement {
    editor: IDashletEditorElement;
}


export class DashletEditorPanel extends ComponentGeneratedElement<DashletEditorPanelModule>
    implements IDashletEditorPanel {
    public editor: IDashletEditorElement;
    private titleNode: Node;

    closeEditor(canceled: boolean) {
        this.remove();
        this.editor.dashlet.editor = undefined;
    }

    getType() {
        return 'j-dashlet-editor-panel';
    }

    closeEditorActionHandler(event: CustomEvent) {
        this.closeEditor(true);
    }

    saveConfigActionHandler(event: CustomEvent) {
        var detail = event.detail || {};
        detail.$waitFor = this.editor.dashlet.saveConfiguration();
        Promise.resolve(detail.$waitFor).then((res) => {
            if (res == false) return;
            this.closeEditor(false);
        })
    }

    showEditor() {
        (<HTMLElement>this.firstElementChild).style.display = 'block';
    }

    initializeElement() {
        Helper.addActionListener('closeeditor', this.closeEditorActionHandler.bind(this), this.editor);
        Helper.addActionListener('setconfig', this.saveConfigActionHandler.bind(this), this.editor);
        this.showEditor();
    }

    createChildren(parent: HTMLElement) {
        super.createChildren(parent);
        if (this.editor) {
            this.editor.setAttribute('slot', 'body');
            this.addToSlot(this.editor, true);
            Helper.setBindings(this, this.editor.dashlet);
        }
        Helper.bindActions(this, { dashlet: this.editor.dashlet }, this.editor);
    }

    connectedCallback() {
        super.connectedCallback();
    }
}

// export class DashletEditorPanel extends BaseDashletEditorPanel {

// }


export class DashletEditorPanelModule extends Component {
    getBaseElementClass() {
        return DashletEditorPanel;
    }
}

// Component.define('j-dashlet-editor-panel', {
//     elementClass: DashletEditorPanel
// })