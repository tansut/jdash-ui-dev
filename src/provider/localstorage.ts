import { KeyValue } from '../core';
import { ProviderBase, ProviderManager } from './';
import Helper from '../helper';
import { IClientProvider, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';


export class LocalStorageProvider extends ProviderBase {
    static ProviderType = 'localstorage';
    static Register = ProviderManager.register(LocalStorageProvider.ProviderType, LocalStorageProvider);
    public storage: Storage;

    init(values: KeyValue<string>) {
        this.storage = values['storage'] == 'session' ? window.sessionStorage : window.localStorage;
    }

    getCollection<T>(type: string, id?: string | Function) {
        var collectionData = this.storage.getItem(type), collection: Array<T>;
        if (!collectionData) {
            collection = [];
            this.storage.setItem(type, JSON.stringify(collection));
        } else collection = JSON.parse(collectionData);
        return id ? collection.filter((item) => typeof id == 'string' ? item['id'] == id : id.apply(this, [item])) : collection;
    }

    addToCollection(type: string, item: any) {
        var colection = this.getCollection(type);
        colection.push(item);
        this.storage.setItem(type, JSON.stringify(colection));
        return colection;
    }

    saveItem(type: string, data: any) {
        var colection = this.getCollection(type);
        var found = colection.filter((item) => item['id'] == data.id)[0];
        if (found) {
            var index = colection.indexOf(found);
            colection[index] = data;
        }
        this.storage.setItem(type, JSON.stringify(colection));
        return colection;
    }

    removeItem(type: string, id: string) {
        var colection = this.getCollection(type);
        var found = colection.filter((item) => item['id'] == id)[0];
        if (found) {
            var index = colection.indexOf(found);
            colection.splice(index, 1)
        }
        this.storage.setItem(type, JSON.stringify(colection));
        return colection;
    }

    createDashboard(model: DashboardCreateModel): Promise<CreateResult> {
        return new Promise((resolve, reject) => {
            model.id = model.id || Helper.makeid();
            this.addToCollection('dashboards', model);
            resolve({
                id: model.id
            })
        })
    }

    getMyDashboards(query?: Query): Promise<QueryResult<DashboardModel>> {
        return this.searchDashboards({
            user: 'me'
        }, query);
    }

    searchDashboards(search?: ISearchDashboards, query?: Query): Promise<QueryResult<DashboardModel>> {
        var dashboards = this.getCollection<DashboardModel>('dashboards');
        var result: QueryResult<DashboardModel> = {
            data: dashboards,
            hasMore: false
        }
        return Promise.resolve(result);
    }

    getDashboard(id: string): Promise<DashboardModel> {
        var dashboard = this.getCollection<DashboardModel>('dashboards', id)[0]
        return dashboard ? Promise.resolve(dashboard) : Promise.reject('not found');
    }


    saveDashboard(id: string, updateValues: DashboardUpdateModel): Promise<any> {
        var dashboard = this.getCollection<DashboardModel>('dashboards', id)[0]
        if (!dashboard)
            return Promise.reject('not found');
        var dashletsInCollection = this.getCollection<DashletModel>('dashlets', (item) => item.dashboardId == id);

        updateValues = updateValues || {};
        for (var key in updateValues)
            dashboard[key] = updateValues;

        if (updateValues.layout) {
            dashletsInCollection.forEach((dashlet) => {
                var foundInLayout = updateValues.layout.dashlets[dashlet.id];
                if (!foundInLayout)
                    this.removeItem('dashlets', dashlet.id)
            })
        }
        this.saveItem('dashboards', dashboard);
        return Promise.resolve({});
    }

    saveDashlet(id: string, updateValues: DashletUpdateModel): Promise<any> {
        var dashlet = this.getCollection<DashletModel>('dashlets', id)[0];
        if (!dashlet)
            return Promise.reject('not found');
        updateValues = updateValues || {};
        for (var key in updateValues)
            dashlet[key] = updateValues;
        this.saveItem('dashlets', dashlet);
        return Promise.resolve({});
    }


    createDashlet(model: DashletCreateModel): Promise<any> {
        return this.getDashboard(model.dashboardId).then((dashboard) => {
            model.id = Helper.makeid();
            this.addToCollection('dashlets', model);
            return {
                id: model.id
            }
        })
    }

    getDashletsOfDashboard(dashboardId: string): Promise<Array<DashletCreateModel>> {
        return this.getDashboard(dashboardId).then((dashboard) => {
            var dashlets = this.getCollection<DashletModel>('dashlets').filter((item) => item.dashboardId == dashboard.id);
            return dashlets;
        })
    }

    deleteDashboard(dashboardId: string) {
        return this.getDashboard(dashboardId).then((dashboard) => {
            var dashlets = this.getCollection<DashletModel>('dashlets').filter((item) => item.dashboardId == dashboard.id);
            dashlets.forEach(dashlet => this.removeItem('dashlets', dashlet.id));
            this.removeItem('dashboards', dashboardId);
        })
    }
}

