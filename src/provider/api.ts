import { Dashboard } from '../dashboard';
import { IClientProvider, GetDashboardResult, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';
import * as axios from 'axios';



export type fnType = (callback: Function) => string;

export interface ITokenProvider {
    apikey: string | fnType;
    userToken: string | fnType;
}

interface IJDashRequestHeader {
    Authorization?: string;
}


export class ApiProvider implements IClientProvider {
    private tokenProvider: ITokenProvider;
    private currentUserToken: string;

    init(tokenProvider: ITokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    constructor() {

    }

    private refreshUserToken(): Promise<any> {
        var self = this;
        return new Promise((resolve, reject) => {
            try {
                var fn = typeof self.tokenProvider.userToken == 'string' ?
                    function (done) { done(null, self.tokenProvider.userToken) } :
                    self.tokenProvider.userToken;
                fn((function (err, userToken) {
                    if (err) return reject(err)
                    self.currentUserToken = userToken;
                    resolve(userToken);
                }))
            } catch (err) {
                console.error("jdash.Provider must be initted with an object that has a getUserToken((function (userToken) { }) callback for authorization purposes.");
                console.warn && console.warn("See https://docs.jdash.io/ for details");
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
            baseURL: ApiProvider['url'],
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


Object.defineProperty(ApiProvider, 'url', {
    get: function () {
        var url = 'https://app.jdash.io/jdash/api/v1';
        //removeIf(production) 
        url = 'http://localhost:3000/jdash/api/v1'
        //endRemoveIf(production) 

        //var url = 'https://app.jdash.io/jdash/api/v1';

        return url;
    }
})
