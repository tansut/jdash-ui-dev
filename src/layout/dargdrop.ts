export class InteractBase {
    protected interactable: Interact.Interactable;

    constructor(public el: any, context?: Element) {
        var _interactable: Interact.Interactable = undefined;
        if (context)
            _interactable = interact(el, { context: context })
        else _interactable = interact(el);
        this.interactable = _interactable;
    }
}

export class Draggable extends InteractBase {

}

export class Dropzone extends InteractBase {
    constructor(public el: any, context?: Element) {
        super(el, context);
    }

    make() {
        this.interactable.dropzone();
    }
}