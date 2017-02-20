import { Dashlet } from '../dashboard/dashlet';
import { HtmlElement, KeyValue } from '../core';
import { IClientProvider, LayoutModel, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';



export class ProviderBase implements IClientProvider {
    init(values: KeyValue<any>) {

    }

    getDashboard(id: string): Promise<DashboardModel> {
        return null;
    }

    createDashboard(model: DashboardCreateModel): Promise<CreateResult> {
        return null;
    }
    getMyDashboards(query?: Query): Promise<QueryResult<DashboardModel>> {
        return null;
    }
    searchDashboards(search?: ISearchDashboards, query?: Query): Promise<QueryResult<DashboardModel>> {
        return null;
    }
    deleteDashboard(id: string): Promise<any> {
        return null;
    }
    saveDashboard(id: string, updateValues: DashboardUpdateModel): Promise<any> {
        return null;
    }
    createDashlet(model: DashletCreateModel): Promise<CreateResult> {
        return null;
    }
    getDashletsOfDashboard(dashboardId: string): Promise<Array<DashletCreateModel>> {
        return null;
    }
    deleteDashlet(id: string): Promise<any> {
        return null;
    }
    saveDashlet(id: string, updateValues: DashletUpdateModel): Promise<any> {
        return null;
    }


}

export class ProviderManager {

    static providers: KeyValue<typeof ProviderBase> = {};


    public static get(type?: string): typeof ProviderBase {
        return type ? ProviderManager.providers[type] : ProviderManager.providers[Object.keys(ProviderManager.providers)[0]];
    }

    public static register(type: string, provider: typeof ProviderBase): typeof ProviderBase {
        ProviderManager.providers[type] = provider;
        return provider;
    }
}



export class ProviderElement extends HtmlElement {
    public provider: ProviderBase;

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


    createProvider(constructor: typeof ProviderBase) {
        this.provider = new constructor();
    }

    attributeChangedCallback(name: string, oldVal: string, newVal: string) {
        if (name.toLowerCase() == 'type' && newVal) {
            if (this.provider)
                throw new Error('Cannot change provider.');
            var constructor = ProviderManager.get(newVal);
            if (!constructor)
                throw new Error(`${newVal} is not a valid provider. Available providers: ${Object.keys(ProviderManager.providers)}`);
            this.createProvider(constructor);
        }
    }

    connectedCallback() {
        if (!this.provider) {
            var constructor = ProviderManager.get('api');
            constructor && this.createProvider(constructor);
        }
        if (this.provider) {
            var initProps = {};
            for (var i = 0; i < this.attributes.length; i++)
                if (this.attributes[i].name.toLowerCase() != 'id' && this.attributes[i].name.toLocaleLowerCase() != 'type')
                    initProps[this.attributes[i].name] = this.attributes[i].value;
            this.provider.init(initProps);
        }
        super.connectedCallback();
    }
}