import { Dashboard } from '../dashboard';
import { IClientProvider, GetDashboardResult, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';
import * as axios from 'axios';



export type requestConfigCallback = (config: axios.AxiosRequestConfig) => void;

export interface IProviderOptions {
    configRequest?: requestConfigCallback;
}

export class ApiProvider implements IClientProvider {


    constructor(protected options?: IProviderOptions) {
        this.options = options || {};
    }


    protected getDefaultRequestConfig(url: string): Promise<axios.AxiosRequestConfig> {

        var headers = {};

        var config = <axios.AxiosRequestConfig>{
            url: url,
            headers: headers
        };

        this.options && this.options.configRequest && this.options.configRequest(config);

        return Promise.resolve(config);
    }


    private get<T>(url: string): Promise<T> {
        return this.getDefaultRequestConfig(url).then((requestConfig) => {
            requestConfig.method = 'get';
            return this.makeRequest(requestConfig).then(result => result.data);
        });
    }

    private post<T>(url: string, data?: any): Promise<T> {
        return this.getDefaultRequestConfig(url).then((requestConfig) => {
            requestConfig.method = 'post';
            requestConfig.data = data;
            return this.makeRequest(requestConfig).then(result => result.data);
        });
    }

    protected makeRequest(config: axios.AxiosRequestConfig): Promise<axios.AxiosResponse> {
        return (<Promise<axios.AxiosResponse>>axios["request"](config));
    }

    getDashboard(id: string): Promise<GetDashboardResult> {
        return this.get(`/dashboard/${id}`);
    }

    createDashboard(model: DashboardCreateModel): Promise<CreateResult> {
        if (!model.layout)
            model.layout = {
                moduleId: Dashboard.defaultLayoutModule
            }
        return this.post(`/dashboard/create`, model);
    }

    getMyDashboards(query?: Query): Promise<QueryResult<DashboardModel>> {
        return this.get(`/dashboard/my`);
    }

    searchDashboards(search?: ISearchDashboards, query?: Query): Promise<QueryResult<DashboardModel>> {
        return this.post(`/dashboard/search`, { search: search, query: query });
    }

    deleteDashboard(id: string): Promise<any> {
        return this.post(`/dashboard/delete/${id}`);
    }

    saveDashboard(id: string, updateValues: DashboardUpdateModel): Promise<any> {
        return this.post(`/dashboard/save/${id}`, updateValues);
    }

    createDashlet(model: DashletCreateModel): Promise<CreateResult> {
        return this.post(`/dashlet/create`, model);
    }

    getDashletsOfDashboard(dashboardId: string): Promise<Array<DashletCreateModel>> {
        return this.get(`/dashlet/bydashboard/${dashboardId}`);
    }

    deleteDashlet(id: string): Promise<any> {
        return this.post(`/dashlet/delete/${id}`);
    }

    saveDashlet(id: string, updateValues: DashletUpdateModel): Promise<any> {
        return this.post(`/dashlet/save/${id}`, updateValues);
    }
}


