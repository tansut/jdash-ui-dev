///<reference path="./interact.d.ts" />

import { Dashboard, DashboardState } from '../dashboard';
import { IDashletEditorPanel } from '../dashboard/dashleteditorpanel';
import { DashletModel, DashletPositionModel, LayoutDashletMetaModel, LayoutModel } from 'jdash-core';
import {
    Dashlet,
    DashletModule,
    DashletViewMode,
    IDashletEditorElement,
    IDashletElement,
    IDashletElementStatus
} from '../dashboard/dashlet';
import { IDashletPanel } from '../dashboard/dashletpanel';
import { HtmlElement, KeyValue, Component, ComponentElement, TemplatedElement } from './../core';
import Helper from '../helper';
import { TemplateInstantiatePosition } from '../helper';


function dragMoveListener(event) {
    var target = event.target,
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
    var body = document.body.getBoundingClientRect();
    var dy = (Math.round(body.height) - window.screen.height, 0);
    var dx = (Math.round(body.width) - window.screen.width, 0);
    target.style.webkitTransform =
        target.style.transform =
        'translate(' + (x + dx) + 'px, ' + (y + dy) + 'px)';
    target.setAttribute('data-x', x + dx);
    target.setAttribute('data-y', y + dy);
}

function getAbsoluteBoundingRect(el) {
    var doc = document,
        win = window,
        body = doc.body,

        offsetX = win.pageXOffset !== undefined ? win.pageXOffset :
            (doc.documentElement || body.parentNode || body)['scrollLeft'],
        offsetY = win.pageYOffset !== undefined ? win.pageYOffset :
            (doc.documentElement || body.parentNode || body)['scrollTop'],

        rect = el.getBoundingClientRect();

    if (el !== body) {
        var parent = el.parentNode;
        while (parent !== body) {
            offsetX += parent.scrollLeft;
            offsetY += parent.scrollTop;
            parent = parent.parentNode;
        }
    }

    return {
        bottom: rect.bottom + offsetY,
        height: rect.height,
        left: rect.left + offsetX,
        right: rect.right + offsetX,
        top: rect.top + offsetY,
        width: rect.width
    };
}

export interface IDashboardLayout extends HTMLElement {

}




export let LayoutViewMode = {
    readonly: 'readonly',
    layoutedit: 'layoutedit',
    dashletedit: 'dashletedit',
    editable: 'editable'
}


export class DashboardLayout extends ComponentElement implements IDashboardLayout {
    public _viewMode: string = LayoutViewMode.readonly;
    public dashletsHidden: boolean;
    public dashletsCollapsed: boolean;
    public _layoutStyle: string;
    private _dashletsCollapsedByLayout: boolean;
    public dashboard: Dashboard;

    public discardedAttributesOnClone = {
        'j-type': ['j-dashlet-panel', 'j-dashlet', 'j-zone-editor', 'j-section-editor', 'j-dashlet-zone-group-editor']
    }


    getType() {
        return 'j-layout';
    }

    getStyles(): KeyValue<string> {
        return {};
    }

    get layoutStyle() {
        return this._layoutStyle;
    }



    getModel() {

        var content = <HTMLElement>this.querySelector('[j-type="j-layout-content"]:not(template)');
        var clone = Helper.cloneElement(content, true, undefined, { 'j-persist': '' })

        var dashlets = this.getDashlets();
        var dashletData: KeyValue<LayoutDashletMetaModel> = {};
        for (var i = 0; i < dashlets.length; i++) {
            var dashlet = <IDashletElement>dashlets[i];
            var dashletId = dashlet.getAttribute('j-provider-id') || dashlet.id;
            dashletId && (dashletData[dashletId] = {
                position: this.getElementPosition(dashlet)
            })
        }
        var model: LayoutModel = {
            moduleId: this.tagName.toLowerCase(),
            dashlets: dashletData,
            config: {
                content: clone.outerHTML
            }
        }
        return model;
    }

    set layoutStyle(value: string) {
        if (this._layoutStyle)
            this.classList.remove(this._layoutStyle);
        var styles = this.getStyles();
        if (styles) {
            this.classList.add(value);
            this._layoutStyle = value;
        }

    }


    /* action handlers */

    removeZoneActionHandler(event: CustomEvent) {
        var zone = <HTMLElement>event.detail.zone, parent = zone.parentElement;
        var containingGroup = Helper.getContainingType(zone, 'j-dashlet-zone-group');
        var immidiateSiblings = Helper.getImmidiateSiblings(zone, '[j-dashlet-zone]', false);
        zone.remove();
        if (containingGroup && !immidiateSiblings.length) {
            containingGroup.remove();
        }

        this.setColumnWidths4Zones(immidiateSiblings)
        this.save();
    }

    moveSectionActionHandler(event: CustomEvent) {
        var direction = event.detail.direction || 'next';
        var section = event.detail.section;
        Helper.moveElement(section, direction, '[j-type="j-layout-section"]');
        this.save();
    }

    cloneZoneActionHandler(event: CustomEvent) {
        var zone = <HTMLElement>event.detail.zone;
        var clone = Helper.cloneElement(zone, true, this.discardedAttributesOnClone);
        clone.setAttribute('j-dashlet-zone', Helper.makeid());
        zone.parentElement.insertBefore(clone, zone);
        this.setLayoutMode4Zone(clone);
        var zones = Helper.getImmidiateSiblings(zone, "[j-dashlet-zone]", false);
        this.setColumnWidths4Zones(Array.prototype.concat.apply(zones, [zone]))

        this.save();
    }

    editSectionTitle(section: HTMLElement, header: string) {
        var titleNodes = section.querySelectorAll('[j-type="j-layout-section-title"]')
        if (titleNodes.length > 0) {
            var title = titleNodes[0].textContent;
            var newTitle = window.prompt(header || 'Title', title)
            if (newTitle != null) {
                for (var i = 0; i < titleNodes.length; i++)
                    titleNodes[i].textContent = newTitle;
                return newTitle;
            } return null;
        } return undefined;
    }

    editSectionTitleActionHandler(event: CustomEvent) {
        this.editSectionTitle(event.detail.section, 'Set section title');
    }

    removeSectionActionHandler(event: CustomEvent) {
        var section = <HTMLElement>event.detail.section;
        var container = Helper.getContainingType(section, "j-layout-content");
        section.remove();
        if (!container.querySelector('[j-type="j-layout-section"]')) {
            this.reset();
        }
        this.save();
    }



    editzoneGroupTitle(container: HTMLElement, header: string) {
        var titleNodes = container.querySelectorAll('[j-type="j-dashlet-zone-group-title"]')
        if (titleNodes.length > 0) {
            var title = titleNodes[0].textContent.trim();
            var newTitle = window.prompt(header || 'Title', title)
            if (newTitle != null) {
                for (var i = 0; i < titleNodes.length; i++)
                    titleNodes[i].textContent = newTitle;
                return newTitle;
            } return null;
        } return undefined;
    }

    moveZoneGroupActionHandler(event: CustomEvent) {
        var direction = event.detail.direction, group = event.detail.group;
        Helper.moveElement(group, direction, '[j-type="j-dashlet-zone-group"]');
        this.save();
    }

    cloneZoneGroupActionHandler(event: CustomEvent) {
        var group = <HTMLElement>event.detail.group;
        var newGroup = Helper.cloneElement(group, true, this.discardedAttributesOnClone);

        var zones = newGroup.querySelectorAll('[j-dashlet-zone]');
        for (var i = 0; i < zones.length; i++) {
            zones[i].setAttribute('j-dashlet-zone', Helper.makeid());
            this.setLayoutMode4Zone(<HTMLElement>zones[i])
        }
        this.setLayoutMode4ZoneGroup(newGroup);
        var titleRes = this.editzoneGroupTitle(newGroup, 'Set a title for new group');
        if (titleRes === null)
            return;

        this.save();
        group.parentElement.insertBefore(newGroup, group);
    }

    editZoneGroupTitleActionHandler(event: CustomEvent) {
        this.editzoneGroupTitle(event.detail.group, 'Set group title');
    }

    removeZoneGroupActionHandler(event: CustomEvent) {
        var group = event.detail.group;
        group.remove();
        this.save();
    }

    makeZoneGroupActionHandler(event: CustomEvent) {
        var zone = <HTMLElement>event.detail.zone;

        var template = Helper.locateTemplate(this, 'j-dashlet-zone-group');
        if (template) {
            Helper.instantiateTemplate(template, zone, {
                position: TemplateInstantiatePosition.append,
                postProcess: (clone: HTMLElement) => {
                    var zones = clone.querySelectorAll('[j-dashlet-zone]');
                    for (var i = 0; i < zones.length; i++) {
                        zones[i].setAttribute('j-dashlet-zone', Helper.makeid());
                        this.setLayoutMode4Zone(zones[i]);
                    }
                    this.setLayoutMode4ZoneGroup(clone);
                    this.setColumnWidths4Zones(zones);
                }
            })

            this.save();
        }
    }

    cloneSectionActionHandler(event: CustomEvent) {
        var section = <HTMLElement>event.detail.section;
        var newSection = Helper.cloneElement(section, true, this.discardedAttributesOnClone);
        //newSection.setAttribute('j-layout-section', Helper.makeid());

        var zones = newSection.querySelectorAll('[j-dashlet-zone]');
        for (var i = 0; i < zones.length; i++) {
            zones[i].setAttribute('j-dashlet-zone', Helper.makeid());
            this.setLayoutMode4Zone(<HTMLElement>zones[i])
        }
        this.setLayoutMode4Section(newSection);
        var titleRes = this.editSectionTitle(newSection, 'Set a title for new section');
        if (titleRes === null)
            return;
        section.parentElement.insertBefore(newSection, section);

        this.save();
    }

    resetSectionActionHandler(event: CustomEvent) {
        var section = <HTMLElement>event.detail.section;
        var zones = section.querySelectorAll('[j-dashlet-zone]');
        for (var i = 0; i < zones.length; i++) {
            (<HTMLElement>zones[i]).removeAttribute('j-weight');
        }
        this.setColumnWidths4Zones(zones);
        this.save();
    }


    moveZoneActionHandler(event: CustomEvent) {
        var direction = event.detail.direction, zone = event.detail.zone;
        Helper.moveElement(zone, direction, '[j-dashlet-zone]');
        this.save();
    }

    setColumnWidths4Zones(zoneElements: NodeListOf<Element>) {
    }

    setColumnWidths() {

    }

    getElementWeigth(el: HTMLElement) {
        if (el.hasAttribute('j-weight')) {
            var existing = Number(el.getAttribute('j-weight'));
            return existing || 1;
        } else return 1;
    }

    changeElementWeigth(el: HTMLElement, delta: number, max?: number) {
        var weigth = this.getElementWeigth(el);
        if (weigth >= max)
            return;
        var expected = weigth + delta;
        if (expected == 0 && delta > 0)
            expected = 2;
        else if (expected < 1 && delta < 0)
            expected = 1;
        el.setAttribute('j-weight', (expected).toString());
    }

    changeElementWeigths(els: NodeListOf<HTMLElement>, delta: number, max?: number) {
        for (var i = 0; i < els.length; i++) {
            this.changeElementWeigth(<HTMLElement>els[i], delta, max);
        }
    }

    resizeZoneActionHandler(event: CustomEvent) {
        var incSize = Number(event.detail.inc), zone = <HTMLElement>event.detail.zone;
        var zones = Helper.getImmidiateSiblings(zone, "[j-dashlet-zone]", false);
        var maxWeight = 12 - (zones.length - 1);
        if (incSize > 0) {
            var elWeight = this.getElementWeigth(zone);
            if (elWeight >= maxWeight)
                this.changeElementWeigths(zones, -1, maxWeight);
            else this.changeElementWeigth(zone, 1, maxWeight)
        }
        else {
            this.changeElementWeigths(zones, 1, maxWeight);
        }
        this.setColumnWidths4Zones(Array.prototype.concat.apply(zones, [zone]));
        this.save();
    }


    /* end of action handlers*/


    getDashlets(): NodeListOf<IDashletElement> {
        var elements = this.querySelectorAll('[j-type="j-dashlet"]');
        return <any>elements;
    }

    makeDashletsDragable(enable: boolean) {
        var dashlets = this.getDashlets();
        for (var i = 0; i < dashlets.length; i++)
            this.makeDashletDragable(<IDashletElement>dashlets[i], enable);
    }

    hideDashlets(hide: boolean) {
        var panels = this.querySelectorAll('[j-type="j-dashlet-panel"]');
        Helper.hideElements(panels, hide);
        hide ? (this.dashletsHidden = true) : (this.dashletsHidden = false);
    }

    toggleDashlets() {
        this.hideDashlets(!this.dashletsHidden);
    }

    collapseDashlet(dashlet: IDashletElement, collapse: boolean) {
        var configureTools = this.querySelectorAll('[j-type="j-dashlet-configuration-tools"]');
        if (this.viewMode == 'dashletedit')
            Helper.hideElements(configureTools, collapse);
        Helper.hideElements(dashlet, collapse);
    }

    collapseDashlets(collapse: boolean) {
        var dashlets = this.getDashlets();
        for (var i = 0; i < dashlets.length; i++)
            this.collapseDashlet(<IDashletElement>dashlets[i], collapse);
        this.dashletsCollapsed = collapse;
    }

    toggleCollapseDashlets() {
        this.collapseDashlets(!this.dashletsCollapsed)
    }

    get viewMode() {
        return this._viewMode;
    }

    setViewMode(newVal: string) {
        this.clearDropZones('j-dashlet');
        this.setAttribute('j-view-mode', newVal);
        switch (newVal) {
            case LayoutViewMode.readonly: {
                // this.classList.remove('view-mode-layoutedit', 'view-mode-dashletedit');
                // this.classList.add('view-mode-readonly');
                this.setLayoutEditMode(false);
                this.setDashletEditMode(false);
                break;
            }
            case LayoutViewMode.layoutedit: {
                // this.classList.remove('view-mode-readonly', 'view-mode-dashletedit');
                // this.classList.add('view-mode-layoutedit');
                this.setDashletEditMode(false);
                this.setLayoutEditMode(true);
                break;
            }
            case LayoutViewMode.dashletedit: {
                // this.classList.remove('view-mode-readonly', 'view-mode-layoutedit');
                // this.classList.add('view-mode-dashletedit');
                this.setLayoutEditMode(false);
                this.setDashletEditMode(true);
                break;
            }
        }

    }

    set viewMode(newVal: string) {
        if (this.viewMode != newVal) {
            this.fireEvent('viewmode-change', {
                oldVal: this.viewMode,
                newVal: newVal
            }, false, true)
            this._viewMode = newVal;
            if (this.isInitialized)
                this.setViewMode(newVal);
        }
    }

    initializeElement() {
        var styles = this.getStyles(), style = null;
        if (!this.layoutStyle) {
            Object.keys(styles).forEach((k) => {
                style = style || k;
            })
        }
        style && (this.layoutStyle = style);
        super.initializeElement();

        (<any>interact).dynamicDrop(true);
        this.listenforActions();
        Helper.ensureId(this, 'j-dashlet-zone');
        this.setViewMode(this.viewMode);
    }



    setDashletViewMode(newMode: string, targets: IDashletElement | NodeListOf<IDashletElement>) {
        var dashlets = targets instanceof NodeList ? targets : [targets];
        for (var i = 0; i < dashlets.length; i++) {
            var dashlet = dashlets[i];
            dashlet.setAttribute('j-view-mode', newMode);
        }
    }

    setDashletEditMode(edit: boolean) {
        if (edit) {
            this.createDashletDropzones();
            this.makeZonesDroppable(true);
            this.makeDashletsDragable(true);
            this.setDashletViewMode(DashletViewMode.configure, this.getDashlets());
        } else {
            this.makeDashletsDragable(false);
            this.makeZonesDroppable(false);
            this.clearDropZones('j-dashlet');
            this.setDashletViewMode(DashletViewMode.readonly, this.getDashlets());
        }
    }


    setLayoutMode4Zone(targets: Node | NodeListOf<any>) {
        var zoneEditTemplate = Helper.locateTemplate(this, 'j-zone-editor', true);
        zoneEditTemplate && Helper.instantiateTemplate(zoneEditTemplate, targets, {
            position: TemplateInstantiatePosition.insert,
            preProcess: (clone: HTMLElement, el) => {
                Helper.bindActions(clone, {
                    'zone': el
                }, this)
            }
        });
    }

    setLayoutMode4Section(container: Element | HTMLElement) {
        var sectionEditTemplate = Helper.locateTemplate(this, 'j-section-editor', true);
        var items = container.querySelectorAll('[j-type="j-layout-section-header"]');
        sectionEditTemplate && Helper.instantiateTemplate(sectionEditTemplate, items, {
            position: TemplateInstantiatePosition.sibling,
            preProcess: (clone, el) => {
                Helper.bindActions(clone, {
                    'section': Helper.getContainingType(el, 'j-layout-section')
                }, this);
                var headerTitle = el.querySelector('[j-type="j-layout-section-title"]');
                if (headerTitle) {
                    var templateHeaderTitle = clone.querySelector('[j-type="j-layout-section-title"]');
                    templateHeaderTitle && (templateHeaderTitle.innerHTML = headerTitle.innerHTML);
                }
            }
        });
    }

    setLayoutMode4ZoneGroup(container: HTMLElement) {
        var sectionEditTemplate = Helper.locateTemplate(this, 'j-dashlet-zone-group-editor', true);
        var items = container.querySelectorAll('[j-type="j-dashlet-zone-group-header"]');
        sectionEditTemplate && Helper.instantiateTemplate(sectionEditTemplate, items, {
            position: TemplateInstantiatePosition.sibling,
            preProcess: (clone, el) => {
                Helper.bindActions(clone, {
                    'group': Helper.getContainingType(el, 'j-dashlet-zone-group')
                }, this);
                var headerTitle = el.querySelector('[j-type="j-dashlet-zone-group-title"]');
                if (headerTitle) {
                    var templateHeaderTitle = clone.querySelector('[j-type="j-dashlet-zone-group-title"]');
                    templateHeaderTitle && (templateHeaderTitle.innerHTML = headerTitle.innerHTML);
                }
            }
        });
    }

    load(model: LayoutModel, dashlets: Array<DashletModel>) {
        if (model.config && model.config["content"]) {
            this.generateLayoutContent(model.config && model.config['content']);
        } else {
            this.reset();
        }
        dashlets.forEach((dashletModel) => {
            var dashlet = this.generateDashletElement(dashletModel, IDashletElementStatus.loaded);
            this.placeDashlet(dashlet, model.dashlets && model.dashlets[dashletModel.id] && model.dashlets[dashletModel.id].position);
        })
        //var dashboardId = this.dashboard.getAttribute('j-provider-id') || this.dashboard.id;
        // return this.dashboard.provider.getDashletsOfDashboard(dashboardId).then((dashletsResult) => {
        //     var dashlets = dashletsResult;

        // })
    }

    save() {
        var layoutData = this.getModel();
        var dashboardId = this.dashboard.getAttribute('j-provider-id') || this.dashboard.id;
        return this.dashboard.provider.saveDashboard(dashboardId, { layout: layoutData });
    }


    setLayoutEditMode(edit: boolean) {
        if (!edit) {
            Helper.removeTemplateInstances(this, ['j-zone-editor', 'j-section-editor', 'j-dashlet-zone-group-editor']);
            Helper.hideElements(this.querySelectorAll('[j-type="j-layout-section-header"]'), false);
            Helper.hideElements(this.querySelectorAll('[j-type="j-dashlet-zone-group-header"]'), false);
            if (this._dashletsCollapsedByLayout) {
                this.collapseDashlets(false);
                delete this._dashletsCollapsedByLayout;
            }
        } else {
            if (!this.dashletsCollapsed) {
                this.collapseDashlets(true);
                this._dashletsCollapsedByLayout = true;
            }
            var dashletZones = this.querySelectorAll('[j-dashlet-zone]');
            this.setLayoutMode4Zone(this.querySelectorAll('[j-dashlet-zone]'));
            this.setLayoutMode4Section(this);
            this.setLayoutMode4ZoneGroup(this);
        }
    }

    generateDashletElement(model: DashletModel, status: string): IDashletElement {
        var dashletModule = DashletModule.getByTag(model.moduleId);
        dashletModule = dashletModule || DashletModule.createModule(model.moduleId);
        var dashlet = <IDashletElement>document.createElement(dashletModule.elementTag);
        dashlet.model = model;
        dashlet.status = status;
        return dashlet;
    }

    attributeChangedCallback(name: string, oldVal: string, newVal: string) {
        super.attributeChangedCallback(name, oldVal, newVal);
    }

    createDropzoneElement(instance?: string) {
        var dropzoneTemplate = <HTMLTemplateElement>Helper.locateTemplate(this, 'j-dropzone', true);
        var dropZoneEl = Helper.extractTemplate(dropzoneTemplate);
        instance && dropZoneEl.setAttribute('j-instance', instance);
        return dropZoneEl;
    }

    dropActiveForElement(el: HTMLElement) {
        var rect = getAbsoluteBoundingRect(el);

        if (typeof el['__originalPosition'] == 'undefined') {
            el['__originalPosition'] = el.style.position;
            el.style.position = 'absolute';
            el.style.left = `${Math.round(rect.left)}px`;
            el.style.top = `${Math.round(rect.top)}px`;
            el.style.width = `${Math.round(rect.width)}px`;
            el.style.height = `${Math.round(rect.height)}px`;
        }
    }

    dropEndForElement(el: HTMLElement) {
        el.style.webkitTransform = el.style.transform = '';
        el.removeAttribute('data-x');
        el.removeAttribute('data-y');

        el.style.position = el['__originalPosition'] || '';
        el.style.left = ``;
        el.style.top = ``;
        el.style.width = ``;
        el.style.height = ``;
        delete el['__originalPosition'];
    }

    makeZonesDroppable(enable: boolean) {
        var self = this;
        var _interactable = interact('[j-type="j-dropzone"][j-instance="j-dashlet"]:not(template)', {
            context: this
        });
        if (enable) {
            _interactable.dropzone({
                accept: '[j-type="j-dashlet-panel"],[j-type="j-dashlet-module"]',
                checker: function (dragEvent,           // related dragmove or dragend event
                    event,                              // TouchEvent/PointerEvent/MouseEvent
                    dropped,                            // bool result of the default checker
                    dropzone,                           // dropzone Interactable
                    dropElement,                        // dropzone elemnt
                    draggable,                          // draggable Interactable
                    draggableElement) {                 // draggable element
                    if (dropped) {

                    }
                    return dropped;
                },
                ondropactivate: function (event) {
                    var el: HTMLElement = event.relatedTarget,
                        zone: HTMLElement = event.target,
                        dashlet = <IDashletElement>el.querySelector('[j-type="j-dashlet"]'),
                        dashletModule = <HTMLElement>el.querySelector('[j-type="j-dashlet-module"]');
                    zone.classList.add('j-dropzone-active');
                    self.dropActiveForElement(el);



                    dashlet && self.createDashletDropzones([dashlet]);
                },

                ondragenter: function (event) {
                    var el: HTMLElement = event.relatedTarget,
                        zone: HTMLElement = event.target,
                        dashlet = el.querySelector('[j-type="j-dashlet"]'),
                        dashletModule = <HTMLElement>el.querySelector('[j-type="j-dashlet-module"]');
                    zone.classList.add('j-dropzone-enter');
                    el.classList.add('j-can-drop');
                    var rect = el.getBoundingClientRect();
                    zone.style.height = `${Math.round(rect.height)}px`;
                },
                ondragleave: function (event) {
                    var el: HTMLElement = event.relatedTarget,
                        zone: HTMLElement = event.target,
                        dashlet = el.querySelector('[j-type="j-dashlet"]'),
                        dashletModule = <HTMLElement>el.querySelector('[j-type="j-dashlet-module"]');
                    zone.classList.remove('j-dropzone-enter');
                    zone.style.height = '';
                    el.classList.remove('j-can-drop');
                },
                ondrop: function (event) {
                    var el: HTMLElement = event.relatedTarget,
                        zone: HTMLElement = event.target,
                        dashlet = <IDashletElement>el.querySelector('[j-type="j-dashlet"]'),
                        dashletModule = <HTMLElement>el.querySelector('[j-type="j-dashlet-module"]');
                    el.classList.remove('j-can-drop');

                    self.dropEndForElement(el);

                    var newPos = self.getElementPosition(zone);

                    if (dashlet) {
                        self.placeDashlet(dashlet, newPos);
                    } else if (el.getAttribute('j-type') == 'j-dashlet-module') {
                        var model: DashletModel = {
                            id: '',
                            moduleId: el.getAttribute('j-module-id'),
                            dashboardId: self.dashboard.getAttribute('j-provider-id') || self.dashboard.id,
                            title: '',
                            configuration: {},
                            createdAt: null
                        }
                        self.dashboard.addDashlet(el.getAttribute('j-module-id'), newPos);
                    }

                },
                ondropdeactivate: function (event) {
                    var el: HTMLElement = event.relatedTarget,
                        zone: HTMLElement = event.target,
                        dashlet = <IDashletElement>el.querySelector('[j-type="j-dashlet"]');
                    zone.classList.remove('drop-active');
                    zone.classList.remove('drop-target');
                }
            })
        } else {

        }


    }

    makeDashletDragable(dashletElement: IDashletElement, enable: boolean) {
        var selector = dashletElement.panel ? '[j-type="j-dashlet-panel"]' : '[j-type="j-dashlet"]';

        var interactable = interact(selector, {
            context: dashletElement.panel || dashletElement
        });

        var self = this;

        if (enable) {
            (<any>interactable).draggable({
                inertia: true,
                restrict: {
                    endOnly: true,
                    elementRect: { top: 1, left: 1, bottom: 1, right: 1 },

                },
                autoScroll: true,
                onmove: function (event) {
                    dragMoveListener.apply(this, [event])
                },
                onend: function (event) {
                    var zone = event['dropzone'];
                    if (!zone) {
                        var el = event.target;
                        self.dropEndForElement(el);
                        var dashlet = event.target.querySelector('[j-type="j-dashlet"]');
                        var pos = self.getElementPosition(dashlet);
                        self.placeDashlet(dashlet, pos);
                    }
                }
            }).allowFrom('[j-drag-handle]');
        } else {
            interactable.draggable(false);
        }
    }


    createDashletDropzones(excludeList: Array<HTMLElement> = []) {
        var zones = this.querySelectorAll("[j-dashlet-zone]");
        this.clearDropZones('j-dashlet');
        for (var i = 0; i < zones.length; i++) {
            var zone = <HTMLElement>zones[i];
            var dashlets = zone.querySelectorAll('[j-type="j-dashlet"]');

            for (var j = 0; j < dashlets.length; j++) {
                if (excludeList.indexOf(<IDashletElement>dashlets[j]) >= 0)
                    continue;
                var dashlet = <IDashletElement>dashlets[j];
                if (dashlet.panel.parentElement != zone)
                    continue;
                var dropZoneEl = this.createDropzoneElement('j-dashlet');
                zone.insertBefore(dropZoneEl, dashlet.panel);
            }
            var dropZoneEl = this.createDropzoneElement('j-dashlet');
            var zoneId = zone.getAttribute('j-dashlet-zone');
            zone.appendChild(dropZoneEl);
            this.autoArrangeElements(zoneId, 'j-dropzone');
        }
    }

    clearDropZones(instance?: string) {
        var zones = instance ? this.querySelectorAll(`[j-type="j-dropzone"][j-instance="${instance}"]:not(template)`) : this.querySelectorAll('[j-type="j-dropzone"]:not(template)');

        for (var i = 0; i < zones.length; i++) {
            var zone = zones[i];
            zone.remove();
        }
    }

    generateDashletZoneIds() {
        var unidentifiedZones = this.querySelectorAll("[j-dashlet-zone='']");

        for (var i = 0; i < unidentifiedZones.length; i++) {
            var zone = unidentifiedZones[i];
            var zoneId = Helper.makeid();
            zone.setAttribute("j-dashlet-zone", zoneId);
        }
    }

    generateLayoutContent(newContent?: string) {
        var contentTemplate = Helper.locateTemplate(this, 'j-layout-content', false);
        if (newContent) {
            Helper.removeTemplateInstances(this, 'j-layout-content');
            var template = document.createElement('template');
            template.innerHTML = newContent;
            template.setAttribute('j-type', 'j-layout-content');
            var content = Helper.extractTemplate(template);
            this.insertBefore(content, contentTemplate);
            this.generateDashletZoneIds(); // fix : if not given zoneId, moving dashlet to the zone cannot work.
        } else {
            Helper.instantiateTemplate(contentTemplate);
            this.generateDashletZoneIds(); // fix : if not given zoneId, moving dashlet to the zone cannot work.

        }

    }

    createChildren(parent: HTMLElement) {
        super.createChildren(parent);
        this.generateLayoutContent();
        this.setColumnWidths();

    }

    listenforActions() {
        Helper.addActionListener('removezone', this.removeZoneActionHandler.bind(this), this);
        Helper.addActionListener('movesection', this.moveSectionActionHandler.bind(this), this);
        Helper.addActionListener('movezone', this.moveZoneActionHandler.bind(this), this);
        Helper.addActionListener('resizezone', this.resizeZoneActionHandler.bind(this), this);
        Helper.addActionListener('clonezone', this.cloneZoneActionHandler.bind(this), this);
        Helper.addActionListener('clonesection', this.cloneSectionActionHandler.bind(this), this);
        Helper.addActionListener('editsectiontitle', this.editSectionTitleActionHandler.bind(this), this);
        Helper.addActionListener('removesection', this.removeSectionActionHandler.bind(this), this);
        Helper.addActionListener('makezonegroup', this.makeZoneGroupActionHandler.bind(this), this);
        Helper.addActionListener('movezonegroup', this.moveZoneGroupActionHandler.bind(this), this);
        Helper.addActionListener('clonezonegroup', this.cloneZoneGroupActionHandler.bind(this), this);
        Helper.addActionListener('editzonegrouptitle', this.editZoneGroupTitleActionHandler.bind(this), this);
        Helper.addActionListener('removezonegroup', this.removeZoneGroupActionHandler.bind(this), this);
        Helper.addActionListener('resetsection', this.resetSectionActionHandler.bind(this), this);





    }


    connectedCallback() {
        super.connectedCallback();
    }

    makeDroppable(selector: string, enable: boolean, context?: HTMLElement, container?: HTMLElement) {

        var interactable = interact(selector, {
            context: context
        });

        var self = this;

        if (enable) {
            (<any>interactable).draggable({
                inertia: true,
                restrict: {
                    endOnly: true,
                    elementRect: { top: 1, left: 1, bottom: 1, right: 1 },

                },
                autoScroll: {
                    container: this
                },
                onstart: function (event) {
                    // scroll bug fix hack
                    setTimeout(function () {
                        event.target.style.left = (event.pageX - 25) + "px";
                        event.target.style.top = (event.pageY - 25) + "px";               
                    });
                },
                onmove: function (event) {
                    dragMoveListener.apply(this, [event])
                },
                onend: function (event) {
                    self.dropEndForElement(event.target);
                    var zone = event['dropzone'];
                    if (!zone) {
                        var el = event.target;
                        el.style.webkitTransform = el.style.transform = '';
                        el.removeAttribute('data-x');
                        el.removeAttribute('data-y');
                    }
                }
            }).allowFrom('[j-drag-handle]')
        } else {
            interactable.draggable(false);
        }
    }




    setDashletProperties(dashletElement: IDashletElement) {
        if ([LayoutViewMode.editable, LayoutViewMode.dashletedit].indexOf(this.viewMode) >= 0) {
            this.makeDashletDragable(dashletElement, true);
            this.setDashletViewMode(DashletViewMode.configure, dashletElement);
        } else {
            this.makeDashletDragable(dashletElement, false);
            this.setDashletViewMode(DashletViewMode.readonly, dashletElement);
        }
        dashletElement.config = dashletElement.config || <any>{};

    }

    createPanelForDashlet(dashletElement: IDashletElement): HTMLElement {
        var panelTag = dashletElement.getAttribute('j-panel') || 'j-dashlet-panel';
        if (panelTag && panelTag != 'none') {
            var panel = <IDashletPanel>document.createElement(panelTag);
            panel.setAttribute('j-type', 'j-dashlet-panel');
            panel.dashlet = dashletElement;
            return panel;
        } else {
            var el = document.createElement('div');
            el.setAttribute('j-type', 'j-dashlet-panel');
            el['dashlet'] = dashletElement;
            el.appendChild(dashletElement);
            return el;
        }
    }

    normalizePosition(pos?: DashletPositionModel) {
        pos = pos || {};
        var zoneEl: Element, dashletsInZone = 0;
        if (!pos.zone) {
            zoneEl = this.querySelector('[j-dashlet-zone]');
            zoneEl && (pos.zone = zoneEl.getAttribute('j-dashlet-zone'));
        } else zoneEl = this.querySelector('[j-dashlet-zone]');
        zoneEl && (dashletsInZone = zoneEl.querySelectorAll('[j-type="j-dashlet"]').length);

        pos.x = pos.x || 0;
        pos.y = pos.y || 0;
        pos.z = pos.z || 0;

        pos.y = Math.min(pos.y, dashletsInZone);

        return pos;
    }

    autoArrangeElements(zoneId: string, type: string) {
        var zone = this.querySelector(`[j-dashlet-zone="${zoneId}"]`);
        if (!zone) {
            zone = this.querySelector(`[j-dashlet-zone]`);
        }
        var elements = zone.querySelectorAll(`[j-type="${type}"]:not(template)`);
        for (var i = 0; i < elements.length; i++) {
            var pos: DashletPositionModel = {
                zone: zoneId,
                y: i
            };
            this.setElementPosition(<HTMLElement>elements[i], pos);
        }
    }

    getPositionalChanges(from: DashletPositionModel, to: DashletPositionModel) {
        return this.getDashlets();
    }

    placeDashlet(dashletElement: IDashletElement, to?: DashletPositionModel) {
        to = this.normalizePosition(to);
        var zoneToAdd = this.querySelector(`[j-dashlet-zone="${to.zone}"]`);
        zoneToAdd = zoneToAdd || this.querySelector('[j-dashlet-zone]');

        if (!dashletElement.panel) {
            dashletElement.panel = this.createPanelForDashlet(dashletElement);
        }

        if (!dashletElement.layout)
            dashletElement.layout = this;

        var dashletId = dashletElement.getAttribute('j-provider-id') || dashletElement.id;
        // var dashletProperties: LayoutDashletMetaModel = this.model && this.model.dashlets ? this.model.dashlets[dashletId] : {

        // };


        var existingPos = this.getElementPosition(dashletElement);

        if (dashletElement.panel.parentElement == zoneToAdd) {
            dashletElement.panel.remove(); /* remove olduğu için disconnect oluyor */
            to = this.normalizePosition(to);
        }

        var dashletsInZone = Helper.getElementsNotIn(zoneToAdd, '[j-type="j-dashlet"]', '[j-type="j-dashlet-zone-group"]');

        var nearestDashlet: IDashletElement = undefined;
        this.setElementPosition(dashletElement, to);
        this.setDashletProperties(dashletElement);

        for (var i = 0; i < dashletsInZone.length; i++) {
            var dashlet = <IDashletElement>dashletsInZone[i];
            var existingPos = this.getElementPosition(dashlet);
            if (to.y <= (existingPos.y || 0)) {
                nearestDashlet = nearestDashlet || dashlet;
            }
        }

        if (nearestDashlet)
            zoneToAdd.insertBefore(dashletElement.panel || dashletElement, nearestDashlet.panel);
        else zoneToAdd.appendChild(dashletElement.panel || dashletElement);


        // todo : parent to sub-group movements control
        // if (existingPos.zone && existingPos.zone != to.zone) {
        //     this.autoArrangeElements(existingPos.zone, 'j-dashlet');
        // }
        this.autoArrangeElements(to.zone, 'j-dashlet');

        var placeEventArgs = {
            zone: zoneToAdd,
            dashlet: dashletElement
        }

        Helper.fireEvent(document, "jdash:dashlet.after-place", placeEventArgs);
        Helper.fireEvent(dashletElement, "after-place", placeEventArgs);

        if (this.viewMode == LayoutViewMode.editable || this.viewMode == LayoutViewMode.dashletedit) {
            this.createDashletDropzones();
        }
        this.collapseDashlet(dashletElement, this.dashletsCollapsed);
        var createPromise: Promise<any>;

        if (this.dashboard.state == DashboardState.loading)
            return Promise.resolve(dashletElement);

        if (dashletElement.status == IDashletElementStatus.created)
            createPromise = this.dashboard.provider.createDashlet(dashletElement.model).then((createResult) => {
                dashletElement.model.id = createResult.id;
                dashletElement.status == IDashletElementStatus.loaded;
                dashletElement.updateFromModel();
                return dashletElement;
            });
        else createPromise = Promise.resolve(dashletElement);
        return createPromise.then((dashletEl) => {
            return this.save();
        })
    }


    removeDashlet(dashletElement: IDashletElement) {
        dashletElement.panel.remove();
        return this.save().then(() => this.createDashletDropzones());
    }

    cloneDashlet(dashletElement: IDashletElement) {
        var config = dashletElement.config ? JSON.parse(JSON.stringify(dashletElement.config)) : null;
        var model = <DashletModel>dashletElement.model ? JSON.parse(JSON.stringify(dashletElement.model)) : {};
        model.title = `Copy ${model && model.title}`;
        config && (model.configuration = config);
        return this.dashboard.provider.createDashlet(model).then(result => {
            Object.keys(result).forEach(key => model[key] = result[key]);
            var copyElement = this.generateDashletElement(model, IDashletElementStatus.created);
            return this.placeDashlet(copyElement, this.getElementPosition(dashletElement));
        })
    }

    normalizeDashletZones() {
        var zoneGroups = this.querySelectorAll("[j-type='j-dashlet-zone-group']");
        for (var i = 0; i < zoneGroups.length; i++) {
            var zoneGroup = zoneGroups[i];
            var dashletZones = <any>Helper.getElementsNotIn(zoneGroup, "[j-dashlet-zone]", "j-dashlet-zone-group");
            this.setColumnWidths4Zones(dashletZones);
        }
    }

    reset(newMode?: string) {
        var dashlets = this.querySelectorAll('[j-type="j-dashlet"]');
        for (var i = 0; i < dashlets.length; i++)
            (((<IDashletElement>dashlets[i]).panel) || dashlets[i]).remove();

        var layoutContainer = this.querySelector("[j-type='j-layout-content']:not(template)");
        if (layoutContainer) {
            layoutContainer.remove();
        }

        this.generateLayoutContent();


        newMode = newMode || this.viewMode;
        if (this.viewMode == newMode)
            this.setViewMode(newMode);
        else this.viewMode = newMode;

        this.normalizeDashletZones();
    }

    getElementPosition(el: Element) {
        var pos: DashletPositionModel = {
            zone: el.getAttribute('j-zone'),
            x: el.getAttribute('j-x') ? parseInt(el.getAttribute('j-x')) : undefined,
            y: el.getAttribute('j-y') ? parseInt(el.getAttribute('j-y')) : undefined,
            z: el.getAttribute('j-z') ? parseInt(el.getAttribute('j-z')) : undefined,
        };
        return pos;
    }

    setElementPosition(el: IDashletElement | HTMLElement, position: DashletPositionModel) {
        position.zone ? el.setAttribute('j-zone', position.zone) : el.removeAttribute('zone');
        position.x ? el.setAttribute('j-x', position.x.toString()) : el.removeAttribute('j-x');
        position.y ? el.setAttribute('j-y', position.y.toString()) : el.removeAttribute('j-y');
        position.z ? el.setAttribute('j-z', position.z.toString()) : el.removeAttribute('j-z');
        el['model'] && (el['model'].position = position);
    }

    moveDashlet(dashletElement: IDashletElement, to: DashletPositionModel): Array<IDashletElement> {
        var oldPosition = this.getElementPosition(dashletElement);
        var allowDrag =
            allowDrag = Helper.fireEvent(dashletElement, 'drag-start', {
                from: oldPosition,
                to: to
            }, true) && Helper.fireEvent(document, 'jdash:dashlet.drag-start', {
                target: dashletElement,
                from: oldPosition,
                to: to
            }, true);
        if (allowDrag) {
            this.placeDashlet(dashletElement, to);
            return [dashletElement];

        } else return [];
    }

    getDashletsByPosition(position: DashletPositionModel) {
        var query = '[j-type="j-dashlet"]';
        query = position.zone ? query.concat(`[j-zone="${position.zone}"]`) : query;
        query = position.x ? query.concat(`[j-x="${position.x}"]`) : query;
        query = position.y ? query.concat(`[j-y="${position.y}"]`) : query;
        query = position.z ? query.concat(`[j-z="${position.z}"]`) : query;
        return this.querySelectorAll(query);
    }

    getDashletAt(position: DashletPositionModel) {
        var query = '[j-type="j-dashlet"]';
        query = position.zone ? query.concat(`[j-zone="${position.zone}"]`) : query;
        query = position.x ? query.concat(`[j-x="${position.x}"]`) : query;
        query = position.y ? query.concat(`[j-y="${position.y}"]`) : query;
        query = position.z ? query.concat(`[j-z="${position.z}"]`) : query;
        return this.querySelector(query);
    }
}






