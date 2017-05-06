export class TemplateGenerator {
    private manipulatingElement: Element;

    wrapWith(element: HTMLElement) {
        element.appendChild(this.manipulatingElement);
        this.manipulatingElement = element;
        return this;
    }

    getResult() {
        this.manipulatingElement.setAttribute('j-template-generated', '');
        return this.manipulatingElement;
    }

    clone() {
        var div = document.createElement('div');
        div.innerHTML = this.manipulatingElement.outerHTML;
        return div.firstElementChild;
    }

    constructor(private template: HTMLTemplateElement) {
        var clone = <HTMLElement>document.importNode(this.template.content, true);
        this.manipulatingElement = clone;
    }
}