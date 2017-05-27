import { Dashboard } from '../dashboard';
import { IClientProvider, GetDashboardResult, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';
import * as axios from 'axios';
import { ApiProvider } from './api'


interface PremiseProviderOptions {
    url: string
}


export class PremiseProvider extends ApiProvider {
    constructor(options: PremiseProviderOptions) {
        super();
    }
}



