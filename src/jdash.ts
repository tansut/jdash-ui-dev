import * as axios from 'axios';
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

export default class JDash {
    static HtmlElement = HtmlElement;
    static Helper = Helper;
    static Component = Component;
    static DashletModule = DashletModule;
    static DashletPanel = DashletPanel;
    static DashletEditorPanel = DashletEditorPanel;
    static ApiProvider = ApiProvider;
    static LocalStorageProvider = LocalStorageProvider;
    static GenericLayout = GenericLayout;
    static GridLayout = GridLayout;
    static DashboardLayout = DashboardLayout;
    static Configuration = Configuration;
    static ThemeManager = ThemeManager;
    static Dashboard = Dashboard;
    static Http = axios;


    static dashlet(id: string | Function | Object, handler: Function | Object) {
        var args = Array.prototype.slice.call(arguments);
        JDash.define.apply(this, args);
    }

    static define(id: string | Function | Object, handler: Function | Object) {
        var args = Array.prototype.slice.apply(arguments);
        return Component.define.apply(Component, args);
    }

    static ready(fn) {
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


declare global {
    interface Window {
        jdash: JDash
    }
}

(function (window: Window) {
    window['jdash'] = JDash;
    register.elements();
    JDash.ready(() => ThemeManager.init())
})(window)





