import { Dashboard } from '../dashboard';
import { IClientProvider, GetDashboardResult, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';
import * as axios from 'axios';
import { ApiProvider, IProviderOptions } from './api';


interface IPremiseProviderOptions extends IProviderOptions {
    url: string
}


export class PremiseProvider extends ApiProvider {
    constructor(public options: IPremiseProviderOptions) {
        super(options);
        this.options = this.options || { url: '/jdash/api/v1' };
    }


    protected getDefaultRequestConfig(url: string): Promise<axios.AxiosRequestConfig> {
        return super.getDefaultRequestConfig(url).then(config => {
            config.baseURL = this.options.url;
            return config;
        })
    }
}



