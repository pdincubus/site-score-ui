import { apiFetch } from './client';
import {
    buildQuery,
    encodePathSegment,
    normaliseAllowedValue,
    normaliseLimit,
    normalisePage
} from './query';
import type { Client, PaginatedResponse, ResourceStatus } from '../types/api';

const CLIENT_SORT_OPTIONS = ['createdAt', 'name'] as const;
const ORDER_OPTIONS = ['asc', 'desc'] as const;
const STATUS_OPTIONS = ['active', 'archived', 'all'] as const;

type ClientSort = (typeof CLIENT_SORT_OPTIONS)[number];
type SortOrder = (typeof ORDER_OPTIONS)[number];

type GetClientsOptions = {
    page?: number;
    limit?: number;
    search?: string;
    sort?: ClientSort;
    order?: SortOrder;
    status?: ResourceStatus;
};

type CreateClientInput = {
    name: string;
};

type UpdateClientInput = {
    name?: string;
};

function getClients(options: GetClientsOptions = {}) {
    const query = buildQuery({
        page: options.page === undefined ? undefined : normalisePage(options.page),
        limit: options.limit === undefined ? undefined : normaliseLimit(options.limit),
        search: options.search,
        sort:
            options.sort === undefined
                ? undefined
                : normaliseAllowedValue(options.sort, CLIENT_SORT_OPTIONS, 'createdAt'),
        order:
            options.order === undefined
                ? undefined
                : normaliseAllowedValue(options.order, ORDER_OPTIONS, 'desc'),
        status:
            options.status === undefined
                ? undefined
                : normaliseAllowedValue(options.status, STATUS_OPTIONS, 'active')
    });

    return apiFetch<PaginatedResponse<Client>>(`/clients${query}`);
}

function createClient(input: CreateClientInput) {
    return apiFetch<Client>('/clients', {
        method: 'POST',
        bodyJson: input
    });
}

function getClientById(id: string) {
    return apiFetch<Client>(`/clients/${encodePathSegment(id)}`);
}

function updateClient(id: string, input: UpdateClientInput) {
    return apiFetch<Client>(`/clients/${encodePathSegment(id)}`, {
        method: 'PATCH',
        bodyJson: input
    });
}

function archiveClient(id: string) {
    return apiFetch<Client>(`/clients/${encodePathSegment(id)}/archive`, {
        method: 'POST'
    });
}

function restoreClient(id: string) {
    return apiFetch<Client>(`/clients/${encodePathSegment(id)}/restore`, {
        method: 'POST'
    });
}

function deleteClient(id: string) {
    return apiFetch<void>(`/clients/${encodePathSegment(id)}`, {
        method: 'DELETE'
    });
}

export {
    CLIENT_SORT_OPTIONS,
    ORDER_OPTIONS,
    STATUS_OPTIONS,
    getClients,
    createClient,
    getClientById,
    updateClient,
    archiveClient,
    restoreClient,
    deleteClient
};
