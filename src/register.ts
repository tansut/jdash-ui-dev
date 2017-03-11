import { Dashboard } from './dashboard';
import { GenericLayout } from './layout/generic';
import { GridLayout } from './layout/grid';
import { HtmlElement, KeyValue, Component, ComponentOptions } from './core';
import { DashletModule, DashletEditorModule } from './dashboard/dashlet';
import { DashletPanelModule } from './dashboard/dashletpanel';
import { DashletEditorPanelModule } from './dashboard/dashleteditorpanel';

export default {
    elements: () => {
        window.customElements.define('j-component', Component);
        window.customElements.define('j-dashlet', DashletModule);
        window.customElements.define('j-dashlet-editor', DashletEditorModule);
        // window.customElements.define('j-layout', GenericLayout);
    }
}