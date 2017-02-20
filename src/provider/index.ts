import { Dashlet } from '../dashboard/dashlet';
import { HtmlElement, KeyValue } from '../core';
import { IClientProvider, LayoutModel, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';


export class ProviderManager {
    static providers: KeyValue<Function> = {};

    public static get(type?: string): any {
        return type ? ProviderManager.providers[type] : ProviderManager.providers[Object.keys(ProviderManager.providers)[0]];
    }

    public static register(type: string, provider: any): IClientProvider {
        ProviderManager.providers[type] = provider;
        return provider;
    }
}



export class ProviderElement extends HtmlElement {
    public provider: IClientProvider;

    static get observedAttributes() {
        return ['type'];
    }

    static locate(id?: string): ProviderElement {
        var uniqueInstance = <ProviderElement>document.querySelector('j-provider');
        if (!id)
            return uniqueInstance;
        var byId = document.querySelector(`j-provider#${id}`);
        if (byId)
            return <ProviderElement>byId;
        var byTypes = document.querySelectorAll(`j-provider[type=${id}]`);
        if (byTypes.length > 1)
            throw new Error(`There seems ${byTypes.length} instances for provider type ${id}. Please set an id and reference using id`);
        else if (byTypes.length == 1)
            return <ProviderElement>byTypes[0];
        else {
            return uniqueInstance;
        }
    }


    constructor() {
        super();
    }


    createProvider(constructor: typeof Object, params: any) {
        this.provider = <IClientProvider>new constructor(params);
    }

    connectedCallback() {
        var initProps = {};
        for (var i = 0; i < this.attributes.length; i++)
            if (this.attributes[i].name.toLowerCase() != 'id' && this.attributes[i].name.toLocaleLowerCase() != 'type')
                initProps[this.attributes[i].name] = this.attributes[i].value;
        var constructor = ProviderManager.get(this.getAttribute('type'));
        this.createProvider(constructor, initProps);
        super.connectedCallback();
    }
}