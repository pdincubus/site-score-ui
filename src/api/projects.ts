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

type CreateReportInput = {
    title: string;
    summary: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    uxScore: number;
};

type UpdateProjectInput = {
    name?: string;
    url?: string;
};

type UpdateReportInput = {
    title?: string;
    summary?: string;
    accessibilityScore?: number;
    performanceScore?: number;
    seoScore?: number;
    uxScore?: number;
};

type GetProjectReportsOptions = {
    page?: number;
    limit?: number;
    search?: string;
    sort?: 'createdAt' | 'title';
    order?: 'asc' | 'desc';
};

function updateReport(id: string, input: UpdateReportInput) {
    return apiFetch<Report>(`/reports/${id}`, {
        method: 'PATCH',
        bodyJson: input
    });
}

function updateProject(id: string, input: UpdateProjectInput) {
    return apiFetch<Project>(`/projects/${id}`, {
        method: 'PATCH',
        bodyJson: input
    });
}

function createReport(projectId: string, input: CreateReportInput) {
    return apiFetch<Report>(`/projects/${projectId}/reports`, {
        method: 'POST',
        bodyJson: input
    });
}

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

function getProjectReports(id: string, options: GetProjectReportsOptions = {}) {
    const query = buildQuery({
        page: options.page,
        limit: options.limit,
        search: options.search,
        sort: options.sort,
        order: options.order
    });

    return apiFetch<PaginatedResponse<Report>>(`/projects/${id}/reports${query}`);
}

function createProject(input: CreateProjectInput) {
    return apiFetch<Project>('/projects', {
        method: 'POST',
        bodyJson: input
    });
}

function deleteProject(id: string) {
    return apiFetch<void>(`/projects/${id}`, {
        method: 'DELETE'
    });
}

function deleteReport(id: string) {
    return apiFetch<void>(`/reports/${id}`, {
        method: 'DELETE'
    });
}

export { getProjects, getProjectById, getProjectReports, createProject, createReport, updateProject, updateReport, deleteProject, deleteReport };