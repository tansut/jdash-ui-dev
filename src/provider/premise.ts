import { Dashboard } from '../dashboard';
import { IClientProvider, GetDashboardResult, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';
import * as axios from 'axios';
import { ApiProvider, IJDashRequestHeader } from './api';


interface PremiseProviderOptions {
    url: string
}


export class PremiseProvider extends ApiProvider {
    constructor(public options: PremiseProviderOptions) {
        super();
    }


    protected getDefaultRequestConfig(url: string): Promise<axios.AxiosRequestConfig> {
        var headers = <IJDashRequestHeader>{};

        var config = <axios.AxiosRequestConfig>{
            baseURL: this.options.url,
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
}



