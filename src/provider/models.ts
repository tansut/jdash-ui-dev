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



export interface DashletModuleModel {

}