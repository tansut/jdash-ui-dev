import { KeyValue } from './keyvalue';

export class Configuration {
    set(key: string, value: any) {
        var oldVal = this[key];
        if (this.changeCallback && oldVal !== value) {
            var res = this.changeCallback.apply(this, [key, value, oldVal]);
            if (res === false) return false;
            this[key] = value;
            return true;
        }
    }

    get(key: string) {
        return this[key];
    }

    init(initialValues: KeyValue<any>, ) {
        for (var prop in this) {
            if (!this.hasOwnProperty(prop) && typeof this[prop] != 'function')
                delete this[prop];
        }

        Object.keys(initialValues || {}).forEach((key) => {
            this[key] = initialValues[key];
        })
        return this;
    }

    constructor(public changeCallback: Function) {

    }
}
