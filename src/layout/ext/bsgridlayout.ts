import { GridLayout } from '../grid';
export class BsGridLayout extends GridLayout {


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
            zone.classList.add(`col-md-${zoneWidth}`);
        }

    }

}