import { KeyValue } from '../core';

export const Sharewith = {
    nobody: 'nobody',
    users: 'users',
    everyone: 'everyone'
}

export const DocumentStatus = {
    draft: 'draft',
    published: 'published'
}

export const Permission = {
    none: 'none',
    canSee: 'canSee',
    canEdit: 'canEdit'
}

export interface DashletProperties {
    title?: string;
    description?: string;
}

export const PermissionOwnerType = {
    user: 'user',
    role: 'role',
    group: 'group'
}

export const ResourceType = {
    dashboard: 'dashboard',
    dashlet: 'dashlet'
}

export interface ResourcePermission {
    resourceType: string;
    id: string;
    owner: string;
    ownerType: string;
    permission: string;
}

export interface Query {
    limit: number;
    startFrom?: any;
}

export interface SearchQuery extends Query {
    filters: any;
}

export interface QueryResult<T> {
    data: Array<T>;
    hasMore: boolean;
}

export interface CreateResult {
    id: string;
}

export interface Metadata {
    owner?: string;
    created?: Date;
    lastUpdated?: Date;
    sharedWith?: string;
    config?: { [key: string]: any };
    publishStatus?: string;
}

export interface DashletPositionModel {
    zone?: string;
    y?: number;
    x?: number;
    z?: number;
}

export interface DashletModel {
    moduleId: string;
    dashboardId: string;
    id?: string;
    title?: string;
    description?: string;
    configuration?: { [key: string]: any };
    meta?: Metadata;
}
export interface LayoutDashletMetaModel {
    data?: any
    position?: DashletPositionModel
}

export interface LayoutModel {
    module: string;
    config?: { [key: string]: any };
    dashlets?: KeyValue<LayoutDashletMetaModel>;
}

export interface DashboardModel {
    id?: string;
    title: string;
    config?: { [key: string]: any };
    layout: LayoutModel
    meta?: Metadata;
}


export interface DashletModuleModel {

}