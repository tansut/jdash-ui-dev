import { ProviderManager } from './';
import { IClientProvider, GetDashboardResult, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';
import * as axios from 'axios';

export type fnType = () => string;
export type refreshType = (newToken: string) => void;

export interface ITokenProvider {
    apikey: string | fnType;
    userToken: string | fnType;
    refreshToken: refreshType;
}

// export interface ITokenProvider {
//     apikey: string | fnType;
//     getUserToken: fnType;
// }

export class ApiProvider implements IClientProvider {
    private tokenProvider: ITokenProvider;

    static getUrl() {
        return 'http://localhost:3000/jdash/api/v1'
    }

    init(tokenProvider: ITokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    constructor() {

    }

    private request(): axios.AxiosInstance {
        var token = this.tokenProvider ? (typeof this.tokenProvider.userToken == 'string' ? this.tokenProvider.userToken : this.tokenProvider.userToken()) : null;
        var headers = token ? { 'Authorization': 'Bearer ' + token } : {}
        var instance = axios.default.create({
            baseURL: ApiProvider.getUrl(),
            headers: headers
        });
        return instance;
    }

    getDashboard(id: string): Promise<GetDashboardResult> {
        return this.request().get(`/dashboard/${id}`).then(result => result.data);
    }

    createDashboard(model: DashboardCreateModel): Promise<CreateResult> {
        return this.request().post(`/dashboard/create`, model).then(result => result.data);
    }

    getMyDashboards(query?: Query): Promise<QueryResult<DashboardModel>> {
        return this.request().get(`/dashboard/my`).then(result => result.data);
    }

    searchDashboards(search?: ISearchDashboards, query?: Query): Promise<QueryResult<DashboardModel>> {
        return this.request().post(`/dashboard/search`, {
            search: search,
            query: query
        }).then(result => result.data);
    }

    deleteDashboard(id: string): Promise<any> {
        return this.request().post(`/dashboard/delete/${id}`).then(result => result.data);
    }

    saveDashboard(id: string, updateValues: DashboardUpdateModel): Promise<any> {
        return this.request().post(`/dashboard/save/${id}`, updateValues).then(result => result.data);
    }

    createDashlet(model: DashletCreateModel): Promise<CreateResult> {
        return this.request().post(`/dashlet/create`, model).then(result => result.data);
    }

    getDashletsOfDashboard(dashboardId: string): Promise<Array<DashletCreateModel>> {
        return this.request().get(`/dashlet/bydashboard/${dashboardId}`).then(result => result.data);
    }

    deleteDashlet(id: string): Promise<any> {
        return this.request().post(`/dashlet/delete/${id}`).then(result => result.data);
    }

    saveDashlet(id: string, updateValues: DashletUpdateModel): Promise<any> {
        return this.request().post(`/dashlet/save/${id}`, updateValues).then(result => result.data);
    }
}



