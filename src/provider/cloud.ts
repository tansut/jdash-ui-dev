import { Dashboard } from '../dashboard';
import { IClientProvider, GetDashboardResult, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';
import * as axios from 'axios';
import { ApiProvider, IJDashRequestHeader } from './api';




export class CloudProvider extends ApiProvider {

    protected getDefaultRequestConfig(url: string): Promise<axios.AxiosRequestConfig> {
        var headers = <IJDashRequestHeader>{};

        var config = <axios.AxiosRequestConfig>{
            baseURL: CloudProvider['url'],
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
