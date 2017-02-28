import { CompilationResult } from 'gulp-typescript/release/reporter';
import { ProviderManager } from './';
import { IClientProvider, GetDashboardResult, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';
import * as axios from 'axios';



export type fnType = (callback: Function) => string;

export interface ITokenProvider {
    apikey: string | fnType;
    getUserToken: fnType;
}

interface IJDashRequestHeader {
    Authorization?: string;
}


export class ApiProvider implements IClientProvider {
    private tokenProvider: ITokenProvider;
    private currentUserToken: string;

    static getUrl() {
        return 'http://localhost:3000/jdash/api/v1'
    }

    init(tokenProvider: ITokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    constructor() {

    }

    private refreshUserToken(): Promise<any> {
        var self = this;
        return new Promise((resolve, reject) => {
            try {
                self.tokenProvider.getUserToken((function (userToken) {
                    self.currentUserToken = userToken;
                    resolve(userToken);
                }))
            } catch (err) {
                reject(err);
            }

        });
    }

    private getAuthorizationHeaderContent() {
        return "Bearer " + this.currentUserToken;
    }

    private getDefaultRequestConfig(url: string): Promise<axios.AxiosRequestConfig> {
        var headers = <IJDashRequestHeader>{};

        var config = <axios.AxiosRequestConfig>{
            baseURL: ApiProvider.getUrl(),
            url: url,
            headers: headers
        };

        if (!this.currentUserToken) {
            return this.refreshUserToken().then(() => {
                headers.Authorization = this.getAuthorizationHeaderContent()
                return config;
            });
        } else {
            headers.Authorization = this.getAuthorizationHeaderContent();
            return Promise.resolve(config);
        }


    }

    private ensureTokenReceived(err: axios.AxiosError, config: axios.AxiosRequestConfig) {
        if (err.response.status !== 401 || err.config["authRetry"]) {
            throw err;
        }

        return this.refreshUserToken().then(() => {
            config.headers.Authorization = this.getAuthorizationHeaderContent();
            config["authRetry"] = true;
            return this.makeRequest(config);
        });
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

    private makeRequest(config: axios.AxiosRequestConfig): Promise<axios.AxiosResponse> {
        var request = (<Promise<axios.AxiosResponse>>axios["request"](config)).catch((err: axios.AxiosError) => {
            return this.ensureTokenReceived(err, config);
        });
        return request;
    }

    getDashboard(id: string): Promise<GetDashboardResult> {
        return this.get(`/dashboard/${id}`);
    }

    createDashboard(model: DashboardCreateModel): Promise<CreateResult> {
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



