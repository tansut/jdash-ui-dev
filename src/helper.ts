import { KeyValue, HtmlElement } from './core';

export interface InstantiateTemplateOptions {
    position?: string;
    preProcess?: Function;
    postProcess?: Function;
    container?: HTMLElement
}

export let TemplateInstantiatePosition = {
    insert: 'insert',
    append: 'append',
    sibling: 'sibling',
    auto: 'auto'
}

export default class Helper {

    static getElementChildren(parent: Element): Array<Element> {
        var children = [];
        for (var i = 0; i < parent.childNodes.length; i++) {
            var child = parent.childNodes[i];
            if (child instanceof Element)
                children.push(child);
        }
        return children;
    }



    static elementIndex(parent: Element, child: Element) {
        var parentChilds = Helper.getElementChildren(parent);
        for (var i = 0; i < parentChilds.length; i++)
            if (parentChilds[i] == child) return i;
        return -1;
    }

    static cloneElement(source: HTMLElement, deep?: boolean | number, discardedAttributes?: KeyValue<string | Array<string>>, existingAttributes?: KeyValue<string | Array<string>>): HTMLElement {
        discardedAttributes = discardedAttributes || {};
        existingAttributes = existingAttributes || {};

        var shouldClone = (el: Element) => {
            var keys = Object.keys(discardedAttributes);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var values = discardedAttributes[k];
                if (typeof values == 'string')
                    values = [values];
                var attrVal = el.getAttribute(k);
                if (typeof attrVal != 'undefined') {
                    if (values.indexOf(attrVal) >= 0)
                        return false;
                }
            }
            keys = Object.keys(existingAttributes);
            if (keys.length > 0) {
                for (var i = 0; i < keys.length; i++) {
                    var k = keys[i];
                    var values = existingAttributes[k];
                    if (typeof values == 'string')
                        values = [values];
                    var attrVal = el.getAttribute(k);
                    if (typeof attrVal != 'undefined') {
                        if (values.indexOf(attrVal) >= 0)
                            return true;
                    }
                }
                return false;
            }
            return true;
        }

        var cloneIt = (el: HTMLElement, includeTextNodes: boolean = false) => {
            var cloned = el.cloneNode();
            return <HTMLElement>cloned;
        }


        var deepCloned = (el: HTMLElement, level: number = 0) => {
            if (shouldClone(el)) {
                var clone = cloneIt(el, true);
                if (typeof deep != 'undefined' && typeof deep != 'boolean' && deep < level)
                    return clone;
                level++;
                for (var i = 0; i < el.childNodes.length; i++) {
                    var child = el.childNodes[i];
                    if (child.nodeType == 3)
                        clone.appendChild(child.cloneNode());
                    else if (shouldClone(<HTMLElement>child)) {
                        var clonedChild = deepCloned(<HTMLElement>child, level);
                        clonedChild && clone.appendChild(clonedChild);
                    }
                }
                return clone;
            } else return null;
        }


        if (deep === false || typeof deep == 'undefined' || deep === 0) {
            if (shouldClone(source)) return cloneIt(source);
        } else {
            return deepCloned(source);
        }

        // var tag = source.tagName.toLowerCase();
        // var el = <HTMLElement>document.createElement(tag);
        // for (var i = 0; i < source.attributes.length; i++) {
        //     el.setAttribute(source.attributes[i].name, source.attributes[i].value);
        // }
        // return el;
    }

    static moveElement(el: Element, direction: string, selector: string) {
        direction = direction || 'next';

        var siblings = Helper.getImmidiateSiblings(<HtmlElement>el, selector, true);

        if (siblings.length < 2)
            return;

        var index = Array.prototype.indexOf.call(siblings, el);
        if (index < 0)
            return;

        var targetIndex;
        if (index == 0 && direction == 'prev') {
            targetIndex = siblings.length - 1;
            direction = 'next';
        }
        else if (index == siblings.length - 1 && direction == 'next') {
            targetIndex = 0;
            direction = 'prev';

        } else {
            targetIndex = direction == 'next' ? index + 1 : index - 1;
        }

        var childAtTargetIndex = siblings[targetIndex];
        direction == 'next' ? el.parentElement.insertBefore(childAtTargetIndex, el) : el.parentElement.insertBefore(el, childAtTargetIndex);

    }

    static executeAction(action: string, actionParams: KeyValue<string>, originalEvent?: Event, context?: Window | Document | HTMLElement) {
        var eventDetail = {
            $event: originalEvent,
        }
        actionParams && Object.keys(actionParams).forEach((k) => eventDetail[k] = actionParams[k]);
        context = context || window;
        var handlers: Array<Function> = context[`j-action-${action}-handlers`] || [];
        var executeHandler = context[`j-action-${action}-execute-handler`];
        if (!executeHandler) {
            context.addEventListener(`execute-${action}`, function (event: CustomEvent) {
                if (event.defaultPrevented)
                    return;

                var before = Helper.fireEvent(context || window, `${action}`, event.detail, true, true);
                if (before.dispatchResult == false || before.event.defaultPrevented) {
                    event.cancelable && event.preventDefault();
                    return;
                }

                var waitForPromise = event.detail.$waitFor;
                Promise.resolve(waitForPromise).then(() => {
                    handlers.forEach((handler) => handler.apply(context, [event]))
                    Helper.fireEvent(context || window, `after-${action}`, event.detail, false, true);
                })
            });
            context[`j-action-${action}-execute-handler`] = true;
        }

        return Helper.fireEvent(context, `execute-${action}`, eventDetail, true, true)
    }

    static setBindings(container: HTMLElement, context?: Window | Document | HTMLElement, selector?: string) {
        context = context || container;
        var elements = container.querySelectorAll(selector || '[j-bind]');
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i], attrVal = el.getAttribute('j-bind');
            var elementContext = el['__j-binding-context'] || (el['__j-binding-context'] = context);
            if (elementContext === context) {
                var val = attrVal ? context[attrVal] : context;
                if (val) el.textContent = val.toString();
                else {
                    var defaultVal = el.getAttribute('j-bind-default');
                    defaultVal && (el.innerHTML = defaultVal);
                }
            }
        }
    }


    static bindActions(container: HTMLElement, parameters?: KeyValue<any>, context?: Window | Document | HTMLElement) {

        var parseActionParams = (val: string) => {
            var result = {};
            if (val) {
                var parts = val.split(',');
                parts.forEach((part) => {
                    var nameValues = part.split(':');
                    result[nameValues[0]] = nameValues[1];
                })
            }
            return result;
        }

        var actionElements = container.querySelectorAll('[j-action]');
        var fn = (event: any, handler: Function, actionParts: Array<any>) => {
            var actionParams = [event].concat(actionParts.slice(1));
            handler.apply(this, actionParams);
        }

        for (var i = 0; i < actionElements.length; i++) {
            var el = <HTMLElement>actionElements[i];
            var action = el.getAttribute('j-action'), actionParamsOnAttribute = el.getAttribute('j-action-params')
            var actionParameters: KeyValue<string> = parseActionParams(actionParamsOnAttribute);
            if (parameters) {
                Object.keys(parameters).forEach((k) => {
                    var val = parameters[k];
                    actionParameters[k] = val;
                });
            }

            (function (action: string, actionParameters: KeyValue<string>) {
                el.addEventListener('click', (event) => Helper.executeAction.apply(null, [`${action}`, actionParameters, event, context]));
            })(action, actionParameters);

        }
    }

    static addActionListener(action: string, handler: EventListener, context: Window | Document | HTMLElement) {
        var handlers = context[`j-action-${action}-handlers`] || [];
        handlers.push(handler);
        context[`j-action-${action}-handlers`] = handlers;
    }

    static ensureId(container: HTMLElement, attr: string) {
        var emptyElements = container.querySelectorAll(`[${attr}=""]`);
        for (var i = 0; i < emptyElements.length; i++)
            emptyElements[i].setAttribute(attr, this.makeid());
    }

    static locateElementType(container: HTMLElement, type: typeof HTMLElement, deep?: boolean) {
        var result: Array<HTMLElement> = [];
        var findType = (el: HTMLElement) => {
            if (!deep && result.length > 0) return;
            var elChildren = Helper.getElementChildren(el);
            for (var i = 0; i < elChildren.length; i++) {
                var child = <HTMLElement>elChildren[i];
                findType(child);
                if (child instanceof type)
                    result.push(child);
            }
        }

        findType(container);
        return result;
    }

    static getSiblings(el: HTMLElement, selector: string) {
        var parentEl = el.parentElement;
        var allItems = parentEl.querySelectorAll(selector);
        return Array.prototype.filter.call(allItems, (item) => item !== el);
    }

    static getImmidiateSiblings(el: HTMLElement, selector: string, includeSelf: boolean) {
        var parentEl = el.parentElement;
        var allItems = parentEl.querySelectorAll(selector);
        return Array.prototype.filter.call(allItems, (item) => {
            if (!includeSelf && item === el)
                return false;
            if (item.parentElement !== parentEl)
                return false;
            return true;
        });
    }

    static extractTemplate(template: HTMLTemplateElement) {
        var clone = <any>document.importNode(template.content, true);
        var topEl: HTMLElement;
        var cloneChildren = Helper.getElementChildren(clone);
        if (cloneChildren.length > 1 || template.getAttribute('j-target-tag')) {
            topEl = document.createElement(template.getAttribute('j-target-tag') || 'div');
            topEl.appendChild(clone);
        } else if (cloneChildren.length < 1) {
            topEl = document.createElement(template.getAttribute('j-target-tag') || 'div');
        } else topEl = <HTMLElement>cloneChildren[0];
        topEl.className = topEl.className + (template.className || '');
        for (var i = 0; i < template.attributes.length; i++) {
            topEl.setAttribute(template.attributes[i].name, template.attributes[i].value);
        }
        topEl.setAttribute('j-template-generated', '');
        return topEl;
    }

    static getFirstElementChild(node: HTMLElement): Element {
        if (!node.hasChildNodes()) {
            return null;
        }
        // We have native support
        if (node.firstElementChild) {
            return node.firstElementChild;
        }

        for (var i = 0; i < node.childNodes.length; i++) {
            var child = node.childNodes[i];
            if (child.nodeType === Node.ELEMENT_NODE)
                return <Element>child;
        }

        return undefined;
    }

    static instantiateTemplate(template: HTMLTemplateElement, targets?: string | Node | NodeListOf<any>, options?: InstantiateTemplateOptions) {
        options = options || {};

        var items: NodeList | (string | Node | NodeListOf<any>)[];
        if (template.getAttribute('j-target-selector'))
            items = (options.container || document).querySelectorAll(template.getAttribute('j-target-selector'));
        else
            if (typeof targets == 'string')
                items = (options.container || document).querySelectorAll(targets);
            else if (targets instanceof NodeList)
                items = targets;
            else items = targets ? [targets] : undefined;

        var result = [];

        var position = (!items) ? TemplateInstantiatePosition.auto : (template.getAttribute('j-target-position') || options.position || TemplateInstantiatePosition.append);

        var processNode = (topEl: HTMLElement, el: HTMLElement) => {
            var doIt = true;
            if (options.preProcess) {
                doIt = options.preProcess.apply(this, [topEl, el]);
                if (doIt !== false)
                    doIt = true;
            }
            if (doIt) {
                if (position == TemplateInstantiatePosition.append)
                    el.appendChild(topEl);
                else if (position == TemplateInstantiatePosition.insert) {
                    var firstChild = Helper.getFirstElementChild(el);
                    firstChild ? el.insertBefore(topEl, firstChild) : el.appendChild(topEl);
                } else if (position == TemplateInstantiatePosition.auto) {
                    var parent = el.parentElement;
                    parent.insertBefore(topEl, el);
                } else {
                    Helper.hideElements(el, true);
                    el.parentElement.insertBefore(topEl, el);
                }
                options.postProcess && options.postProcess.apply(this, [topEl, el]);
                result.push(topEl)
            }
        };

        if (position == TemplateInstantiatePosition.auto) {
            var topEl = Helper.extractTemplate(template);
            processNode(topEl, template);
        } else {
            for (var i = 0; i < items.length; i++) {
                var el = <HTMLElement>items[i];
                var topEl = Helper.extractTemplate(template);
                processNode(topEl, el);
            }
        }


        return result;
    }

    static locateTemplate(container: HTMLElement, jtype: string, deep: boolean = false) {
        var getTemplate = (el: HTMLElement) => {
            return <HTMLTemplateElement>el.querySelector(`template[j-type="${jtype}"]`);
        }
        var foundTemplate = getTemplate(container);
        if (foundTemplate) return foundTemplate;

        if (deep) {
            var node = container.parentElement;
            while (node) {
                var found = getTemplate(node);
                if (found) return found;
                node = node.parentElement;
            }
        } else return null;
    }

    static removeTemplateInstances(container: HTMLElement, templateId: string | Array<string> | HTMLTemplateElement) {
        var templateList = Array.isArray(templateId) ? templateId : (typeof templateId == 'string' ? [templateId] : [templateId.getAttribute('j-type')]);
        for (var i = 0; i < templateList.length; i++) {
            var elements = container.querySelectorAll(`[j-type="${templateList[i]}"]:not(template)`);
            this.removeElements(elements);
        }
    }

    static hideTemplateInstances(container: HTMLElement, templateId: string | Array<string>, hide: boolean) {
        var templateList = Array.isArray(templateId) ? templateId : [templateId];
        for (var i = 0; i < templateList.length; i++) {
            var elements = container.querySelectorAll(`[j-type="${templateList[i]}"]:not(template)`);
            this.hideElements(elements, hide);
        }
    }

    static hideElements(targets: Node | NodeListOf<any>, hide: boolean) {
        var elements = targets instanceof NodeList ? targets : [targets];
        for (var i = 0; i < elements.length; i++) {
            var el = (<HTMLElement>elements[i]);
            hide ? (el.style.display = 'none') : (el.style.display = '');
        }
    }

    static removeElements(targets: Node | NodeListOf<any>) {
        var elements = targets instanceof NodeList ? targets : [targets];

        for (var i = 0; i < elements.length; i++) {
            (<Element>elements[i]).remove();
        }
    }


    static getElementsNotIn(container, selector, excludeContainerSelector) {
        var allItems = container.querySelectorAll(selector);
        var notIncludingContainerItems = container.querySelectorAll(excludeContainerSelector);
        var excludedItemList = [];
        for (var i = 0; i < notIncludingContainerItems.length; i++) {
            var subContainer = notIncludingContainerItems[i];
            var notToIncludeItems = subContainer.querySelectorAll(selector);
            for (var j = 0; j < notToIncludeItems.length; j++) {
                excludedItemList.push(notToIncludeItems[j]);
            }
        }

        var foundItems = [];
        for (var i = 0; i < allItems.length; i++) {
            var found = false;
            for (var j = 0; j < excludedItemList.length; j++) {
                if (allItems[i] === excludedItemList[j])
                    found = true;
            }
            if (!found)
                foundItems.push(allItems[i]);
        }

        return foundItems;
    }

    static getContainingType(el: HTMLElement, jtype: string) {
        var node = el.parentElement;
        while (node) {
            var found = node.getAttribute('j-type') == jtype;
            if (found) return node;
            node = node.parentElement;
        }
        return null;
    }

    static getContainingAttr(el: HTMLElement, attr: string, attrValue?: string) {
        var node = el.parentElement;
        while (node) {
            if (node.hasAttribute(attr)) {
                if (!attrValue) {
                    return node;
                }
                else if (attrValue && node.getAttribute(attr) == attrValue) {
                    return node;
                }

            }
            node = node.parentElement;
        }
    }

    static makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 8; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    static fireEvent(source: HTMLElement | Window | Document, name: string, detail: any = null, cancellable: boolean = false, canBubble: boolean = false) {
        var createdEvent = new CustomEvent('Event');
        createdEvent.initCustomEvent(name, canBubble, cancellable, detail);
        return { event: createdEvent, dispatchResult: source.dispatchEvent(createdEvent) };
    }

    static extends(d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };

    static inherit(base: any) {
        var generatedClass = (function (_parent) {
            Helper.extends(generatedClass, _parent);
            function generatedClass() {
                return _parent.apply(this, arguments) || this;
            }

            return generatedClass;
        }(base));
        return generatedClass;
    }

}