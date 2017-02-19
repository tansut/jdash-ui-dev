import {
    CreateResult,
    DashboardModel,
    DashletModel,
    DashletPositionModel,
    DashletProperties,
    LayoutModel,
    Query,
    QueryResult,
    ResourcePermission,
    ResourceType
} from './models';
import { Dashlet } from '../dashboard/dashlet';
import { HtmlElement, KeyValue } from '../core';
import { IClientProvider } from 'jdash-core';



export interface IProvider {

    getDashboardsOfUser(username: string, query?: Query): Promise<QueryResult<DashboardModel>>;
    // getDashboards(query?: Query): Promise<QueryResult<DashboardModel>>;
    getDashboard(id: string): Promise<DashboardModel>;
    getDashletsOfDashboard(dashboardId: string): Promise<QueryResult<DashletModel>>;
    updateLayout(dashboardId: string, layout: LayoutModel): Promise<any>;


    createDashboard(model: DashboardModel): Promise<CreateResult>;
    // updateDashboard(dashboardId: string, updateValues: any): Promise<any>;
    // updateLayout(dashboardId: string, layout: any): Promise<any>;
    deleteDashboard(dashboardId: string): Promise<any>;

    // updateDashletPositions(values: KeyValue<DashletPositionModel>): Promise<any>;
    // deleteDashlet(dashletId: string, updatedPositions: KeyValue<DashletPositionModel>): Promise<any>;
    saveDashletConfiguration(dashletId: string, configuration: KeyValue<any>): Promise<any>;
    updateDashletProperties(dashletId: string, properties: DashletProperties): Promise<any>;
    createDashlet(model: DashletModel): Promise<any>;

    // getResourcePermissions(id: string, resourceType: string): Promise<Array<ResourcePermission>>;
    // getResourcePermissionsForOwner(id: string, resourceType: string, owner: string, ownerType: string): Promise<Array<ResourcePermission>>;

    init(values: KeyValue<any>);

}

export class ProviderBase implements IProvider {
    init(values: KeyValue<any>) {

    }

    createDashboard(model: DashboardModel): Promise<CreateResult> {
        return null;
    }

    getDashboard(id: string): Promise<DashboardModel> {
        return null;
    }

    getDashboardsOfUser(username: string, query?: Query): Promise<QueryResult<DashboardModel>> {
        return null;
    }

    saveDashletConfiguration(dashletId: string, configuration: KeyValue<any>): Promise<any> {
        return null;
    }

    createDashlet(model: DashletModel): Promise<any> {
        return null;
    }

    getDashletsOfDashboard(dashboardId: string): Promise<QueryResult<DashletModel>> {
        return null;
    }

    updateLayout(dashboardId: string, layout: LayoutModel): Promise<any> {
        return null;
    }

    updateDashletProperties(dashletId: string, properties: DashletProperties): Promise<any> {
        return null;
    }

    deleteDashboard(dashboardId: string): Promise<any> {
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