import { DashboardState, Dashboard } from './';
import { IClientProvider, DashboardModel, DashletModel } from 'jdash-core';
import { IDashletEditorPanel } from './dashleteditorpanel';
import { DashboardLayout } from '../layout';
import { Component, ComponentElement, ComponentGeneratedElement, HtmlElement, KeyValue, Configuration } from '../core';
import { IDashletPanel, DashletPanel } from './dashletpanel';
import Helper from '../helper';
import { TemplateInstantiatePosition } from '../helper';

export const IDashletElementStatus = {
    created: 'created',
    loaded: 'loaded'
}

export interface IDashletElement extends HTMLElement {
    panel: HTMLElement;
    layout: DashboardLayout;
    editor: IDashletEditorElement;
    viewMode: string;
    config: Configuration;
    status: string;
    model: DashletModel;
    saveConfiguration();
    updateFromModel();
}


export interface IDashletEditorElement extends HTMLElement {
    dashlet: IDashletElement;
    panel: IDashletEditorPanel;
}

export let DashletViewMode = {
    readonly: 'readonly',
    configure: 'configure',
    preview: 'preview'
}

export class DashletContext {

}

export class Dashlet extends ComponentGeneratedElement<DashletModule> implements IDashletElement {
    public layout: DashboardLayout;
    public editor: IDashletEditorElement;
    public status: string = IDashletElementStatus.created;
    public _configObject: Configuration;
    public _viewMode: string = DashletViewMode.readonly;
    private _panel: IDashletPanel;
    private _provider: IClientProvider;
    public _model: DashletModel;

    // set title(val: string) {
    //     super.title = val;
    //     this.model && (this.model.title = val);
    // }

    get canBeConfigured(): boolean {
        var editorTag = this.getAttribute('j-editor') || `${this.tagName.toLowerCase()}-editor`;
        if (editorTag == 'none') return false;
        var isDefined = window.customElements.get(editorTag);
        return isDefined;
    }

    get model() {
        return this._model;
    }



    set model(val: DashletModel) {
        if (val.id) {
            this.id = this.id || val.id;
            this.setAttribute('j-provider-id', val.id)
        } else this.removeAttribute('j-provider-id');
        this.config = val.configuration;
        this.title = val.title;
        this._model = val;
    }

    updateFromModel() {
        if (this.model) {
            this.id = this.id || this.model.id;
            this.setAttribute('j-provider-id', this.model.id);
            this.title = this.model.title;
            this.config = this.model.configuration;
        }
    }

    updateModel() {
        if (this.model) {
            var id = this.getAttribute('j-provider-id') || this.id;
            id && (this.model.id = id);
            this.model.configuration = this.config;
            this.model.title = this.title;
        }
    }

    public get panel(): IDashletPanel {
        return this._panel || <IDashletPanel>Helper.getContainingType(this, 'j-dashlet-panel');
    }

    public set panel(v: IDashletPanel) {
        this._panel = v;
    }

    get Provider() {
        if (this._provider)
            return this._provider;
        if (this.layout && this.layout.dashboard && this.layout.dashboard.provider)
            this._provider = this.layout.dashboard.provider;
        return this._provider;
    }


    get viewMode() {
        return this._viewMode;
    }

    getType() {
        return 'j-dashlet';
    }

    constructor() {
        super();
        this._configObject = new Configuration((key: string, newVal: any, oldVal: any) => {
            var result = this.executeAction('configitemupdated', {
                key: key,
                newVal: newVal,
                oldVal: oldVal
            });
        });
    }

    setViewMode(newVal: string) {
        this.panel && this.panel.setAttribute('j-view-mode', newVal);
        switch (newVal) {
            case DashletViewMode.readonly: {
                // this.panel && this.panel.classList.remove('view-mode-preview', 'view-mode-configure');
                // this.panel && this.panel.classList.add('view-mode-readonly');
                this.setDashletViewModeConfigure(false);
                this.setDashletViewModePreview(false);
                this.setDashletViewModeReadonly(true);
                break;
            }

            case DashletViewMode.configure: {
                // this.panel && this.panel.classList.remove('view-mode-readonly', 'view-mode-preview');
                // this.panel && this.panel.classList.add('view-mode-configure');
                this.setDashletViewModePreview(false);
                this.setDashletViewModeReadonly(false);
                this.setDashletViewModeConfigure(true);
                break;
            }

            case DashletViewMode.preview: {
                // this.panel && this.panel.classList.remove('view-mode-readonly', 'view-mode-configure');
                // this.panel && this.panel.classList.add('view-mode-preview');
                this.setDashletViewModeConfigure(false);
                this.setDashletViewModeReadonly(false);
                this.setDashletViewModePreview(true);
                break;
            }
        }
        this.arrangeTitleNodes();
    }

    set viewMode(newVal: string) {
        if (this.viewMode != newVal) {
            this._viewMode = newVal;
            this.setAttribute('j-view-mode', newVal);
        }
    }

    setDashletViewModeReadonly(enable: boolean) {

    }

    setDashletViewModePreview(enable: boolean) {

    }

    setDashletViewModeConfigure(enable: boolean) {
        var container = this.panel || this;
        var target = container.querySelector('[j-type="j-dashlet-configuration-tools"]:not(template)');
        var configureTemplate = Helper.locateTemplate(this, 'j-dashlet-configuration-tools', true);
        if (enable) {
            configureTemplate && Helper.instantiateTemplate(configureTemplate, target, {
                position: TemplateInstantiatePosition.insert,
                preProcess: (clone: HTMLElement, el: HTMLElement) => {
                    Helper.bindActions(clone, {
                        'zone': el
                    }, this);
                    Helper.setBindings(clone);
                    target && Helper.hideElements(target, false);
                }
            });
        } else {
            configureTemplate && Helper.removeTemplateInstances(container, configureTemplate);
            target && Helper.hideElements(target, true);
        }
        var configureActions = container.querySelectorAll('[j-action="configuredashlet"]');
        Helper.hideElements(configureActions, !this.canBeConfigured);
    }


    get config() {
        return this._configObject;
    }


    configurationChangeHandler(event: CustomEvent) {

    }

    configurationSaveHandler(event: CustomEvent) {

    }

    saveConfiguration() {
        var detail = <any>{};
        var res = this.executeAction('saveconfig', detail);
        if (res == false)
            Promise.reject('cancel');
        return Promise.resolve(detail.$waitFor).then(() => {
            if (!this.Provider)
                return Promise.reject('no provider');
            return this.Provider.saveDashlet(this.getAttribute('j-provider-id') || this.id, { configuration: this.config });
        });
    }

    set config(newVal: any) {
        var oldVal = this._configObject;
        if (newVal instanceof Configuration) {
            if (newVal === oldVal)
                return;
            this._configObject = newVal;
        } else {
            this._configObject.init(newVal);
        }
    }

    static get observedAttributes() {
        return ['disabled', 'title', 'j-view-mode', 'j-zone', 'j-x', 'j-y', 'j-z'];
    }

    createPanelForDashletEditor(editorElement: IDashletEditorElement): HTMLElement {
        var panelTag = editorElement.getAttribute('j-panel') || 'j-dashlet-editor-panel';
        if (panelTag && panelTag != 'none') {
            var panel = <IDashletEditorPanel>document.createElement(panelTag);
            panel.setAttribute('j-type', 'j-dashlet-editor-panel');
            panel.editor = editorElement;
            return panel;
        } else {
            var el = document.createElement('div');
            el.setAttribute('j-type', 'j-dashlet-editor-panel');
            el['editor'] = editorElement;
            el.appendChild(editorElement);
            return el;
        }
    }

    openConfiguration() {
        var editorTag = this.getAttribute('j-editor') || `${this.tagName.toLowerCase()}-editor`;
        var editor = <IDashletEditorElement>document.createElement(editorTag);
        var editorPanel = <IDashletEditorPanel>this.createPanelForDashletEditor(editor);
        editor.panel = editorPanel;
        editor.dashlet = this;
        editorPanel.classList.add(editorTag);
        this.editor = editor;
        this.appendChild(editorPanel);
    }

    configureDashletActionHandler(event: CustomEvent) {
        return this.openConfiguration();
    }

    cloneDashletActionHandler(event: CustomEvent) {
        return this.layout && this.layout.cloneDashlet(this);
    }

    removeDashletActionHandler(event: CustomEvent) {
        return this.layout && this.layout.removeDashlet(this);
    }

    arrangeTitleNodes() {
        var container = (this.panel || this);

        var headerTemplate = Helper.locateTemplate(this, 'j-dashlet-header', true);
        if (!headerTemplate) {
            var items = container.querySelectorAll('[j-type="j-dashlet-title"]');
            for (var i = 0; i < items.length; i++) {
                var item = <HTMLElement>items[i];
                if (!this.title) {
                    item.style.display = 'none';
                    item.textContent = '';
                }
                else {
                    item.textContent = this.title;
                    item.style.display = '';
                }
            }
        } else {
            Helper.removeTemplateInstances(container, headerTemplate);
            if (this.viewMode != 'readonly') {
                Helper.instantiateTemplate(headerTemplate);
            } else if (this.title && this.title.trim() != '')
                Helper.instantiateTemplate(headerTemplate);
        }


        if (!this.title)
            container.classList.add('j-no-title')
        else container.classList.remove('j-no-title');
        Helper.setBindings(container, this, '[j-bind][j-type="j-dashlet-title"]');
    }

    editDashletTitleActionHandler(event: CustomEvent) {
        var newTitle = prompt('Title', this.title);
        if (newTitle !== null) {
            var dashletId = this.getAttribute('j-provider-id') || this.id;
            if (this.Provider) {
                event.detail.$waitFor = this.Provider.saveDashlet(dashletId, {
                    title: newTitle
                }).then(() => {
                    this.title = newTitle;
                    this.arrangeTitleNodes();
                });
            }
            else this.title = newTitle;

        }
    }

    listenforActions() {
        Helper.addActionListener('configuredashlet', this.configureDashletActionHandler.bind(this), this);
        Helper.addActionListener('clonedashlet', this.cloneDashletActionHandler.bind(this), this);
        Helper.addActionListener('removedashlet', this.removeDashletActionHandler.bind(this), this);
        
        Helper.addActionListener('setdashlettitle', this.editDashletTitleActionHandler.bind(this), this);


        Helper.addActionListener('configurationchange', this.configurationChangeHandler.bind(this), this);
        Helper.addActionListener('configurationsave', this.configurationSaveHandler.bind(this), this);
    }



    initializeElement() {
        super.initializeElement();
        this.setViewMode(this.viewMode);
        this.listenforActions();
        this.arrangeTitleNodes();
        this.panel && this.panel.classList.add(this.tagName.toLowerCase() + '-panel');
        Helper.setBindings(this.panel || this, this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.model && (this.title = this.model.title);
    }

    attributeChangedCallback(name: string, oldVal: string, newVal: string) {
        if (name == 'title' && this.isInitialized) {
            this.arrangeTitleNodes();
        }
        if (name == 'j-view-mode') {
            this._viewMode = newVal;
            this.isInitialized && this.setViewMode(newVal);
        }
        super.attributeChangedCallback(name, oldVal, newVal);
    }
}



export class DashletEditor extends ComponentGeneratedElement<DashletEditorModule> implements IDashletEditorElement {
    public dashlet: IDashletElement;
    public panel: IDashletEditorPanel;
}


export class DashletEditorModule extends Component {
    getBaseElementClass() {
        return DashletEditor;
    }
}

export class DashletModule extends Component {

    getBaseElementClass() {
        return Dashlet;
    }

    static getModules() {
        var modules = this.definedElements;
        var list = [];
        Object.keys(modules).forEach((k) => {
            var elementInfo = modules[k];
            if (elementInfo instanceof DashletModule)
                list.push(elementInfo); 
        });
        return list;
    }

    static getByTag(tag): DashletModule {
        return <DashletModule>Component.definedElements[tag];
    }


    createEditorForDashlet(dashlet: HTMLElement) {

    }


    static createModule(id: string | HTMLElement, defaults?: KeyValue<any>) {
        var component = <DashletModule>document.createElement('j-dashlet');
        component.id = typeof id == 'string' ? id : id.tagName.toLowerCase();
        return component;
    }

}