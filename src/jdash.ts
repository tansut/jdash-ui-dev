import { BsGridLayout } from './layout/ext/bsgridlayout';
import { BsDashletPanel } from './dashboard/ext/bsdashletpanel';
import { BsDashletEditorPanel } from './dashboard/ext/bsdashleteditorpanel';
import { IClientProvider } from 'jdash-core/lib/definitions';
import { Dashboard } from './dashboard';
import * as axios from 'axios';
import { ThemeManager } from './theme';
import { DashletModule } from './dashboard/dashlet';
import { LocalStorageProvider } from './provider/localstorage';
import { CloudProvider } from './provider/cloud';
import { PremiseProvider } from './provider/premise';
import { DashletPanel } from './dashboard/dashletpanel';
import { DashletEditorPanel } from './dashboard/dashleteditorpanel';
import { Component, ComponentOptions, ComponentElement } from './core';
import { HtmlElement, KeyValue, Configuration } from './core';
import { GridLayout } from './layout/grid';
import { GenericLayout } from './layout/generic';
import { DashboardLayout } from './layout';
import Helper from './helper';
import register from './register';

export var JDash = {
    HtmlElement: HtmlElement,
    Helper: Helper, 
    Component: Component,
    DashletModule: DashletModule,
    DashletPanel: DashletPanel,
    DashletEditorPanel: DashletEditorPanel,
    GenericLayout: GenericLayout,
    GridLayout: GridLayout,
    DashboardLayout: DashboardLayout,
    Configuration: Configuration,
    ThemeManager: ThemeManager,
    Dashboard: Dashboard,
    Http: axios,

    bs: {
        DashletEditorPanel: BsDashletEditorPanel,
        DashletPanel: BsDashletPanel,
        GridLayout: BsGridLayout
    },

    ProviderTypes: {
        Cloud: CloudProvider,
        OnPremise: PremiseProvider
    },

    //Provider: new LocalStorageProvider(),
    Provider: new CloudProvider(),

    dashlet: function (id: string | Function | Object, handler: Function | Object) {
        var args = Array.prototype.slice.call(arguments);
        JDash.define.apply(this, args);
    },

    define: function (id: string | Function | Object, handler: Function | Object) {
        var args = Array.prototype.slice.apply(arguments);
        return Component.define.apply(Component, args);
    },

    ready: function (fn) {
        window.customElements["flush"] && window.customElements["flush"]();

        if (document.readyState != 'loading')
            fn();
        else document.addEventListener('DOMContentLoaded', () => {
            if (window['HTMLImports'])
                window['HTMLImports']['whenReady'](() => setTimeout(function () {
                    fn()
                }));
            else fn();
        });
    }
}


declare global {
    interface Window { 
        jdash: any
    }
}

(function (window: Window) {
    window['jdash'] = JDash;
    // var jdash = window['jdash'] = (window['jdash'] || {});
    // for(var prop in JDash)
    //   jdash[prop] = JDash[prop] || jdash[prop];
    register.elements();
    JDash.ready(() => ThemeManager.init())
})(window)





