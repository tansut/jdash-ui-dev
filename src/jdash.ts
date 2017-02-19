import { Dashboard } from './dashboard';
import { ThemeManager } from './theme';
import { DashletModule } from './dashboard/dashlet';
import { LocalStorageProvider } from './provider/localstorage';
import { ApiProvider } from './provider/api';
import { DashletPanel } from './dashboard/dashletpanel';
import { DashletEditorPanel } from './dashboard/dashleteditorpanel';
import { Component, ComponentOptions, ComponentElement } from './core';
import { HtmlElement, KeyValue, Configuration } from './core';
import { GridLayout } from './layout/grid';
import { GenericLayout } from './layout/generic';
import { DashboardLayout } from './layout';
import Helper from './helper';
import register from './register';


declare global {
    interface Window {
        jdash: JDashStatic
    }
}

class JDashStatic {
    HtmlElement = HtmlElement;
    Helper = Helper;
    Component = Component;
    DashletModule = DashletModule;
    DashletPanel = DashletPanel;
    DashletEditorPanel = DashletEditorPanel;
    ApiProvider = ApiProvider;
    LocalStorageProvider = LocalStorageProvider;
    GenericLayout = GenericLayout;
    GridLayout = GridLayout;
    DashboardLayout = DashboardLayout;
    Configuration = Configuration;
    ThemeManager = ThemeManager;
    Dashboard = Dashboard;
    Http = axios;


    dashlet(id: string | Function | Object, handler: Function | Object) {
        var args = Array.prototype.slice.call(arguments);
        this.define.apply(this, args);
    }

    define(id: string | Function | Object, handler: Function | Object) {
        var args = Array.prototype.slice.apply(arguments);
        return Component.define.apply(Component, args);
    }

    ready(fn) {
        window.customElements.flush && window.customElements.flush();

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

export let JDash: JDashStatic;

(function (window: Window) {
    JDash = window.jdash = new JDashStatic();
    register.elements();
    JDash.ready(() => ThemeManager.init())
})(window)





