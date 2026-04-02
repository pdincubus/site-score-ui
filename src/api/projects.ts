import { apiFetch } from './client';
import type { PaginatedResponse, Project, Report } from '../types/api';

type GetProjectsOptions = {
    page?: number;
    limit?: number;
    search?: string;
    sort?: 'createdAt' | 'name';
    order?: 'asc' | 'desc';
};

type CreateProjectInput = {
    name: string;
    url: string;
};

function buildQuery(params: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
            searchParams.set(key, String(value));
        }
    }

    const query = searchParams.toString();

    return query ? `?${query}` : '';
}

function getProjects(options: GetProjectsOptions = {}) {
    const query = buildQuery({
        page: options.page,
        limit: options.limit,
        search: options.search,
        sort: options.sort,
        order: options.order
    });

    return apiFetch<PaginatedResponse<Project>>(`/projects${query}`);
}

function getProjectById(id: string) {
    return apiFetch<Project>(`/projects/${id}`);
}

function getProjectReports(id: string, page = 1, limit = 10) {
    const query = buildQuery({ page, limit });

    return apiFetch<PaginatedResponse<Report>>(`/projects/${id}/reports${query}`);
}

function createProject(input: CreateProjectInput) {
    return apiFetch<Project>('/projects', {
        method: 'POST',
        bodyJson: input
    });
}

export { getProjects, getProjectById, getProjectReports, createProject };