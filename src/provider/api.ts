import { ProviderManager } from './';
import {  IClientProvider, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';
import * as axios from 'axios';

export interface ITokenProvider {
    apikey(): string;
    userToken(): string;
}


export class ApiProvider implements IClientProvider {

    static ProviderType = 'api';
    static Register = ProviderManager.register(ApiProvider.ProviderType, ApiProvider);
    private tokenProvider: ITokenProvider;

    static getUrl() {
        return 'http://localhost:3000/jdash/api/v1'
    }

    constructor() {
        this.tokenProvider = <ITokenProvider>{
            userToken: ()=> 'sdsa',
            apikey: ()=>''
        }
    }

    private request(): axios.AxiosInstance {
        var instance = axios.default.create({
            baseURL: ApiProvider.getUrl(),
            headers: { 'Authentication': 'Bearer ' + this.tokenProvider.userToken() }
        });
        return instance;
    }

    getDashboard(id: string): Promise<DashboardModel> {
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




