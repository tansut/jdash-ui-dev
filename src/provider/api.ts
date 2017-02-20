import { ProviderManager } from './';
import { IClientProvider, DashboardCreateModel, DashboardUpdateModel, ISearchDashboards, DashboardModel, CreateResult, Query, QueryResult, DashletCreateModel, DashletUpdateModel, DashletModel, DashletPositionModel } from 'jdash-core';
import { JDashProvider } from 'jdash-core';


export class ApiProvider extends JDashProvider {
    static ProviderType = 'api';
    static Register = ProviderManager.register(ApiProvider.ProviderType, typeof ApiProvider);
}



