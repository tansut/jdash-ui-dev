import { Dashboard } from '../dashboard';
import { IClientProvider, GetDashboardResult, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';
import * as axios from 'axios';
import { ApiProvider } from './api';

export type fnType = (callback: Function) => string;


export interface ITokenProvider {
    apikey: string | fnType;
    userToken: string | fnType;
}

export interface IJDashRequestHeader {
    Authorization?: string;
}

export class CloudProvider extends ApiProvider {

    protected tokenProvider: ITokenProvider;
    protected currentUserToken: string;

    init(tokenProvider: ITokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    protected refreshUserToken(): Promise<any> {
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

    protected getAuthorizationHeaderContent() {
        return "Bearer " + this.currentUserToken;
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

    protected makeRequest(config: axios.AxiosRequestConfig): Promise<axios.AxiosResponse> {
        var req = super.makeRequest(config);

        return req.catch((err: axios.AxiosError) => {
            return this.ensureTokenReceived(err, config);
        });
    }


    protected getDefaultRequestConfig(url: string): Promise<axios.AxiosRequestConfig> {


        return super.getDefaultRequestConfig(url).then(config => {
            config.baseURL = CloudProvider['url'];

            if (!this.currentUserToken) {
                return this.refreshUserToken().then(() => {
                    config.headers.Authorization = this.getAuthorizationHeaderContent()
                    return config;
                });
            } else {
                config.headers.Authorization = this.getAuthorizationHeaderContent();
                return config;
            }
        })

    }
}




Object.defineProperty(CloudProvider, 'url', {
    get: function () {
        var url = 'https://app.jdash.io/jdash/api/v1';
        //removeIf(production) 
        url = 'http://localhost:3000/jdash/api/v1'
        //endRemoveIf(production) 

        //var url = 'https://app.jdash.io/jdash/api/v1';

        return url;
    }


})
