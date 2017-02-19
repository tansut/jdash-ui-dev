import { ProviderManager, ProviderBase } from './';

export class ApiProvider extends ProviderBase {
    static ProviderType = 'api';
    static Register = ProviderManager.register(ApiProvider.ProviderType, ApiProvider);
}

