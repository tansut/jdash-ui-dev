
import { Component } from '../core';
import { DashboardLayout } from './';

export class GridLayout extends DashboardLayout {

    getStyles() {
        return {
            dark: 'Dark',
            light: 'Light'
        }
    }


    setColumnWidths4Zones(zoneElements: NodeListOf<Element>) {
        var totalWeigth = 0, zoneCount = zoneElements.length;
        for (var i = 0; i < zoneElements.length; i++) {
            var zone = <HTMLElement>zoneElements[i];
            var weight = parseInt(zone.getAttribute('j-weight') || "1") || 1;
            totalWeigth += weight;
        }
        var weightEffect = 12.0 / totalWeigth, zoneValue = 12 / zoneCount;
        var zoneWidthCount = 0;

        for (var i = 0; i < zoneElements.length; i++) {
            var zone = <HTMLElement>zoneElements[i];
            var weight = parseInt(zone.getAttribute('j-weight') || "1") || 1;
            var zoneWidth = Math.round(weight * weightEffect);
            if (i == zoneElements.length - 1)
                zoneWidth = Math.abs(12 - zoneWidthCount);
            else zoneWidthCount += zoneWidth;

            zone.setAttribute('class', '');
            zone.classList.add(`j-col`, `m${zoneWidth}`);
        }

    }

    setColumnWidths() {
        var sections = this.querySelectorAll('[j-type="j-layout-section"]');
        if (sections.length == 0)
            this.setColumnWidths4Zones(this.querySelectorAll('[j-dashlet-zone]'));
        else {
            for (var i = 0; i < sections.length; i++) {
                var zones = sections[i].querySelectorAll('[j-dashlet-zone]');
                this.setColumnWidths4Zones(zones);
            }
        }
    }

    createChildren(parent: HTMLElement) {
        super.createChildren(parent);

    }

    connectedCallback() {
        super.connectedCallback();
    }
}

// Component.define('j-grid-layout', {
//     elementClass: GridLayout
// })
