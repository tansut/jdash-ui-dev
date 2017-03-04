import { JDash } from '../jdash';

import { DashboardModel, DashletModel, DashletPositionModel, IClientProvider } from 'jdash-core';

import { LocalStorageProvider } from '../provider/localstorage';

import { Dashlet, DashletEditor, DashletModule, IDashletElement, IDashletElementStatus } from './dashlet';
import { IDashletPanel } from './dashletpanel';
import { Component, ComponentElement, TemplatedElement, HtmlElement, KeyValue } from '../core';
import { DashboardLayout, LayoutViewMode } from '../layout';
import { GenericLayout } from '../layout/generic';
import Helper from '../helper';



export const DashboardState = {
    none: 'none',
    loading: 'loading',
    loaded: 'loaded'
}



export class Dashboard extends TemplatedElement {
    protected _provider: IClientProvider;
    protected _layout: DashboardLayout;
    private _model: DashboardModel;
    public _state: string = DashboardState.none;
    static defaultLayoutModule = 'j-grid-layout';

    static get observedAttributes() {
        return ['j-provider', 'j-provider-id', 'j-layout', 'j-view-mode', 'title'];
    }

    getType() {
        return 'j-dashboard';
    }

    get state() {
        return this._state;
    }

    get provider() {
        if (!this._provider) {
            var located = this.locateProvider();
            located && (this._provider = located)
        }
        return this._provider;
    }

    // set provider(val: IClientProvider) {
    //     this._provider = val;
    // }


    set state(newVal: string) {
        var oldVal = this._state;
        this._state = newVal;
        this.fireEvent('state-change', {
            newVal: newVal,
            oldVal: oldVal
        })
    }

    get model() {
        return this._model;
    }

    set model(val: DashboardModel) {
        if (!val) {
            this.title = '';
            this.removeAttribute('j-provider-id');
        } else {
            if (val.id) {
                this.id = this.id || val.id;
                this.setAttribute('j-provider-id', val.id)
            } else this.removeAttribute('j-provider-id');
            //this.config = val.configuration;
            this.title = val.title;
        }
        this._model = val;
        Helper.setBindings(this);
    }

    initializeLayout() {
        this._layout.dashboard = this;
        var viewMode = this.getAttribute('j-view-mode')
        viewMode && (this.layout.viewMode = viewMode);
        var style = this.getAttribute('j-layout-style');
        style && (this.layout.layoutStyle = style);
        this.fireEvent('layout-ready')
    }

    get layout() {
        return this._layout;
    }

    set layout(newVal: DashboardLayout) {
        if (this._layout != newVal) {
            this._layout = newVal;
            this.initializeLayout();
        }
    }


    unload() {
        this.layout.reset();
        this.model = undefined;
        Helper.setBindings(this);
        this.state = DashboardState.none;
    }


    load(id: string | DashboardModel): Promise<any> {
        if (this.state == DashboardState.loaded)
            this.unload();
        if (this.state == DashboardState.loading)
            return Promise.reject(new Error('Loading not completed'));
        this.state = DashboardState.loading;
        var promise = this.provider.getDashboard(typeof id == 'string' ? id : id.id);
        return promise.then((dashboardData) => {
            this.model = dashboardData.dashboard;
            return Promise.resolve(this.layout.load(this.model.layout, dashboardData.dashlets)).then(() => {
                this.state = DashboardState.loaded;
                return dashboardData.dashboard;
            });
        }).catch((err) => {
            this.state = DashboardState.none;
            return Promise.reject(err);
        });
    }

    moveDashlet(dashletElement: IDashletElement, to: DashletPositionModel) {
        return Promise.resolve(this.layout.moveDashlet(dashletElement, to)).then((updatedDashlets) => {
            var providerValues: KeyValue<DashletPositionModel> = {};
            updatedDashlets.forEach((dashlet) => {
                providerValues[dashlet.getAttribute('j-provider-id')] = this.getDashletPosition(dashlet);
            })
        });
    }

    locateTemplate() {
        return super.locateTemplate();
    }

    getDashletAt(position: DashletPositionModel) {
        return this.layout.getDashletAt(position);
    }

    getDashletPosition(dashletElement: IDashletElement) {
        return this.layout.getElementPosition(dashletElement);
    }

    connectedCallback() {
        super.connectedCallback();
    }

    locateProvider(): IClientProvider {
        //var providerAtAttribute = this.getAttribute('j-provider');
        //var located = ProviderElement.locate(providerAtAttribute);
        //return located;
        return JDash['Provider']
    }


    hideDashlets(hide: boolean) {
        this.layout.hideDashlets(hide);
    }

    collapseDashlets(hide: boolean) {
        this.layout.collapseDashlets(hide);
    }

    toggleDashlets(hide: boolean) {
        this.layout.toggleDashlets();
    }

    toggleCollapseDashlets(hide: boolean) {
        this.layout.toggleCollapseDashlets();
    }


    createDefaultLayout() {
        var layout = <GenericLayout>document.createElement(Dashboard.defaultLayoutModule);
        return layout;
    }

    initializeElement() {
        var layoutFoundInside = false;
        if (!this._layout) {
            var baseLayout = DashboardLayout;
            var locatedLayout = Helper.locateElementType(this, baseLayout);
            if (locatedLayout.length > 0) {
                this.layout = <DashboardLayout>locatedLayout[0];
                layoutFoundInside = true;
            }
        }
        this.layout = this.layout || this.createDefaultLayout();
        layoutFoundInside || this.appendChild(this.layout);
        Helper.setBindings(this);
    }


    attributeChangedCallback(name: string, oldVal: string, newVal: string) {
        if (name == 'title' && this.isInitialized) {
            Helper.setBindings(this, this);
        }
        if (name.toLowerCase() == 'j-view-mode' && this.layout)
            this.layout.viewMode = newVal;
        if (name.toLowerCase() == 'j-style' && this.layout)
            this.layout.layoutStyle = newVal;
        if (name.toLowerCase() == 'j-layout') {
            if (this.isInitialized) {

            } else {
                this.layout = <DashboardLayout>document.createElement(name);
            }
        }
    }


    addDashlet(dashletEl: string | IDashletElement | DashletModel | DashletModule, position?: DashletPositionModel) {
        var dashlet: IDashletElement, model: DashletModel;
        if (typeof dashletEl == 'string') {
            var module = DashletModule.getByTag(dashletEl);
            model = {
                moduleId: (module && module.elementTag) || dashletEl,
                title: (module && module.title) || '',
                dashboardId: this.getAttribute('j-provider-id') || this.id,
                createdAt: undefined
            }
            dashlet = this.layout.generateDashletElement(model, IDashletElementStatus.created);
        } else if (dashletEl instanceof Dashlet) {
            dashlet = dashletEl;
            model = {
                moduleId: dashletEl.tagName.toLowerCase(),
                title: dashletEl.title,
                dashboardId: this.getAttribute('j-provider-id') || this.id,
                createdAt: undefined
            }
        } else if (dashletEl instanceof DashletModule) {
            var module = dashletEl;
            model = {
                moduleId: (module && module.elementTag),
                title: (module && module.title) || '',
                dashboardId: this.getAttribute('j-provider-id') || this.id,
                createdAt: undefined
            }
            dashlet = this.layout.generateDashletElement(model, IDashletElementStatus.created);
        } else {
            model = <DashletModel>dashletEl;
            dashlet = this.layout.generateDashletElement(model, IDashletElementStatus.created);
        }
        this.layout.placeDashlet(dashlet, position);
    }
}

Component.define('j-dashboard', {
    elementClass: Dashboard
})

